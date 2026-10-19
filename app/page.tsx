import React from "react";
import type { Metadata } from "next";
import client from "@/tina/__generated__/client";
import Layout from "@/components/layout/layout";
import ClientPage from "./[...urlSegments]/client-page";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { siteDefaults } from "@/lib/seo/site";

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

  return (
    <Layout rawPageData={data}>
      <ClientPage {...data} />
    </Layout>
  );
}
