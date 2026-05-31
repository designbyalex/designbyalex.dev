import React from 'react';
import { notFound } from 'next/navigation';
import client from '@/tina/__generated__/client';
import Layout from '@/components/layout/layout';
import { Section } from '@/components/layout/section';
import PageClientPage from './client-page';
import ProjectClientPage from './project-page';

export const revalidate = 300;

export default async function Page({
  params,
}: {
  params: Promise<{ urlSegments: string[] }>;
}) {
  const resolvedParams = await params;
  const filepath = resolvedParams.urlSegments.join('/');

  // Projects own the root slug (e.g. /acacia), so resolve a project first and
  // fall back to a marketing page (e.g. /about).
  try {
    const data = await client.queries.project({
      relativePath: `${filepath}.mdx`,
    });
    return (
      <Layout rawPageData={data}>
        <ProjectClientPage {...data} />
      </Layout>
    );
  } catch {
    // Not a project — try a page below.
  }

  let data;
  try {
    data = await client.queries.page({
      relativePath: `${filepath}.mdx`,
    });
  } catch {
    notFound();
  }

  return (
    <Layout rawPageData={data}>
      <Section>
        <PageClientPage {...data} />
      </Section>
    </Layout>
  );
}

async function collectBreadcrumbs<T extends { pageInfo: { hasNextPage: boolean; endCursor: string | null }; edges?: ({ node?: { _sys: { breadcrumbs: string[] } } | null } | null)[] | null }>(
  fetchPage: (after?: string) => Promise<T>
): Promise<string[][]> {
  const out: string[][] = [];
  let connection = await fetchPage();
  while (true) {
    for (const edge of connection.edges ?? []) {
      const crumbs = edge?.node?._sys.breadcrumbs;
      if (crumbs) out.push(crumbs);
    }
    if (!connection.pageInfo.hasNextPage || !connection.pageInfo.endCursor) break;
    connection = await fetchPage(connection.pageInfo.endCursor);
  }
  return out;
}

export async function generateStaticParams() {
  const pageCrumbs = await collectBreadcrumbs(async (after) => {
    const res = await client.queries.pageConnection({ after });
    return res.data.pageConnection;
  });

  const projectCrumbs = await collectBreadcrumbs(async (after) => {
    const res = await client.queries.projectConnection({ after });
    return res.data.projectConnection;
  });

  return [...pageCrumbs, ...projectCrumbs]
    .map((urlSegments) => ({ urlSegments }))
    .filter((x) => x.urlSegments.length >= 1)
    .filter((x) => !x.urlSegments.every((segment) => segment === 'home')); // exclude the home page
}
