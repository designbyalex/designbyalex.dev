import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import { cn } from '@/lib/utils';
import type { ProjectBlocksCaseStudySectionBlocksStudioBoard } from '@/tina/__generated__/types';

/**
 * The studio board (#191, "Nine agents, one director"): the sessions Alex had going at once, as cards in
 * Working / Waiting / Blocked columns, the way he reads the app's sidebar. Alex's picks: those three column
 * names (round 2, never "needs me"), the right column of its Section (round 6), the columns stacked on phones.
 *
 * Static and server-rendered. The only motion is the Working dot's pulse, which reduced motion stops.
 */

type Board = ProjectBlocksCaseStudySectionBlocksStudioBoard;
type Card = NonNullable<NonNullable<Board['cards']>[number]>;

const COLUMNS = [
  { id: 'working', name: 'Working', dot: 'bg-emphasis motion-safe:animate-pulse' },
  { id: 'waiting', name: 'Waiting', dot: 'bg-muted-foreground' },
  { id: 'blocked', name: 'Blocked', dot: 'bg-status-in-development' },
] as const;

export const StudioBoard = ({ data }: { data: Board }) => {
  const cards = (data.cards?.filter(Boolean) ?? []) as Card[];
  return (
    <div className='@container w-full' data-tina-field={tinaField(data, 'cards')}>
      <div className='grid grid-cols-1 gap-2 @[30rem]:grid-cols-3'>
        {COLUMNS.map((column) => {
          const inColumn = cards.filter((card) => (card.column || 'working') === column.id);
          return (
            <section key={column.id} aria-label={column.name} className='grid content-start gap-1.5 rounded-2xl bg-card p-3'>
              <h3 className='flex items-center gap-2 px-1 pt-0.5 pb-1.5 text-caption text-foreground-soft'>
                <span aria-hidden className={cn('size-2 rounded-full', column.dot)} />
                {column.name}
                <span className='ml-auto text-muted-foreground'>{inColumn.length}</span>
              </h3>
              {inColumn.map((card, i) => (
                <p
                  key={i}
                  className='grid gap-0.5 rounded-[10px] bg-background px-3 py-2.5 text-[13px] leading-[1.4] tracking-[-0.01em] text-foreground-soft dark:bg-accent'
                  data-tina-field={tinaField(card)}
                >
                  {card.title}
                  {card.role && <span className='text-xs text-muted-foreground'>{card.role}</span>}
                </p>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
};

export const studioBoardTemplate: Template = {
  name: 'studioBoard',
  label: 'Studio board',
  ui: { defaultItem: { cards: [{ title: 'Session title', role: 'Writer', column: 'working' }] } },
  fields: [
    {
      type: 'object',
      name: 'cards',
      label: 'Sessions',
      list: true,
      description: 'One card per session, in the column it sat in. Portfolio sessions only: no client work, no transcript text.',
      ui: { itemProps: (item: { title?: string }) => ({ label: item?.title || 'Session' }) },
      fields: [
        { type: 'string', name: 'title', label: 'Title', description: 'The session’s title, without its emojis.' },
        { type: 'string', name: 'role', label: 'Role', description: 'Grey, under the title: Master, Writer, Side worker.' },
        {
          type: 'string',
          name: 'column',
          label: 'Column',
          options: [
            { label: 'Working', value: 'working' },
            { label: 'Waiting', value: 'waiting' },
            { label: 'Blocked', value: 'blocked' },
          ],
        },
      ],
    },
  ],
};
