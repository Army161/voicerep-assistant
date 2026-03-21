import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2, AlertCircle, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

type ProvisionState = "idle" | "provisioning" | "succeeded" | "failed";

const BillingSuccess = () => {
  const { workspace, refreshSubscription } = useAuth();
  const [state, setState] = useState<ProvisionState>("idle");
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!workspace) return;

    const run = async () => {
      // Check current provisioning status first
      const db = supabase as any;
      const { data: prov } = await db
        .from("provisioning")
        .select("status, twilio_phone_number")
        .eq("workspace_id", workspace.id)
        .maybeSingle();

      if (prov?.status === "succeeded") {
        setState("succeeded");
        setPhoneNumber(prov.twilio_phone_number);
        return;
      }

      // Trigger provisioning
      setState("provisioning");
      try {
        const { data, error } = await supabase.functions.invoke("provision");

        if (error) {
          setState("failed");
          setErrorMsg(error.message || "Provisioning failed");
          return;
        }

        if (data?.status === "succeeded") {
          setState("succeeded");
          setPhoneNumber(data.phone_number);
          toast({ title: "Your AI phone line is ready!" });
        } else {
          setState("failed");
          setErrorMsg(data?.error || "Unexpected response");
        }
      } catch (err: any) {
        setState("failed");
        setErrorMsg(err.message || "Provisioning failed");
      }
    };

    run();
  }, [workspace]);

  const handleRetry = () => {
    setState("idle");
    setErrorMsg(null);
    // Re-trigger by resetting workspace dependency isn't clean,
    // so we just call provision again
    (async () => {
      setState("provisioning");
      try {
        const { data, error } = await supabase.functions.invoke("provision");
        if (error) {
          setState("failed");
          setErrorMsg(error.message);
          return;
        }
        if (data?.status === "succeeded") {
          setState("succeeded");
          setPhoneNumber(data.phone_number);
          toast({ title: "Your AI phone line is ready!" });
        } else {
          setState("failed");
          setErrorMsg(data?.error || "Unexpected response");
        }
      } catch (err: any) {
        setState("failed");
        setErrorMsg(err.message);
      }
    })();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-20">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              {state === "succeeded" ? (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              ) : state === "failed" ? (
                <AlertCircle className="h-6 w-6 text-destructive" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              )}
            </div>
            <CardTitle>
              {state === "succeeded"
                ? "You're All Set!"
                : state === "failed"
                  ? "Provisioning Failed"
                  : "Payment Received"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {state === "provisioning" && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Setting up your AI voice line…</span>
              </div>
            )}

            {state === "succeeded" && phoneNumber && (
              <div className="rounded-lg bg-primary/5 p-4">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Phone className="h-5 w-5" />
                  <span className="text-lg font-semibold">{phoneNumber}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your AI receptionist is live and ready to take calls!
                </p>
              </div>
            )}

            {state === "succeeded" && !phoneNumber && (
              <p className="text-sm text-muted-foreground">
                Your AI receptionist has been provisioned successfully.
              </p>
            )}

            {state === "failed" && (
              <>
                <p className="text-sm text-destructive">{errorMsg}</p>
                <Button onClick={handleRetry} variant="outline">
                  Retry Provisioning
                </Button>
              </>
            )}

            <Button asChild>
              <Link to="/app">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BillingSuccess;
