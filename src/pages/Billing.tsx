import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
  const [selected, setSelected] = useState("starter");
  const [loading, setLoading] = useState(false);

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
        <p className="mb-8 text-center text-muted-foreground">Start capturing every call today. No contracts, cancel anytime.</p>

        <div className="grid gap-6 md:grid-cols-2">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-all ${selected === plan.id ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"}`}
              onClick={() => setSelected(plan.id)}
            >
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
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button size="lg" onClick={handleCheckout} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue with {PLANS.find((p) => p.id === selected)?.name} — ${PLANS.find((p) => p.id === selected)?.price}/mo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Billing;
