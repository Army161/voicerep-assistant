ALTER TABLE public.provisioning
  ADD COLUMN IF NOT EXISTS vapi_assistant_id text,
  ADD COLUMN IF NOT EXISTS vapi_tool_ids jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS twilio_phone_number text;