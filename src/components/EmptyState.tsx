import type { ReactNode } from 'react';

/** Keadaan kosong: ilustrasi garis lapangan + satu kalimat. */
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
    <div className="rounded-[28px] border border-line bg-surface px-6 py-12 text-center">
      <svg
        aria-hidden
        viewBox="0 0 200 120"
        className="mx-auto mb-6 h-[120px] w-[200px]"
        fill="none"
        stroke="var(--color-blue)"
        strokeWidth={1.5}
        opacity={0.55}
      >
        <rect x="8" y="8" width="184" height="104" rx="2" />
        <line x1="100" y1="8" x2="100" y2="112" />
        <circle cx="100" cy="60" r="26" />
        <rect x="8" y="32" width="34" height="56" />
        <rect x="158" y="32" width="34" height="56" />
      </svg>
      <h3 className="font-display text-2xl font-extrabold">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-[52ch] text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}