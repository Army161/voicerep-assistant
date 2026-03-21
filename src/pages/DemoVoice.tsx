import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, PhoneOff, MicOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ASSISTANT_ID = "5e8bf670-8e75-4293-b3eb-db966b23a6d0";
const PHONE_FALLBACK = "+13806007211";

export default function DemoVoice() {
  const [state, setState] = useState<"idle" | "connecting" | "in-call">("idle");
  const [micError, setMicError] = useState(false);
  const vapiRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { default: Vapi } = await import("@vapi-ai/web");
      const publicKey = (import.meta as any).env.VITE_VAPI_PUBLIC_KEY;
      if (!publicKey || !mounted) return;

      const instance = new Vapi(publicKey);
      vapiRef.current = instance;

      instance.on("call-start", () => mounted && setState("in-call"));
      instance.on("call-end", () => mounted && setState("idle"));
      instance.on("error", (e: any) => {
        if (!mounted) return;
        setState("idle");
        const msg = String(e?.message ?? e ?? "").toLowerCase();
        if (msg.includes("not found") || msg.includes("denied") || msg.includes("microphone")) {
          setMicError(true);
        }
      });
    })();

    return () => {
      mounted = false;
      vapiRef.current?.stop();
    };
  }, []);

  const start = async () => {
    // Check for microphone before attempting
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasMic = devices.some((d) => d.kind === "audioinput" && d.deviceId);
      if (!hasMic) {
        setMicError(true);
        toast({
          title: "No microphone detected",
          description: "Please connect a microphone or use the phone number below to try the demo.",
          variant: "destructive",
        });
        return;
      }
    } catch {
      // enumerateDevices not supported, try anyway
    }

    setMicError(false);
    setState("connecting");
    try {
      await vapiRef.current?.start(ASSISTANT_ID);
    } catch (e: any) {
      setState("idle");
      const msg = String(e?.message ?? e ?? "").toLowerCase();
      if (msg.includes("not found") || msg.includes("denied") || msg.includes("permission")) {
        setMicError(true);
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access in your browser, or call the number below.",
          variant: "destructive",
        });
      }
    }
  };

  const stop = async () => {
    await vapiRef.current?.stop();
  };

  return (
    <Card>
      <CardContent className="p-6 text-center space-y-6">
        <p className="text-sm text-muted-foreground">
          Voice demo uses your microphone.
        </p>

        {micError && (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <MicOff className="h-4 w-4 shrink-0" />
            <span>
              No microphone found. Please connect one or use the phone number below.
            </span>
          </div>
        )}

        {state !== "in-call" ? (
          <Button size="lg" onClick={start} disabled={state === "connecting"}>
            <Phone className="h-4 w-4 mr-2" />
            {state === "connecting" ? "Connecting…" : "Start Voice Demo"}
          </Button>
        ) : (
          <Button size="lg" variant="destructive" onClick={stop}>
            <PhoneOff className="h-4 w-4 mr-2" />
            End Call
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          No mic? Call instead:{" "}
          <a href={`tel:${PHONE_FALLBACK}`} className="text-primary underline">
            +1 (380) 600-7211
          </a>
        </p>
      </CardContent>
    </Card>
  );
}