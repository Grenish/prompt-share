import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative isolate h-screen flex items-center justify-center bg-background text-foreground">
      <>
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.35] dark:opacity-[0.25]"
            style={{
              backgroundImage:
                "linear-gradient(to right, hsl(var(--foreground) / 0.06) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground) / 0.06) 1px, transparent 1px)",
              backgroundSize: "44px 44px, 44px 44px",
              backgroundPosition: "center",
              maskImage:
                "radial-gradient(ellipse at center, black 55%, transparent 85%)",
              WebkitMaskImage:
                "radial-gradient(ellipse at center, black 55%, transparent 85%)",
            }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 0%, hsl(var(--foreground) / 0.05), transparent 60%)",
            }}
            aria-hidden="true"
          />
        </div>

        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="min-h-[72svh] md:min-h-[78svh] grid items-center gap-12 py-20 md:py-28 lg:grid-cols-12">
            {/* Left: Copy */}
            <div className="text-center lg:text-left lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
                Open community of AI creators
                <span className="inline-block h-1 w-1 rounded-full bg-foreground/40" />
                Free to join
              </div>

              <h1 className="mt-5 font-light tracking-tight text-4xl leading-[1.1] md:text-5xl lg:text-6xl">
                Swap prompts. Spark ideas.
                <br className="hidden sm:block" />
                <span className="font-normal text-foreground">
                  Build together.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base md:text-lg leading-relaxed text-muted-foreground font-light mx-auto lg:mx-0">
                Share and remix high-quality prompts. Discover what works, save
                time, and collaborate with a global community.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link
                  href="#get-started"
                  className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm md:text-base font-medium border border-primary/80 shadow-sm hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors"
                >
                  Get started free
                </Link>

                <Link
                  href="#explore"
                  className="group inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm md:text-base text-foreground/80 hover:bg-muted/50 backdrop-blur-sm transition-colors"
                >
                  Explore prompts
                  <ChevronRight
                    size={18}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </div>

              {/* Tiny stats */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground lg:justify-start">
                <span>10k+ prompts shared</span>
                <span className="hidden sm:inline text-foreground/20">•</span>
                <span>5k+ creators</span>
                <span className="hidden sm:inline text-foreground/20">•</span>
                <span>Powered by community</span>
              </div>
            </div>

            <div className="lg:col-span-5 hidden sm:block">
              <div className="mx-auto max-w-md lg:ml-auto">
                <div className="relative rounded-2xl border border-border bg-card/70 backdrop-blur-sm shadow-sm">
                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex gap-2 text-[10px] text-muted-foreground">
                        <span className="rounded-full border border-border px-2 py-0.5">
                          Writing
                        </span>
                        <span className="rounded-full border border-border px-2 py-0.5">
                          Brainstorm
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        #A1B2C3
                      </span>
                    </div>

                    <p className="text-sm leading-relaxed text-foreground/90">
                      I am{" "}
                      <code className="bg-muted/50 rounded px-1 py-0.5 font-mono text-xs italic">
                        [describe the problem you're facing with background
                        context]
                      </code>
                      . Generate 10 innovative marketing campaign ideas for
                      <code className="bg-muted/50 rounded px-1 py-0.5 font-mono text-xs italic">
                        [industry or business type, e.g., eco-friendly brands,
                        SaaS products, handmade jewelry]
                      </code>
                      , and for each idea provide a campaign theme/concept, a
                      catchy tagline, the main objective, at least three
                      specific tactics or channels (e.g., social media,
                      influencers, email, guerrilla marketing), and a brief note
                      on why it would appeal to the intended target audience.
                      Present the output in a clear numbered list, written
                      concisely in the style of professional marketing briefs.
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <button
                        className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground/80 hover:bg-muted/60 transition-colors"
                        type="button"
                      >
                        Copy prompt
                      </button>
                      <span className="text-[11px] text-muted-foreground">
                        Sep 13, 2025
                      </span>
                    </div>

                    <div className="mt-4 border-t border-border pt-3 flex items-center justify-between text-xs">
                      <span className="text-foreground/90">By Cookbook</span>
                      <span className="text-muted-foreground">ChatGPT</span>
                    </div>
                  </div>
                  <div className="pointer-events-none absolute -inset-px rounded-2xl ring-1 ring-black/2 dark:ring-white/2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    </section>
  );
}
