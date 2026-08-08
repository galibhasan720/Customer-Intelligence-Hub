import { Check, ChevronRight, Star, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { BADGE_COLORS, CAT_COLORS } from "../../lib/constants";
import { springFast } from "../../lib/animations";
import type { Seat, SeatFlowEvent } from "../../lib/types";
import { cx } from "../../lib/utils";

export function Surface({
  children,
  className,
  raised,
  muted,
}: {
  children: ReactNode;
  className?: string;
  raised?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={cx(muted ? "surface-muted" : raised ? "surface-raised" : "surface", "rounded-xl", className)}>
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-foreground mb-1.5">{label}</label>
      {children}
      {error ? <p className="text-xs text-destructive mt-1">{error}</p> : hint ? <p className="text-xs text-muted-foreground mt-1">{hint}</p> : null}
    </div>
  );
}

export function FilterChip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary text-white border-primary"
          : "bg-card text-foreground border-border hover:border-primary/40 hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-lg bg-muted", className)} />;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-14 h-14 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
        <Icon size={28} className="text-muted-foreground" />
      </div>
      <p className="font-display font-bold text-foreground text-lg">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon size={20} />
          </div>
        )}
        <div>
          <h2 className="font-display font-bold text-foreground text-xl">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions}
    </div>
  );
}

export function Badge({ children, color = "blue" }: { children: React.ReactNode; color?: string }) {
  return (
    <span className={cx("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold", BADGE_COLORS[color] ?? BADGE_COLORS.blue)}>
      {children}
    </span>
  );
}
export function CategoryBadge({ category }: { category: string }) {
  return <Badge color={CAT_COLORS[category] ?? "slate"}>{category}</Badge>;
}
export function AvailabilityBar({ total, sold }: { total: number; sold: number }) {
  const pct = Math.round((sold / total) * 100);
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{total - sold} seats left</span>
        <span>{pct}% full</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-muted">
        <div className={cx("h-full rounded-full", pct >= 90 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-green-500")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
export function StarsRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={12} className={i <= Math.floor(rating) ? "text-amber-400 fill-amber-400" : "text-slate-300 fill-slate-300 dark:text-slate-600 dark:fill-slate-600"} />
      ))}
    </div>
  );
}
export function BookingStepper({ step, labels }: { step: 1 | 2 | 3 | 4; labels?: string[] }) {
  const steps = labels ?? ["Select Seats", "Your Details", "Payment", "Confirmed"];
  return (
    <ol className="flex items-center gap-1.5 flex-wrap justify-end" aria-label="Booking progress">
      {steps.map((label, i) => {
        const n = i + 1,
          active = n === step,
          done = n < step;
        return (
          <li key={label} className="flex items-center gap-1.5">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...springFast, delay: i * 0.05 }}
              aria-current={active ? "step" : undefined}
              className={cx(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                done ? "bg-secondary text-white" : active ? "bg-primary text-white" : "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check size={12} /> : n}
            </motion.div>
            <span className={cx("text-xs hidden sm:block whitespace-nowrap", active ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</span>
            {i < steps.length - 1 && <ChevronRight size={14} className="text-muted-foreground/40 shrink-0" />}
          </li>
        );
      })}
    </ol>
  );
}
export function SeatLegend() {
  const items = [
    { fill: "#DBEAFE", stroke: "#60A5FA", label: "Available" },
    { fill: "#22C55E", stroke: "#16A34A", label: "Selected" },
    { fill: "#EDE9FE", stroke: "#A78BFA", label: "VIP" },
    { fill: "#E2E8F0", stroke: "#CBD5E1", label: "Sold" },
  ];
  return (
    <div className="flex flex-wrap gap-3">
      {items.map(({ fill, stroke, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <svg width={14} height={14} viewBox="0 0 14 14">
            <rect x={1} y={1} width={12} height={12} rx={3} fill={fill} stroke={stroke} strokeWidth={1.5} />
          </svg>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}
export function QRCode() {
  const size = 120,
    cell = size / 10;
  const pat = [
    [1, 1, 1, 1, 1, 1, 1, 0, 1, 0],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 0],
    [1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 0],
    [1, 0, 0, 0, 0, 0, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 0, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1],
    [0, 1, 0, 0, 1, 0, 1, 0, 1, 1],
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded">
      <rect width={size} height={size} fill="white" />
      {pat.map((row, ri) => row.map((v, ci) => (v ? <rect key={`${ri}-${ci}`} x={ci * cell} y={ri * cell} width={cell} height={cell} fill="#0F172A" /> : null)))}
    </svg>
  );
}
export function OrderSummary({ event, seats }: { event: SeatFlowEvent; seats: Seat[] }) {
  const total = seats.reduce((s, seat) => s + seat.price, 0);
  return (
    <Surface raised className="p-5 sticky top-24">
      <h3 className="font-display font-bold text-foreground mb-4">Order Summary</h3>
      <div className="mb-3">
        <p className="font-semibold text-sm text-foreground">{event.title}</p>
        <p className="text-xs text-muted-foreground">
          {event.date} · {event.time}
        </p>
        <p className="text-xs text-muted-foreground">{event.venue}</p>
      </div>
      <div className="space-y-2 border-t border-border pt-3 mb-3">
        {seats.map((s) => (
          <div key={s.id} className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Seat {s.id} ({s.category})
            </span>
            <span>৳{s.price}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-border pt-3 flex justify-between font-bold text-sm">
        <span>Total</span>
        <span className="text-primary text-base">৳{total}</span>
      </div>
    </Surface>
  );
}
