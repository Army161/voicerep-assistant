import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import HowItWorks from "@/components/HowItWorks";
import ROICalculator from "@/components/ROICalculator";
import { ArrowRight, Phone, CheckCircle2, Wrench, Scissors, Car, Paintbrush, MessageSquare, Calendar, BarChart3 } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          {/* Left: Copy */}
          <div>
            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Your hands are full.{" "}
              <span className="italic text-primary">Let us grab the phone.</span>
            </h1>
            <div className="mt-2 h-1 w-64 rounded-full bg-primary/40" />
            <p className="mt-6 max-w-lg text-lg text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
              Stop losing customers to voicemail. Meet the AI receptionist that books jobs while you do them.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button size="lg" className="rounded-full px-8 text-base" asChild>
                <Link to="/login">
                  Stop Missing Calls <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                <CheckCircle2 className="h-4 w-4 text-primary" /> 7-day free trial
              </span>
            </div>

            {/* Live Demo callout */}
            <div className="mt-8 flex items-center gap-4 rounded-xl border border-border bg-secondary/60 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary" style={{ fontFamily: "'Inter', sans-serif" }}>Live Demo</p>
                <p className="text-lg font-bold text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>Try our AI receptionist</p>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <Link to="/demo" className="underline hover:text-primary">Chat or call now</Link> to experience the AI for yourself
                </p>
              </div>
            </div>
          </div>

          {/* Right: Phone mockup illustration */}
          <div className="relative flex items-center justify-center">
            <div className="absolute -z-10 h-[400px] w-[400px] rounded-full bg-primary/10" />
            <div className="w-[320px] rounded-3xl border border-border bg-card p-5 shadow-xl">
              <div className="mb-4 flex items-center gap-3 rounded-xl bg-secondary p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div className="h-3 w-24 rounded-full bg-border" />
                <div className="ml-auto h-3 w-12 rounded-full bg-border" />
              </div>
              <div className="mb-3 ml-0 mr-auto max-w-[80%] rounded-2xl rounded-tl-sm bg-primary px-4 py-3 text-sm text-primary-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                "Hi, I need a plumber ASAP..."
              </div>
              <div className="mb-3 ml-auto mr-0 max-w-[80%] rounded-2xl rounded-tr-sm bg-secondary px-4 py-3 text-sm text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                "We can help! How is 2 PM?"
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
                  <span className="text-xs text-primary">💰</span>
                  <span className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>+$150</span>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15">
                    <Phone className="h-4 w-4 rotate-[135deg] text-destructive" />
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -right-2 top-8 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-md">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>Job Booked</span>
            </div>
          </div>
        </div>

        {/* Social proof */}
        <div className="mx-auto mt-20 max-w-4xl text-center">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
            Trusted by Local Heroes
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 text-muted-foreground/60">
            {[
              { icon: Wrench, name: "ProPlumb" },
              { icon: Scissors, name: "Salon Style" },
              { icon: Car, name: "AutoFix Garage" },
              { icon: Paintbrush, name: "Elite Painters" },
            ].map((brand) => (
              <div key={brand.name} className="flex items-center gap-2">
                <brand.icon className="h-5 w-5" />
                <span className="text-base font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>{brand.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <div id="how-it-works">
        <HowItWorks />
      </div>

      {/* ROI Calculator */}
      <section id="roi-calculator" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold text-foreground">See What You're Losing</h2>
          <p className="mt-3 text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
            Every missed call is a missed opportunity. Use our calculator to see how much revenue you can reclaim.
          </p>
        </div>
        <div className="mx-auto mt-12 max-w-2xl">
          <ROICalculator />
        </div>
      </section>

      {/* Features row */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
          {[
            { icon: MessageSquare, title: "Instant Text-Back", desc: "Stop customers from calling your competitors when you can't answer." },
            { icon: Calendar, title: "Auto-Booking", desc: "Link your calendar directly in the reply to secure the job instantly." },
            { icon: BarChart3, title: "ROI Tracking", desc: "Detailed reports show exactly how many dollars were saved each month." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl bg-foreground px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-background sm:text-4xl">Ready to become your own hero?</h2>
          <p className="mx-auto mt-4 max-w-lg text-background/70" style={{ fontFamily: "'Inter', sans-serif" }}>
            Join over 500 local businesses who never miss a customer connection. No setup fees, no long contracts.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="rounded-full px-8 text-base" asChild>
              <Link to="/login">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full border-background/30 px-8 text-base text-background hover:bg-background/10" asChild>
              <Link to="/demo">Watch Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
            <Phone className="h-4 w-4 text-primary" />
            Autonomous Voice Reps
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
            <Link to="#" className="hover:text-foreground">Privacy</Link>
            <Link to="#" className="hover:text-foreground">Terms</Link>
            <Link to="#" className="hover:text-foreground">Support</Link>
          </div>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
            © {new Date().getFullYear()} Autonomous Voice Reps
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
