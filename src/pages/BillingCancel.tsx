import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const BillingCancel = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="flex items-center justify-center px-4 py-20">
      <Card className="w-full max-w-md text-center">
        <CardHeader><CardTitle>Payment Cancelled</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Your payment was not completed.</p>
          <Link to="/billing" className="mt-4 inline-block text-sm text-primary underline">Back to Billing</Link>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default BillingCancel;
