import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

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

const Settings = () => {
  const { profile, workspace, refresh } = useAuth();
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [phone, setPhone] = useState("");
  const [areaCode, setAreaCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [provStatus, setProvStatus] = useState<string | null>(null);

  useEffect(() => {
    if (workspace) {
      setName(workspace.name || "");
      setTimezone(workspace.timezone || "");
      setPhone(workspace.phone || "");
      setAreaCode(workspace.area_code || "");

      db.from("provisioning").select("status").eq("workspace_id", workspace.id).maybeSingle()
        .then(({ data }: any) => setProvStatus(data?.status ?? null));
    }
  }, [workspace]);

  const areaCodeLocked = provStatus === "succeeded";

  const handleSave = async () => {
    if (!workspace) return;
    if (!name.trim()) { toast({ title: "Required", description: "Business name is required", variant: "destructive" }); return; }
    if (!areaCodeLocked && areaCode && !/^[0-9]{3}$/.test(areaCode)) {
      toast({ title: "Invalid", description: "Area code must be 3 digits", variant: "destructive" }); return;
    }

    setSaving(true);
    const fields: Record<string, any> = { name: name.trim(), timezone, phone: phone.trim() || null };
    if (!areaCodeLocked) fields.area_code = areaCode || null;

    const { error } = await db.from("workspaces").update(fields).eq("id", workspace.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await refresh();
      toast({ title: "Settings saved" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <Button variant="outline" asChild><Link to="/app">Back to Dashboard</Link></Button>
        </div>

        <Card className="mb-6">
          <CardHeader><CardTitle>Account</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground"><strong>Email:</strong> {profile?.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Workspace</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ws-name">Business Name</Label>
              <Input id="ws-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
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
              <Label htmlFor="ws-phone">Business Phone</Label>
              <Input id="ws-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-area">Area Code</Label>
              {areaCodeLocked ? (
                <div>
                  <Input id="ws-area" value={areaCode} disabled className="max-w-[120px]" />
                  <p className="mt-1 text-xs text-muted-foreground">Locked — your phone number is already provisioned.</p>
                </div>
              ) : (
                <Input id="ws-area" value={areaCode} onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, "").slice(0, 3))} maxLength={3} className="max-w-[120px]" />
              )}
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
