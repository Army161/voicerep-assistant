import { Phone, MessageSquare, CalendarCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const steps = [
  {
    num: 1,
    icon: Phone,
    title: "The phone rings",
    description: "A customer calls while your hands are full — under a sink or under a hood. You can't answer.",
    side: "left" as const,
  },
  {
    num: 2,
    icon: MessageSquare,
    title: "AI Answers Instantly",
    description: "Our AI warmly answers the call immediately, collecting their details and understanding the problem.",
    side: "right" as const,
    chat: [
      { sender: "ai", text: "Hi! You've reached Local Plumbers. How can I help you today?" },
      { sender: "user", text: "I have a leaking pipe..." },
    ],
  },
  {
    num: 3,
    icon: CalendarCheck,
    title: "Job Booked",
    description: "The job is automatically scheduled and added to your calendar without you ever lifting a finger.",
    side: "left" as const,
  },
];

const HowItWorks = () => {
  return (
    <section className="bg-card px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="text-center text-4xl font-bold text-foreground sm:text-5xl"
        >
          How it works
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-4 max-w-xl text-center text-muted-foreground"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          A seamless handoff from a ringing phone to a booked job, while you keep your hands on your work.
        </motion.p>

        {/* Timeline */}
        <div className="relative mt-16">
          {/* Vertical line */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-border md:block" />

          {steps.map((step, idx) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: step.side === "left" ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: idx * 0.15, ease: "easeOut" }}
              className="relative mb-20 last:mb-0"
            >
              {/* Step number on timeline */}
              <div className="absolute left-1/2 top-4 z-10 hidden h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-background text-sm font-bold text-primary md:flex" style={{ fontFamily: "'Inter', sans-serif" }}>
                {step.num}
              </div>

              <div className={`flex flex-col items-center gap-8 md:flex-row ${step.side === "right" ? "md:flex-row-reverse" : ""}`}>
                {/* Text */}
                <div className={`flex-1 ${step.side === "left" ? "md:text-right" : "md:text-left"}`}>
                  <span className="mb-1 inline-block text-sm font-bold text-primary md:hidden" style={{ fontFamily: "'Inter', sans-serif" }}>{step.num}</span>
                  <h3 className="text-2xl font-bold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{step.description}</p>
                </div>

                {/* Spacer for timeline */}
                <div className="hidden w-8 md:block" />

                {/* Visual */}
                <div className="flex-1">
                  {step.chat ? (
                    <div className="rounded-2xl bg-secondary p-5">
                      {step.chat.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: idx * 0.15 + i * 0.2 + 0.3 }}
                          className={`mb-2 last:mb-0 max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${msg.sender === "ai" ? "mr-auto bg-card text-foreground" : "ml-auto bg-primary/15 text-foreground"}`}
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          {msg.text}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center rounded-2xl bg-secondary p-10">
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: idx * 0.15 + 0.2, type: "spring", stiffness: 200 }}
                        className="flex h-16 w-16 items-center justify-center rounded-full bg-card shadow-sm"
                      >
                        <step.icon className="h-7 w-7 text-primary" />
                      </motion.div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-8 text-center"
        >
          <Button className="rounded-full px-8" asChild>
            <Link to="/roi-calculator">Calculate Your ROI</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
