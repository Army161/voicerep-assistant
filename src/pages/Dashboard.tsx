import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Phone, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const db = supabase as any;

const Dashboard = () => {
  const { workspace } = useAuth();
  const [provisioning, setProvisioning] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadingProv, setLoadingProv] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingCalls, setLoadingCalls] = useState(true);

  useEffect(() => {
    if (!workspace) return;
    const wid = workspace.id;

    db.from("provisioning").select("*").eq("workspace_id", wid).maybeSingle()
      .then(({ data }: any) => { setProvisioning(data); setLoadingProv(false); });

    db.from("leads").select("*").eq("workspace_id", wid).order("created_at", { ascending: false }).limit(50)
      .then(({ data }: any) => { setLeads(data ?? []); setLoadingLeads(false); });

    db.from("calls").select("*").eq("workspace_id", wid).order("created_at", { ascending: false }).limit(50)
      .then(({ data }: any) => { setCalls(data ?? []); setLoadingCalls(false); });
  }, [workspace]);

  const filteredLeads = statusFilter === "all" ? leads : leads.filter((l) => l.status === statusFilter);

  const statusColor = (s: string) => {
    if (s === "succeeded") return "default";
    if (s === "failed") return "destructive";
    return "secondary";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <Button variant="outline" asChild><Link to="/app/settings">Settings</Link></Button>
        </div>

        {/* Provisioning */}
        <Card className="mb-6">
          <CardHeader><CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5" /> AI Phone Line</CardTitle></CardHeader>
          <CardContent>
            {loadingProv ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : provisioning ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={provisioning.status === "succeeded" ? "default" : provisioning.status === "failed" ? "destructive" : "secondary"}>
                    {provisioning.status === "succeeded" ? "Active" : provisioning.status === "pending" ? "Setting up…" : provisioning.status}
                  </Badge>
                </div>
                {provisioning.twilio_phone_number && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Your number:</span>
                    <span className="font-mono text-lg font-semibold text-foreground">{provisioning.twilio_phone_number}</span>
                  </div>
                )}
                {provisioning.status === "pending" && (
                  <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Provisioning your AI phone line. This usually takes under a minute.</span>
                  </div>
                )}
                {provisioning.status === "failed" && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">Provisioning failed. Please retry or contact support.</p>
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <Link to="/app/billing/success">Retry Provisioning</Link>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No provisioning record found. Complete onboarding and billing first.</p>
            )}
          </CardContent>
        </Card>

        {/* Leads */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Leads</CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loadingLeads ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : filteredLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leads yet. They'll appear here once your AI line is active.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                   <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Fit</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="text-xs text-muted-foreground">{format(new Date(lead.created_at), "MMM d, h:mm a")}</TableCell>
                        <TableCell>{lead.name || "—"}</TableCell>
                        <TableCell className="font-mono text-sm">{lead.phone || "—"}</TableCell>
                       <TableCell>{lead.source || "—"}</TableCell>
                        <TableCell>
                          {lead.metadata?.qualified === true ? (
                            <Badge variant="default">Qualified</Badge>
                          ) : lead.metadata?.qualified === false ? (
                            <Badge variant="destructive">Not Qualified</Badge>
                          ) : (
                            <Badge variant="secondary">—</Badge>
                          )}
                        </TableCell>
                        <TableCell><Badge variant="secondary">{lead.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calls */}
        <Card>
          <CardHeader><CardTitle>Recent Calls</CardTitle></CardHeader>
          <CardContent>
            {loadingCalls ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : calls.length === 0 ? (
              <p className="text-sm text-muted-foreground">No calls yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Sentiment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calls.map((call) => (
                      <TableRow key={call.id}>
                        <TableCell className="text-xs text-muted-foreground">{format(new Date(call.created_at), "MMM d, h:mm a")}</TableCell>
                        <TableCell className="capitalize">{call.direction}</TableCell>
                        <TableCell><Badge variant="secondary">{call.status}</Badge></TableCell>
                        <TableCell>{call.duration_seconds != null ? `${call.duration_seconds}s` : "—"}</TableCell>
                        <TableCell className="capitalize">{call.sentiment || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
