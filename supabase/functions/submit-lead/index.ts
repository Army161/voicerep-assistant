import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const body = await req.json();

    // Validate required fields
    const { name, email, phone, businessName, businessType, callVolume, address, metadata } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid name" }), { status: 400, headers: corsHeaders });
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
      return new Response(JSON.stringify({ error: "Invalid email" }), { status: 400, headers: corsHeaders });
    }
    if (!phone || typeof phone !== "string" || phone.trim().length === 0 || phone.length > 20) {
      return new Response(JSON.stringify({ error: "Invalid phone" }), { status: 400, headers: corsHeaders });
    }
    if (!businessName || typeof businessName !== "string" || businessName.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid business name" }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Use a system workspace for public leads
    // First check if the public workspace exists, create if not
    const PUBLIC_WS_ID = "00000000-0000-0000-0000-000000000000";

    const { error: insertError } = await supabase.from("leads").insert({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      source: "website_qualify",
      status: metadata?.qualified ? "new" : "unqualified",
      metadata: {
        business_name: businessName,
        business_type: businessType || null,
        call_volume: callVolume || null,
        address: address || null,
        ...(metadata || {}),
      },
      workspace_id: PUBLIC_WS_ID,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      // If workspace doesn't exist, create it first
      if (insertError.message?.includes("foreign key")) {
        // Create the public workspace with a service role
        const { error: wsError } = await supabase.from("workspaces").insert({
          id: PUBLIC_WS_ID,
          owner_id: "00000000-0000-0000-0000-000000000000",
          name: "Public Leads",
        });
        if (wsError) {
          console.error("Workspace create error:", wsError);
          return new Response(JSON.stringify({ error: "Failed to save lead" }), { status: 500, headers: corsHeaders });
        }
        // Retry insert
        const { error: retryError } = await supabase.from("leads").insert({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          source: "website_qualify",
          status: metadata?.qualified ? "new" : "unqualified",
          metadata: {
            business_name: businessName,
            business_type: businessType || null,
            call_volume: callVolume || null,
            address: address || null,
            ...(metadata || {}),
          },
          workspace_id: PUBLIC_WS_ID,
        });
        if (retryError) {
          console.error("Retry insert error:", retryError);
          return new Response(JSON.stringify({ error: "Failed to save lead" }), { status: 500, headers: corsHeaders });
        }
      } else {
        return new Response(JSON.stringify({ error: "Failed to save lead" }), { status: 500, headers: corsHeaders });
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders });
  }
});
