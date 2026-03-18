
-- 1. profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  default_workspace_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- 2. workspaces
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Workspace',
  business_type text,
  timezone text,
  phone text,
  area_code text,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- 3. workspace_members
CREATE TABLE public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Helper function: check workspace membership (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  );
$$;

-- workspace RLS via membership
CREATE POLICY "Members can read workspace" ON public.workspaces FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), id));
CREATE POLICY "Owner can update workspace" ON public.workspaces FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

-- workspace_members RLS
CREATE POLICY "Members can read members" ON public.workspace_members FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

-- 4. subscriptions
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read subscription" ON public.subscriptions FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

-- 5. provisioning
CREATE TABLE public.provisioning (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  twilio_sid text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.provisioning ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read provisioning" ON public.provisioning FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

-- 6. leads
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text,
  phone text,
  email text,
  source text,
  status text NOT NULL DEFAULT 'new',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read leads" ON public.leads FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Members can insert leads" ON public.leads FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Members can update leads" ON public.leads FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

-- 7. calls
CREATE TABLE public.calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id),
  direction text NOT NULL DEFAULT 'inbound',
  status text NOT NULL DEFAULT 'queued',
  duration_seconds integer,
  recording_url text,
  transcript text,
  sentiment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read calls" ON public.calls FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Members can insert calls" ON public.calls FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

-- 8. outbox (MVP message queue)
CREATE TABLE public.outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'sms',
  recipient text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
ALTER TABLE public.outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read outbox" ON public.outbox FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Members can insert outbox" ON public.outbox FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

-- FK for profiles.default_workspace_id (now that workspaces exists)
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_default_workspace_id_fkey
  FOREIGN KEY (default_workspace_id) REFERENCES public.workspaces(id);

-- 9. Signup trigger: auto-create profile + workspace + membership + provisioning
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace_id uuid;
BEGIN
  -- Create workspace
  INSERT INTO public.workspaces (owner_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'My Workspace'))
  RETURNING id INTO new_workspace_id;

  -- Create profile
  INSERT INTO public.profiles (id, email, name, default_workspace_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    new_workspace_id
  );

  -- Create workspace membership
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (new_workspace_id, NEW.id, 'owner');

  -- Create provisioning record
  INSERT INTO public.provisioning (workspace_id, status)
  VALUES (new_workspace_id, 'pending');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
