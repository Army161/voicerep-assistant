import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get workspace
    const { data: profile } = await supabase
      .from("profiles")
      .select("default_workspace_id")
      .eq("id", user.id)
      .single();

    if (!profile?.default_workspace_id) {
      return new Response(JSON.stringify({ error: "No workspace found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const workspaceId = profile.default_workspace_id;

    // Verify subscription is active
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("workspace_id", workspaceId)
      .single();

    if (!sub || sub.status !== "active") {
      return new Response(
        JSON.stringify({ error: "Active subscription required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get provisioning record
    const { data: prov } = await supabase
      .from("provisioning")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single();

    if (!prov || prov.status !== "succeeded" || !prov.vapi_assistant_id) {
      return new Response(
        JSON.stringify({
          error: "AI phone line must be fully provisioned first",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse phone number to call
    const body = await req.json();
    const phoneNumber = body.phone_number;
    if (!phoneNumber || typeof phoneNumber !== "string") {
      return new Response(
        JSON.stringify({ error: "phone_number is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initiate outbound call via Vapi
    const vapiKey = Deno.env.get("VAPI_API_KEY");
    if (!vapiKey) {
      return new Response(
        JSON.stringify({ error: "VAPI_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const vapiRes = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vapiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistantId: prov.vapi_assistant_id,
        customer: { number: phoneNumber },
        phoneNumberId: prov.twilio_sid,
      }),
    });

    const vapiData = await vapiRes.json();

    if (!vapiRes.ok) {
      console.error("Vapi call error:", JSON.stringify(vapiData));
      return new Response(
        JSON.stringify({
          error: "Failed to initiate test call",
          details: vapiData,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, callId: vapiData.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("test-call error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
