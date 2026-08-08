import { useEffect, useState } from "react";
import { AlertCircle, Building2, CheckCircle, Clock, Edit2, Ticket, User, XCircle } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { api, ApiError } from "../../../lib/api";
import { EmptyState, PageHeader, Skeleton, Surface } from "../atoms";
import { CancelConfirmModal } from "../modals/CancelConfirmModal";
import { EditEventBookingDrawer } from "../modals/EditEventBookingDrawer";
import { EditHallBookingDrawer } from "../modals/EditHallBookingDrawer";
import { mapApiBooking } from "../../lib/mappers";
import type { Booking, Hall, HallBooking, Notification } from "../../lib/types";
import { cx, statusColor } from "../../lib/utils";

export function DashboardView({
  hallBookings,
  halls,
  onCancelHall,
  onUpdateHall,
  addNotification,
  isLoggedIn,
  onNeedAuth,
}: {
  hallBookings: HallBooking[];
  halls: Hall[];
  onCancelHall: (id: string) => void | Promise<void>;
  onUpdateHall: (b: HallBooking) => void | Promise<void>;
  addNotification: (n: Omit<Notification, "id" | "read">) => void;
  isLoggedIn: boolean;
  onNeedAuth: () => void;
}) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"events" | "venues">("events");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancellingHallId, setCancellingHallId] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editingHallBooking, setEditingHallBooking] = useState<HallBooking | null>(null);
  const [localHallBookings, setLocalHallBookings] = useState<HallBooking[]>(hallBookings);
  useEffect(() => {
    setLocalHallBookings(hallBookings);
  }, [hallBookings]);

  useEffect(() => {
    if (!isLoggedIn) {
      setBookings([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const rows = await api.myBookings();
        if (!cancelled) setBookings(rows.map(mapApiBooking));
      } catch (err) {
        if (!cancelled) toast.error(err instanceof ApiError ? err.message : "Failed to load bookings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const cancel = async (id: string, reason: string) => {
    try {
      const updated = await api.cancelBooking(id);
      setBookings((prev) => prev.map((b) => (b.id === id ? mapApiBooking(updated) : b)));
      toast.info("Booking cancelled.");
      addNotification({ type: "booking_cancelled", title: "Booking Cancelled", message: `Booking cancelled (${reason}).`, timestamp: "Just now" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Cancel failed");
    } finally {
      setCancellingId(null);
    }
  };
  const cancelHall = async (id: string) => {
    try {
      await onCancelHall(id);
      setLocalHallBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "Cancelled" } : b)));
      toast.info("Hall booking cancelled.");
    } catch {
      /* parent shows error */
    } finally {
      setCancellingHallId(null);
    }
  };

  const cancelTarget = bookings.find((b) => b.id === cancellingId);
  const cancelHallTarget = localHallBookings.find((b) => b.id === cancellingHallId);
  const statusIcon = (s: Booking["status"]) =>
    ({
      Confirmed: <CheckCircle size={13} className="text-green-500" />,
      Pending: <Clock size={13} className="text-amber-500" />,
      Cancelled: <XCircle size={13} className="text-red-500" />,
      Expired: <AlertCircle size={13} className="text-slate-400" />,
    })[s];

  if (!isLoggedIn) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState
          icon={User}
          title="Sign in to view bookings"
          description="Your event tickets and hall reservations live here once you are signed in."
          action={
            <button type="button" onClick={onNeedAuth} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Sign In
            </button>
          }
        />
      </div>
    );
  }

  const stats = [
    { label: "Total", value: bookings.length + localHallBookings.length, color: "text-primary" },
    { label: "Confirmed", value: bookings.filter((b) => b.status === "Confirmed").length + localHallBookings.filter((b) => b.status === "Confirmed").length, color: "text-green-600 dark:text-green-400" },
    { label: "Cancelled", value: bookings.filter((b) => b.status === "Cancelled").length + localHallBookings.filter((b) => b.status === "Cancelled").length, color: "text-red-600 dark:text-red-400" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <AnimatePresence>
        {cancellingId && cancelTarget && <CancelConfirmModal key="ce" bookingRef={cancellingId} title={cancelTarget.eventTitle} onConfirm={(reason) => cancel(cancellingId, reason)} onClose={() => setCancellingId(null)} />}
        {cancellingHallId && cancelHallTarget && (
          <CancelConfirmModal key="ch" bookingRef={cancellingHallId} title={`${cancelHallTarget.hallName} at ${cancelHallTarget.venueName}`} onConfirm={() => cancelHall(cancellingHallId)} onClose={() => setCancellingHallId(null)} />
        )}
        {editingBooking && (
          <EditEventBookingDrawer
            key="eb"
            booking={editingBooking}
            onSave={(updated) => {
              setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
            }}
            onClose={() => setEditingBooking(null)}
          />
        )}
        {editingHallBooking && (
          <EditHallBookingDrawer
            key="ehb"
            booking={editingHallBooking}
            halls={halls}
            onSave={async (updated) => {
              await onUpdateHall(updated);
              setLocalHallBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
            }}
            onClose={() => setEditingHallBooking(null)}
          />
        )}
      </AnimatePresence>

      <PageHeader icon={User} title="My Bookings" subtitle={loading ? "Loading reservations…" : "Manage tickets and hall reservations"} />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map(({ label, value, color }) => (
          <Surface raised key={label} className="p-4 text-center">
            <p className={cx("text-2xl font-extrabold", color)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </Surface>
        ))}
      </div>

      <div className="flex gap-1 surface rounded-xl p-1 mb-6 w-fit">
        {(["events", "venues"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cx("px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", tab === t ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}
          >
            {t === "events" ? "Event Tickets" : "Venue Bookings"}
          </button>
        ))}
      </div>

      {tab === "events" && (
        <div className="space-y-4">
          {loading &&
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          {!loading && bookings.length === 0 && (
            <EmptyState icon={Ticket} title="No event bookings yet" description="Browse events and pick a seat to see tickets here." />
          )}
          {bookings.map((booking) => (
            <Surface raised key={booking.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-display font-bold text-foreground text-sm">{booking.eventTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {booking.date} · {booking.venue}
                  </p>
                </div>
                <span className={cx("flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full", statusColor(booking.status))}>
                  {statusIcon(booking.status)} {booking.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Seats:</p>
                  <div className="flex gap-1">
                    {booking.seats.map((s) => (
                      <span key={s} className="bg-primary/10 text-primary text-xs font-bold px-1.5 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-primary">৳{booking.total}</span>
                  {booking.status === "Confirmed" && (
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setEditingBooking(booking)} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                        <Edit2 size={11} /> Edit
                      </button>
                      <button type="button" onClick={() => setCancellingId(booking.id)} className="text-xs text-destructive font-semibold hover:underline">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Ref: {booking.id}</p>
            </Surface>
          ))}
        </div>
      )}

      {tab === "venues" && (
        <div className="space-y-4">
          {localHallBookings.length === 0 ? (
            <EmptyState icon={Building2} title="No venue bookings yet" description="Browse venues to book a hall for your event." />
          ) : (
            localHallBookings.map((b) => (
              <Surface raised key={b.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-display font-bold text-foreground text-sm">{b.hallName}</p>
                    <p className="text-xs text-muted-foreground">{b.venueName}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.date} · {b.startTime}–{b.endTime}
                    </p>
                  </div>
                  <span className={cx("flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full", statusColor(b.status))}>
                    {b.status === "Confirmed" ? <CheckCircle size={13} className="text-green-500" /> : <XCircle size={13} className="text-red-500" />} {b.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{b.purpose}</span>
                    <span>·</span>
                    <span>{b.guestCount} guests</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-primary">৳{b.total.toLocaleString()}</span>
                    {b.status === "Confirmed" && (
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setEditingHallBooking(b)} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                          <Edit2 size={11} /> Edit
                        </button>
                        <button type="button" onClick={() => setCancellingHallId(b.id)} className="text-xs text-destructive font-semibold hover:underline">
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Booked on {b.bookedAt} · Ref: {b.id}
                </p>
              </Surface>
            ))
          )}
        </div>
      )}
    </div>
  );
}
