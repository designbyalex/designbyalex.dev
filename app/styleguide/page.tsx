import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ScrollReveal } from "@/components/motion-primitives/scroll-reveal";
import { TextReveal } from "@/components/motion-primitives/text-reveal";
import { HoverLift } from "@/components/motion-primitives/hover-lift";
import { TransitionLink } from "@/components/motion-primitives/route-transitions";

export const metadata: Metadata = {
  title: "Styleguide — designbyalex.dev",
  description: "Design system tokens, type scale, and primitives (S1).",
};

const semanticColors: { name: string; swatch: string; ring?: boolean }[] = [
  { name: "background", swatch: "bg-background" },
  { name: "foreground", swatch: "bg-foreground" },
  { name: "card", swatch: "bg-card" },
  { name: "primary", swatch: "bg-primary" },
  { name: "primary-foreground", swatch: "bg-primary-foreground" },
  { name: "secondary", swatch: "bg-secondary" },
  { name: "muted", swatch: "bg-muted" },
  { name: "muted-foreground", swatch: "bg-muted-foreground" },
  { name: "accent", swatch: "bg-accent" },
  { name: "destructive", swatch: "bg-destructive" },
  { name: "border", swatch: "bg-border" },
  { name: "ring", swatch: "bg-ring" },
];

const categoricalColors = [
  { name: "chart-1 · green", swatch: "bg-chart-1" },
  { name: "chart-2 · blue", swatch: "bg-chart-2" },
  { name: "chart-3 · amber", swatch: "bg-chart-3" },
  { name: "chart-4 · orange", swatch: "bg-chart-4" },
  { name: "chart-5 · indigo", swatch: "bg-chart-5" },
];

// The type ramp (#53): tiers from styles.css, sized as the Reference measures them at
// 390/768 → 1440 (fluid between). Display tiers pair with `font-display` (Inter opsz 32).
const typeScale: { label: string; cls: string }[] = [
  { label: "display · 42→75", cls: "font-display text-display" },
  { label: "h1 · 48→58", cls: "font-display text-h1" },
  { label: "h2 · 28→48", cls: "font-display text-h2" },
  { label: "heading · 30→40", cls: "font-display text-heading" },
  { label: "lead · 24→32", cls: "font-display text-lead" },
  { label: "statement · 22→28", cls: "font-display text-statement" },
  { label: "body-lg · 20", cls: "text-body-lg" },
  { label: "body · 18", cls: "text-body" },
  { label: "caption · 14", cls: "text-caption" },
];

const buttonVariants = ["default", "secondary", "outline", "ghost", "link", "destructive"] as const;
const buttonSizes = ["sm", "default", "lg"] as const;
const radii = [
  { label: "sm", cls: "rounded-sm" },
  { label: "md", cls: "rounded-md" },
  { label: "lg", cls: "rounded-lg" },
  { label: "xl", cls: "rounded-xl" },
  { label: "full", cls: "rounded-full" },
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-6 font-mono text-mono uppercase text-muted-foreground">
      {children}
    </h2>
  );
}

