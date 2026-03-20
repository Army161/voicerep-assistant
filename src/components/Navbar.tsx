import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Phone className="h-5 w-5 text-primary" />
          Autonomous Voice Reps
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Button variant="ghost" asChild>
                <Link to="/app">Dashboard</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/app/leads">Leads</Link>
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            <Button variant="ghost" asChild>
              <Link to="/demo">Demo</Link>
            </Button>
            <Button asChild>
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
