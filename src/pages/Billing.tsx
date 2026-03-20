import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Crown, Phone, MessageSquare, BarChart3, Clock, Shield, Headphones, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 299,
    subtitle: "Perfect for single-location businesses",
    features: [
      { text: "1 AI voice agent", included: true },
      { text: "500 minutes/mo", included: true },
      { text: "Lead capture & CRM", included: true },
      { text: "SMS notifications", included: true },
      { text: "Business hours routing", included: true },
      { text: "Call recordings & transcripts", included: true },
      { text: "Unlimited minutes", included: false },
      { text: "Priority support", included: false },
      { text: "Advanced analytics", included: false },
      { text: "Multi-location support", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 499,
    subtitle: "For growing businesses that need more",
    popular: true,
    features: [
      { text: "1 AI voice agent", included: true },
      { text: "Unlimited minutes", included: true },
      { text: "Lead capture & CRM", included: true },
      { text: "SMS notifications", included: true },
      { text: "Business hours routing", included: true },
      { text: "Call recordings & transcripts", included: true },
      { text: "Priority support", included: true },
      { text: "Custom greetings", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Multi-location support", included: true },
    ],
  },
];

const FAQS = [
  {
    q: "How does the AI phone agent work?",
    a: "Your AI agent answers calls just like a trained receptionist. It greets callers, captures their information, answers common questions about your business, and sends you an instant SMS with the lead details — all without you lifting a finger.",
  },
  {
    q: "Can I try before I subscribe?",
    a: "Absolutely! Check out our demo page to see a sample conversation and hear what the AI sounds like. You can also cancel anytime — no contracts or commitments.",
  },
  {
    q: "What happens when I hit 500 minutes on Starter?",
    a: "You'll receive a notification when you're approaching your limit. Calls will still be answered, but you can upgrade to Pro at any time for unlimited minutes.",
  },
  {
    q: "How quickly is my phone line set up?",
    a: "Within minutes! After subscribing, our system automatically provisions a local phone number in your area code and configures your AI agent. You'll be ready to take calls almost immediately.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. There are no long-term contracts. You can cancel or change your plan at any time from the Settings page.",
  },
];

const HIGHLIGHTS = [
  { icon: Phone, title: "Never Miss a Call", desc: "Your AI agent picks up 24/7 — nights, weekends, holidays." },
  { icon: MessageSquare, title: "Instant Lead Alerts", desc: "Get an SMS with caller details the moment a lead comes in." },
  { icon: BarChart3, title: "Actionable Analytics", desc: "See call volume, sentiment, and conversion trends at a glance." },
  { icon: Clock, title: "Setup in Minutes", desc: "Subscribe, and your AI phone line is live almost instantly." },
  { icon: Shield, title: "No Contracts", desc: "Cancel anytime. No hidden fees, no long-term commitments." },
  { icon: Headphones, title: "Human-Quality Voice", desc: "Callers won't know it's AI — natural, professional conversations." },
];

const Billing = () => {
  const { subscription } = useAuth();
  const [selected, setSelected] = useState("pro");
  const [loading, setLoading] = useState(false);

  const isActivePlan = (planId: string) => subscription.subscribed && subscription.plan === planId;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { plan: selected },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            {subscription.subscribed ? "Your Subscription" : "Every Call Answered. Every Lead Captured."}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
            {subscription.subscribed
              ? `You're on the ${subscription.plan?.charAt(0).toUpperCase()}${subscription.plan?.slice(1)} plan.`
              : "An AI receptionist that works around the clock so you never miss a customer again. No contracts, cancel anytime."}
          </p>
          {!subscription.subscribed && (
            <Link to="/demo">
              <Button variant="outline" className="mt-4">
                See a Live Demo First
              </Button>
            </Link>
          )}
        </div>

        {/* Value Highlights */}
        {!subscription.subscribed && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
            {HIGHLIGHTS.map((h) => (
              <div key={h.title} className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                <h.icon className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-sm text-foreground">{h.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {PLANS.map((plan) => {
            const active = isActivePlan(plan.id);
            return (
              <Card
                key={plan.id}
                className={`relative cursor-pointer transition-all ${
                  active
                    ? "border-primary ring-2 ring-primary/30 shadow-lg"
                    : selected === plan.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "hover:border-primary/50"
                }`}
                onClick={() => !active && setSelected(plan.id)}
              >
                {active && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gap-1 bg-primary text-primary-foreground px-3 py-1">
                    <Crown className="h-3 w-3" />
                    Your Plan
                  </Badge>
                )}
                {!active && plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.subtitle}</CardDescription>
                  <div className="pt-2">
                    <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f.text} className={`flex items-center gap-2 text-sm ${f.included ? "text-foreground" : "text-muted-foreground/50"}`}>
                        {f.included ? (
                          <Check className="h-4 w-4 shrink-0 text-primary" />
                        ) : (
                          <X className="h-4 w-4 shrink-0" />
                        )}
                        {f.text}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        {!subscription.subscribed && (
          <div className="mt-8 text-center space-y-2">
            <Button size="lg" onClick={handleCheckout} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Get Started with {PLANS.find((p) => p.id === selected)?.name} — ${PLANS.find((p) => p.id === selected)?.price}/mo
            </Button>
            <p className="text-xs text-muted-foreground">No contracts · Cancel anytime · Setup in minutes</p>
          </div>
        )}

        {subscription.subscribed && subscription.subscriptionEnd && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Current period ends {new Date(subscription.subscriptionEnd).toLocaleDateString()}
          </p>
        )}

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-6">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default Billing;
