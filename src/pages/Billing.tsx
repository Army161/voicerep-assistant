import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Billing = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="flex items-center justify-center px-4 py-20">
      <Card className="w-full max-w-md text-center">
        <CardHeader><CardTitle>Billing</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Billing & subscription management coming soon.</p>
          <Link to="/app" className="mt-4 inline-block text-sm text-primary underline">Go to Dashboard</Link>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default Billing;
