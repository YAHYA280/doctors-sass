export const SUBSCRIPTION_PLANS = {
  free_trial: {
    name: "Free Trial",
    price: 0,
    duration: "14 days",
    features: [
      "Up to 20 patients",
      "1 clinic",
      "Basic intake form (Name, Date, Sickness)",
      "Email notifications only",
      "Standard support",
    ],
    limits: {
      maxPatients: 20,
      maxClinics: 1,
      customForms: false,
      whatsappNotifications: false,
      advancedAnalytics: false,
      teamManagement: false,
      maxTeamMembers: 0,
      customBranding: false,
      calendarIntegrations: false,
      prioritySupport: false,
    },
  },
  premium: {
    name: "Premium",
    price: 15,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    features: [
      "Up to 300 patients/month",
      "Unlimited clinics",
      "Custom branded booking pages",
      "Advanced form builder",
      "WhatsApp + Email notifications",
      "Advanced calendar integrations",
      "Basic analytics",
      "Priority support",
      "Team management (up to 3 members)",
    ],
    limits: {
      maxPatients: 300,
      maxClinics: -1, // unlimited
      customForms: true,
      whatsappNotifications: true,
      advancedAnalytics: false,
      teamManagement: true,
      maxTeamMembers: 3,
      customBranding: true,
      calendarIntegrations: true,
      prioritySupport: true,
    },
  },
  advanced: {
    name: "Advanced",
    price: 35,
    priceId: process.env.STRIPE_ADVANCED_PRICE_ID,
    features: [
      "Unlimited patients",
      "Unlimited clinics",
      "All Premium features",
      "Comprehensive analytics dashboard",
      "Unlimited team members",
      "API access",
      "HIPAA compliance tools",
      "Dedicated account manager",
      "Custom integrations",
    ],
    limits: {
      maxPatients: -1, // unlimited
      maxClinics: -1, // unlimited
      customForms: true,
      whatsappNotifications: true,
      advancedAnalytics: true,
      teamManagement: true,
      maxTeamMembers: -1, // unlimited
      customBranding: true,
      calendarIntegrations: true,
      prioritySupport: true,
      apiAccess: true,
      hipaaTools: true,
    },
  },
} as const;

export type SubscriptionPlanKey = keyof typeof SUBSCRIPTION_PLANS;

export function getPlanLimits(plan: SubscriptionPlanKey) {
  return SUBSCRIPTION_PLANS[plan].limits;
}

export function canAddPatient(plan: SubscriptionPlanKey, currentCount: number): boolean {
  const limits = getPlanLimits(plan);
  if (limits.maxPatients === -1) return true;
  return currentCount < limits.maxPatients;
}

export function canAddClinic(plan: SubscriptionPlanKey, currentCount: number): boolean {
  const limits = getPlanLimits(plan);
  if (limits.maxClinics === -1) return true;
  return currentCount < limits.maxClinics;
}

export function canUseCustomForms(plan: SubscriptionPlanKey): boolean {
  return SUBSCRIPTION_PLANS[plan].limits.customForms;
}

export function canUseWhatsApp(plan: SubscriptionPlanKey): boolean {
  return SUBSCRIPTION_PLANS[plan].limits.whatsappNotifications;
}

export function canUseAdvancedAnalytics(plan: SubscriptionPlanKey): boolean {
  return SUBSCRIPTION_PLANS[plan].limits.advancedAnalytics;
}

export function canManageTeam(plan: SubscriptionPlanKey): boolean {
  return SUBSCRIPTION_PLANS[plan].limits.teamManagement;
}
