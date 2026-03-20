import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 299,
    features: ["1 AI voice agent", "500 minutes/mo", "Lead capture", "SMS notifications", "Business hours routing"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 499,
    features: ["Everything in Starter", "Unlimited minutes", "Priority support", "Custom greetings", "Advanced analytics", "Multi-location support"],
  },
];

const Billing = () => {
  const { subscription } = useAuth();
  const [selected, setSelected] = useState("starter");
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
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-2 text-center text-2xl font-bold text-foreground">Choose Your Plan</h1>
        <p className="mb-8 text-center text-muted-foreground">
          {subscription.subscribed
            ? `You're on the ${subscription.plan?.charAt(0).toUpperCase()}${subscription.plan?.slice(1)} plan.`
            : "Start capturing every call today. No contracts, cancel anytime."}
        </p>

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
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!subscription.subscribed && (
          <div className="mt-8 text-center">
            <Button size="lg" onClick={handleCheckout} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue with {PLANS.find((p) => p.id === selected)?.name} — ${PLANS.find((p) => p.id === selected)?.price}/mo
            </Button>
          </div>
        )}

        {subscription.subscribed && subscription.subscriptionEnd && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Current period ends {new Date(subscription.subscriptionEnd).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default Billing;
