import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

const ROICalculator = () => {
  const [missedCalls, setMissedCalls] = useState(25);
  const [customerValue, setCustomerValue] = useState(150);

  const recoveryRate = 0.4;
  const weeksPerMonth = 4;
  const recoveredRevenue = Math.round(missedCalls * customerValue * recoveryRate * weeksPerMonth);

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Inputs */}
        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>Missed calls per week</label>
              <span className="rounded-full border border-primary/30 px-3 py-0.5 text-sm font-bold text-primary" style={{ fontFamily: "'Inter', sans-serif" }}>{missedCalls}</span>
            </div>
            <Slider
              value={[missedCalls]}
              onValueChange={(v) => setMissedCalls(v[0])}
              min={1}
              max={50}
              step={1}
              className="w-full"
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
              <span>1 call</span>
              <span>50 calls</span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>Average value of a customer</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>$</span>
              <Input
                type="number"
                value={customerValue}
                onChange={(e) => setCustomerValue(Number(e.target.value) || 0)}
                className="pl-7 bg-secondary border-0"
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
              Typical service businesses range from $100 to $500.
            </p>
          </div>
        </div>

        {/* Result */}
        <div className="flex flex-col items-center justify-center rounded-xl bg-secondary p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary" style={{ fontFamily: "'Inter', sans-serif" }}>Estimated Potential</p>
          <p className="mt-1 text-lg font-bold text-foreground">Lost Revenue Recovered:</p>
          <p className="mt-2 text-5xl font-extrabold text-primary">
            ${recoveredRevenue.toLocaleString()}
            <span className="text-xl font-normal text-muted-foreground">/mo</span>
          </p>
          <p className="mt-3 text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
            Based on a {recoveryRate * 100}% recovery rate with automated miss-call text back.
          </p>
          <Button className="mt-6 w-full rounded-full" size="lg" asChild>
            <Link to="/login">
              Start Reclaiming Revenue <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ROICalculator;
