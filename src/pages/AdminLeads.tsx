import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw, Search, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { format } from "date-fns";

const PAGE_SIZE = 25;

const AdminLeads = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-public-leads", {
        body: null,
        method: "GET",
      });

      // functions.invoke doesn't support GET params well, use POST instead
      const response = await supabase.functions.invoke("get-public-leads", {
        body: { status: statusFilter, limit: PAGE_SIZE, offset: page * PAGE_SIZE },
      });

      if (response.error) {
        console.error("Error fetching leads:", response.error);
        setLeads([]);
        setTotal(0);
      } else {
        setLeads(response.data?.leads ?? []);
        setTotal(response.data?.total ?? 0);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Client-side search filter
  const filtered = searchQuery.trim()
    ? leads.filter((l) => {
        const q = searchQuery.toLowerCase();
        return (
          l.name?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.phone?.includes(q) ||
          l.metadata?.business_name?.toLowerCase().includes(q)
        );
      })
    : leads;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const qualificationBadge = (lead: any) => {
    if (lead.metadata?.qualified === true) return <Badge variant="default">Qualified</Badge>;
    if (lead.metadata?.qualified === false) return <Badge variant="destructive">Not Qualified</Badge>;
    return <Badge variant="secondary">—</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Public Leads</h1>
            <Badge variant="secondary" className="text-xs">{total} total</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLeads} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, or business…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="unqualified">Unqualified</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No leads found. Public leads from the qualify form will appear here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Call Volume</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Fit</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {format(new Date(lead.created_at), "MMM d, h:mm a")}
                        </TableCell>
                        <TableCell className="font-medium">{lead.name || "—"}</TableCell>
                        <TableCell className="text-sm">{lead.email || "—"}</TableCell>
                        <TableCell className="font-mono text-sm">{lead.phone || "—"}</TableCell>
                        <TableCell className="text-sm">{lead.metadata?.business_name || "—"}</TableCell>
                        <TableCell className="text-sm capitalize">{lead.metadata?.business_type?.replace("_", " ") || "—"}</TableCell>
                        <TableCell className="text-sm">{lead.metadata?.call_volume?.replace("_", "–").replace("plus", "+") || "—"}</TableCell>
                        <TableCell>
                          {lead.metadata?.qualification_score != null ? (
                            <span className="font-mono text-sm font-semibold">{lead.metadata.qualification_score}/100</span>
                          ) : "—"}
                        </TableCell>
                        <TableCell>{qualificationBadge(lead)}</TableCell>
                        <TableCell><Badge variant="secondary">{lead.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLeads;
