import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CaseStudySection } from '@/components/blocks/case-study-section';
import { ThemeToggle } from '@/components/theme/theme-toggle';

export const metadata: Metadata = {
  title: 'Mos playground preview — designbyalex.dev',
  robots: { index: false, follow: false },
};

/**
 * Preview of the MOS Urban design-system playground (#172) before #135 embeds it in the case study: the
 * design-system Section as the case study renders it, with `interactive: mos-playground`. Shown locally and on
 * Vercel preview deployments for the batch review; production 404s here, like the styleguide.
 */
export default function MosPlaygroundPreview() {
  if (process.env.VERCEL_ENV === 'production') notFound();
  const section = {
    __typename: 'ProjectBlocksCaseStudySection',
    sectionId: 'design-system',
    heading: 'A design system the team can own',
    subheading: 'Components built for editors, not just designers',
    headingSize: 'statement',
    rhythm: 'uniform',
    blocks: [],
    interactive: 'mos-playground',
  };
  return (
    <main className='min-h-screen bg-background py-16 text-foreground'>
      <div className='mx-auto flex max-w-[1440px] justify-end px-4 lg:px-6 xl:px-12'>
        <ThemeToggle />
      </div>
      <CaseStudySection data={section as Parameters<typeof CaseStudySection>[0]['data']} />
    </main>
  );
}
