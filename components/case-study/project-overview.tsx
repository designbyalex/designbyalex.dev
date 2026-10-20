'use client';
import React, { Fragment } from 'react';
import { tinaField } from 'tinacms/dist/react';
import { TinaMarkdown } from 'tinacms/dist/rich-text';
import type { ProjectQuery } from '@/tina/__generated__/types';
import { buildOverviewRows } from '@/lib/case-study/overview';
import { cn } from '@/lib/utils';
import { components } from '../mdx-components';
import { Section } from '../layout/section';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';

type Project = ProjectQuery['project'];

const HAIRLINE_ABOVE = 'shadow-[0_-1px_0_0_var(--color-border)]';

/**
 * The case-study Overview (`docs/parity-audit.md` A3, A4, M2): the intro paragraphs as white
 * statements with green key phrases on the left, the stacked metadata list with hairlines on the
 * right (Typology, Product, Role, Timeline, Collaborators, Tools, Deliverables; see
 * `lib/case-study/overview.ts`).
 *
 * Boxes, from Framer's CSS (the Acacia instance). Desktop (≥1280): 1440px max, padded
 * 200/48/100, at least 605px tall; the two columns 40px apart, each opening with a hairline and
 * 10px of padding; the intro column flexes (772px at 1440), paragraphs 30px apart; the list is
 * at most 532px wide, items 10px apart with 10px of padding and a hairline above every item but
 * the first, the value straight under its label. Under 1024 (Framer's phone variant): a centred
 * 532px column padded 64/16, the columns stacked 64px apart, the intro 16px under its hairline
 * with paragraphs 20px apart. The tablet variant (1024–1279) is approximated: 128/24/64 padding,
 * the list 43% wide.
 *
 * `overviewStyle: relaxed` is Framer's MOS Urban instance, a hand-tuned copy of Acacia's: 4px
 * between every label and its value, the Role value a white paragraph in a 4px-padded wrapper,
 * and the paragraphs 40px apart at desktop (20px on phones, as the compact style).
 */
export const ProjectOverview = ({ project }: { project: Project }) => {
  const rows = buildOverviewRows(project);
  if (!project.intro && rows.length === 0) return null;
  const relaxed = project.overviewStyle === 'relaxed';

  return (
    <Section
      sectionId='overview'
      rootClassName='mx-auto w-full max-w-[532px] lg:max-w-[1440px]'
      className='flex min-h-[605px] max-w-none flex-col gap-[60px] px-4 py-16 lg:px-6 lg:pt-32 xl:px-12 xl:pt-[200px] xl:pb-[100px]'
    >
      <div className='flex flex-col gap-16 lg:flex-row lg:items-start lg:gap-10'>
        {project.intro && (
          <ScrollReveal className={cn('w-full pt-4 lg:min-w-0 lg:flex-1 lg:pt-[10px]', HAIRLINE_ABOVE)}>
            {/* Statements at the Reference's 28px Inter Display, white, highlights green; pre-wrap as Framer's text containers. */}
            <div
              className={cn(
                'flex flex-col gap-5 font-display text-statement text-foreground [&_p]:whitespace-pre-wrap',
                relaxed ? 'xl:gap-10' : 'xl:gap-[30px]'
              )}
              data-tina-field={tinaField(project, 'intro')}
            >
              <TinaMarkdown content={project.intro} components={components} />
            </div>
          </ScrollReveal>
        )}

        {rows.length > 0 && (
          <dl
            className={cn(
              'flex w-full flex-col gap-[10px] pt-[10px] lg:w-[43%] lg:flex-none xl:w-auto xl:max-w-[532px] xl:flex-1',
              HAIRLINE_ABOVE
            )}
          >
            {rows.map((row, i) => (
              <ScrollReveal key={row.key} delay={Math.min(i, 4) * 0.06} className={cn('w-full', i > 0 && cn('pt-[10px]', HAIRLINE_ABOVE))}>
                <dt className='text-caption text-muted-foreground'>{row.label}</dt>
                <dd
                  className={cn(
                    'text-caption text-foreground-soft',
                    relaxed && 'mt-1',
                    relaxed && row.key === 'role' && 'pb-1 text-foreground'
                  )}
                  data-tina-field={tinaField(project, row.key)}
                >
                  {row.lines.map((line, j) => (
                    <Fragment key={j}>
                      {j > 0 && <br />}
                      {line.text}
                      {line.note && (
                        <>
                          {' '}
                          <span className='text-muted-foreground'>{line.note}</span>
                        </>
                      )}
                    </Fragment>
                  ))}
                </dd>
              </ScrollReveal>
            ))}
          </dl>
        )}
      </div>
    </Section>
  );
};
