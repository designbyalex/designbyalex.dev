import Link from 'next/link'
import { tinaField } from 'tinacms/dist/react';
import { Button } from '@/components/ui/button'
import { PageBlocksCta } from '@/tina/__generated__/types';
import { Icon } from '../icon';
import { Section } from '../layout/section';

export const CallToAction = ({ data }: { data: PageBlocksCta }) => {
    return (
        <Section sectionId="cta">
            <div className="text-center">
                <h2 className="font-display text-heading text-balance" data-tina-field={tinaField(data, 'title')}>{data.title}</h2>
                <p className="mt-4 text-body-lg text-muted-foreground" data-tina-field={tinaField(data, 'description')}>{data.description}</p>

                <div className="mt-12 flex flex-wrap justify-center gap-4">
                    {data.actions && data.actions.map(action => (
                        <div
                            key={action!.label}
                            data-tina-field={tinaField(action)}
                            className="bg-foreground/10 rounded-[calc(var(--radius-xl)+0.125rem)] border p-0.5">
                            <Button
                                asChild
                                size="lg"
                                variant={action!.type === 'link' ? 'ghost' : 'default'}
                                className="rounded-xl px-5 text-body-lg font-normal">
                                <Link href={action!.link!}>
                                    {action?.icon && (<Icon data={action?.icon} />)}
                                    <span className="text-nowrap">{action!.label}</span>
                                </Link>
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </Section>
    )
}
