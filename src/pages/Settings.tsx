import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const Settings = () => {
  const { profile, workspace } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-2xl font-bold text-foreground">Settings</h1>
        <Card>
          <CardHeader><CardTitle>Account</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Email:</strong> {profile?.email}</p>
            <p><strong>Workspace:</strong> {workspace?.name}</p>
            <p>Settings page coming soon.</p>
            <Link to="/app" className="inline-block text-primary underline">Back to Dashboard</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
