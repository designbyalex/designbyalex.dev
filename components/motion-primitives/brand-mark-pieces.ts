/** The Brand mark's artwork, shared by `MarkGlyph` (header and footer) and the 404's assembling outline. */
export const BRAND_MARK_VIEWBOX = '0 0 35 33.2';

/** The viewBox width, which converts screen pixels into the artwork's units. */
export const BRAND_MARK_WIDTH = 35;

/** The mark's three rounded triangles, each its own path so the pieces can move apart. */
export const BRAND_MARK_PIECES = {
  left: 'M 15.132 16.922 L 1.322 2.39 C 0.836 1.876 0 2.242 0 2.967 L 0 32.034 C 0 32.758 0.835 33.124 1.323 32.612 L 15.132 18.078 C 15.433 17.752 15.433 17.248 15.132 16.922 Z',
  right:
    'M 19.869 18.078 L 33.677 32.612 C 34.165 33.125 35 32.758 35 32.034 L 35 2.967 C 35 2.242 34.165 1.876 33.677 2.388 L 19.87 16.922 C 19.569 17.248 19.569 17.752 19.87 18.078 Z',
  top: 'M 18.21 15.92 L 32.025 1.393 C 32.51 0.879 32.163 0 31.474 0 L 3.848 0 C 3.16 0 2.812 0.88 3.3 1.392 L 17.112 15.92 C 17.254 16.072 17.453 16.158 17.661 16.158 C 17.87 16.158 18.069 16.072 18.211 15.92 Z',
} as const;

export type BrandMarkPiece = keyof typeof BRAND_MARK_PIECES;