export default function StyleguidePage() {
  return (
    <main className="min-h-screen bg-background py-16 text-foreground">
      <Container className="space-y-16">
        <header className="flex items-start justify-between gap-6">
          <div>
            <p className="font-mono text-mono uppercase text-muted-foreground">
              S1 · Design system
            </p>
            <h1 className="mt-2 font-display text-h1">
              Styleguide
            </h1>
            <p className="mt-3 max-w-prose text-body text-muted-foreground">
              Inter (text and display optical sizes) + Space Mono, dark (faithful) and light
              (proposed) token sets. Toggle the theme — every token below updates live.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <section>
          <SectionHeading>Semantic colours</SectionHeading>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {semanticColors.map((c) => (
              <div key={c.name} className="space-y-2">
                <div className={`h-20 w-full rounded-lg border border-border ${c.swatch}`} />
                <p className="font-mono text-caption text-muted-foreground">{c.name}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading>Categorical / status accents</SectionHeading>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {categoricalColors.map((c) => (
              <div key={c.name} className="space-y-2">
                <div className={`h-20 w-full rounded-lg border border-border ${c.swatch}`} />
                <p className="font-mono text-caption text-muted-foreground">{c.name}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading>Type ramp · Inter</SectionHeading>
          <div className="space-y-4">
            {typeScale.map((t) => (
              <div key={t.label} className="flex items-baseline gap-6">
                <span className="w-36 shrink-0 font-mono text-caption text-muted-foreground">
                  {t.label}
                </span>
                <span className={t.cls}>Human-centred product design</span>
              </div>
            ))}
            <div className="flex items-baseline gap-6">
              <span className="w-36 shrink-0 font-mono text-caption text-muted-foreground">
                mono · 11
              </span>
              <span className="font-mono text-mono uppercase">
                Eyebrow / label · Space Mono
              </span>
            </div>
          </div>
        </section>

        <section>
          <SectionHeading>Buttons</SectionHeading>
          <div className="space-y-4">
            {buttonSizes.map((size) => (
              <div key={size} className="flex flex-wrap items-center gap-3">
                <span className="w-20 font-mono text-caption text-muted-foreground">{size}</span>
                {buttonVariants.map((variant) => (
                  <Button key={variant} variant={variant} size={size}>
                    {variant}
                  </Button>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading>Radius</SectionHeading>
          <div className="flex flex-wrap gap-6">
            {radii.map((r) => (
              <div key={r.label} className="space-y-2">
                <div className={`size-20 border border-border bg-card ${r.cls}`} />
                <p className="font-mono text-caption text-muted-foreground">{r.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading>Motion primitives · S2</SectionHeading>
          <p className="mb-8 max-w-prose text-body text-muted-foreground">
            All four route through the pure reduced-motion selector. Enable{" "}
            <span className="font-mono text-foreground">prefers-reduced-motion</span> at the OS level
            and every one below degrades to a static, non-animated fallback — the decision logic is
            unit-tested.
          </p>

          <div className="space-y-12">
            <div className="space-y-4">
              <h3 className="font-mono text-mono uppercase text-muted-foreground">
                TextReveal
              </h3>
              <TextReveal
                as="p"
                per="word"
                className="font-display text-heading"
              >
                Human-centred product design, revealed word by word.
              </TextReveal>
              <TextReveal
                as="p"
                per="char"
                className="font-mono text-body text-muted-foreground"
              >
                ...and character by character.
              </TextReveal>
            </div>

            <div className="space-y-4">
              <h3 className="font-mono text-mono uppercase text-muted-foreground">
                ScrollReveal · scroll this section in and out of view to replay
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <ScrollReveal
                    key={i}
                    once={false}
                    delay={i * 0.08}
                    className="rounded-lg border border-border bg-card p-6"
                  >
                    <p className="font-mono text-caption text-muted-foreground">card {i + 1}</p>
                    <p className="mt-2 text-body">
                      Fades and rises into view as it enters the viewport.
                    </p>
                  </ScrollReveal>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-mono text-mono uppercase text-muted-foreground">
                HoverLift · hover / press
              </h3>
              <div className="flex flex-wrap items-center gap-6">
                <HoverLift className="w-60 rounded-lg border border-border bg-card p-6">
                  <p className="font-mono text-caption text-muted-foreground">card</p>
                  <p className="mt-2 text-body">
                    Lifts and scales on hover, presses on tap.
                  </p>
                </HoverLift>
                <HoverLift className="inline-flex">
                  <Button>Hover me</Button>
                </HoverLift>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-mono text-mono uppercase text-muted-foreground">
                TransitionLink · route transition (S8)
              </h3>
              <p className="max-w-prose text-body text-muted-foreground">
                Navigates with the View Transitions API: the old page fades out, the new one fades and
                rises in, and the header stays put. Browser back replays it in reverse.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Button asChild>
                  <TransitionLink href="/">Home</TransitionLink>
                </Button>
                <Button asChild variant="outline">
                  <TransitionLink href="/acacia">Acacia case study</TransitionLink>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}
