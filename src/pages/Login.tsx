import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { Loader2 } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate("/app");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSignupSuccess(true);
    }
  };

  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-20">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Check your email</CardTitle>
              <CardDescription>
                We've sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-20">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex gap-4 border-b border-border pb-4">
              <button
                className={`pb-1 text-sm font-medium ${tab === "signin" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}
                onClick={() => { setTab("signin"); setError(null); }}
              >
                Sign in
              </button>
              <button
                className={`pb-1 text-sm font-medium ${tab === "signup" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}
                onClick={() => { setTab("signup"); setError(null); }}
              >
                Create account
              </button>
            </div>
            <CardTitle className="mt-4">{tab === "signin" ? "Welcome back" : "Create your account"}</CardTitle>
            <CardDescription>
              {tab === "signin" ? "Sign in to your account" : "Get started with Autonomous Voice Reps"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={tab === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
              {tab === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {tab === "signin" ? "Sign in" : "Create account"}
              </Button>
              {tab === "signin" && (
                <p className="text-center text-sm text-muted-foreground">
                  <Link to="/reset-password" className="text-primary underline hover:text-primary/80">
                    Forgot password?
                  </Link>
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
