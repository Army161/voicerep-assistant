// TODO: Implement Vapi tool endpoints (called by Vapi assistant during calls)
// Expected env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPI_SERVER_SECRET

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // TODO: Verify Vapi server secret token
    // const token = req.headers.get("x-vapi-secret");

    const body = await req.json();
    const toolName = body?.message?.toolCalls?.[0]?.function?.name;

    // TODO: Route by tool name:
    // - create_lead: insert into leads table
    // - send_sms: insert into outbox table with channel='sms'
    // - notify_staff: insert into outbox table with channel='sms' to workspace phone

    return new Response(
      JSON.stringify({ error: "Not implemented yet" }),
      {
        status: 501,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
