"use client";
import { useTina, tinaField } from "tinacms/dist/react";
import { Blocks } from "@/components/blocks";
import { Section } from "@/components/layout/section";
import { ProjectQuery } from "@/tina/__generated__/types";
import ErrorBoundary from "@/components/error-boundary";

export interface ProjectClientPageProps {
  data: {
    project: ProjectQuery["project"];
  };
  variables: {
    relativePath: string;
  };
  query: string;
}

const statusLabels: Record<string, string> = {
  shipped: "Shipped",
  "in-development": "In development",
  concept: "Concept",
};

export default function ProjectClientPage(props: ProjectClientPageProps) {
  const { data } = useTina({ ...props });
  const project = data?.project;
  if (!project) return null;

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
                  <span className="block text-4xl font-medium tracking-tight">{metric!.value}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{metric!.label}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </Section>

        <Blocks blocks={project.blocks} />
      </article>
    </ErrorBoundary>
  );
}
