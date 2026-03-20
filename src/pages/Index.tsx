import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { Phone, Clock, BarChart3, Calendar, Check } from "lucide-react";

const features = [
  {
    icon: Phone,
    title: "24/7 Call Handling",
    description: "Never miss a lead. Your AI receptionist answers every call, day or night.",
  },
  {
    icon: Calendar,
    title: "Appointment Booking",
    description: "Automatically schedule appointments directly into your calendar.",
  },
  {
    icon: BarChart3,
    title: "Lead Capture",
    description: "Capture caller details and qualify leads before they reach your team.",
  },
  {
    icon: Clock,
    title: "Instant Setup",
    description: "Go live in minutes with a dedicated phone number and AI voice agent.",
  },
];

const pricing = [
  {
    name: "Starter",
    price: "$299",
    period: "/mo",
    features: ["1 AI voice agent", "500 minutes included", "Lead capture", "Email notifications", "Basic analytics"],
  },
  {
    name: "Pro",
    price: "$499",
    period: "/mo",
    features: [
      "3 AI voice agents",
      "2,000 minutes included",
      "Appointment booking",
      "CRM integrations",
      "Advanced analytics",
      "Priority support",
    ],
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Your AI Receptionist, Always On
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Capture leads, answer questions, and book appointments 24/7 — without hiring another person.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/login">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/demo">See a Live Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-secondary/50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">
            Everything you need to automate your phones
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <Card key={f.title} className="border-border bg-card">
                <CardHeader>
                  <f.icon className="mb-2 h-8 w-8 text-primary" />
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">Simple, transparent pricing</h2>
          <div className="grid gap-8 md:grid-cols-2">
            {pricing.map((plan) => (
              <Card key={plan.name} className="flex flex-col border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <ul className="mb-8 flex-1 space-y-3">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" asChild>
                    <Link to="/login">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Autonomous Voice Reps. All rights reserved.
      </footer>
    </div>
  );
};

export default Index;
