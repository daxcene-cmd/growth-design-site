import type { ReactNode } from 'react';

type CalloutBlockProps = {
  title: string;
  children: ReactNode;
};

export default function CalloutBlock({ title, children }: CalloutBlockProps) {
  return (
    <aside className="callout-block" aria-label={title}>
      <p className="callout-kicker">设计提醒</p>
      <h4>{title}</h4>
      <div className="callout-content">{children}</div>
    </aside>
  );
}
