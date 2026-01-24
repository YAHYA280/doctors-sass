"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Calendar,
  Users,
  BarChart3,
  Shield,
  Zap,
  Globe,
  Check,
  ArrowRight,
  Sparkles,
  Clock,
  MessageSquare,
  Star,
  Stethoscope,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "Intelligent appointment booking with automatic conflict detection and customizable availability windows.",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    icon: Users,
    title: "Patient Management",
    description:
      "Comprehensive patient records with visit history, form submissions, and communication logs.",
    gradient: "from-accent/20 to-accent/5",
  },
  {
    icon: BarChart3,
    title: "Rich Analytics",
    description:
      "Deep insights into your practice performance with visual dashboards and trend analysis.",
    gradient: "from-success/20 to-success/5",
  },
  {
    icon: MessageSquare,
    title: "Multi-Channel Notifications",
    description:
      "Automated reminders via Email and WhatsApp to reduce no-shows and keep patients informed.",
    gradient: "from-warning/20 to-warning/5",
  },
  {
    icon: Shield,
    title: "Secure & Compliant",
    description:
      "Enterprise-grade security with encrypted data storage and HIPAA-ready infrastructure.",
    gradient: "from-purple-500/20 to-purple-500/5",
  },
  {
    icon: Zap,
    title: "Custom Forms",
    description:
      "Drag-and-drop form builder to create tailored intake forms with conditional logic.",
    gradient: "from-pink-500/20 to-pink-500/5",
  },
];

