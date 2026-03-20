import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2025-08-27.basil",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("[STRIPE-WEBHOOK] Missing stripe-signature header");
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("[STRIPE-WEBHOOK] Signature verification failed:", err.message);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[STRIPE-WEBHOOK] Event received:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId = session.metadata?.workspace_id;
        const plan = session.metadata?.plan || "starter";
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!workspaceId) {
          console.error("[STRIPE-WEBHOOK] No workspace_id in session metadata");
          break;
        }

        // Fetch subscription details for period dates
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        const { error } = await supabase
          .from("subscriptions")
          .upsert(
            {
              workspace_id: workspaceId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              plan,
              status: "active",
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            },
            { onConflict: "workspace_id" }
          );

        if (error) {
          console.error("[STRIPE-WEBHOOK] Upsert subscription error:", error);
        } else {
          console.log("[STRIPE-WEBHOOK] Subscription upserted for workspace", workspaceId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const workspaceId = subscription.metadata?.workspace_id;

        if (!workspaceId) {
          console.warn("[STRIPE-WEBHOOK] No workspace_id in subscription metadata");
          break;
        }

        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: subscription.status === "active" ? "active" : subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("workspace_id", workspaceId);

        if (error) {
          console.error("[STRIPE-WEBHOOK] Update subscription error:", error);
        } else {
          console.log("[STRIPE-WEBHOOK] Subscription updated for workspace", workspaceId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const workspaceId = subscription.metadata?.workspace_id;

        if (!workspaceId) {
          console.warn("[STRIPE-WEBHOOK] No workspace_id in subscription metadata");
          break;
        }

        const { error } = await supabase
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("workspace_id", workspaceId);

        if (error) {
          console.error("[STRIPE-WEBHOOK] Cancel subscription error:", error);
        } else {
          console.log("[STRIPE-WEBHOOK] Subscription canceled for workspace", workspaceId);
        }
        break;
      }

      default:
        console.log("[STRIPE-WEBHOOK] Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[STRIPE-WEBHOOK] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
