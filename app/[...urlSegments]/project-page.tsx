"use client";
import { useTina } from "tinacms/dist/react";
import { Blocks } from "@/components/blocks";
import { BackLink } from "@/components/case-study/back-link";
import { ProjectHero } from "@/components/case-study/project-hero";
import { ProjectOverview } from "@/components/case-study/project-overview";
import { NextProjectProvider } from "@/components/case-study/next-project-context";
import { ProjectQuery } from "@/tina/__generated__/types";
import ErrorBoundary from "@/components/error-boundary";
import { resolveAdjacentProjects, type ProjectCardRef } from "@/lib/case-study/next-project";

export interface ProjectClientPageProps {
  data: {
    project: ProjectQuery["project"];
  };
  variables: {
    relativePath: string;
  };
  query: string;
  /** Every project (slug, title, order, and what a next-project card shows), for the next-project resolver. */
  allProjects?: ProjectCardRef[];
}

/**
 * A case study: the sticky Back pill, the Project Hero (status, title, tagline, full-bleed
 * image), the Overview (intro statements + metadata list), then the authored Sections. The
 * closing CTA block among them renders the next project's card from the resolver's answer,
 * provided here through `NextProjectProvider`.
 */
export default function ProjectClientPage(props: ProjectClientPageProps) {
  const { allProjects, ...tinaProps } = props;
  const { data } = useTina(tinaProps);
  const project = data?.project;
  if (!project) return null;

  const currentSlug = props.variables.relativePath.replace(/\.mdx$/, "");
  const { next } = resolveAdjacentProjects(allProjects ?? [], currentSlug);

  return (
    <ErrorBoundary>
      <article>
        <BackLink />
        <ProjectHero project={project} />
        <ProjectOverview project={project} />

        <NextProjectProvider value={next}>
          <Blocks blocks={project.blocks} />
        </NextProjectProvider>
      </article>
    </ErrorBoundary>
  );
}
