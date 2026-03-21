const VAPI_BASE_URL = "https://api.vapi.ai";

const ALLOWED_ASSISTANT_IDS = new Set([
  "5e8bf670-8e75-4293-b3eb-db966b23a6d0",
]);

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const VAPI_PRIVATE_KEY = Deno.env.get("VAPI_API_KEY");
  if (!VAPI_PRIVATE_KEY) return json({ error: "Missing VAPI_API_KEY secret" }, 500);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const input = String(body?.input ?? "").trim();
  if (!input) return json({ error: "Missing `input`" }, 400);

  const previousChatId = body?.previousChatId ? String(body.previousChatId) : undefined;
  const assistantId = body?.assistantId
    ? String(body.assistantId)
    : "5e8bf670-8e75-4293-b3eb-db966b23a6d0";

  if (!ALLOWED_ASSISTANT_IDS.has(assistantId)) {
    return json({ error: "assistantId not allowed" }, 403);
  }

  const resp = await fetch(`${VAPI_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VAPI_PRIVATE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assistantId,
      input,
      previousChatId,
      stream: false,
    }),
  });

  let data: Record<string, unknown> = {};
  try {
    data = await resp.json();
  } catch {
    data = {};
  }

  if (!resp.ok) {
    return json({ error: "Vapi error", status: resp.status, details: data }, resp.status);
  }

  return json({
    chatId: data.id,
    output: data.output ?? [],
  });
});
