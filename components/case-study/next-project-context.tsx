'use client';
import { createContext, useContext } from 'react';
import type { ProjectCardRef } from '@/lib/case-study/next-project';

/**
 * The project after the current one, as the next-project resolver orders them. The case-study
 * page provides it; the closing CTA block (`components/blocks/case-study-cta.tsx`) reads it for
 * its "Next project" card, so the card follows the collection rather than an authored link.
 * `null` when there is no other project.
 */
const NextProjectContext = createContext<ProjectCardRef | null>(null);

export const NextProjectProvider = NextProjectContext.Provider;

export const useNextProject = () => useContext(NextProjectContext);
