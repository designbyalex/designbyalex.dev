/** One page of a Tina `*Connection` query, reduced to what breadcrumb collection reads. */
type BreadcrumbConnection = {
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
  edges?: ({ node?: { _sys: { breadcrumbs: string[] } } | null } | null)[] | null;
};

/** Walk every page of a Tina connection and collect each document's breadcrumbs. */
export async function collectBreadcrumbs<T extends BreadcrumbConnection>(
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
