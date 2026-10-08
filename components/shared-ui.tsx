import React from 'react';
import { COLORS, LABELS } from '@/lib/design-system';

interface StatCardProps {
  label: string;
  value: number | string;
  subtitle: string;
  accent: 'slate' | 'emerald' | 'amber' | 'rose';
}

export function StatCard({ label, value, subtitle, accent }: StatCardProps) {
  const accentDots = {
    slate: 'bg-brand-blue',
    emerald: 'bg-brand-gold',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };

  return (
    <div className="bg-white px-5 py-5 transition hover:bg-brand-bg">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-brand-muted">{label}</p>
        <span className={`h-2.5 w-2.5 rounded-full ${accentDots[accent]}`} />
      </div>
      <p className="mt-2 text-4xl font-bold leading-none text-brand-ink">{value}</p>
      <p className="mt-2 text-xs text-brand-muted">{subtitle}</p>
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
      className={`min-h-10 shrink-0 rounded-xl px-4 text-sm font-semibold transition ${
        active
          ? 'bg-brand-navy text-white'
          : 'bg-white text-brand-muted ring-1 ring-brand-border hover:bg-brand-bg hover:text-brand-ink'
      }`}
    >
      {label}
      <span className={`mr-2 rounded-full px-2 py-0.5 text-xs ${active ? 'bg-brand-gold text-brand-gold-ink' : 'bg-brand-line text-brand-muted'}`}>
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
    <div className="relative px-5 py-6 lg:px-7">
      <span aria-hidden className="absolute inset-y-6 right-0 w-1 rounded-l-full bg-brand-gold" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1">
          {superLabel && (
            <p className="text-xs font-semibold tracking-wide text-brand-on-soft">{superLabel}</p>
          )}
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-brand-ink">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm text-brand-muted">{subtitle}</p>
          )}
        </div>
        {(badge || children) && (
          <div className="flex flex-wrap items-center gap-2">
            {badge?.map((b, i) => (
              <span
                key={i}
                className={`rounded-full px-3.5 py-2 text-xs font-semibold ${
                  b.color === 'blue'
                    ? 'bg-brand-soft text-brand-on-soft'
                    : 'bg-brand-mint-soft text-brand-mint-text'
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
    <div className="grid gap-px bg-brand-line sm:grid-cols-2 lg:grid-cols-4">
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
    <label className="flex min-h-12 w-full items-center gap-2 rounded-2xl border border-brand-border bg-brand-bg px-4 transition focus-within:border-brand-blue focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-soft xl:w-[440px]">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-[18px] w-[18px] shrink-0 text-brand-muted" aria-hidden>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-4-4" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full bg-transparent text-sm text-brand-ink outline-none placeholder:text-brand-muted/80"
        dir="rtl"
      />
    </label>
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
    sm: 'min-h-10 px-4 text-xs',
    md: 'min-h-11 px-5 text-sm',
    lg: 'min-h-12 px-6 text-base',
  };

  const variantClasses = {
    primary: 'bg-brand-blue text-white hover:bg-brand-blue-dark',
    secondary: 'bg-brand-line text-brand-ink hover:bg-brand-border',
    danger: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
    success: 'bg-brand-mint-soft text-brand-mint-text hover:bg-brand-gold/40',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`rounded-xl font-semibold transition hover:-translate-y-0.5 active:translate-y-0 disabled:translate-y-0 disabled:opacity-50 ${sizeClasses[size]} ${variantClasses[variant]}`}
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
    <div className="py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-on-soft">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
          {icon === 'search' ? (
            <>
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </>
          ) : icon === 'folder' ? (
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          ) : (
            <>
              <path d="M22 12h-6l-2 3h-4l-2-3H2" />
              <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </>
          )}
        </svg>
      </div>
      <p className="text-lg font-semibold text-brand-ink">{title}</p>
      <p className="mt-1 text-sm text-brand-muted">{description}</p>
    </div>
  );
}

interface BadgeProps {
  label: string;
  color: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
}

export function Badge({ label, color }: BadgeProps) {
  const colorClasses = {
    blue: 'bg-brand-soft text-brand-on-soft',
    emerald: 'bg-brand-mint-soft text-brand-mint-text',
    amber: 'bg-amber-50 text-amber-800',
    rose: 'bg-rose-50 text-rose-700',
    slate: 'bg-brand-line text-brand-muted',
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colorClasses[color]}`}>
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
  const borderClass = variant === 'danger' ? 'border-rose-200' : 'border-brand-border';

  return (
    <section className={`overflow-hidden rounded-3xl border ${borderClass} ${bgClass}`}>
      {(title || description) && (
        <div className="border-b border-brand-line px-5 py-4 md:px-6">
          <h2 className="text-lg font-bold text-brand-ink">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-brand-muted">{description}</p>
          )}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
