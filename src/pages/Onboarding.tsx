import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Loader2, Building2, Stethoscope, Sparkles, Check } from "lucide-react";

const db = supabase as any;

const US_TIMEZONES = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Phoenix", label: "Arizona (no DST)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HT)" },
];

const STEPS = ["Business Type", "Business Details", "Area Code", "After Hours", "Review"];

const Onboarding = () => {
  const { workspace, refresh, user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [businessType, setBusinessType] = useState<string>("");
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [phone, setPhone] = useState("");
  const [areaCode, setAreaCode] = useState("");

  // Seed form from workspace
  useEffect(() => {
    if (workspace) {
      setBusinessType(workspace.business_type || "");
      setName(workspace.name || "");
      setTimezone(workspace.timezone || "");
      setPhone(workspace.phone || "");
      setAreaCode(workspace.area_code || "");
    }
  }, [workspace]);

  // Redirect if onboarding already done
  useEffect(() => {
    if (workspace?.onboarding_completed) {
      navigate("/billing", { replace: true });
    }
  }, [workspace, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Setting up your workspace…</p>
        <Button variant="outline" onClick={() => refresh()}>Retry</Button>
      </div>
    );
  }

  const saveField = async (fields: Record<string, any>) => {
    setSaving(true);
    const { error } = await db
      .from("workspaces")
      .update(fields)
      .eq("id", workspace.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }
    await refresh();
    toast({ title: "Saved" });
    return true;
  };

  const handleNext = async () => {
    if (step === 0) {
      if (!businessType) { toast({ title: "Required", description: "Select a business type", variant: "destructive" }); return; }
      if (await saveField({ business_type: businessType })) setStep(1);
    } else if (step === 1) {
      if (!name.trim()) { toast({ title: "Required", description: "Enter your business name", variant: "destructive" }); return; }
      if (!timezone) { toast({ title: "Required", description: "Select a timezone", variant: "destructive" }); return; }
      if (await saveField({ name: name.trim(), timezone, phone: phone.trim() || null })) setStep(2);
    } else if (step === 2) {
      if (!/^[0-9]{3}$/.test(areaCode)) { toast({ title: "Invalid", description: "Enter a 3-digit area code", variant: "destructive" }); return; }
      if (await saveField({ area_code: areaCode })) setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      if (await saveField({ onboarding_completed: true })) {
        navigate("/billing");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-xl px-4 py-10">
        {/* Stepper */}
        <div className="mb-8 flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-1 h-0.5 w-full ${i < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[step]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 0 && (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "dental", label: "Dental Practice", icon: Stethoscope },
                  { value: "medspa", label: "Med Spa", icon: Sparkles },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setBusinessType(opt.value)}
                    className={`flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-colors ${businessType === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                  >
                    <opt.icon className="h-8 w-8 text-primary" />
                    <span className="font-medium text-foreground">{opt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name *</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Bright Smile Dental" />
                </div>
                <div className="space-y-2">
                  <Label>Timezone *</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger>
                    <SelectContent>
                      {US_TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Business Phone (optional)</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
                </div>
              </>
            )}

            {step === 2 && (
              <div className="space-y-2">
                <Label htmlFor="area_code">Preferred Area Code *</Label>
                <Input id="area_code" value={areaCode} onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="212" maxLength={3} className="max-w-[120px] text-center text-lg tracking-widest" />
                <p className="text-sm text-muted-foreground">We'll provision a local phone number with this area code for your AI receptionist.</p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3 rounded-lg bg-muted p-4">
                <p className="font-medium text-foreground">How after-hours calls work:</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  <li>Your AI receptionist answers every call 24/7</li>
                  <li>After hours, it captures the caller's information as a lead</li>
                  <li>Promises a callback during business hours</li>
                  <li>Sends you an instant notification via SMS</li>
                </ul>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-border pb-2"><span className="text-muted-foreground">Business Type</span><span className="font-medium text-foreground capitalize">{businessType === "medspa" ? "Med Spa" : "Dental"}</span></div>
                <div className="flex justify-between border-b border-border pb-2"><span className="text-muted-foreground">Name</span><span className="font-medium text-foreground">{name}</span></div>
                <div className="flex justify-between border-b border-border pb-2"><span className="text-muted-foreground">Timezone</span><span className="font-medium text-foreground">{US_TIMEZONES.find((t) => t.value === timezone)?.label ?? timezone}</span></div>
                <div className="flex justify-between border-b border-border pb-2"><span className="text-muted-foreground">Phone</span><span className="font-medium text-foreground">{phone || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Area Code</span><span className="font-medium text-foreground">{areaCode}</span></div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || saving}>Back</Button>
              <Button onClick={handleNext} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {step === 4 ? "Continue to Payment" : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
