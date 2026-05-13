import React from 'react';
import { COLORS, LABELS } from '@/lib/design-system';

interface StatCardProps {
  label: string;
  value: number | string;
  subtitle: string;
  accent: 'slate' | 'emerald' | 'amber' | 'rose';
}

export function StatCard({ label, value, subtitle, accent }: StatCardProps) {
  const accentColors = {
    slate: 'text-slate-950',
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    rose: 'text-rose-700',
  };

  return (
    <div className="bg-white px-5 py-4 transition hover:bg-slate-50">
      <p className="text-xs font-black text-slate-400">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className={`text-3xl font-black ${accentColors[accent]}`}>{value}</p>
        <p className="pb-1 text-[11px] font-bold text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

interface FilterTabProps {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}

export function FilterTab({ active, label, count, onClick }: FilterTabProps) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-lg px-3 py-2 text-xs font-black ring-1 transition ${
        active
          ? 'bg-blue-600 text-white ring-blue-600'
          : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
      }`}
    >
      {label}
      <span className={`mr-2 rounded-full px-2 py-0.5 ${active ? 'bg-white/15' : 'bg-slate-100 text-slate-500'}`}>
        {count}
      </span>
    </button>
  );
}

interface SectionHeaderProps {
  superLabel?: string;
  title: string;
  subtitle?: string;
  badge?: { text: string; color: 'blue' | 'rose' }[];
  children?: React.ReactNode;
}

export function SectionHeader({ superLabel, title, subtitle, badge, children }: SectionHeaderProps) {
  return (
    <div className="border-b border-slate-200 bg-[linear-gradient(90deg,#ffffff,#eef6ff,#f6fffb)] px-5 py-5 lg:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          {superLabel && (
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">{superLabel}</p>
          )}
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm font-semibold text-slate-500">{subtitle}</p>
          )}
        </div>
        {(badge || children) && (
          <div className="flex flex-wrap items-center gap-2">
            {badge?.map((b, i) => (
              <span
                key={i}
                className={`rounded-full px-3 py-2 text-xs font-black ring-1 ${
                  b.color === 'blue'
                    ? 'bg-blue-50 text-blue-700 ring-blue-100'
                    : 'bg-rose-50 text-rose-700 ring-rose-100'
                }`}
              >
                {b.text}
              </span>
            ))}
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatsGridProps {
  stats: Array<{
    label: string;
    value: number | string;
    accent: 'slate' | 'emerald' | 'amber' | 'rose';
    sub: string;
  }>;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          subtitle={stat.sub}
          accent={stat.accent}
        />
      ))}
    </div>
  );
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-50 xl:w-[420px]"
      dir="rtl"
    />
  );
}

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ActionButton({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  size = 'md',
}: ActionButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    danger: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100 hover:bg-rose-100',
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`rounded-lg font-black transition disabled:opacity-50 ${sizeClasses[size]} ${variantClasses[variant]}`}
    >
      {loading ? LABELS.loading : label}
    </button>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: 'search' | 'folder' | 'inbox';
}

export function EmptyState({ title, description, icon = 'inbox' }: EmptyStateProps) {
  return (
    <div className="border-t border-slate-100 py-16 text-center">
      <p className="text-lg font-black text-slate-400">{title}</p>
      <p className="mt-1 text-sm font-semibold text-slate-400">{description}</p>
    </div>
  );
}

interface BadgeProps {
  label: string;
  color: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
}

export function Badge({ label, color }: BadgeProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    rose: 'bg-rose-50 text-rose-700 ring-rose-100',
    slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${colorClasses[color]}`}>
      {label}
    </span>
  );
}

interface PanelProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
}

export function Panel({ title, description, children, variant = 'default' }: PanelProps) {
  const bgClass = variant === 'danger' ? 'bg-rose-50' : 'bg-white';
  const borderClass = variant === 'danger' ? 'border-rose-200 ring-rose-100' : 'border-slate-200';

  return (
    <section className={`overflow-hidden rounded-xl border ${borderClass} ${bgClass} shadow-[0_12px_50px_rgba(15,23,42,0.05)]`}>
      {(title || description) && (
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-black text-slate-950">{title}</h2>
          {description && (
            <p className="mt-1 text-sm font-semibold text-slate-500">{description}</p>
          )}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
