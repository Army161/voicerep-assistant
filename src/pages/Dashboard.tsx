import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { workspace } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-2xl font-bold text-foreground">Dashboard</h1>
        <Card>
          <CardHeader>
            <CardTitle>{workspace?.name ?? "Your Workspace"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Dashboard coming soon. Your AI voice agents will appear here.</p>
            <Link to="/app/settings" className="inline-block text-primary underline">Settings</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