const plans = [
  {
    name: "Free Trial",
    description: "Perfect for trying out MediBook",
    price: "0",
    period: "14 days",
    features: [
      "Up to 20 patients",
      "1 clinic location",
      "Basic intake forms",
      "Email notifications",
      "Standard support",
    ],
    cta: "Start Free Trial",
    featured: false,
  },
  {
    name: "Premium",
    description: "For growing practices",
    price: "15",
    period: "per month",
    features: [
      "Up to 300 patients/month",
      "Unlimited clinics",
      "Advanced custom forms",
      "WhatsApp + Email notifications",
      "3 team members",
      "Detailed analytics",
      "Priority support",
    ],
    cta: "Get Started",
    featured: true,
  },
  {
    name: "Advanced",
    description: "For established practices",
    price: "35",
    period: "per month",
    features: [
      "Unlimited patients",
      "Unlimited clinics",
      "Everything in Premium",
      "Unlimited team members",
      "API access",
      "HIPAA compliance tools",
      "Dedicated support",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

const testimonials = [
  {
    quote: "MediBook transformed how I manage my practice. The automated reminders alone saved me hours each week.",
    author: "Dr. Sarah Chen",
    role: "Family Medicine",
    rating: 5,
  },
  {
    quote: "The patient booking experience is seamless. My patients love how easy it is to schedule appointments.",
    author: "Dr. Michael Roberts",
    role: "Dermatology",
    rating: 5,
  },
  {
    quote: "Finally, a practice management tool that's both powerful and beautiful. Highly recommended.",
    author: "Dr. Emily Watson",
    role: "Pediatrics",
    rating: 5,
  },
];

export default function HomePage() {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-soft-sm">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <span className="font-display font-semibold text-xl tracking-tight">MediBook</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Testimonials
              </a>
            </div>

            <div className="flex items-center gap-3">
              {session ? (
                <Link href="/dashboard">
                  <Button className="btn-premium bg-primary text-primary-foreground rounded-xl h-11 px-6">
                    Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="hidden sm:flex h-11 rounded-xl">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="btn-premium bg-primary text-primary-foreground rounded-xl h-11 px-6">
                      Get Started
                      <Sparkles className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32">
        {/* Background Effects */}
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 dot-pattern text-border/30 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

        {/* Floating Orbs */}
        <div className="absolute top-40 -left-20 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-0 -right-20 w-[600px] h-[600px] bg-accent/8 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-3s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="animate-fade-up">
              <Badge className="mb-8 px-5 py-2.5 text-sm font-medium bg-primary/10 text-primary border-0 hover:bg-primary/15 transition-colors">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Trusted by 2,000+ Healthcare Professionals
              </Badge>
            </div>

            <h1 className="animate-fade-up-delay-1 font-display text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance leading-[1.1]">
              Practice Management,{" "}
              <span className="text-gradient">Reimagined</span>
            </h1>

            <p className="animate-fade-up-delay-2 mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
              Streamline your medical practice with intelligent scheduling, patient management,
              and automated communications. Focus on what matters most — your patients.
            </p>

            <div className="animate-fade-up-delay-3 mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="btn-premium bg-primary text-primary-foreground h-14 px-8 text-base rounded-2xl shadow-glow-primary">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-2xl border-2 group">
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </div>

            <div className="animate-fade-up-delay-4 mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-success/20 flex items-center justify-center">
                  <Check className="h-3 w-3 text-success" />
                </div>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-success/20 flex items-center justify-center">
                  <Check className="h-3 w-3 text-success" />
                </div>
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-success/20 flex items-center justify-center">
                  <Check className="h-3 w-3 text-success" />
                </div>
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Hero Image / Dashboard Preview */}
          <div className="animate-fade-up mt-20 lg:mt-24 relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-[2rem] blur-3xl opacity-30" />
            <div className="relative bg-card rounded-2xl lg:rounded-3xl border border-border/50 shadow-soft-xl overflow-hidden">
              {/* Browser Chrome */}
              <div className="h-12 bg-muted/30 flex items-center gap-2 px-5 border-b border-border/50">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                  <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                  <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-muted/50 rounded-lg px-4 py-1.5 text-xs text-muted-foreground font-mono">
                    app.medibook.com/dashboard
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-8 bg-gradient-to-b from-muted/10 to-transparent">
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                  {[
                    { label: "Today's Appointments", value: "12", icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
                    { label: "Patients This Week", value: "48", icon: Users, color: "text-accent", bg: "bg-accent/10" },
                    { label: "Completion Rate", value: "94%", icon: Check, color: "text-success", bg: "bg-success/10" },
                    { label: "Monthly Revenue", value: "$3.2K", icon: BarChart3, color: "text-warning", bg: "bg-warning/10" },
                  ].map((stat, i) => (
                    <div key={i} className="stat-card">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                          <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                      </div>
                      <p className={`text-2xl md:text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Content Grid */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 bg-card rounded-2xl border border-border/50 p-5">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Upcoming Appointments</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">Today</Badge>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: "Emma Thompson", time: "9:00 AM", type: "Consultation" },
                        { name: "James Wilson", time: "10:30 AM", type: "Follow-up" },
                        { name: "Sarah Miller", time: "2:00 PM", type: "Check-up" },
                      ].map((apt, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                            <span className="font-semibold text-primary">{apt.name.split(' ').map(n => n[0]).join('')}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{apt.name}</p>
                            <p className="text-xs text-muted-foreground">{apt.type}</p>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-primary/10 text-primary border-0 text-xs">
                              {apt.time}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl border border-border/50 p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <BarChart3 className="h-5 w-5 text-accent" />
                      <span className="font-semibold">Weekly Overview</span>
                    </div>
                    <div className="flex items-end justify-between h-36 px-1">
                      {[
                        { day: 'M', value: 40 },
                        { day: 'T', value: 65 },
                        { day: 'W', value: 45 },
                        { day: 'T', value: 80 },
                        { day: 'F', value: 55 },
                        { day: 'S', value: 30 },
                        { day: 'S', value: 20 },
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 flex-1">
                          <div
                            className="w-full max-w-[28px] bg-gradient-to-t from-primary to-primary/60 rounded-lg transition-all hover:from-primary/90"
                            style={{ height: `${item.value}%` }}
                          />
                          <span className="text-xs text-muted-foreground">{item.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos Section */}
      <section className="py-16 border-y border-border/50 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground mb-8">
            Trusted by leading healthcare providers worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {["HealthCare Plus", "MedGroup", "CityClinic", "WellCare", "PrimeMed"].map((name) => (
              <span key={name} className="font-display font-semibold text-xl text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
            <Badge className="mb-6 bg-accent/10 text-accent border-0">
              Features
            </Badge>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-balance">
              Everything you need to run your practice
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              Powerful tools designed specifically for healthcare professionals, built with simplicity in mind.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="feature-card group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 group-hover:scale-110 transition-transform duration-500`}>
                  <feature.icon className="h-6 w-6 text-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 lg:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
            <Badge className="mb-6 bg-success/10 text-success border-0">
              Pricing
            </Badge>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-balance">
              Simple, transparent pricing
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              Choose the plan that fits your practice. No hidden fees, no surprises.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`pricing-card ${plan.featured ? "featured lg:scale-105 z-10" : ""}`}
              >
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground shadow-glow-primary px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="font-display text-2xl font-semibold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                </div>
                <div className="mb-8">
                  <span className="text-5xl font-display font-bold">${plan.price}</span>
                  <span className="text-muted-foreground ml-2">/{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-success/20 flex items-center justify-center mt-0.5 shrink-0">
                        <Check className="h-3 w-3 text-success" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block">
                  <Button
                    className={`w-full h-12 rounded-xl font-medium text-base ${
                      plan.featured
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-primary"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
            <Badge className="mb-6 bg-warning/10 text-warning border-0">
              Testimonials
            </Badge>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-balance">
              Loved by doctors everywhere
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card-premium p-8 hover:shadow-soft-lg transition-shadow duration-500">
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-warning text-warning" />
                  ))}
                </div>
                <blockquote className="text-lg mb-8 leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold shadow-soft">
                    {testimonial.author.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary to-primary/90 p-12 md:p-20">
            {/* Background Effects */}
            <div className="absolute inset-0 dot-pattern text-white/5" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

            <div className="relative text-center max-w-3xl mx-auto">
              <h2 className="font-display text-4xl md:text-5xl font-semibold text-white mb-6 text-balance">
                Ready to transform your practice?
              </h2>
              <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
                Join thousands of healthcare professionals who trust MediBook to manage their practice.
                Start your free trial today — no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 h-14 px-8 text-base font-semibold rounded-2xl shadow-soft-xl">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 h-14 px-8 text-base rounded-2xl backdrop-blur-sm">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 lg:py-20 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-6">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-soft-sm">
                  <Stethoscope className="h-6 w-6 text-white" />
                </div>
                <span className="font-display font-semibold text-2xl tracking-tight">MediBook</span>
              </Link>
              <p className="text-muted-foreground max-w-md leading-relaxed">
                Streamline your medical practice with intelligent scheduling, patient management, and automated communications.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-5">Product</h4>
              <ul className="space-y-4 text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-5">Company</h4>
              <ul className="space-y-4 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} MediBook. All rights reserved.
            </p>
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
