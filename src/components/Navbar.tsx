import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Phone, Menu, X } from "lucide-react";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const close = () => setOpen(false);

  return (
    <nav className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-foreground" onClick={close}>
          <Phone className="h-5 w-5 text-primary" />
          <span style={{ fontFamily: "'Playfair Display', serif" }}>Autonomous Voice Reps</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 sm:flex sm:gap-3" style={{ fontFamily: "'Inter', sans-serif" }}>
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/app">Dashboard</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/app/leads">Leads</Link>
              </Button>
              <Button variant="outline" size="sm" className="rounded-full" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <a href="#how-it-works">How it Works</a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="#roi-calculator">ROI Calculator</a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/demo">Demo</Link>
              </Button>
              <Button className="rounded-full" size="sm" asChild>
                <Link to="/login">Log In</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="sm:hidden p-2" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border bg-background px-4 pb-4 pt-2 sm:hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
          <div className="flex flex-col gap-2">
            {user ? (
              <>
                <Button variant="ghost" size="sm" className="justify-start" asChild>
                  <Link to="/app" onClick={close}>Dashboard</Link>
                </Button>
                <Button variant="ghost" size="sm" className="justify-start" asChild>
                  <Link to="/app/leads" onClick={close}>Leads</Link>
                </Button>
                <Button variant="ghost" size="sm" className="justify-start" asChild>
                  <Link to="/app/settings" onClick={close}>Settings</Link>
                </Button>
                <Button variant="outline" size="sm" onClick={() => { close(); handleSignOut(); }}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="justify-start" asChild>
                  <a href="#how-it-works" onClick={close}>How it Works</a>
                </Button>
                <Button variant="ghost" size="sm" className="justify-start" asChild>
                  <a href="#roi-calculator" onClick={close}>ROI Calculator</a>
                </Button>
                <Button variant="ghost" size="sm" className="justify-start" asChild>
                  <Link to="/demo" onClick={close}>Demo</Link>
                </Button>
                <Button className="rounded-full" size="sm" asChild>
                  <Link to="/login" onClick={close}>Log In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
