import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const ASSISTANT_ID = "5e8bf670-8e75-4293-b3eb-db966b23a6d0";

export default function DemoChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [previousChatId, setPreviousChatId] = useState<string>();
  const [loading, setLoading] = useState(false);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("vapi-chat", {
        body: { input: text, previousChatId, assistantId: ASSISTANT_ID },
      });
      if (error) throw error;

      setPreviousChatId(data.chatId);

      const assistantText =
        (data.output ?? [])
          .map((o: any) => (typeof o?.content === "string" ? o.content : ""))
          .filter(Boolean)
          .join("\n") || "…";

      setMessages((m) => [...m, { role: "assistant", content: assistantText }]);
    } catch (e) {
      console.error(e);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Demo chat error. Try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setMessages([]);
    setPreviousChatId(undefined);
    setInput("");
  };

  return (
    <Card>
      <CardContent className="p-4">
        <ScrollArea className="h-72 mb-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center pt-24">
              Try: "I want to schedule a cleaning" or "I have tooth pain."
            </p>
          ) : (
            <div className="space-y-3 pr-3">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                      m.role === "assistant"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {m.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      m.role === "assistant"
                        ? "bg-muted text-foreground rounded-tl-sm"
                        : "bg-primary text-primary-foreground rounded-tr-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            disabled={loading}
            onKeyDown={(e) => e.key === "Enter" && canSend && send()}
          />
          <Button onClick={send} disabled={!canSend}>
            {loading ? "Sending…" : "Send"}
          </Button>
          <Button variant="outline" onClick={clear} disabled={loading}>
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
