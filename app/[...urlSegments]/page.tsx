import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import client from '@/tina/__generated__/client';
import Layout from '@/components/layout/layout';
import PageClientPage from './client-page';
import ProjectClientPage from './project-page';
import { buildPageMetadata, buildProjectMetadata } from '@/lib/seo/metadata';
import { siteDefaults } from '@/lib/seo/site';
import type { WorkProjectRef } from '@/lib/case-study/work-index';
import { collectBreadcrumbs } from '@/lib/tina/collect-breadcrumbs';

export const revalidate = 300;

// Only the slugs generateStaticParams lists render here; any other URL is unmatched, so Next serves the
// prerendered app/not-found.tsx (/_not-found) inside the root layout with a 404 (#174). Rendering an
// unknown slug on demand and calling notFound() from the page instead sent Next's empty error shell
// (`<html id="__next_error__">`, no lang, empty body) and drew the 404 client-side: Next 15 only catches
// a page's notFound() in the browser, never during SSR. Tina's content commits redeploy the site, so a
// new page or project gets its route with that build.
export const dynamicParams = false;

/** Collect every project's slug, title and order (for the next-project and Work-index sorts) and what its card shows. */
async function fetchAllProjects(): Promise<WorkProjectRef[]> {
  const out: WorkProjectRef[] = [];
  let after: string | undefined;
  while (true) {
    const res = await client.queries.projectConnection({ after });
    const connection = res.data.projectConnection;
    for (const edge of connection.edges ?? []) {
      const node = edge?.node;
      if (node) {
        out.push({
          slug: node._sys.breadcrumbs.join('/'),
          title: node.title,
          order: node.order ?? null,
          format: node.format ?? null,
          status: node.status ?? null,
          tagline: node.tagline ?? null,
          thumbnail: node.thumbnail ?? null,
          thumbnailAlt: node.thumbnailAlt ?? null,
        });
      }
    }
    if (!connection.pageInfo.hasNextPage || !connection.pageInfo.endCursor) break;
    after = connection.pageInfo.endCursor;
  }
  return out;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ urlSegments: string[] }>;
}): Promise<Metadata> {
  const filepath = (await params).urlSegments.join('/');

  try {
    const res = await client.queries.project({ relativePath: `${filepath}.mdx` });
    const project = res.data.project;
    return buildProjectMetadata(
      {
        title: project.title,
        tagline: project.tagline,
        slug: filepath,
      },
      siteDefaults
    );
  } catch {
    // Not a project — fall back to a page title below.
  }

  try {
    const res = await client.queries.page({ relativePath: `${filepath}.mdx` });
    return buildPageMetadata(
      { title: res.data.page.title, description: res.data.page.description, slug: filepath },
      siteDefaults
    );
  } catch {
    return {};
  }
}

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
    const allProjects = await fetchAllProjects();
    return (
      <Layout rawPageData={data}>
        {/* Keyed by path: case study → case study must remount the client tree
            so the hero entrance (#68) replays — the App Router would otherwise
            keep client-component state across a same-route param change. */}
        <ProjectClientPage key={filepath} {...data} allProjects={allProjects} />
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

  // The Work index block lists the Project collection, not the Page document,
  // so its data is fetched here and handed down (as the next-project card's is).
  // Fetched unconditionally, like the project branch above: gating on the saved
  // document's block list would hand an empty list to a block added live in
  // Tina's editor until the page revalidates.
  const allProjects = await fetchAllProjects();

  return (
    <Layout rawPageData={data}>
      <PageClientPage {...data} allProjects={allProjects} />
    </Layout>
  );
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
