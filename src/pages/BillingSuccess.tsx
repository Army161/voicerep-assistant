import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";

const BillingSuccess = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="flex items-center justify-center px-4 py-20">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Payment Received</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Provisioning your AI voice line…</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Provisioning will run automatically after Edge Functions are enabled.
          </p>
          <Button asChild>
            <Link to="/app">Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default BillingSuccess;
