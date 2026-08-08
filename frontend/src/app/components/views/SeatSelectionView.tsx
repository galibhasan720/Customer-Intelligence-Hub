import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock, Ticket } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "../../../lib/api";
import { BookingStepper, SeatLegend, Skeleton, Surface } from "../atoms";
import { HoldModal } from "../modals/HoldModal";
import { mapApiSeat } from "../../lib/mappers";
import type { Seat, SeatFlowEvent, SeatStatus } from "../../lib/types";
import { cx } from "../../lib/utils";

export function SeatSelectionView({ event, onContinue, onBack }: { event: SeatFlowEvent; onContinue: (seats: Seat[]) => void; onBack: () => void }) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const selected = seats.filter((s) => s.status === "selected");
  const total = selected.reduce((sum, s) => sum + s.price, 0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const rows = await api.listSeats(event.id);
        if (!cancelled) setSeats(rows.map(mapApiSeat));
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load seats");
        if (!cancelled) setSeats([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [event.id]);

  const toggleSeat = useCallback((id: string) => {
    setSeats((prev) => {
      const currentSelected = prev.filter((s) => s.status === "selected").length;
      return prev.map((s) => {
        if (s.id !== id) return s;
        if (s.status === "selected") {
          const r: SeatStatus = s.category === "VIP" ? "vip-available" : "available";
          return { ...s, status: r };
        }
        if (["available", "vip-available"].includes(s.status)) {
          if (currentSelected >= 6) {
            toast.message("You can select up to 6 seats per booking.");
            return s;
          }
          return { ...s, status: "selected" };
        }
        return s;
      });
    });
  }, []);
  const releaseSeat = useCallback(() => {
    setSeats((prev) =>
      prev.map((s) => {
        if (s.status !== "selected") return s;
        const r: SeatStatus = s.category === "VIP" ? "vip-available" : "available";
        return { ...s, status: r };
      }),
    );
    setShowHoldModal(false);
  }, []);

  const rows = useMemo(() => {
    const map = new Map<string, Seat[]>();
    seats.forEach((s) => {
      const list = map.get(s.row) ?? [];
      list.push(s);
      map.set(s.row, list);
    });
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([row, list]) => [row, [...list].sort((x, y) => x.number - y.number)] as const);
  }, [seats]);

  const renderSeat = (seat: Seat) => (
    <button
      key={seat.id}
      type="button"
      disabled={!["available", "vip-available", "selected"].includes(seat.status)}
      onClick={() => toggleSeat(seat.id)}
      onMouseEnter={() => setHoveredId(seat.id)}
      onMouseLeave={() => setHoveredId(null)}
      aria-label={`Seat ${seat.id}, ${seat.category}, ৳${seat.price}, ${seat.status}`}
      className={cx(
        "w-8 h-8 sm:w-9 sm:h-9 rounded-md text-[9px] sm:text-[10px] font-bold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        seat.status === "selected" && "bg-green-500 text-white border-green-600",
        seat.status === "vip-available" && "bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-200 dark:border-indigo-700",
        seat.status === "available" && "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600",
        seat.status === "sold" && "bg-slate-300 text-slate-500 border-slate-400 cursor-not-allowed opacity-50 dark:bg-slate-700 dark:text-slate-500",
      )}
      title={`${seat.id} · ${seat.category} · ৳${seat.price}`}
    >
      {seat.number}
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {showHoldModal && <HoldModal seats={selected} total={total} onProceed={() => { setShowHoldModal(false); onContinue(selected); }} onRelease={releaseSeat} />}
      <div className="flex items-center justify-between gap-3 mb-6">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-primary text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
          <ArrowLeft size={16} /> Back
        </button>
        <BookingStepper step={1} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Surface raised className="p-5">
            <div className="mb-4">
              <h2 className="font-display font-bold text-foreground">{event.title}</h2>
              <p className="text-sm text-muted-foreground">
                {event.venue} · {event.date}
              </p>
            </div>
            <div className="relative mb-6">
              <div className="h-3 mx-8 rounded-b-full bg-slate-700 dark:bg-slate-600" />
              <p className="text-center text-[10px] font-semibold tracking-[0.25em] text-slate-400 mt-2">STAGE</p>
            </div>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-9" />
                ))}
              </div>
            ) : seats.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">No seats found for this event.</p>
            ) : (
              <div className="overflow-x-auto pb-2">
                <div className="min-w-[520px] space-y-2">
                  {rows.map(([row, list]) => (
                    <div key={row} className="flex items-center gap-2 justify-center">
                      <span className="w-6 text-xs font-bold text-muted-foreground text-right shrink-0">{row}</span>
                      <div className="flex gap-1.5 items-center">
                        {list.map((seat, i) => (
                          <span key={seat.id} className="contents">
                            {i === Math.floor(list.length / 2) && <span className="w-4 shrink-0" aria-hidden />}
                            {renderSeat(seat)}
                          </span>
                        ))}
                      </div>
                      <span className="w-6 text-xs font-bold text-muted-foreground shrink-0">{row}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {hoveredId &&
              (() => {
                const seat = seats.find((s) => s.id === hoveredId);
                if (!seat) return null;
                return (
                  <div className="mt-4 text-xs text-muted-foreground">
                    Seat {seat.id} · {seat.category} · ৳{seat.price}
                  </div>
                );
              })()}
            <div className="mt-5 pt-4 border-t border-border">
              <SeatLegend />
            </div>
          </Surface>
        </div>
        <div>
          <Surface raised className="p-5 sticky top-24">
            <h3 className="font-display font-bold text-foreground mb-1">Your selection</h3>
            <p className="text-xs text-muted-foreground mb-4">Up to 6 seats · {selected.length} selected</p>
            {selected.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Ticket size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Click seats on the map</p>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {selected.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-green-500 text-white flex items-center justify-center text-[9px] font-bold">{s.id}</div>
                      <span className="text-muted-foreground">{s.category}</span>
                    </div>
                    <span className="font-semibold">৳{s.price}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-3 flex justify-between font-bold text-sm">
                  <span>Total</span>
                  <span className="text-primary">৳{total}</span>
                </div>
              </div>
            )}
            <button
              type="button"
              disabled={selected.length === 0}
              onClick={() => selected.length > 0 && setShowHoldModal(true)}
              className={cx(
                "w-full py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected.length > 0 ? "bg-primary text-white hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed",
              )}
            >
              {selected.length > 0 ? (
                <>
                  <Clock size={15} /> Hold & Continue
                </>
              ) : (
                "Select seats to continue"
              )}
            </button>
          </Surface>
        </div>
      </div>
    </div>
  );
}
