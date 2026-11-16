import { type JsonLdGraph, serializeJsonLd } from './structured-data';

/** Renders schema.org JSON-LD (#179). A server component: the script ships in the HTML, crawlers need no JS. */
export function JsonLd({ graph }: { graph: JsonLdGraph }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD must be raw JSON; serializeJsonLd escapes `<`.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }}
    />
  );
}
