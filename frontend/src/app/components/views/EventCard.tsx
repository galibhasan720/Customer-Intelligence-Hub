import { Calendar, MapPin } from "lucide-react";
import { AvailabilityBar, CategoryBadge } from "../atoms";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import type { SeatFlowEvent } from "../../lib/types";
import { cx } from "../../lib/utils";

export function EventCard({ event, onClick }: { event: SeatFlowEvent; onClick: () => void }) {
  const pct = Math.round((event.soldSeats / event.totalSeats) * 100);
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left surface-raised rounded-xl overflow-hidden cursor-pointer group w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow hover:shadow-md"
    >
      <div className="relative h-44 overflow-hidden bg-muted">
        <ImageWithFallback src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute top-3 left-3">
          <CategoryBadge category={event.category} />
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white font-display font-bold text-base leading-snug line-clamp-2">{event.title}</p>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <Calendar size={12} />
          <span>
            {event.date} · {event.time}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <MapPin size={12} />
          <span className="truncate">
            {event.venue}, {event.city}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">
            From <span className="text-primary text-base">৳{event.priceFrom}</span>
          </span>
          <span className={cx("text-xs font-medium", pct >= 90 ? "text-red-600 dark:text-red-400" : pct >= 60 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400")}>
            {pct >= 90 ? "Almost sold out" : pct >= 60 ? "Selling fast" : "Available"}
          </span>
        </div>
        <AvailabilityBar total={event.totalSeats} sold={event.soldSeats} />
      </div>
    </button>
  );
}
