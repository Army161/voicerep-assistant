import { useState, lazy, Suspense } from "react";
import { z } from "zod";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, ArrowRight, Phone, Users, Building2, MapPin, Search } from "lucide-react";
import { Link } from "react-router-dom";
import AddressAutocomplete, { type NominatimResult } from "@/components/AddressAutocomplete";

const CompetitorMap = lazy(() => import("@/components/CompetitorMap"));



const BUSINESS_TYPES = [
  { value: "dental", label: "Dental Practice", qualified: true },
  { value: "medspa", label: "Med Spa / Aesthetics", qualified: true },
  { value: "chiropractic", label: "Chiropractic", qualified: true },
  { value: "veterinary", label: "Veterinary Clinic", qualified: true },
  { value: "optometry", label: "Optometry", qualified: true },
  { value: "dermatology", label: "Dermatology", qualified: true },
  { value: "other_medical", label: "Other Medical/Health", qualified: true },
  { value: "legal", label: "Legal / Law Firm", qualified: false },
  { value: "real_estate", label: "Real Estate", qualified: false },
  { value: "restaurant", label: "Restaurant / Food Service", qualified: false },
  { value: "retail", label: "Retail", qualified: false },
  { value: "other", label: "Other", qualified: false },
];

const CALL_VOLUMES = [
  { value: "under_50", label: "Under 50 calls/month" },
  { value: "50_200", label: "50–200 calls/month" },
  { value: "200_500", label: "200–500 calls/month" },
  { value: "500_plus", label: "500+ calls/month" },
];

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Valid email required").max(255),
  phone: z.string().trim().min(1, "Phone is required").max(20),
  businessName: z.string().trim().min(1, "Business name is required").max(100),
  businessType: z.string().min(1, "Select your business type"),
  callVolume: z.string().min(1, "Select your call volume"),
  address: z.string().trim().min(1, "Search for your business address").max(300),
});

type FormData = z.infer<typeof formSchema>;

interface LocationData {
  lat: number;
  lon: number;
  city?: string;
  state?: string;
}

