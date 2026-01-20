import Stripe from "stripe";
import { db } from "@/lib/db";
import { doctors, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SUBSCRIPTION_PLANS } from "@/constants/plans";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export { stripe };

export async function createCustomer(email: string, name: string): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      source: "doctor_saas",
    },
  });
  return customer.id;
}

export async function createCheckoutSession(
  doctorId: string,
  plan: "premium" | "advanced",
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const doctor = await db.query.doctors.findFirst({
    where: eq(doctors.id, doctorId),
    with: {
      user: true,
      subscription: true,
    },
  });

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  let customerId = doctor.subscription?.stripeCustomerId;

  if (!customerId) {
    customerId = await createCustomer(doctor.user.email, doctor.fullName);
  }

  const priceId =
    plan === "premium"
      ? process.env.STRIPE_PREMIUM_PRICE_ID
      : process.env.STRIPE_ADVANCED_PRICE_ID;

  if (!priceId) {
    throw new Error("Price ID not configured");
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: {
      doctorId,
      plan,
    },
    subscription_data: {
      metadata: {
        doctorId,
        plan,
      },
    },
    allow_promotion_codes: true,
  });

  return session.url!;
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

export async function reactivateSubscription(subscriptionId: string): Promise<void> {
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.retrieve(subscriptionId);
}

export async function handleWebhookEvent(
  body: string,
  signature: string
): Promise<{ success: boolean; message: string }> {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return { success: false, message: "Webhook signature verification failed" };
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { success: true, message: "Webhook processed successfully" };
  } catch (error) {
    console.error("Error processing webhook:", error);
    return { success: false, message: "Error processing webhook" };
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
  const doctorId = session.metadata?.doctorId;
  const plan = session.metadata?.plan as "premium" | "advanced";

  if (!doctorId || !plan) {
    console.error("Missing metadata in checkout session");
    return;
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  // Update or create subscription record
  const existingSubscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.doctorId, doctorId),
  });

  const subscriptionData = {
    plan,
    stripeCustomerId: session.customer as string,
    stripeSubscriptionId: session.subscription as string,
    stripePriceId: stripeSubscription.items.data[0].price.id,
    status: "active" as const,
    currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
    currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    cancelAtPeriodEnd: false,
  };

  if (existingSubscription) {
    await db
      .update(subscriptions)
      .set({ ...subscriptionData, updatedAt: new Date() })
      .where(eq(subscriptions.doctorId, doctorId));
  } else {
    await db.insert(subscriptions).values({
      doctorId,
      ...subscriptionData,
    });
  }

  // Update doctor record
  await db
    .update(doctors)
    .set({
      subscriptionPlan: plan,
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(stripeSubscription.current_period_end * 1000),
      trialUsed: true,
      updatedAt: new Date(),
    })
    .where(eq(doctors.id, doctorId));
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
  const doctorId = subscription.metadata?.doctorId;
  if (!doctorId) return;

  const plan = subscription.metadata?.plan as "premium" | "advanced";
  const status = mapStripeStatus(subscription.status);

  await db
    .update(subscriptions)
    .set({
      status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.doctorId, doctorId));

  await db
    .update(doctors)
    .set({
      subscriptionEnd: new Date(subscription.current_period_end * 1000),
      isActive: status === "active",
      updatedAt: new Date(),
    })
    .where(eq(doctors.id, doctorId));
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription): Promise<void> {
  const doctorId = subscription.metadata?.doctorId;
  if (!doctorId) return;

  await db
    .update(subscriptions)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.doctorId, doctorId));

  // Downgrade to free trial (or deactivate based on business logic)
  await db
    .update(doctors)
    .set({
      subscriptionPlan: "free_trial",
      updatedAt: new Date(),
    })
    .where(eq(doctors.id, doctorId));
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const doctorId = subscription.metadata?.doctorId;
  if (!doctorId) return;

  // Reset monthly patient count
  await db
    .update(doctors)
    .set({
      patientCountThisMonth: 0,
      monthlyResetDate: new Date().toISOString().split("T")[0],
      updatedAt: new Date(),
    })
    .where(eq(doctors.id, doctorId));
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const doctorId = subscription.metadata?.doctorId;
  if (!doctorId) return;

  await db
    .update(subscriptions)
    .set({
      status: "past_due",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.doctorId, doctorId));

  // TODO: Send email notification about failed payment
}

function mapStripeStatus(
  status: Stripe.Subscription.Status
): "active" | "cancelled" | "past_due" | "trialing" {
  switch (status) {
    case "active":
      return "active";
    case "canceled":
      return "cancelled";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "trialing":
      return "trialing";
    default:
      return "active";
  }
}

export async function getMonthlyRevenue(): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const charges = await stripe.charges.list({
    created: {
      gte: Math.floor(startOfMonth.getTime() / 1000),
    },
    limit: 100,
  });

  return charges.data.reduce((sum, charge) => {
    if (charge.status === "succeeded") {
      return sum + charge.amount;
    }
    return sum;
  }, 0) / 100; // Convert from cents to dollars
}

export async function getRevenueByMonth(months: number = 12): Promise<{ month: string; revenue: number }[]> {
  const result: { month: string; revenue: number }[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startOfMonth = Math.floor(date.getTime() / 1000);
    const endOfMonth = Math.floor(
      new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).getTime() / 1000
    );

    const charges = await stripe.charges.list({
      created: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      limit: 100,
    });

    const revenue = charges.data.reduce((sum, charge) => {
      if (charge.status === "succeeded") {
        return sum + charge.amount;
      }
      return sum;
    }, 0) / 100;

    result.push({
      month: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      revenue,
    });
  }

  return result;
}
