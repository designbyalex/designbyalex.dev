import {
  HousePlug,
  LayoutDashboard,
  LayoutPanelLeft,
  LoaderCircle,
  LockKeyhole,
  MonitorPlay,
  Pilcrow,
  RectangleEllipsis,
  TabletSmartphone,
  User,
} from 'lucide-react';

/**
 * The key-feature icons of the case-study icon list (#61). The Reference drew them inline from an
 * Iconify mix; #110 redraws each one from lucide (the owner's pick, 2026-11-11) at 20px in the 30px
 * column, default stroke 2, `currentColor` so they follow the page foreground in both themes.
 * The last five came with the TinaCMS case study (#127, the owner's set B pick, 2026-11-12).
 */

export type FeatureIconName = 'module' | 'progress' | 'lock' | 'house' | 'user' | 'field' | 'dashboard' | 'preview' | 'richtext' | 'responsive';

export const featureIconOptions: { label: string; value: FeatureIconName }[] = [
  { label: 'Module (panels)', value: 'module' },
  { label: 'Progress (loader circle)', value: 'progress' },
  { label: 'Lock', value: 'lock' },
  { label: 'House (plug)', value: 'house' },
  { label: 'User', value: 'user' },
  { label: 'Field (input with dots)', value: 'field' },
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'Preview (monitor with play)', value: 'preview' },
  { label: 'Rich text (pilcrow)', value: 'richtext' },
  { label: 'Responsive (tablet and phone)', value: 'responsive' },
];

const common = { 'aria-hidden': true, focusable: false, className: 'block size-5 shrink-0' } as const;

const ICONS: Record<FeatureIconName, () => React.JSX.Element> = {
  module: () => <LayoutPanelLeft {...common} />,
  progress: () => <LoaderCircle {...common} />,
  lock: () => <LockKeyhole {...common} />,
  house: () => <HousePlug {...common} />,
  user: () => <User {...common} />,
  field: () => <RectangleEllipsis {...common} />,
  dashboard: () => <LayoutDashboard {...common} />,
  preview: () => <MonitorPlay {...common} />,
  richtext: () => <Pilcrow {...common} />,
  responsive: () => <TabletSmartphone {...common} />,
};

/** One key-feature icon by name; unknown names render nothing, so an empty slot keeps the row's indent. */
export const FeatureIcon = ({ name }: { name?: string | null }) => {
  const Icon = name ? ICONS[name as FeatureIconName] : undefined;
  return Icon ? <Icon /> : null;
};

/**
 * The Acacia mark on the Mission logo card (#94): the rounded-square ring and the A glyph in one
 * path, filled with `currentColor` so it follows the page foreground in both themes. Inline rather
 * than a CSS mask of the white SVG asset: a mask on a span inside the card's radius-clipped,
 * transform-animated ScrollReveal can composite to nothing in Safari, and the Reference draws this
 * logo inline too (it has no media entry for it).
 */
export const AcaciaMark = ({ className }: { className?: string }) => (
  <svg aria-hidden focusable={false} viewBox='0 0 91 91' fill='currentColor' className={className}>
    <path d='M71 0C82.0457 0 91 8.95431 91 20V71C91 81.873 82.3235 90.7192 71.5166 90.9932L71 91H20L19.4834 90.9932C8.84814 90.7235 0.276492 82.1519 0.00683594 71.5166L0 71V20C0 8.95431 8.95431 8.85854e-08 20 0H71ZM20 1C9.50659 1 1 9.50659 1 20V71C1 81.4934 9.50659 90 20 90H71C81.4934 90 90 81.4934 90 71V20C90 9.50659 81.4934 1 71 1H20ZM70.2803 66.1533H64.9492L58.6807 50.6357H52.542C45.7354 50.6357 39.7211 54.7283 37.2217 61.0576L35.2119 66.1494H29.8975L32.623 59.2412C35.8707 51.0072 43.6932 45.6895 52.542 45.6895H56.6865L50.168 29.5439H49.9287L49.6172 30.3125L47.0332 36.7148L46.8311 37.2119C43.5431 45.349 35.7497 50.6074 26.9736 50.6074H19.5L21.498 45.6611H26.9736C33.7234 45.6611 39.7174 41.6169 42.2451 35.3564L47.3369 22.75H52.7559L70.2803 66.1533Z' />
  </svg>
);
