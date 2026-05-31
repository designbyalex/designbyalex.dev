"use client";
import Link from "next/link";
import { useTina, tinaField } from "tinacms/dist/react";
import { Blocks } from "@/components/blocks";
import { Section } from "@/components/layout/section";
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
  "in-development": "In development",
  concept: "Concept",
};

export default function ProjectClientPage(props: ProjectClientPageProps) {
  const { allProjects, ...tinaProps } = props;
  const { data } = useTina(tinaProps);
  const project = data?.project;
  if (!project) return null;

  const currentSlug = props.variables.relativePath.replace(/\.mdx$/, "");
  const { next, prev } = resolveAdjacentProjects(allProjects ?? [], currentSlug);

  const meta: { key: string; label: string; value: string }[] = [];
  if (project.role?.length) meta.push({ key: "role", label: "Role", value: project.role.filter(Boolean).join(", ") });
  if (project.typology?.length) meta.push({ key: "typology", label: "Typology", value: project.typology.filter(Boolean).join(", ") });
  if (project.timeline) meta.push({ key: "timeline", label: "Timeline", value: project.timeline });
  if (project.collaborators?.length) {
    meta.push({
      key: "collaborators",
      label: "With",
      value: project.collaborators.filter(Boolean).map((c) => c!.name).filter(Boolean).join(", "),
    });
  }

  return (
    <ErrorBoundary>
      <article>
        <Section className="prose-none">
          {project.status && (
            <p
              className="font-mono text-xs uppercase tracking-widest text-primary"
              data-tina-field={tinaField(project, "status")}
            >
              {statusLabels[project.status] ?? project.status}
            </p>
          )}
          <h1
            className="mt-4 text-balance text-5xl font-medium tracking-tight md:text-6xl"
            data-tina-field={tinaField(project, "title")}
          >
            {project.title}
          </h1>
          {project.tagline && (
            <p
              className="mt-6 max-w-2xl text-balance text-xl text-muted-foreground"
              data-tina-field={tinaField(project, "tagline")}
            >
              {project.tagline}
            </p>
          )}

          {meta.length > 0 && (
            <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-border pt-8 sm:grid-cols-4">
              {meta.map((m) => (
                <div key={m.key} data-tina-field={tinaField(project, m.key as any)}>
                  <dt className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{m.label}</dt>
                  <dd className="mt-2 text-base">{m.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {project.metrics?.length ? (
            <ul className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
              {project.metrics.filter(Boolean).map((metric, i) => (
                <li key={i} data-tina-field={tinaField(metric!)}>
                  <span className="block text-4xl font-medium tracking-tight">
                    {formatMetric({
                      value: metric!.value ?? Number.NaN,
                      kind: metric!.kind as MetricKind | null,
                      to: metric!.to,
                      suffix: metric!.suffix,
                    })}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">{metric!.label}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </Section>

        <Blocks blocks={project.blocks} />

        {(next || prev) && (
          <Section className="prose-none">
            <nav className="flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:justify-between">
              {prev ? (
                <Link href={`/${prev.slug}`} className="group">
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Previous
                  </span>
                  <span className="mt-1 block text-lg font-medium group-hover:text-primary">{prev.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link href={`/${next.slug}`} className="group sm:text-right">
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Next project
                  </span>
                  <span className="mt-1 block text-lg font-medium group-hover:text-primary">{next.title}</span>
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
