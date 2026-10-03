import type { ReactNode } from 'react';

export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-rule bg-white px-4 py-10 text-center">
      <div
        aria-hidden
        className="mx-auto mb-4 h-16 w-28 border-[1.5px] border-blue"
        style={{
          backgroundImage:
            'linear-gradient(to right, transparent 49.5%, rgba(22,70,184,.5) 49.5%, rgba(22,70,184,.5) 50.5%, transparent 50.5%)',
        }}
      />
      <h3 className="font-display text-2xl font-extrabold text-ink">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-[65ch] text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
