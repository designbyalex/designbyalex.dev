import type { SiteSeoDefaults } from './metadata';

/**
 * Site-wide SEO defaults (S9 / #13). Values are the live designbyalex.dev
 * <head>: the Framer site emits the same title, description and share image
 * on every page, so these are the fallbacks for anything a document doesn't
 * override. `NEXT_PUBLIC_SITE_URL` lets a Vercel preview resolve canonical
 * and Open Graph URLs against itself.
 */
export const siteDefaults: SiteSeoDefaults & { baseUrl: string } = {
  siteName: 'Alexander Blum',
  siteTitle: 'Alexander Blum | UX • Product Design',
  titleTemplate: '%s · Alexander Blum',
  defaultDescription:
    'Alex is a Sydney-based product designer with 3+ years’ experience crafting human-centred products.',
  defaultImage: '/uploads/home/og.png',
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://designbyalex.dev',
};
