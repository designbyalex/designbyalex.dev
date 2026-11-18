import React, { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface SectionProps extends React.HTMLProps<HTMLElement> {
  /** Stable Section id, rendered as `data-section` on the root. */
  sectionId?: string;
  /** Classes for the root `data-section` element itself (the `className` goes on the inner `section`). */
  rootClassName?: string;
  children: ReactNode;
}

export const Section: React.FC<SectionProps> = ({ className, rootClassName, children, sectionId, ...props }) => {
  return (
    <div className={cn("bg-default", rootClassName)} data-section={sectionId}>
      <section
        className={cn("py-12 mx-auto max-w-7xl px-6", className)}
        {...props}
      >
        {children}
      </section>
    </div>
  );
};
