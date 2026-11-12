'use client';
import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import { createContext, type ReactNode, useContext, useState } from 'react';
import { statusDotClasses, statusLabels } from '@/components/case-study/project-hero';
import { TransitionLink } from '@/components/motion-primitives/route-transitions';
import { cn } from '@/lib/utils';

export interface NotFoundProject {
  title: string;
  href: string;
  status?: string;
  image?: { src: string; alt: string };
}

/*
 * The 404's row hover (#93, owner pick 2026-11-12, "preview takes the mark's place"):
 * hovering or focusing a project row shows that project's home thumbnail over the
 * right half, where the mark outline fades out. Desktop only (lg and up), mouse or
 * keyboard; touch taps go straight to the link. Under reduced motion the sitewide
 * rule makes the fades instant, so the preview simply appears.
 */
interface Preview {
  active: string | null;
  setActive: (href: string | null) => void;
}

const PreviewContext = createContext<Preview>({ active: null, setActive: () => {} });

/** The 404 section, carrying `data-previewing` for the mark while a row is hovered or focused. */
export function NotFoundStage({ className, children }: { className?: string; children: ReactNode }) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <PreviewContext.Provider value={{ active, setActive }}>
      <div data-section='not-found' data-previewing={active ? 'true' : undefined} className={cn('group/nf', className)}>
        {children}
      </div>
    </PreviewContext.Provider>
  );
}

/** The thumbnails, stacked over the right half; the active one fades and rises in. */
export function ProjectPreviews({ projects }: { projects: NotFoundProject[] }) {
  const { active } = useContext(PreviewContext);
  return (
    <div aria-hidden className='pointer-events-none absolute top-[calc(50%-175px)] right-24 hidden h-[349px] w-[560px] lg:block'>
      {projects.map((project) =>
        project.image ? <PreviewCard key={project.href} project={project} image={project.image} on={active === project.href} /> : null
      )}
    </div>
  );
}

function PreviewCard({ project, image, on }: { project: NotFoundProject; image: { src: string; alt: string }; on: boolean }) {
  const status = project.status ?? '';
  return (
    <div
      data-on={on}
      className='absolute inset-0 translate-y-4 overflow-hidden rounded-[20px] opacity-0 transition-[opacity,translate] duration-500 ease-hover-link data-[on=true]:translate-y-0 data-[on=true]:opacity-100'
    >
      <Image src={image.src} alt='' fill sizes='560px' className='object-cover' />
      {status && (
        <span className='absolute top-4 left-4 z-10 inline-flex h-[30px] items-center gap-2 rounded-full border border-on-image/15 bg-scrim/60 px-[13px] font-mono text-mono text-on-image uppercase shadow-glass-photo glass-blur-photo'>
          <span className={cn('size-2 rounded-full', statusDotClasses[status] ?? 'bg-primary')} />
          {statusLabels[status] ?? status}
        </span>
      )}
    </div>
  );
}

/** One project row: the title nudges right and the arrow rolls out and back in, and the preview follows it. */
export function ProjectRow({ project, last }: { project: NotFoundProject; last: boolean }) {
  const { setActive } = useContext(PreviewContext);
  return (
    <TransitionLink
      href={project.href}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(project.href)}
      onPointerLeave={() => setActive(null)}
      onFocus={() => setActive(project.href)}
      onBlur={() => setActive(null)}
      className={cn(
        'group flex items-center justify-between gap-4 border-t border-border py-3.5 text-body text-foreground transition-colors hover:text-emphasis',
        last && 'border-b'
      )}
    >
      <span className='transition-transform duration-500 ease-hover-link group-hover:translate-x-2 group-focus-visible:translate-x-2'>{project.title}</span>
      <span aria-hidden className='relative size-5 shrink-0 overflow-hidden text-emphasis'>
        <ArrowUpRight
          strokeWidth={2}
          className='absolute inset-0 size-5 transition-transform duration-500 ease-hover-link group-hover:translate-x-5 group-hover:-translate-y-5 group-focus-visible:translate-x-5 group-focus-visible:-translate-y-5'
        />
        <ArrowUpRight
          strokeWidth={2}
          className='absolute inset-0 size-5 -translate-x-5 translate-y-5 transition-transform duration-500 ease-hover-link group-hover:translate-x-0 group-hover:translate-y-0 group-focus-visible:translate-x-0 group-focus-visible:translate-y-0'
        />
      </span>
    </TransitionLink>
  );
}
