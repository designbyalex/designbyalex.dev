import { cn } from '@/lib/utils';

/**
 * The build layers (#133, FireBootCamp's "The build"): the home page as two stacked planes, a block wireframe
 * under the finished design, as Alex signed it off (picker round 4). Both layers are drawn in the site's tokens
 * on the design's own 1440 x 1210 artboard, so they scale as one and follow the theme. From 700px of container
 * the planes tilt and overlap; below that they stack flat, wireframe first.
 *
 * The hero is a neutral block on purpose: the design's hero photo shows real people and stays out until SSW agrees.
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

const NAV_LINKS = [
  { label: 'Program', x: 555 },
  { label: 'Pricing', x: 660 },
  { label: 'FAQs', x: 751 },
  { label: 'Courses & Events', x: 827 },
];

const COURSES = [
  { x: 66, title: '1-Day Dev Superpowers', lines: ['One day seminars where you', 'watch our developers build an app', 'live.'] },
  { x: 402, title: '2-Day Workshops', lines: ['Two day workshops where you get', 'your hands dirty and build an app.'] },
  { x: 738, title: 'SSW Internship', lines: ['We’ll cover your fee for SSW’s', 'FireBootCamp completely.'] },
  { x: 1074, title: 'Something Else?', lines: ['Explore our full list of courses and', 'events at SSW.'] },
];

const HERO_BODY = [
  'After 12-weeks of intense training you will emerge as a',
  'professional fullstack developer. Master enterprise-grade',
  'technologies and transform your potential into a powerful',
  'technical skill set, ready for real-world challenges.',
];

const ApplyButton = ({ x, y, height }: { x: number; y: number; height: number }) => (
  <>
    <rect x={x} y={y} width={133} height={height} rx={10} className='fill-emphasis' />
    <text x={x + 66.5} y={y + height / 2 + 7} textAnchor='middle' fontSize={19} fontWeight={500} className='fill-background'>
      Apply now
    </text>
  </>
);

const Mockup = () => (
  <svg
    viewBox='0 0 1440 1210'
    role='img'
    aria-label='The finished FireBootCamp home page design, with a neutral block in place of the hero photo'
    className='block h-auto w-full font-sans'
  >
    <rect width='1440' height='1210' className='fill-card' />

    {/* Nav */}
    <text x={65} y={48} fontSize={25} letterSpacing={-0.5} className='fill-foreground'>
      <tspan fontWeight={600} className='fill-emphasis'>
        SSW
      </tspan>
      FireBootCamp
    </text>
    {NAV_LINKS.map((link) => (
      <text key={link.label} x={link.x} y={47} fontSize={19} className='fill-foreground-soft'>
        {link.label}
      </text>
    ))}
    <path d='M987 36 L993 42 L999 36' fill='none' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='stroke-foreground-soft' />
    <ApplyButton x={1244} y={14} height={44} />

    {/* Four course links */}
    {COURSES.map((course) => (
      <g key={course.title}>
        <rect x={course.x} y={115} width={20} height={20} rx={5} fill='none' strokeWidth='2' className='stroke-foreground-soft' />
        <text x={course.x + 34} y={132} fontSize={19} fontWeight={500} className='fill-foreground'>
          {course.title}
        </text>
        {course.lines.map((line, i) => (
          <text key={line} x={course.x + 34} y={158 + i * 24} fontSize={17} className='fill-muted-foreground'>
            {line}
          </text>
        ))}
      </g>
    ))}

    {/* Announcement strip */}
    <rect y='251' width='1440' height='59' className='fill-muted' />
    <rect y='251' width='1440' height='1' className='fill-border' />
    <text x={720} y={287} textAnchor='middle' fontSize={19} className='fill-foreground-soft'>
      Transform your tech career now{'  '}
      <tspan textDecoration='underline'>Start your path</tspan>
    </text>

    {/* Hero, on the neutral block that stands in for the photo */}
    <rect y='310' width='1440' height='900' className='fill-accent' />
    <rect y='310' width='1440' height='1' className='fill-border' />
    <g fontSize={84} letterSpacing={-2} className='fill-foreground'>
      <text x={65} y={512}>
        {'<'}
        <tspan className='fill-emphasis'>Code</tspan>
        {'> your way to a'}
      </text>
      <text x={65} y={608}>
        professional career in
      </text>
      <text x={65} y={704}>
        software development
      </text>
    </g>
    {HERO_BODY.map((line, i) => (
      <text key={line} x={816} y={905 + i * 30} fontSize={21} className='fill-foreground-soft'>
        {line}
      </text>
    ))}
    <ApplyButton x={816} y={1035} height={47} />
  </svg>
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
            <Mockup />
          </div>
        </div>
      </div>
      <figcaption className='relative z-10 flex items-center gap-2.5 text-caption text-muted-foreground'>
        <span className={cn(CHIP, 'shadow-[inset_0_0_0_1px_var(--color-border)]')}>Wireframe</span>
        <span aria-hidden>→</span>
        <span className={cn(CHIP, 'bg-emphasis text-background')}>Mockup</span>
      </figcaption>
    </figure>
  </div>
);

export default BuildLayers;