const Qualify = () => {
  const [form, setForm] = useState<Partial<FormData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [result, setResult] = useState<{
    qualified: boolean;
    reasons: string[];
    score: number;
  } | null>(null);

  const updateField = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleAddressSelect = (r: NominatimResult) => {
    setLocation({
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      city: r.address?.city || r.address?.town,
      state: r.address?.state,
    });
    // Auto-fill city/state into display
    updateField("address", r.display_name);
  };

  const qualify = (data: FormData) => {
    const bt = BUSINESS_TYPES.find((b) => b.value === data.businessType);
    const isQualifiedType = bt?.qualified ?? false;
    const hasVolume = data.callVolume !== "under_50";
    const hasLocation = !!location;

    let score = 0;
    const reasons: string[] = [];

    if (isQualifiedType) {
      score += 40;
      reasons.push(`✓ ${bt!.label} is a supported business type`);
    } else {
      reasons.push(`✗ ${bt?.label ?? data.businessType} is not currently supported — we serve medical & health practices`);
    }

    if (hasVolume) {
      score += 30;
      reasons.push("✓ Your call volume is a great fit for AI automation");
    } else {
      score += 10;
      reasons.push("✗ Under 50 calls/month may not see enough ROI yet");
    }

    if (hasLocation) {
      score += 20;
      reasons.push(`✓ Business location verified — ${location!.city || "your area"}, ${location!.state || ""}`);
    } else {
      score += 5;
      reasons.push("△ Location not verified — add your address for a competitor analysis");
    }

    if (data.callVolume === "500_plus") {
      score += 10;
      reasons.push("✓ High call volume — you'll see massive ROI with AI automation");
    }

    const qualified = isQualifiedType && hasVolume;
    return { qualified, reasons, score: Math.min(score, 100) };
  };

  const handleSubmit = async () => {
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((e) => {
        const key = e.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const data = parsed.data;
    const qualification = qualify(data);

    try {
      await supabase.functions.invoke("submit-lead", {
        body: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          businessName: data.businessName,
          businessType: data.businessType,
          callVolume: data.callVolume,
          address: data.address,
          metadata: {
            lat: location?.lat,
            lon: location?.lon,
            city: location?.city,
            state: location?.state,
            qualification_score: qualification.score,
            qualified: qualification.qualified,
          },
        },
      });
    } catch {
      // Edge function error — result still shows
    }

    setResult(qualification);
    setSubmitting(false);
  };

  // ── Result Screen ──
  if (result) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-12">
          {/* Score + verdict */}
          <Card className="overflow-hidden mb-6">
            <div className={`p-6 text-center ${result.qualified ? "bg-primary/10" : "bg-destructive/10"}`}>
              {result.qualified ? (
                <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
              ) : (
                <XCircle className="mx-auto h-14 w-14 text-destructive" />
              )}
              <h2 className="mt-3 text-2xl font-bold text-foreground">
                {result.qualified ? "Great news — you're a perfect fit!" : "Not quite the right fit yet"}
              </h2>
              <div className="mt-3 flex items-center justify-center gap-3">
                <Badge variant={result.qualified ? "default" : "secondary"}>
                  {result.qualified ? "Qualified" : "Not Qualified"}
                </Badge>
                <span className="text-sm font-medium text-muted-foreground">
                  Score: {result.score}/100
                </span>
              </div>
            </div>
            <CardContent className="space-y-2 p-6">
              {result.reasons.map((r, i) => (
                <p key={i} className="text-sm text-muted-foreground">{r}</p>
              ))}
              <div className="pt-4">
                {result.qualified ? (
                  <Button className="w-full" asChild>
                    <Link to="/login">
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full" onClick={() => setResult(null)}>
                      Try Again
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      Think we got it wrong?{" "}
                      <Link to="/login" className="text-primary underline">Sign up anyway</Link>
                      {" "}— we're expanding to new industries soon.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Competitor map on result */}
          {location && form.businessType && (
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
              <CompetitorMap
                lat={location.lat}
                lon={location.lon}
                businessType={form.businessType}
                businessName={form.businessName || "Your Business"}
              />
            </Suspense>
          )}
        </div>
      </div>
    );
  }

  // ── Form Screen ──
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            See If You Qualify
          </h1>
          <p className="mt-2 text-muted-foreground">
            Find out in 30 seconds if an AI receptionist is right for your business.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Tell us about your business
              </CardTitle>
              <CardDescription>
                We'll instantly evaluate fit and show you competitors in your area.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="q-name">Your Name *</Label>
                  <Input id="q-name" value={form.name ?? ""} onChange={(e) => updateField("name", e.target.value)} placeholder="Jane Smith" />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="q-phone">Phone *</Label>
                  <Input id="q-phone" value={form.phone ?? ""} onChange={(e) => updateField("phone", e.target.value)} placeholder="(555) 123-4567" />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="q-email">Email *</Label>
                <Input id="q-email" type="email" value={form.email ?? ""} onChange={(e) => updateField("email", e.target.value)} placeholder="jane@example.com" />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="q-biz">Business Name *</Label>
                <Input id="q-biz" value={form.businessName ?? ""} onChange={(e) => updateField("businessName", e.target.value)} placeholder="Bright Smile Dental" />
                {errors.businessName && <p className="text-xs text-destructive">{errors.businessName}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Business Address *</Label>
                <AddressAutocomplete
                  id="q-address"
                  value={form.address ?? ""}
                  onChange={(v) => updateField("address", v)}
                  onSelect={handleAddressSelect}
                  placeholder="Search your business address…"
                />
                {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                {location && (
                  <p className="flex items-center gap-1 text-xs text-primary">
                    <MapPin className="h-3 w-3" />
                    Location verified — {location.city}{location.state ? `, ${location.state}` : ""}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Business Type *</Label>
                <Select value={form.businessType ?? ""} onValueChange={(v) => updateField("businessType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((bt) => (
                      <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.businessType && <p className="text-xs text-destructive">{errors.businessType}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Monthly Call Volume *</Label>
                <Select value={form.callVolume ?? ""} onValueChange={(v) => updateField("callVolume", v)}>
                  <SelectTrigger><SelectValue placeholder="Select volume" /></SelectTrigger>
                  <SelectContent>
                    {CALL_VOLUMES.map((cv) => (
                      <SelectItem key={cv.value} value={cv.value}>{cv.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.callVolume && <p className="text-xs text-destructive">{errors.callVolume}</p>}
              </div>

              <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Check Qualification
              </Button>
            </CardContent>
          </Card>

          {/* Live competitor preview if location selected */}
          {location && form.businessType && (
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
              <CompetitorMap
                lat={location.lat}
                lon={location.lon}
                businessType={form.businessType}
                businessName={form.businessName || "Your Business"}
              />
            </Suspense>
          )}
        </div>

        {/* Trust signals */}
        <div className="mt-8 flex items-center justify-center gap-6 text-muted-foreground">
          <div className="flex items-center gap-1.5 text-xs">
            <Phone className="h-4 w-4" /> 24/7 AI Answering
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Users className="h-4 w-4" /> 500+ Practices
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Building2 className="h-4 w-4" /> HIPAA Ready
          </div>
        </div>
      </div>
    </div>
  );
};

export default Qualify;
