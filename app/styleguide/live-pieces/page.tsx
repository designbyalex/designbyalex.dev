import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CaseStudySection } from '@/components/blocks/case-study-section';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { JumpToHash } from './jump-to-hash';

export const metadata: Metadata = {
  title: 'AI-workflow live pieces preview — designbyalex.dev',
  robots: { index: false, follow: false },
};

type SectionData = Parameters<typeof CaseStudySection>[0]['data'];

const T = 'ProjectBlocksCaseStudySectionBlocks';
const body = (...paragraphs: string[]) => ({
  __typename: `${T}Body`,
  body: { type: 'root', children: paragraphs.map((text) => ({ type: 'p', children: [{ type: 'text', text }] })) },
});
const statement = (text: string, emphasis: string) => ({ __typename: `${T}Statement`, text, emphasis });
const section = (sectionId: string, heading: string, subheading: string, blocks: object[], interactive?: string) =>
  ({ __typename: 'ProjectBlocksCaseStudySection', sectionId, heading, subheading, headingSize: 'heading', blocks, interactive }) as unknown as SectionData;

/**
 * Preview of the AI-workflow story's live pieces (#191) before the #132 writer places them in
 * `building-with-ai.mdx`: each one in its Section, with the story's copy, as the case study renders it. Shown
 * locally and on Vercel preview deployments for the batch review; production 404s here, like the styleguide.
 * The board's session titles wait on Alex's sign-off in the PR.
 */
const SECTIONS: SectionData[] = [
  section('studio', 'Running it like a small studio', 'I direct, the agents build', [
    body(
      'Left alone, my agents made calls I never signed off on. That’s on me. I hadn’t told them how I work.',
      'So I wrote it down, the way I’d onboard someone new at a studio. One agent plans and briefs, and the rest each take a part of the site and build side by side. The rules took more thinking than anything I built with them.',
    ),
    {
      __typename: `${T}IconList`,
      label: 'My rules for the team',
      items: [
        { icon: 'approve', text: 'Nothing goes live until I say yes.' },
        { icon: 'options', text: 'I see every design decision as real options on the page.' },
        { icon: 'questions', text: 'They save up their questions and ask me once, with what they’d pick.' },
        { icon: 'parallel', text: 'Each agent owns its own part of the site.' },
      ],
    },
    statement('Write the rules first, ', 'then let them build.'),
  ]),
  section(
    'taste',
    'Taste stays with me',
    'Every visual call is mine',
    [
      body(
        'Agents will make your design calls for you if you let them. I don’t let them. Every visual decision on this site came to me as a picker round: real options built on the real page, where I pick one, leave a note, or ask to see more.',
        'My notes count as much as my picks. On the hero, I didn’t like any of the idle loops, so I wrote what I wanted instead. Round two was built from that note, and it’s what plays on my home page now. Have a go below.',
      ),
      statement('If I didn’t pick it, ', 'it doesn’t ship.'),
    ],
    'story-picker',
  ),
  section('sessions', 'Nine agents, one director', 'What it’s like to run', [
    body(
      'On my busiest afternoon I had nine agents going at once. I’d check the sidebar the way you’d look around a studio: who’s working, who’s waiting, who’s stuck on me.',
      'When one reports back, it leads with a single line. Done, ready, stuck, or the one thing it wants from me. I answer and it carries on.',
    ),
    {
      __typename: `${T}StudioBoard`,
      cards: [
        { title: 'designbyalex.dev master', role: 'Master', column: 'working' },
        { title: 'pilot done #108 (ADR PR #156)', role: '', column: 'working' },
        { title: '#15 Cutover prep', role: 'Side worker', column: 'working' },
        { title: 'AFK dashboard autostart', role: 'Side worker', column: 'working' },
        { title: '#124 Post-cutover case studies', role: '', column: 'working' },
        { title: '#108 Hero animatic', role: 'Writer', column: 'waiting' },
        { title: '#46 AFK polish batch', role: 'Writer', column: 'waiting' },
        { title: 'AFK checks and Tina ports', role: 'Side worker', column: 'blocked' },
        { title: 'Reference cache', role: 'Side worker', column: 'blocked' },
      ],
    },
    statement('I check in, unblock, ', 'and get out of the way.'),
  ]),
  section('batches', 'Built while I was away', 'Unattended batches', [
    body(
      'About half the hours on this rebuild happened while I wasn’t there. I’d mark a set of tickets ready and a loop would take them one at a time: build it, check it, move on. The dashboard below showed me what it was up to.',
      'Seven batches, 36 tickets. I reviewed each batch once at the end, on one page with Accept or Needs work next to every change.',
    ),
    {
      __typename: `${T}BatchDashboard`,
      title: 'Batch #81',
      status: 'Running',
      stats: [
        { value: '8 / 14', label: 'tickets done' },
        { value: '34m', label: 'per ticket' },
        { value: '3h 24m', label: 'left' },
        { value: '$128.72', label: 'agent cost' },
      ],
      done: 8,
      total: 14,
      running: '#62 Case-study opening',
      runningNote: 'attempt 2',
      calls: [
        { tool: 'Read', target: 'components/case-study/project-overview.tsx' },
        { tool: 'Read', target: 'tina/collection/project.ts' },
        { tool: 'Edit', target: 'tina/collection/project.ts' },
        { tool: 'Edit', target: 'components/case-study/project-overview.tsx' },
        { tool: 'Bash', target: 'scripts/afk/check.sh --ticket 62' },
      ],
      queue: [
        { number: '#63', title: 'Case-study ending' },
        { number: '#64', title: 'MOS videos + video block' },
        { number: '#65', title: 'MOS Urban body' },
      ],
      queueMore: 'and 2 more',
    },
    statement('Half the work happened ', 'while I was away.'),
  ]),
  section(
    'hero-piece',
    'The Hero piece',
    'Directing, not doing',
    [
      body(
        'I can’t do 3D. So I directed it. An agent did all the Blender work in six steps, and nothing moved on until I’d signed off the step before.',
        'I picked green glass and a tight crop, sent the idle loop back with a note, and tuned the last details myself in panels like the ones below.',
      ),
      statement(
        '“Looks better. Go with it. Render the animation, plug it into the page. ',
        'Let’s get this shit built, merged and live on prod.”',
      ),
    ],
    'tuner-panels',
  ),
];

export default function LivePiecesPreview() {
  if (process.env.VERCEL_ENV === 'production') notFound();
  return (
    <main className='min-h-screen bg-background py-16 text-foreground'>
      <JumpToHash />
      <div className='mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 lg:px-6 xl:px-12'>
        <nav aria-label='Pieces' className='flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted-foreground'>
          {SECTIONS.map((data) => (
            <a key={data.sectionId} href={`#${data.sectionId}`} className='hover:text-foreground'>
              {data.heading}
            </a>
          ))}
        </nav>
        <ThemeToggle />
      </div>
      {/* An anchor per Section, so review links can jump to each piece (#studio, #taste, #sessions, #batches, #hero-piece). */}
      {SECTIONS.map((data) => (
        <div key={data.sectionId} id={data.sectionId ?? undefined} className='scroll-mt-16'>
          <CaseStudySection data={data} />
        </div>
      ))}
    </main>
  );
}
