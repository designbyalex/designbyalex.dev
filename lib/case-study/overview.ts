/**
 * Pure builder for the case-study Overview's metadata list (no React/DOM imports, so it
 * is unit-tested in plain Node like `./format.ts`).
 *
 * The Reference stacks the project's structured fields as label/value rows in a fixed
 * order: Typology, Product, Role, Timeline, Collaborators, Tools, Deliverables. Rows
 * whose field is empty are left out. Each value is one paragraph of one or more lines
 * (the Reference breaks lines with `<br>`); a line can carry a `note`, the grey trailing
 * parenthetical the Reference sets on deliverables ("Brand strategy platform" + " (purpose,
 * values, tone of voice)").
 */

export type OverviewRowKey = 'typology' | 'product' | 'role' | 'timeline' | 'collaborators' | 'tools' | 'deliverables';

export interface OverviewLine {
  text: string;
  /** Trailing parenthetical set in the muted colour after the text (deliverables only). */
  note?: string;
}

export interface OverviewRow {
  key: OverviewRowKey;
  label: string;
  lines: OverviewLine[];
}

export interface OverviewCollaborator {
  name?: string | null;
  role?: string | null;
}

export interface OverviewInput {
  typology?: (string | null)[] | null;
  product?: string | null;
  role?: (string | null)[] | null;
  roleDescription?: string | null;
  timeline?: string | null;
  collaborators?: (OverviewCollaborator | null)[] | null;
  tools?: (string | null)[] | null;
  deliverables?: (string | null)[] | null;
}

const present = (items?: (string | null)[] | null): string[] =>
  (items ?? []).map((s) => s?.trim() ?? '').filter((s) => s.length > 0);

/**
 * "Brand strategy platform (purpose, values, tone of voice)" → the text and its trailing
 * parenthetical as a note. Text without a trailing parenthetical is returned as is, and a
 * value that is only a parenthetical stays whole.
 */
export function splitTrailingNote(value: string): OverviewLine {
  const match = value.trim().match(/^(.*\S)\s+(\([^()]*\))$/);
  if (!match) return { text: value.trim() };
  return { text: match[1], note: match[2] };
}

/**
 * The Role row is one sentence on the Reference: the role(s), a full stop, then the
 * description ("Product Designer. Worked closely with CEO…").
 */
export function roleSentence(roles: string[], description?: string | null): string {
  const role = roles.join(', ');
  const detail = description?.trim();
  if (!detail) return role;
  if (!role) return detail;
  return `${role.replace(/\.$/, '')}. ${detail}`;
}

/** "Anil Sagaram (Founder & CEO)"; collaborators without a name are skipped. */
export function collaboratorLines(collaborators?: (OverviewCollaborator | null)[] | null): OverviewLine[] {
  return (collaborators ?? [])
    .filter((c): c is OverviewCollaborator => Boolean(c?.name?.trim()))
    .map((c) => ({ text: c.role?.trim() ? `${c.name!.trim()} (${c.role!.trim()})` : c.name!.trim() }));
}

export function buildOverviewRows(project: OverviewInput): OverviewRow[] {
  const rows: OverviewRow[] = [];
  const push = (key: OverviewRowKey, label: string, lines: OverviewLine[]) => {
    if (lines.length > 0) rows.push({ key, label, lines });
  };

  const typology = present(project.typology);
  push('typology', 'Typology', typology.length ? [{ text: typology.join(', ') }] : []);

  const product = project.product?.trim();
  push('product', 'Product', product ? [{ text: product }] : []);

  const role = roleSentence(present(project.role), project.roleDescription);
  push('role', 'Role', role ? [{ text: role }] : []);

  const timeline = project.timeline?.trim();
  push('timeline', 'Timeline', timeline ? [{ text: timeline }] : []);

  push('collaborators', 'Collaborators', collaboratorLines(project.collaborators));

  const tools = present(project.tools);
  push('tools', 'Tools', tools.length ? [{ text: tools.join(', ') }] : []);

  push('deliverables', 'Deliverables', present(project.deliverables).map(splitTrailingNote));

  return rows;
}
