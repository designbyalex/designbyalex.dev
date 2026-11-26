'use client';
import { animate, useInView, useReducedMotion } from 'motion/react';
import { type AnimationEvent, type CSSProperties, useEffect, useRef, useState } from 'react';
import { useHydrated } from '../../motion-primitives/use-hydrated';
import './savings-glance.css';

/**
 * Savings at a glance (#136): three of Acacia's dashboard cards, rebuilt as live UI under the design system
 * image in /acacia's What's next, as Alex signed them off in the element picker rounds (26 Nov 2026).
 *
 * - Copy is Alex's, as written on his Acacia Figma page and concept files. Styling follows Acacia's own rules
 *   from that page: uppercase tracked tags, SemiBold titles, Medium body at 50% white, Acacia green and the
 *   product's flat card (see savings-glance.css).
 * - Motion: once, as the piece scrolls in, the cards rise in turn, the figures count up and the chart lines
 *   draw, then everything rests. It is CSS keyed on `data-sg`, triggered by `useInView` like SettleReveal.
 * - The server HTML is the piece at rest with its final figures, so it reads the same without JavaScript and
 *   under reduced motion, where it rests from first paint.
 */

const COUNT_SECONDS = 1.4;

/** A figure that counts up from 0 to `end` once `play` turns on. Renders `end` until it can animate. */
function Figure({ end, play }: { end: number; play: boolean }) {
  const hydrated = useHydrated();
  const reduced = useReducedMotion() ?? false;
  const animates = hydrated && !reduced;
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!animates || !play) return;
    const controls = animate(0, end, {
      duration: COUNT_SECONDS,
      ease: (t) => 1 - (1 - t) ** 3,
      onUpdate: setValue,
      onComplete: () => setValue(end),
    });
    return () => controls.stop();
  }, [animates, play, end]);

  const shown = animates ? value : end;
  return <span className='sg-figure'>{shown.toFixed(2)}</span>;
}

const Leaf = () => (
  <svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
    <path d='M20 4C10 4 4 9 4 17c0 1 .1 2 .3 3C6 13 11 9 17 8c-5 3-8 7-9 12h2c1-5 5-9 10-11V4z' />
  </svg>
);

export default function SavingsGlance() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  // Once the chart has drawn, the piece goes 'done' and its parts are plain again.
  const [done, setDone] = useState(false);
  const onAnimationEnd = (event: AnimationEvent) => {
    if (event.animationName === 'sg-draw') setDone(true);
  };

  return (
    <div className='sg-host'>
      <div ref={ref} className='sg' data-sg={done ? 'done' : inView ? 'play' : ''} onAnimationEnd={onAnimationEnd}>
        <span className='sg-orb sg-orb-1' aria-hidden='true' />
        <span className='sg-orb sg-orb-2' aria-hidden='true' />
        <span className='sg-orb sg-orb-3' aria-hidden='true' />
        <span className='sg-hills' aria-hidden='true' />

        <div className='sg-cards'>
          <div className='sg-card sg-health' style={{ '--i': 0 } as CSSProperties}>
            <p className='sg-tag'>Energy health</p>
            <p className='sg-big'>
              <Figure end={809.63} play={inView} />
              <span className='sg-unit'>kWh</span>
            </p>
            <div className='sg-split'>
              <div>
                <span className='sg-tag sg-peak'>Peak</span>
                <b>
                  173 <span className='sg-unit'>kWh</span>
                </b>
              </div>
              <div>
                <span className='sg-tag sg-offpeak'>Off-peak</span>
                <b>
                  63 <span className='sg-unit'>kWh</span>
                </b>
              </div>
              <div>
                <span className='sg-tag sg-shoulder'>Shoulder</span>
                <b>
                  29 <span className='sg-unit'>kWh</span>
                </b>
              </div>
            </div>
            <svg className='sg-chart' viewBox='0 0 300 90' preserveAspectRatio='none' aria-hidden='true'>
              <polyline className='sg-line sg-line-peak' pathLength={1} points='0,86 40,70 80,64 120,62 160,48 200,30 240,22 270,12 300,2' />
              <polyline className='sg-line sg-line-offpeak' pathLength={1} points='0,86 30,50 70,40 100,48 140,34 180,30 220,28 300,26' />
              <polyline className='sg-line sg-line-shoulder' pathLength={1} points='0,88 40,88 70,80 110,76 150,78 190,70 220,64 250,52' />
            </svg>
          </div>

          <div className='sg-card sg-save' style={{ '--i': 1 } as CSSProperties}>
            <p className='sg-title'>
              You could save <span className='sg-green'>$10.65 every month.</span>
            </p>
            <p className='sg-body'>Move 30% of your usage from peak to off-peak and save $10.65 every month or $127.80 yearly.</p>
            <span className='sg-pill'>
              Explore other ways to save <span aria-hidden='true'>→</span>
            </span>
          </div>

          <div className='sg-card sg-insight' style={{ '--i': 2 } as CSSProperties}>
            <p className='sg-tag sg-green'>Insights</p>
            <p className='sg-big'>
              <span className='sg-green'>+</span>$<Figure end={78.44} play={inView} />
            </p>
            <p className='sg-tag sg-green'>Est. savings</p>
            <hr />
            <p className='sg-plan'>
              Residential Plan
              <span className='sg-leaves'>
                <Leaf />
                <Leaf />
                <Leaf />
              </span>
            </p>
            <p className='sg-body'>A Green Energy Provider</p>
          </div>
        </div>
      </div>
    </div>
  );
}
