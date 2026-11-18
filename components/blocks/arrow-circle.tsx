import { ArrowRight } from 'lucide-react';

/**
 * The 40px green arrow circle beside a text link (the header's "Let's talk", the 404's "Back to home", the
 * case-study ending's Calendly link). Reference hover: the circle grows 40→44px and the arrow rolls out to the
 * right as a second one enters from the left. The sitewide reduced-motion rule makes both instant.
 *
 * The arrow is black on the green circle in both themes (#89 sign-off; the Reference's white is a deliberate
 * departure). It reacts to the nearest `group`, so the link around it carries that class.
 */
export function ArrowCircle() {
  return (
    <span
      aria-hidden
      className='relative size-10 shrink-0 overflow-hidden rounded-full bg-primary text-primary-foreground transition-transform duration-500 ease-hover-link group-hover:scale-110 group-focus-visible:scale-110'
    >
      <ArrowRight
        strokeWidth={1.6}
        className='absolute inset-0 m-auto size-6 transition-transform duration-500 ease-hover-link group-hover:translate-x-10 group-focus-visible:translate-x-10'
      />
      <ArrowRight
        strokeWidth={1.6}
        className='absolute inset-0 m-auto size-6 -translate-x-10 transition-transform duration-500 ease-hover-link group-hover:translate-x-0 group-focus-visible:translate-x-0'
      />
    </span>
  );
}
