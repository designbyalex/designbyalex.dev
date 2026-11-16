'use client';
import { useEffect } from 'react';

/**
 * Review links into this preview (`…/live-pieces#batches`) should land on their Section. The smooth scroll
 * starts at the top of a fresh page, so once it has settled this jumps to the hash, and again on every hash
 * change from the links at the top.
 */
export function JumpToHash() {
  useEffect(() => {
    const jump = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (id) document.getElementById(id)?.scrollIntoView({ block: 'start' });
    };
    const timer = window.setTimeout(jump, 400);
    window.addEventListener('hashchange', jump);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('hashchange', jump);
    };
  }, []);
  return null;
}
