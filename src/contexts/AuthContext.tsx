import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Untyped client reference for tables not yet in generated types
const db = supabase as any;

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

interface SubscriptionStatus {
  subscribed: boolean;
  plan: string | null;
  subscriptionEnd: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  workspace: Workspace | null;
  subscription: SubscriptionStatus;
  loading: boolean;
  refresh: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  signOut: () => Promise<void>;
}

const DEFAULT_SUBSCRIPTION: SubscriptionStatus = { subscribed: false, plan: null, subscriptionEnd: null };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const RETRY_DELAYS = [300, 700, 1200];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus>(DEFAULT_SUBSCRIPTION);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) {
        console.error("Error checking subscription:", error);
        return;
      }
      setSubscription({
        subscribed: data?.subscribed ?? false,
        plan: data?.plan ?? null,
        subscriptionEnd: data?.subscription_end ?? null,
      });
    } catch (err) {
      console.error("Failed to check subscription:", err);
    }
  }, []);

  const fetchProfileAndWorkspace = useCallback(async (userId: string, retryCount = 0): Promise<void> => {
    const { data: profileData, error: profileError } = await db
      .from("profiles")
      .select("id, email, name, default_workspace_id")
      .eq("id", userId)
      .maybeSingle();

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
      const { data: wsData, error: wsError } = await db
        .from("workspaces")
        .select("id, name, business_type, timezone, phone, area_code, onboarding_completed")
        .eq("id", profileData.default_workspace_id)
        .maybeSingle();

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
      await checkSubscription();
    }
  }, [user, fetchProfileAndWorkspace, checkSubscription]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setWorkspace(null);
    setSubscription(DEFAULT_SUBSCRIPTION);
  }, []);

  // Periodic subscription refresh (every 60s)
  useEffect(() => {
    if (user) {
      checkSubscription();
      intervalRef.current = setInterval(checkSubscription, 60_000);
    } else {
      setSubscription(DEFAULT_SUBSCRIPTION);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, checkSubscription]);

  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          setTimeout(() => fetchProfileAndWorkspace(newSession.user.id), 0);
        } else {
          setProfile(null);
          setWorkspace(null);
          setSubscription(DEFAULT_SUBSCRIPTION);
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

    return () => authSub.unsubscribe();
  }, [fetchProfileAndWorkspace]);

  return (
    <AuthContext.Provider value={{ session, user, profile, workspace, subscription, loading, refresh, refreshSubscription: checkSubscription, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
