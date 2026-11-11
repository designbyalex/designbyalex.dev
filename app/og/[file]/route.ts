import { renderShareCard } from '@/lib/seo/share-card';
import { collectBreadcrumbs } from '@/lib/tina/collect-breadcrumbs';
import client from '@/tina/__generated__/client';

// Every card is rendered at build time (#111): one JPEG per project, so a new
// project added in Tina gets its card on the next build with no code change.
export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  const projectCrumbs = await collectBreadcrumbs(async (after) => {
    const res = await client.queries.projectConnection({ after });
    return res.data.projectConnection;
  });
  return projectCrumbs.map((crumbs) => ({ file: `${crumbs.join('/')}.jpg` }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const slug = file.replace(/\.jpg$/, '');
  const res = await client.queries.project({ relativePath: `${slug}.mdx` });
  const project = res.data.project;

  const jpeg = await renderShareCard({
    title: project.title,
    tagline: project.tagline,
    slug,
    coverImage: project.coverImage,
    shareZoom: project.shareZoom,
  });

  return new Response(new Uint8Array(jpeg), {
    headers: { 'Content-Type': 'image/jpeg' },
  });
}
