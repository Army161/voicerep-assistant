import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, MessageSquare, User, Bot, ArrowRight, Volume2, CheckCircle2 } from "lucide-react";
import DemoChat from "@/pages/DemoChat";
import DemoVoice from "@/pages/DemoVoice";

const SAMPLE_CONVERSATION = [
  { role: "ai", text: "Good afternoon, thank you for calling Mike's Plumbing! This is our AI assistant. How can I help you today?" },
  { role: "caller", text: "Hi, I've got a leaky faucet in my kitchen. It's been dripping all day." },
  { role: "ai", text: "I'm sorry to hear that! I'd love to get one of our technicians out to you. Can I get your name and a good phone number to reach you?" },
  { role: "caller", text: "Sure, it's Sarah Johnson. My number is 555-0142." },
  { role: "ai", text: "Perfect, Sarah. And what's the best address for the service call?" },
  { role: "caller", text: "123 Oak Street, apartment 4B." },
  { role: "ai", text: "Got it! I've captured all your details and our team will reach out shortly to schedule a time. Is there anything else I can help with?" },
  { role: "caller", text: "No, that's it. Thanks!" },
  { role: "ai", text: "Great, have a wonderful day, Sarah! Someone from Mike's Plumbing will be in touch soon." },
];

const WHAT_HAPPENS_NEXT = [
  { icon: MessageSquare, title: "Instant SMS Alert", desc: "You get a text: \"New lead — Sarah Johnson, 555-0142, leaky kitchen faucet, 123 Oak St Apt 4B\"" },
  { icon: CheckCircle2, title: "Lead Saved to CRM", desc: "Sarah's info is automatically saved to your dashboard with call details and transcript." },
  { icon: Phone, title: "You Call Back When Ready", desc: "No more voicemails to check — you have everything you need to close the job." },
];

const Demo = () => {
  const [visibleMessages, setVisibleMessages] = useState(3);

  const showMore = () => {
    setVisibleMessages(SAMPLE_CONVERSATION.length);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-4">
            <Volume2 className="h-3 w-3 mr-1" />
            Live Demo
          </Badge>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            See Your AI Receptionist in Action
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
            Try voice or text before you buy.
          </p>
        </div>

        {/* Interactive Demo Tabs */}
        <Tabs defaultValue="voice" className="mb-10">
          <TabsList className="w-full">
            <TabsTrigger value="voice" className="flex-1">Voice</TabsTrigger>
            <TabsTrigger value="text" className="flex-1">Text</TabsTrigger>
          </TabsList>
          <TabsContent value="voice">
            <DemoVoice />
          </TabsContent>
          <TabsContent value="text">
            <DemoChat />
          </TabsContent>
        </Tabs>

        {/* Sample Conversation */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Incoming call — Mike's Plumbing</span>
              <Badge variant="outline" className="ml-auto text-xs">Sample Call</Badge>
            </div>

            <div className="space-y-4">
              {SAMPLE_CONVERSATION.slice(0, visibleMessages).map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === "caller" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    msg.role === "ai" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {msg.role === "ai" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "ai"
                      ? "bg-muted text-foreground rounded-tl-sm"
                      : "bg-primary text-primary-foreground rounded-tr-sm"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {visibleMessages < SAMPLE_CONVERSATION.length && (
              <button
                onClick={showMore}
                className="mt-4 text-sm text-primary hover:underline w-full text-center"
              >
                Show full conversation ↓
              </button>
            )}
          </CardContent>
        </Card>

        {/* What Happens Next */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4 text-center">What Happens Next</h2>
          <div className="space-y-4">
            {WHAT_HAPPENS_NEXT.map((step, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                <div className="shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{step.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-8 border-t">
          <h3 className="text-lg font-semibold text-foreground mb-2">Ready to never miss a lead again?</h3>
          <p className="text-sm text-muted-foreground mb-4">Your AI phone agent is set up in minutes. No contracts.</p>
          <Link to="/login">
            <Button size="lg">
              Get Started Free
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Demo;
