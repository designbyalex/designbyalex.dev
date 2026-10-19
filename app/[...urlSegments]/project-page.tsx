"use client";
import { useTina, tinaField } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import { Blocks } from "@/components/blocks";
import { components } from "@/components/mdx-components";
import { Section } from "@/components/layout/section";
import { TransitionLink as Link } from "@/components/motion-primitives/route-transitions";
import { ProjectQuery } from "@/tina/__generated__/types";
import ErrorBoundary from "@/components/error-boundary";
import { formatMetric, type MetricKind } from "@/lib/case-study/format";
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

const statusLabels: Record<string, string> = {
  shipped: "Shipped",
  "in-development": "In-development",
  concept: "Concept",
};

// Status accent: the live site tags shipped work green and in-development work orange.
const statusClasses: Record<string, string> = {
  "in-development": "text-status-in-development",
};

export default function ProjectClientPage(props: ProjectClientPageProps) {
  const { allProjects, ...tinaProps } = props;
  const { data } = useTina(tinaProps);
  const project = data?.project;
  if (!project) return null;

  const currentSlug = props.variables.relativePath.replace(/\.mdx$/, "");
  const { next, prev } = resolveAdjacentProjects(allProjects ?? [], currentSlug);

  // Overview order mirrors the live case studies: typology, role, timeline, collaborators, tools, deliverables.
  const meta: { key: string; label: string; value: string; note?: string | null; wide?: boolean }[] = [];
  if (project.typology?.length) meta.push({ key: "typology", label: "Typology", value: project.typology.filter(Boolean).join(", ") });
  if (project.role?.length) {
    meta.push({ key: "role", label: "Role", value: project.role.filter(Boolean).join(", "), note: project.roleDescription });
  }
  if (project.timeline) meta.push({ key: "timeline", label: "Timeline", value: project.timeline });
  if (project.collaborators?.length) {
    meta.push({
      key: "collaborators",
      label: "Collaborators",
      value: project.collaborators
        .filter((c) => c?.name)
        .map((c) => (c!.role ? `${c!.name} (${c!.role})` : c!.name))
        .join("\n"),
    });
  }
  if (project.tools?.length) meta.push({ key: "tools", label: "Tools", value: project.tools.filter(Boolean).join(", ") });
  if (project.deliverables?.length) {
    meta.push({
      key: "deliverables",
      label: "Deliverables",
      value: project.deliverables.filter(Boolean).join("\n"),
      wide: true,
    });
  }

  return (
    <ErrorBoundary>
      <article>
        <Section sectionId="project-hero" className="prose-none">
          {project.status && (
            <p
              className={`font-mono text-mono uppercase ${statusClasses[project.status] ?? "text-emphasis"}`}
              data-tina-field={tinaField(project, "status")}
            >
              {statusLabels[project.status] ?? project.status}
            </p>
          )}
          <h1
            className="mt-4 font-display text-h1 text-balance"
            data-tina-field={tinaField(project, "title")}
          >
            {project.title}
          </h1>
          {project.tagline && (
            <p
              className="mt-6 max-w-2xl font-display text-lead text-balance text-muted-foreground"
              data-tina-field={tinaField(project, "tagline")}
            >
              {project.tagline}
            </p>
          )}

          {project.intro && (
            // Reference: the intro is set as white statements (with green phrases), not body copy.
            <div
              className="mt-10 max-w-3xl space-y-6 font-display text-statement text-foreground"
              data-tina-field={tinaField(project, "intro")}
            >
              <TinaMarkdown content={project.intro} components={components} />
            </div>
          )}

          {meta.length > 0 && (
            <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-border pt-8 sm:grid-cols-4">
              {meta.map((m) => (
                <div key={m.key} className={m.wide ? "col-span-2" : undefined} data-tina-field={tinaField(project, m.key as any)}>
                  <dt className="text-caption text-muted-foreground">{m.label}</dt>
                  <dd className="mt-2 whitespace-pre-line text-caption text-foreground-soft">{m.value}</dd>
                  {m.note && (
                    <dd
                      className="mt-2 text-caption text-muted-foreground"
                      data-tina-field={tinaField(project, "roleDescription")}
                    >
                      {m.note}
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          )}

          {project.metrics?.length ? (
            <ul className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
              {project.metrics.filter(Boolean).map((metric, i) => (
                <li key={i} data-tina-field={tinaField(metric!)}>
                  <span className="block font-display text-h1">
                    {formatMetric({
                      value: metric!.value ?? Number.NaN,
                      kind: metric!.kind as MetricKind | null,
                      to: metric!.to,
                      suffix: metric!.suffix,
                    })}
                  </span>
                  <span className="mt-1 block text-caption text-muted-foreground">{metric!.label}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </Section>

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
