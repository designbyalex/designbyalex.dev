'use client';
import { useId, useState } from 'react';
import { MARK_PATH } from './mark-path';
import './live-pieces.css';

/**
 * The tuner panels (#191, "The Hero piece"): the two panels Alex fine-tuned the home page with, side by side
 * (round 3), rebuilt in the site's tokens. Hero glass (tint, roughness, IOR, key light) and home drip
 * (gooiness, blob lead, wobble rate, sheet speed), each with live sliders, a preview and Reset.
 *
 * The previews are stand-ins drawn in the browser (Alex's call, 16 Nov): the hero is a Blender render and
 * the drip a WebGL shader, and neither re-renders here. The defaults are the shipped values: the glass from
 * the Hero piece scene script (`hero-piece/build_scene.py`: floor tint hue 145°, roughness 0.02, IOR 1.45,
 * sun 10), the drip from its tuner preset (`scroll-drip-canvas.tsx`: goo 85, lead 0.8, wobble at its preset
 * rate, the sheet at half the scroll). Reset returns to them.
 *
 * The server HTML has both panels at their defaults, readable without JavaScript. Under reduced motion the
 * drip preview holds still; the sliders still change it.
 */

type Control = { key: string; label: string; min: number; max: number; step: number; value: number; unit?: string; digits: number };

const GLASS: Control[] = [
  { key: 'tint', label: 'Tint', min: 100, max: 190, step: 1, value: 145, unit: '°', digits: 0 },
  { key: 'roughness', label: 'Roughness', min: 0, max: 0.5, step: 0.01, value: 0.02, digits: 2 },
  { key: 'ior', label: 'IOR', min: 1, max: 2, step: 0.01, value: 1.45, digits: 2 },
  { key: 'key', label: 'Key light', min: 0, max: 20, step: 0.5, value: 10, digits: 1 },
];

const DRIP: Control[] = [
  { key: 'goo', label: 'Gooiness', min: 20, max: 150, step: 1, value: 85, digits: 0 },
  { key: 'lead', label: 'Blob lead', min: 0, max: 1.25, step: 0.05, value: 0.8, digits: 2 },
  { key: 'wobble', label: 'Wobble rate', min: 0, max: 3, step: 0.1, value: 1, unit: '×', digits: 1 },
  { key: 'sheet', label: 'Sheet speed', min: 0.1, max: 1, step: 0.05, value: 0.5, digits: 2 },
];

