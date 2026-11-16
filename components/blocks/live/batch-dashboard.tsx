import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import { cn } from '@/lib/utils';
import type { ProjectBlocksCaseStudySectionBlocksBatchDashboard } from '@/tina/__generated__/types';
import './live-pieces.css';

/**
 * The batch dashboard (#191, "Built while I was away"): the unattended loop's live dashboard, rebuilt in
 * the site's tokens as Alex picked it (round 2, Cards). Four stat cards, a progress bar (one segment per
 * ticket), the running ticket with its latest tool calls, and the queue. The figures and lines are the
 * loop's own record of a real batch (#81), entered in Tina.
 *
 * Server-rendered in full. The live dot and the running segment pulse, and the newest tool call fades in on
 * a loop; reduced motion stops all three.
 */

type Dashboard = ProjectBlocksCaseStudySectionBlocksBatchDashboard;

export const BatchDashboard = ({ data }: { data: Dashboard }) => {
  const stats = data.stats?.filter(Boolean) ?? [];
  const calls = data.calls?.filter(Boolean) ?? [];
  const queue = data.queue?.filter(Boolean) ?? [];
  const total = Math.max(0, Math.min(40, data.total ?? 0));
  const done = Math.max(0, Math.min(total, data.done ?? 0));

  return (
    <div className='@container w-full'>
      <div className='grid gap-4 rounded-[20px] bg-card p-5 text-caption'>
        <div className='flex items-baseline justify-between gap-3'>
          <p className='text-base text-foreground' data-tina-field={tinaField(data, 'title')}>
            {data.title}
          </p>
          {data.status && (
            <p className='inline-flex items-center gap-2 text-muted-foreground' data-tina-field={tinaField(data, 'status')}>
              <span aria-hidden className='size-2 rounded-full bg-emphasis motion-safe:animate-pulse' />
              {data.status}
            </p>
          )}
        </div>

        {stats.length > 0 && (
          <dl className='grid grid-cols-2 gap-2 @[47.5rem]:grid-cols-4'>
            {stats.map((stat, i) => (
              <div key={i} className='grid gap-0.5 rounded-[14px] bg-background px-4 py-3.5 dark:bg-accent' data-tina-field={tinaField(stat!)}>
                <dt className='order-2 text-[13px] text-muted-foreground'>{stat!.label}</dt>
                <dd className='order-1 font-display text-[28px] leading-[1.1] tracking-[-0.02em] text-foreground'>{stat!.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {total > 0 && (
          <div
            role='img'
            aria-label={`${done} of ${total} tickets done`}
            className='grid gap-[3px]'
            style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
            data-tina-field={tinaField(data, 'done')}
          >
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 rounded-[3px]',
                  i < done ? 'bg-emphasis' : i === done && data.running ? 'bg-foreground motion-safe:animate-pulse' : 'bg-background dark:bg-accent',
                )}
              />
            ))}
          </div>
        )}

        <div className='grid gap-4 @[47.5rem]:grid-cols-[1.3fr_1fr] @[47.5rem]:gap-6'>
          {data.running && (
            <div>
              <p className='pb-1.5 text-[13px] text-muted-foreground shadow-[0_1px_0_0_var(--color-border)]'>Now</p>
              <p className='pt-2 text-foreground' data-tina-field={tinaField(data, 'running')}>
                {data.running}
                {data.runningNote && <span className='text-muted-foreground'> · {data.runningNote}</span>}
              </p>
              {calls.length > 0 && (
                <ol className='grid gap-[3px] pt-2 text-[13px]' aria-label='Latest tool calls'>
                  {calls.map((call, i) => (
                    <li
                      key={i}
                      className={cn('grid grid-cols-[40px_minmax(0,1fr)] gap-2 text-foreground-soft', i === calls.length - 1 && 'live-call-in')}
                      data-tina-field={tinaField(call!)}
                    >
                      <span className='text-emphasis'>{call!.tool}</span>
                      <span className='truncate' title={call!.target ?? undefined}>
                        {call!.target}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
          {queue.length > 0 && (
            <div>
              <p className='pb-1.5 text-[13px] text-muted-foreground shadow-[0_1px_0_0_var(--color-border)]'>Up next</p>
              <ol>
                {queue.map((item, i) => (
                  <li
                    key={i}
                    className='grid grid-cols-[34px_minmax(0,1fr)] gap-2 py-[7px] text-[13px] text-foreground-soft shadow-[0_1px_0_0_var(--color-border)]'
                    data-tina-field={tinaField(item!)}
                  >
                    <span className='text-muted-foreground'>{item!.number}</span>
                    {item!.title}
                  </li>
                ))}
              </ol>
              {data.queueMore && (
                <p className='py-[7px] text-[13px] text-muted-foreground' data-tina-field={tinaField(data, 'queueMore')}>
                  {data.queueMore}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const batchDashboardTemplate: Template = {
  name: 'batchDashboard',
  label: 'Batch dashboard',
  fields: [
    { type: 'string', name: 'title', label: 'Title', description: 'Top left, e.g. Batch #81.' },
    { type: 'string', name: 'status', label: 'Status', description: 'Top right, after a green dot, e.g. Running. Leave empty for none.' },
    {
      type: 'object',
      name: 'stats',
      label: 'Stat cards',
      list: true,
      description: 'Up to four: two across on phones, four across when the dashboard is wide.',
      ui: { itemProps: (item: { value?: string; label?: string }) => ({ label: [item?.value, item?.label].filter(Boolean).join(' · ') || 'Stat' }) },
      fields: [
        { type: 'string', name: 'value', label: 'Value', description: 'As shown, e.g. 8 / 14, 34m, $128.72.' },
        { type: 'string', name: 'label', label: 'Label' },
      ],
    },
    { type: 'number', name: 'done', label: 'Tickets done', description: 'Green segments in the progress bar.' },
    { type: 'number', name: 'total', label: 'Tickets in the batch', description: 'One segment each. The one after the done ones pulses while a ticket runs.' },
    { type: 'string', name: 'running', label: 'Running ticket', description: 'Under Now, e.g. #62 Case-study opening. Leave empty to hide Now.' },
    { type: 'string', name: 'runningNote', label: 'Running note', description: 'Grey, after the ticket, e.g. attempt 2.' },
    {
      type: 'object',
      name: 'calls',
      label: 'Tool calls',
      list: true,
      description: 'The running ticket’s latest calls, oldest first. The last one fades in.',
      ui: { itemProps: (item: { tool?: string; target?: string }) => ({ label: [item?.tool, item?.target].filter(Boolean).join(' ') || 'Call' }) },
      fields: [
        { type: 'string', name: 'tool', label: 'Tool', description: 'Green, e.g. Read, Edit, Bash.' },
        { type: 'string', name: 'target', label: 'Target', description: 'The file or command.' },
      ],
    },
    {
      type: 'object',
      name: 'queue',
      label: 'Up next',
      list: true,
      ui: { itemProps: (item: { number?: string; title?: string }) => ({ label: [item?.number, item?.title].filter(Boolean).join(' ') || 'Ticket' }) },
      fields: [
        { type: 'string', name: 'number', label: 'Number', description: 'Grey, e.g. #63.' },
        { type: 'string', name: 'title', label: 'Title' },
      ],
    },
    { type: 'string', name: 'queueMore', label: 'More line', description: 'Grey, under the queue, e.g. and 2 more.' },
  ],
};
