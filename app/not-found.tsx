import { ArrowRight } from "lucide-react"
import Layout from "@/components/layout/layout"
import { type NotFoundProject, NotFoundStage, ProjectPreviews, ProjectRow } from "@/components/not-found/project-previews"
import { DecodeText } from "@/components/motion-primitives/decode-text"
import { TransitionLink } from "@/components/motion-primitives/route-transitions"
import { ScrollReveal } from "@/components/motion-primitives/scroll-reveal"
import client from "@/tina/__generated__/client"

interface NotFoundProps {
  title?: string
  description?: string
  projects?: NotFoundProject[]
}

/**
 * The brand mark (the MarkGlyph artwork, components/icon.tsx) as a large green
 * outline behind the text — inline SVG, its path split into three at the
 * ` Z M` boundaries so the pieces can assemble on mount ("404 mark assembly"
 * in styles.css). Large and whole in the right half (owner pick 2026-11-12); it
 * fades out while a project row shows its preview there.
 */
function AssemblingMark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 35 33.2"
      fill="none"
      stroke="currentColor"
      strokeWidth={0.12}
      className="pointer-events-none absolute top-28 right-6 h-[285px] w-[300px] text-emphasis opacity-50 transition-opacity duration-500 ease-hover-link lg:top-[calc(50%-280px)] lg:right-24 lg:h-[560px] lg:w-[590px] lg:group-data-previewing/nf:opacity-0"
    >
      <path
        className="not-found-piece-left"
        d="M 15.132 16.922 L 1.322 2.39 C 0.836 1.876 0 2.242 0 2.967 L 0 32.034 C 0 32.758 0.835 33.124 1.323 32.612 L 15.132 18.078 C 15.433 17.752 15.433 17.248 15.132 16.922 Z"
      />
      <path
        className="not-found-piece-right"
        d="M 19.869 18.078 L 33.677 32.612 C 34.165 33.125 35 32.758 35 32.034 L 35 2.967 C 35 2.242 34.165 1.876 33.677 2.388 L 19.87 16.922 C 19.569 17.248 19.569 17.752 19.87 18.078 Z"
      />
      <path
        className="not-found-piece-top"
        d="M 18.21 15.92 L 32.025 1.393 C 32.51 0.879 32.163 0 31.474 0 L 3.848 0 C 3.16 0 2.812 0.88 3.3 1.392 L 17.112 15.92 C 17.254 16.072 17.453 16.158 17.661 16.158 C 17.87 16.158 18.069 16.072 18.211 15.92 Z"
      />
    </svg>
  )
}

/**
 * The 404's "Quiet type" direction (#93): a big left-aligned headline that
 * decodes into place, the description and "Back to home" on a hairline row at
 * the bottom, the home page's selected projects as rows, and the mark outline
 * assembling behind it all. Everything rests under reduced motion, and the
 * server HTML is the resting state.
 */
export function NotFoundContent({
  title = "Page not found",
  description = "This page doesn’t exist or has moved.",
  projects = [],
}: NotFoundProps) {
  return (
    <NotFoundStage className="relative flex min-h-[calc(100svh-5.5rem)] flex-col overflow-clip px-6 py-8 lg:min-h-[calc(100svh-6rem)] lg:px-12 lg:py-16">
      <AssemblingMark />
      <ProjectPreviews projects={projects} />
      {/* One column under lg; two equal columns above, sharing the hero's bottom-row geometry. */}
      <div className="relative z-[1] grid flex-1 grid-rows-[auto_1fr_auto] lg:grid-cols-2 lg:gap-x-10">
        <DecodeText
          className="max-w-[450px] font-display text-display text-balance text-foreground lg:col-span-2 lg:w-[55%] lg:max-w-none"
          scrambleClassName="font-mono text-emphasis"
          settledClassName="font-display text-foreground"
        >
          {title}
        </DecodeText>

        {projects.length > 0 && (
          <ScrollReveal
            y={24}
            duration={0.7}
            delay={0.74}
            staticUntilHydrated
            className="row-start-2 mb-8 w-full max-w-[520px] self-end lg:col-start-1"
          >
            <p className="mb-2 text-caption text-muted-foreground">Or see a selected project</p>
            <ul>
              {projects.map((project, index) => (
                <li key={project.href}>
                  <ProjectRow project={project} last={index === projects.length - 1} />
                </li>
              ))}
            </ul>
          </ScrollReveal>
        )}

        {/* The hairline row: description left, "Back to home" right, closed 19px below the text (the home hero's bottom row, without the image). */}
        <div className="row-start-3 flex w-full flex-col border-b border-border lg:col-span-2 lg:grid lg:grid-cols-2 lg:items-end lg:gap-x-10 lg:pb-[19px]">
          <ScrollReveal y={24} duration={0.7} delay={0.5} staticUntilHydrated className="pb-6 lg:w-[80%] lg:pb-0">
            <p className="text-pretty text-body text-muted-foreground">{description}</p>
          </ScrollReveal>
          <ScrollReveal
            y={24}
            duration={0.7}
            delay={0.62}
            staticUntilHydrated
            className="self-end pb-[19px] lg:self-auto lg:justify-self-end lg:pb-0"
          >
            {/* Styled exactly like the header's "Let's talk" (components/layout/nav/header.tsx): the
                40px green circle grows to 110% on hover while the arrow rolls out right and a second
                rolls in from the left. The sitewide reduced-motion rule makes both instant. */}
            <TransitionLink href="/" className="group flex items-center gap-3 text-body-lg text-foreground">
              <span>Back to home</span>
              <span
                aria-hidden
                className="relative size-10 shrink-0 overflow-hidden rounded-full bg-primary text-primary-foreground transition-transform duration-500 ease-hover-link group-hover:scale-110 group-focus-visible:scale-110"
              >
                <ArrowRight
                  strokeWidth={1.6}
                  className="absolute inset-0 m-auto size-6 transition-transform duration-500 ease-hover-link group-hover:translate-x-10 group-focus-visible:translate-x-10"
                />
                <ArrowRight
                  strokeWidth={1.6}
                  className="absolute inset-0 m-auto size-6 -translate-x-10 transition-transform duration-500 ease-hover-link group-hover:translate-x-0 group-focus-visible:translate-x-0"
                />
              </span>
            </TransitionLink>
          </ScrollReveal>
        </div>
      </div>
    </NotFoundStage>
  )
}

/**
 * The home page's Selected projects as rows (title, href, status and the home
 * thumbnail for the hover preview), in order, skipping
 * entries without an href — so adding a project to home.mdx adds a row here
 * with no code change.
 */
async function selectedProjects(): Promise<NotFoundProject[]> {
  try {
    const { data } = await client.queries.page({ relativePath: "home.mdx" })
    const rows: NotFoundProject[] = []
    for (const block of data.page.blocks ?? []) {
      if (block?.__typename !== "PageBlocksSelectedProjects") continue
      for (const project of block.projects ?? []) {
        if (!project?.title || !project?.href) continue
        rows.push({
          title: project.title,
          href: project.href,
          status: project.status ?? undefined,
          image: project.image?.src ? { src: project.image.src, alt: project.image.alt ?? "" } : undefined,
        })
      }
    }
    return rows
  } catch {
    // The 404 must render even when the content layer can't be reached.
    return []
  }
}

/** The 404 carries the site chrome (header and footer), which Framer's 404 doesn't. */
export default async function NotFound() {
  return (
    <Layout>
      <NotFoundContent projects={await selectedProjects()} />
    </Layout>
  )
}
