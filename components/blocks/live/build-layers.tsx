import { cn } from '@/lib/utils';
import Image from 'next/image';

/**
 * The build layers (#133, FireBootCamp's second Section): the home page as two stacked planes, a block wireframe
 * under the live site, as Alex signed it off (picker round 4) and then picked the real page for the upper layer
 * (round 3 of the FireBootCamp picks). The wireframe is drawn in the site's tokens, so it follows the theme; the
 * live site is a capture of firebootcamp.com on the same 1440 x 1210 artboard. From 700px of container the
 * planes tilt and overlap; below that they stack flat, wireframe first.
 *
 * Static and server-rendered, so it is at rest from first paint with nothing for reduced motion to stop.
 */

/** Block fills, faintest to strongest: the wireframe's only four tones. */
const TONE = {
  page: 'fill-background',
  block: 'fill-accent',
  line: 'fill-muted-foreground/70 dark:fill-muted-foreground/45',
  strong: 'fill-muted-foreground',
} as const;

type Tone = keyof typeof TONE;
type Block = readonly [x: number, y: number, width: number, height: number, radius: number, tone: Tone];

const WIREFRAME: readonly Block[] = [
  [0, 0, 1440, 1210, 0, 'page'],
  // Nav
  [70, 20, 70, 32, 8, 'line'],
  [172, 30, 72, 12, 6, 'line'],
  [277, 30, 58, 12, 6, 'line'],
  [368, 30, 44, 12, 6, 'line'],
  [444, 30, 96, 12, 6, 'line'],
  [1244, 14, 133, 44, 10, 'strong'],
  // Four course links
  [66, 114, 22, 22, 5, 'line'],
  [100, 116, 190, 17, 6, 'line'],
  [100, 147, 236, 10, 5, 'block'],
  [100, 171, 236, 10, 5, 'block'],
  [100, 195, 60, 10, 5, 'block'],
  [402, 114, 22, 22, 5, 'line'],
  [436, 116, 190, 17, 6, 'line'],
  [436, 147, 236, 10, 5, 'block'],
  [436, 171, 190, 10, 5, 'block'],
  [738, 114, 22, 22, 5, 'line'],
  [772, 116, 190, 17, 6, 'line'],
  [772, 147, 236, 10, 5, 'block'],
  [772, 171, 190, 10, 5, 'block'],
  [1074, 114, 22, 22, 5, 'line'],
  [1108, 116, 190, 17, 6, 'line'],
  [1108, 147, 236, 10, 5, 'block'],
  [1108, 171, 190, 10, 5, 'block'],
  // Announcement strip
  [0, 251, 1440, 59, 0, 'block'],
  [532, 275, 240, 12, 6, 'line'],
  [782, 275, 126, 12, 6, 'strong'],
  // Hero
  [0, 310, 1440, 900, 0, 'block'],
  [65, 450, 410, 62, 8, 'line'],
  [65, 534, 466, 62, 8, 'line'],
  [65, 618, 412, 62, 8, 'line'],
  [65, 702, 218, 62, 8, 'line'],
  [595, 660, 250, 200, 24, 'line'],
  [760, 918, 566, 14, 7, 'line'],
  [760, 948, 598, 14, 7, 'line'],
  [760, 978, 426, 14, 7, 'line'],
  [760, 1035, 139, 47, 10, 'strong'],
  [915, 1035, 146, 47, 10, 'line'],
];

const Wireframe = () => (
  <svg viewBox='0 0 1440 1210' role='img' aria-label='A block wireframe of the FireBootCamp home page' className='block h-auto w-full'>
    {WIREFRAME.map(([x, y, width, height, rx, tone]) => (
      <rect key={`${x}-${y}-${width}`} x={x} y={y} width={width} height={height} rx={rx} className={TONE[tone]} />
    ))}
    {/* The image placeholder's sun and hills, cut out of its block. */}
    <circle cx='688' cy='716' r='19' className={TONE.block} />
    <path d='M632 822 L676 760 Q682 754 688 760 L703 780 L738 736 Q747 727 756 736 L808 812 Q812 822 802 822 Z' className={TONE.block} />
  </svg>
);

/** The upper layer: the live home page at firebootcamp.com, captured at 1440 wide and cropped to the wireframe's artboard. */
const LiveSite = () => (
  <Image
    src='/uploads/firebootcamp/final-home.webp'
    alt='The FireBootCamp home page as it looks live, with its headline over a dark photo of developers at a table'
    width={2850}
    height={2394}
    sizes='(min-width: 1024px) 560px, 100vw'
    className='block h-auto w-full'
  />
);

const CHIP = 'inline-flex h-6 items-center rounded-full px-2.5 font-mono text-[11px] leading-none uppercase';
const LAYER = 'overflow-hidden rounded-[20px] shadow-[0_0_0_1px_var(--color-border),0_30px_60px_rgb(0_0_0/0.28)]';
const PLANE =
  '@[43.75rem]:absolute @[43.75rem]:top-1/2 @[43.75rem]:left-1/2 @[43.75rem]:mt-[calc(-300*var(--u))] @[43.75rem]:ml-[calc(-280*var(--u))] @[43.75rem]:w-[calc(560*var(--u))]';

const BuildLayers = () => (
  <div className='@container w-full'>
    <figure className='grid justify-items-center gap-3 overflow-hidden rounded-[20px] bg-card p-6'>
      <div
        className={cn(
          'grid w-full gap-3 [--u:min(1px,calc(100cqw/1184))]',
          '@[43.75rem]:relative @[43.75rem]:block @[43.75rem]:h-[calc(720*var(--u))] @[43.75rem]:[perspective:calc(2000*var(--u))]'
        )}
      >
        <div className={cn(PLANE, '@[43.75rem]:[transform:translate3d(calc(-215*var(--u)),calc(120*var(--u)),0)_rotateX(50deg)_rotateZ(-30deg)]')}>
          <div className={cn(LAYER, 'bg-background')}>
            <Wireframe />
          </div>
        </div>
        <div className={cn(PLANE, '@[43.75rem]:[transform:translate3d(calc(215*var(--u)),calc(-50*var(--u)),0)_rotateX(50deg)_rotateZ(-30deg)]')}>
          <div className={cn(LAYER, 'bg-card')}>
            <LiveSite />
          </div>
        </div>
      </div>
      <figcaption className='relative z-10 flex items-center gap-2.5 text-caption text-muted-foreground'>
        <span className={cn(CHIP, 'shadow-[inset_0_0_0_1px_var(--color-border)]')}>Wireframe</span>
        <span aria-hidden>→</span>
        <span className={cn(CHIP, 'bg-emphasis text-background')}>Live site</span>
      </figcaption>
    </figure>
  </div>
);

export default BuildLayers;
