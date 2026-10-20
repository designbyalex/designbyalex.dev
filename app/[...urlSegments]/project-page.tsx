"use client";
import { useTina } from "tinacms/dist/react";
import { Blocks } from "@/components/blocks";
import { Section } from "@/components/layout/section";
import { BackLink } from "@/components/case-study/back-link";
import { ProjectHero } from "@/components/case-study/project-hero";
import { ProjectOverview } from "@/components/case-study/project-overview";
import { TransitionLink as Link } from "@/components/motion-primitives/route-transitions";
import { ProjectQuery } from "@/tina/__generated__/types";
import ErrorBoundary from "@/components/error-boundary";
import { resolveAdjacentProjects, type ProjectRef } from "@/lib/case-study/next-project";

export interface ProjectClientPageProps {
  data: {
    project: ProjectQuery["project"];
  };
  variables: {
    relativePath: string;
  };
  query: string;
  /** Minimal list of all projects, used to resolve next/previous navigation. */
  allProjects?: ProjectRef[];
}

/**
 * A case study: the sticky Back pill, the Project Hero (status, title, tagline, full-bleed
 * image), the Overview (intro statements + metadata list), then the authored Sections and the
 * previous/next links.
 */
export default function ProjectClientPage(props: ProjectClientPageProps) {
  const { allProjects, ...tinaProps } = props;
  const { data } = useTina(tinaProps);
  const project = data?.project;
  if (!project) return null;

  const currentSlug = props.variables.relativePath.replace(/\.mdx$/, "");
  const { next, prev } = resolveAdjacentProjects(allProjects ?? [], currentSlug);

  return (
    <ErrorBoundary>
      <article>
        <BackLink />
        <ProjectHero project={project} />
        <ProjectOverview project={project} />

        <Blocks blocks={project.blocks} />

        {(next || prev) && (
          <Section sectionId="project-nav" className="prose-none">
            <nav className="flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:justify-between">
              {prev ? (
                <Link href={`/${prev.slug}`} className="group rounded-md">
                  <span className="font-mono text-mono uppercase text-muted-foreground">
                    Previous
                  </span>
                  <span className="mt-1 block text-body group-hover:text-emphasis">{prev.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link href={`/${next.slug}`} className="group rounded-md sm:text-right">
                  <span className="font-mono text-mono uppercase text-muted-foreground">
                    Next project
                  </span>
                  <span className="mt-1 block text-body group-hover:text-emphasis">{next.title}</span>
                </Link>
              ) : (
                <span />
              )}
            </nav>
          </Section>
        )}
      </article>
    </ErrorBoundary>
  );
}
