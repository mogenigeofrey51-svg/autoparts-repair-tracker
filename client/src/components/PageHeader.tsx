import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-zinc-200/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-2 h-1 w-12 rounded-full bg-emerald-700" />
        <h2 className="text-2xl font-bold tracking-normal text-zinc-950 sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
