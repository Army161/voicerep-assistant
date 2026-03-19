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
    // Verify Vapi server secret
    const serverSecret = Deno.env.get("VAPI_SERVER_SECRET");
    if (!serverSecret) throw new Error("VAPI_SERVER_SECRET is not configured");

    const authHeader = req.headers.get("authorization") || "";
    const vapiSecret = req.headers.get("x-vapi-secret") || "";
    const token = authHeader.replace("Bearer ", "") || vapiSecret;

    if (token !== serverSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const toolCall = body?.message?.toolCalls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No tool call found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const toolName = toolCall.function?.name;
    const args = typeof toolCall.function?.arguments === "string"
      ? JSON.parse(toolCall.function.arguments)
      : toolCall.function?.arguments || {};

    // Extract workspace context from the call metadata
    const assistantId = body?.message?.call?.assistantId;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Resolve workspace from assistant ID
    const { data: prov } = await adminClient
      .from("provisioning")
      .select("workspace_id")
      .eq("vapi_assistant_id", assistantId)
      .single();

    if (!prov) {
      return vapiResponse(toolCall.id, "Sorry, I couldn't identify the workspace for this call.");
    }

    const workspaceId = prov.workspace_id;

    let resultMessage: string;

    switch (toolName) {
      case "create_lead": {
        const { error } = await adminClient.from("leads").insert({
          workspace_id: workspaceId,
          name: args.name || null,
          phone: args.phone || body?.message?.call?.customer?.number || null,
          email: args.email || null,
          source: "vapi_call",
          metadata: args.notes ? { notes: args.notes } : {},
        });

        if (error) {
          console.error("create_lead error:", error);
          resultMessage = "I've noted your information. Someone from our team will follow up with you.";
        } else {
          resultMessage = "I've saved your information. A team member will reach out to you shortly.";
        }
        break;
      }

      case "send_sms": {
        const { error } = await adminClient.from("outbox").insert({
          workspace_id: workspaceId,
          channel: "sms",
          recipient: args.to,
          payload: { body: args.message },
          status: "pending",
        });

        if (error) {
          console.error("send_sms error:", error);
          resultMessage = "I wasn't able to send the text message right now, but I'll make sure someone follows up.";
        } else {
          resultMessage = "I've queued a text message for delivery.";
        }
        break;
      }

      case "notify_staff": {
        // Get workspace phone to notify
        const { data: ws } = await adminClient
          .from("workspaces")
          .select("phone, name")
          .eq("id", workspaceId)
          .single();

        if (!ws?.phone) {
          resultMessage = "I'll make sure the team is notified about this right away.";
        } else {
          const staffMsg = `🚨 Urgent from ${ws.name} AI Receptionist:\n${args.message}${args.caller_name ? `\nCaller: ${args.caller_name}` : ""}${args.caller_phone ? `\nPhone: ${args.caller_phone}` : ""}`;

          const { error } = await adminClient.from("outbox").insert({
            workspace_id: workspaceId,
            channel: "sms",
            recipient: ws.phone,
            payload: { body: staffMsg },
            status: "pending",
          });

          if (error) {
            console.error("notify_staff error:", error);
          }
          resultMessage = "I've sent an urgent notification to the team. They'll be in touch very soon.";
        }
        break;
      }

      default:
        resultMessage = "I'm not sure how to handle that request, but I'll make a note of it.";
    }

    return vapiResponse(toolCall.id, resultMessage);
  } catch (err) {
    console.error("vapi-tools error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/** Return a Vapi-compatible tool response */
function vapiResponse(toolCallId: string, message: string) {
  return new Response(
    JSON.stringify({
      results: [
        {
          toolCallId,
          result: message,
        },
      ],
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}
