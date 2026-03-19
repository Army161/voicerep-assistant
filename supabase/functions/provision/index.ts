import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VAPI_BASE = "https://api.vapi.ai";

// ── Helpers ──────────────────────────────────────────────────────────

async function vapiRequest(path: string, body: Record<string, unknown>) {
  const apiKey = Deno.env.get("VAPI_API_KEY");
  if (!apiKey) throw new Error("VAPI_API_KEY is not configured");

  const res = await fetch(`${VAPI_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Vapi ${path} failed [${res.status}]: ${JSON.stringify(data)}`);
  }
  return data;
}

async function twilioRequest(path: string, params: Record<string, string>) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  if (!accountSid || !authToken) throw new Error("Twilio credentials not configured");

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Twilio ${path} failed [${res.status}]: ${JSON.stringify(data)}`);
  }
  return data;
}

async function twilioGet(path: string, params?: Record<string, string>) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  if (!accountSid || !authToken) throw new Error("Twilio credentials not configured");

  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}${path}${qs}`;
  const res = await fetch(url, {
    headers: {
      Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Twilio GET ${path} failed [${res.status}]: ${JSON.stringify(data)}`);
  }
  return data;
}

// ── Vapi Tool Definitions ────────────────────────────────────────────

function buildVapiTools(supabaseUrl: string) {
  const serverUrl = `${supabaseUrl}/functions/v1/vapi-tools`;

  return [
    {
      type: "function",
      function: {
        name: "create_lead",
        description:
          "Create a new lead when you capture a caller's contact information. Call this whenever the caller provides their name, phone, or email.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Caller's full name" },
            phone: { type: "string", description: "Caller's phone number" },
            email: { type: "string", description: "Caller's email address" },
            notes: { type: "string", description: "Any additional notes about the caller's needs" },
          },
          required: ["name"],
        },
      },
      server: { url: serverUrl },
    },
    {
      type: "function",
      function: {
        name: "send_sms",
        description:
          "Send an SMS message to a phone number. Use this to send appointment confirmations or follow-up texts to callers.",
        parameters: {
          type: "object",
          properties: {
            to: { type: "string", description: "Recipient phone number in E.164 format" },
            message: { type: "string", description: "SMS message body" },
          },
          required: ["to", "message"],
        },
      },
      server: { url: serverUrl },
    },
    {
      type: "function",
      function: {
        name: "notify_staff",
        description:
          "Send an urgent notification to the office staff. Use this when a caller has an emergency or needs immediate attention.",
        parameters: {
          type: "object",
          properties: {
            message: { type: "string", description: "Notification message for the staff" },
            caller_name: { type: "string", description: "Name of the caller" },
            caller_phone: { type: "string", description: "Phone number of the caller" },
          },
          required: ["message"],
        },
      },
      server: { url: serverUrl },
    },
  ];
}

// ── Assistant Templates ──────────────────────────────────────────────

function buildAssistant(
  businessType: string,
  businessName: string,
  toolIds: string[],
  serverSecret: string,
  supabaseUrl: string,
) {
  const isDental = businessType === "dental";
  const typeName = isDental ? "dental practice" : "med spa";

  const firstMessage = isDental
    ? `Hi, thank you for calling ${businessName}! This is our AI receptionist. How can I help you today? I can help you schedule an appointment, answer questions about our services, or connect you with our team.`
    : `Hi, thank you for calling ${businessName}! This is our AI receptionist. How can I help you today? I can help you book a consultation, answer questions about our treatments, or connect you with our team.`;

  const systemPrompt = `You are a friendly and professional AI receptionist for ${businessName}, a ${typeName}. Your primary goals are:

1. **Answer calls professionally** - Greet callers warmly and help them with their needs.
2. **Capture lead information** - Always try to get the caller's name and phone number. Use the create_lead tool to save their information.
3. **Handle common questions** - Answer basic questions about the ${typeName} (hours, location, services).
4. **Book appointments** - Help callers express interest in booking. Capture their info and let them know someone will call back to confirm.
5. **Handle emergencies** - If a caller describes an urgent ${isDental ? "dental" : "medical"} issue, use the notify_staff tool immediately.
6. **After-hours handling** - If the office is closed, let the caller know, capture their information, and promise a callback during business hours.

Guidelines:
- Be warm, empathetic, and concise.
- Never make up information about pricing, specific availability, or ${isDental ? "treatments" : "procedures"}.
- If you don't know something, say you'll have someone from the office follow up.
- Always confirm the caller's phone number before ending the call.
- Use the send_sms tool to send appointment confirmation texts when appropriate.`;

  return {
    name: `${businessName} AI Receptionist`,
    firstMessage,
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }],
      tools: toolIds.map((id) => ({ type: "function", id })),
    },
    voice: {
      provider: "11labs",
      voiceId: isDental ? "21m00Tcm4TlvDq8ikWAM" : "EXAVITQu4vr4xnSDxMaL",
    },
    serverUrl: `${supabaseUrl}/functions/v1/vapi-tools`,
    serverUrlSecret: serverSecret,
  };
}

// ── Main Handler ─────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // 2. Get workspace
    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: profile } = await adminClient
      .from("profiles")
      .select("default_workspace_id")
      .eq("id", userId)
      .single();

    if (!profile?.default_workspace_id) {
      return new Response(JSON.stringify({ error: "No workspace found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const workspaceId = profile.default_workspace_id;

    const { data: workspace } = await adminClient
      .from("workspaces")
      .select("*")
      .eq("id", workspaceId)
      .single();

    if (!workspace) {
      return new Response(JSON.stringify({ error: "Workspace not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Check existing provisioning (idempotency)
    const { data: prov } = await adminClient
      .from("provisioning")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single();

    if (!prov) {
      return new Response(JSON.stringify({ error: "No provisioning record" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (prov.status === "succeeded") {
      return new Response(
        JSON.stringify({ message: "Already provisioned", status: "succeeded" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Mark as in-progress
    await adminClient
      .from("provisioning")
      .update({ status: "provisioning" })
      .eq("id", prov.id);

    const serverSecret = Deno.env.get("VAPI_SERVER_SECRET")!;

    try {
      // 4. Create Vapi tools (skip if already created)
      let toolIds: string[] = prov.vapi_tool_ids || [];

      if (toolIds.length === 0) {
        const toolDefs = buildVapiTools(supabaseUrl);
        const createdTools = [];

        for (const toolDef of toolDefs) {
          const tool = await vapiRequest("/tool", {
            type: "function",
            function: toolDef.function,
            server: toolDef.server,
          });
          createdTools.push(tool.id);
        }

        toolIds = createdTools;

        await adminClient
          .from("provisioning")
          .update({ vapi_tool_ids: toolIds })
          .eq("id", prov.id);
      }

      // 5. Create Vapi assistant (skip if already created)
      let assistantId = prov.vapi_assistant_id;

      if (!assistantId) {
        const assistantDef = buildAssistant(
          workspace.business_type || "dental",
          workspace.name,
          toolIds,
          serverSecret,
          supabaseUrl,
        );

        const assistant = await vapiRequest("/assistant", assistantDef);
        assistantId = assistant.id;

        await adminClient
          .from("provisioning")
          .update({ vapi_assistant_id: assistantId })
          .eq("id", prov.id);
      }

      // 6. Purchase Twilio phone number (skip if already purchased)
      let twilioSid = prov.twilio_sid;
      let phoneNumber = prov.twilio_phone_number;

      if (!twilioSid) {
        const areaCode = workspace.area_code || "212";

        // Search for available local numbers
        const available = await twilioGet(
          "/AvailablePhoneNumbers/US/Local.json",
          { AreaCode: areaCode, PageSize: "1", VoiceEnabled: "true" },
        );

        if (!available.available_phone_numbers?.length) {
          throw new Error(`No phone numbers available for area code ${areaCode}`);
        }

        const selectedNumber = available.available_phone_numbers[0].phone_number;

        // Purchase the number and point it to Vapi
        const purchased = await twilioRequest("/IncomingPhoneNumbers.json", {
          PhoneNumber: selectedNumber,
          VoiceUrl: `https://api.vapi.ai/twilio/inbound_call/${assistantId}`,
          VoiceMethod: "POST",
          StatusCallback: `${supabaseUrl}/functions/v1/vapi-tools`,
          StatusCallbackMethod: "POST",
        });

        twilioSid = purchased.sid;
        phoneNumber = purchased.phone_number;

        await adminClient
          .from("provisioning")
          .update({
            twilio_sid: twilioSid,
            twilio_phone_number: phoneNumber,
          })
          .eq("id", prov.id);
      }

      // 7. Mark as succeeded
      await adminClient
        .from("provisioning")
        .update({ status: "succeeded" })
        .eq("id", prov.id);

      return new Response(
        JSON.stringify({
          status: "succeeded",
          phone_number: phoneNumber,
          assistant_id: assistantId,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (innerErr) {
      // Mark as failed so it can be retried
      await adminClient
        .from("provisioning")
        .update({ status: "failed" })
        .eq("id", prov.id);

      throw innerErr;
    }
  } catch (err) {
    console.error("Provisioning error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
