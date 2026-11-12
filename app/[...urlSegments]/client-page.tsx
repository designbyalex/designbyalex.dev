"use client";
import { useTina } from "tinacms/dist/react";
import { Blocks } from "@/components/blocks";
import { WorkProjectsProvider } from "@/components/blocks/work-index";
import { PageQuery } from "@/tina/__generated__/types";
import ErrorBoundary from "@/components/error-boundary";
import type { WorkProjectRef } from "@/lib/case-study/work-index";

export interface ClientPageProps {
  data: {
    page: PageQuery["page"];
  };
  variables: {
    relativePath: string;
  };
  query: string;
  /** Every project (slug, title, order, format and card fields), for the Work index block. */
  allProjects?: WorkProjectRef[];
}

export default function ClientPage(props: ClientPageProps) {
  const { allProjects, ...tinaProps } = props;
  const { data } = useTina(tinaProps);
  return (
    <ErrorBoundary>
      <WorkProjectsProvider value={allProjects ?? []}>
        <Blocks {...data?.page} />
      </WorkProjectsProvider>
    </ErrorBoundary>
  );
}