/** React's ids carry colons, which an SVG `url(#…)` reference can't always resolve. */
const svgId = (id: string) => `live${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;

const defaults = (controls: Control[]) => Object.fromEntries(controls.map((c) => [c.key, c.value])) as Record<string, number>;

/** The drip's blobs under the sheet: x, y and radius in the preview's 320 × 180 box. */
const BLOBS = [
  [40, 70, 16],
  [86, 82, 11],
  [128, 66, 20],
  [176, 88, 12],
  [214, 72, 17],
  [262, 84, 13],
  [296, 68, 10],
] as const;

export function TunerPanels() {
  return (
    <div className='@container w-full'>
      <div className='grid grid-cols-1 gap-2 @[45rem]:grid-cols-2'>
        <Panel title='Hero glass' controls={GLASS} preview={(v) => <GlassPreview v={v} />} />
        <Panel title='Home drip' controls={DRIP} preview={(v) => <DripPreview v={v} />} />
      </div>
    </div>
  );
}

export default TunerPanels;

function Panel({ title, controls, preview }: { title: string; controls: Control[]; preview: (v: Record<string, number>) => React.ReactNode }) {
  const [values, setValues] = useState(() => defaults(controls));
  const id = useId();
  return (
    <section aria-label={title} className='grid content-start gap-3.5 rounded-[20px] bg-card p-[18px]'>
      <div className='flex items-baseline justify-between'>
        <h3 className='text-base text-foreground'>{title}</h3>
        <button type='button' className='text-[13px] text-emphasis hover:underline' onClick={() => setValues(defaults(controls))}>
          Reset
        </button>
      </div>
      <div className='relative aspect-video overflow-hidden rounded-[14px] bg-background [background-image:radial-gradient(90%_120%_at_70%_40%,color-mix(in_srgb,var(--color-emphasis)_38%,transparent),transparent_80%)]'>
        {preview(values)}
      </div>
      <div className='grid gap-2.5'>
        {controls.map((c) => {
          const inputId = `${id}-${c.key}`;
          const v = values[c.key];
          return (
            <div key={c.key} className='grid grid-cols-[1fr_auto] items-center gap-x-2.5 gap-y-1 text-[13px] text-foreground-soft'>
              <label htmlFor={inputId}>{c.label}</label>
              <output htmlFor={inputId} className='text-muted-foreground tabular-nums'>
                {v.toFixed(c.digits)}
                {c.unit}
              </output>
              <input
                id={inputId}
                type='range'
                min={c.min}
                max={c.max}
                step={c.step}
                value={v}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setValues((prev) => ({ ...prev, [c.key]: next }));
                }}
                className='col-span-2 m-0 w-full accent-emphasis'
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** The glass A over a striped backdrop: the stripes bend inside the mark with IOR and soften with roughness. */
function GlassPreview({ v }: { v: Record<string, number> }) {
  const clip = svgId(useId());
  const stripes = Array.from({ length: 13 }, (_, i) => 16 + i * 24);
  const bend = 1 + (v.ior - 1) * 0.9;
  const blur = `blur(${(v.roughness * 14).toFixed(2)}px)`;
  const light = 0.55 + v.key / 22;
  return (
    <svg viewBox='0 0 320 180' className='absolute inset-0 size-full' aria-hidden='true'>
      <defs>
        <clipPath id={clip}>
          <path d={MARK_PATH} transform='translate(116 54) scale(2.5)' />
        </clipPath>
      </defs>
      <g stroke='var(--color-emphasis)' strokeOpacity='0.35' strokeWidth='3' style={{ filter: blur }}>
        {stripes.map((x) => (
          <line key={x} x1={x} x2={x} y1='0' y2='180' />
        ))}
      </g>
      <g clipPath={`url(#${clip})`}>
        <rect x='0' y='0' width='320' height='180' fill={`hsl(${v.tint} 70% 55% / 0.35)`} />
        <g
          stroke={`hsl(${v.tint} 80% 80%)`}
          strokeOpacity='0.7'
          strokeWidth='3'
          style={{ filter: blur, transform: `scale(${bend.toFixed(3)}, 1)`, transformOrigin: '160px 95px' }}
        >
          {stripes.map((x) => (
            <line key={x} x1={x} x2={x} y1='0' y2='180' />
          ))}
        </g>
      </g>
      <path
        d={MARK_PATH}
        transform='translate(116 54) scale(2.5)'
        fill='none'
        stroke={`hsl(${v.tint} 85% 75%)`}
        strokeOpacity={Math.min(1, 0.25 + light * 0.4)}
        strokeWidth='0.35'
      />
      <ellipse cx='138' cy='66' rx='24' ry='5' fill='white' opacity={Math.min(0.9, v.key / 22)} transform='rotate(-24 138 66)' />
    </svg>
  );
}

/** The drip's sheet and blobs, merged by a goo filter whose blur follows gooiness. */
function DripPreview({ v }: { v: Record<string, number> }) {
  const goo = svgId(useId());
  const wobble = v.wobble > 0 ? `${(2.6 / v.wobble).toFixed(2)}s` : '0s';
  return (
    <svg
      viewBox='0 0 320 180'
      className='live-drip absolute inset-0 size-full'
      aria-hidden='true'
      style={{ '--live-wobble': wobble, '--live-sheet': `${(1.75 / v.sheet).toFixed(2)}s` } as React.CSSProperties}
    >
      <defs>
        <filter id={goo}>
          <feGaussianBlur in='SourceGraphic' stdDeviation={(v.goo / 9.5).toFixed(2)} />
          <feColorMatrix values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9' />
        </filter>
      </defs>
      <g filter={`url(#${goo})`} fill='var(--color-emphasis)'>
        <g className='live-drip-sheet'>
          <rect x='-10' y='-10' width='340' height='62' />
          <g style={{ transform: `translateY(${(v.lead * 26).toFixed(1)}px)` }}>
            {BLOBS.map(([x, y, r], i) => (
              <circle key={x} cx={x} cy={y} r={r} className='live-drip-blob' style={{ animationDelay: `${-0.8 * i}s` }} />
            ))}
          </g>
        </g>
      </g>
    </svg>
  );
}
