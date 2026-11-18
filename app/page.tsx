import React from "react";
import type { Metadata } from "next";
import client from "@/tina/__generated__/client";
import Layout from "@/components/layout/layout";
import ClientPage from "./[...urlSegments]/client-page";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { siteDefaults } from "@/lib/seo/site";
import { JsonLd } from "@/lib/seo/json-ld";
import { buildHomeStructuredData } from "@/lib/seo/structured-data";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { data } = await client.queries.page({ relativePath: `home.mdx` });
    return buildPageMetadata(
      { title: data.page.title, description: data.page.description, slug: "home" },
      siteDefaults
    );
  } catch {
    return buildPageMetadata({ slug: "home" }, siteDefaults);
  }
}

export default async function Home() {
  const data = await client.queries.page({
    relativePath: `home.mdx`,
  });
  // Footer links feed the Person's sameAs (#179). Same query and revalidate as Layout's, so Next dedupes it.
  const { data: globalData } = await client.queries.global(
    { relativePath: "index.json" },
    { fetchOptions: { next: { revalidate: 60 } } }
  );
  const structuredData = buildHomeStructuredData(
    {
      description: data.data.page.description,
      links: globalData.global.footer?.links?.map((link) => link?.href),
    },
    siteDefaults
  );

  return (
    <Layout rawPageData={data}>
      <JsonLd graph={structuredData} />
      <ClientPage {...data} />
    </Layout>
  );
}
