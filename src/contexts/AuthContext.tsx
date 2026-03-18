import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  email: string;
  name: string | null;
  default_workspace_id: string | null;
}

interface Workspace {
  id: string;
  name: string;
  business_type: string | null;
  timezone: string | null;
  phone: string | null;
  area_code: string | null;
  onboarding_completed: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  workspace: Workspace | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const RETRY_DELAYS = [300, 700, 1200];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndWorkspace = useCallback(async (userId: string, retryCount = 0): Promise<void> => {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles" as any)
      .select("id, email, name, default_workspace_id")
      .eq("id", userId)
      .maybeSingle() as { data: Profile | null; error: any };

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return;
    }

    if (!profileData) {
      if (retryCount < RETRY_DELAYS.length) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[retryCount]));
        return fetchProfileAndWorkspace(userId, retryCount + 1);
      }
      console.error("Profile not found after retries");
      return;
    }

    setProfile(profileData);

    if (profileData.default_workspace_id) {
      const { data: wsData, error: wsError } = await supabase
        .from("workspaces" as any)
        .select("id, name, business_type, timezone, phone, area_code, onboarding_completed")
        .eq("id", profileData.default_workspace_id)
        .maybeSingle() as { data: Workspace | null; error: any };

      if (wsError) {
        console.error("Error fetching workspace:", wsError);
        return;
      }

      if (!wsData && retryCount < RETRY_DELAYS.length) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[retryCount]));
        return fetchProfileAndWorkspace(userId, retryCount + 1);
      }

      setWorkspace(wsData);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (user) {
      await fetchProfileAndWorkspace(user.id);
    }
  }, [user, fetchProfileAndWorkspace]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setWorkspace(null);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          setTimeout(() => fetchProfileAndWorkspace(newSession.user.id), 0);
        } else {
          setProfile(null);
          setWorkspace(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchProfileAndWorkspace(currentSession.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfileAndWorkspace]);

  return (
    <AuthContext.Provider value={{ session, user, profile, workspace, loading, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
