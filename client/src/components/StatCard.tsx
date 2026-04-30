import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string;
  detail?: string;
  icon: ReactNode;
};

export function StatCard({ label, value, detail, icon }: StatCardProps) {
  return (
    <section className="app-panel relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-soft">
      <div className="absolute inset-x-0 top-0 h-1 bg-emerald-700" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-normal text-zinc-950">{value}</p>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-emerald-700 shadow-sm">{icon}</div>
      </div>
      {detail && <p className="mt-4 text-sm leading-5 text-zinc-500">{detail}</p>}
    </section>
  );
}
