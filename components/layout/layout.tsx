import React, { PropsWithChildren } from "react";
import { LayoutProvider } from "./layout-context";
import client from "../../tina/__generated__/client";
import { Header } from "./nav/header";
import { Footer } from "./nav/footer";

type LayoutProps = PropsWithChildren & {
  rawPageData?: any;
};

export default async function Layout({ children, rawPageData }: LayoutProps) {
  const { data: globalData } = await client.queries.global({
    relativePath: "index.json",
  },
    {
      fetchOptions: {
        next: {
          revalidate: 60,
        },
      }
    }
  );

  return (
    <LayoutProvider globalSettings={globalData.global} pageData={rawPageData}>
      {/* Keyboard users can jump past the fixed header; parked above the viewport until focused. */}
      <a
        href="#main"
        className="fixed left-4 top-4 z-30 -translate-y-[200%] rounded-md bg-primary px-4 py-2 text-caption text-primary-foreground focus:translate-y-0"
      >
        Skip to content
      </a>
      <Header />
      {/* Offset by the header's height (88px, 96px at ≥1024) until the Hero and Project Hero tickets place their content under it as the Reference does. */}
      <main id="main" tabIndex={-1} className="overflow-x-hidden pt-22 outline-none lg:pt-24">
        {children}
      </main>
      <Footer />
    </LayoutProvider>
  );
}
