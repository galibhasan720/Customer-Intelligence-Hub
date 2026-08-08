import { useState } from "react";
import { AlertCircle, Bell, Building2, CheckCircle, Clock, Sparkles, Ticket, X, XCircle } from "lucide-react";
import type { Notification } from "../../lib/types";
import { cx } from "../../lib/utils";

export function NotificationPanel({
  notifications,
  onClose,
  onMarkAllRead,
  onClearAll,
  onMarkRead,
}: {
  notifications: Notification[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onMarkRead: (id: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | "unread" | "bookings" | "venues">("all");
  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "bookings") return ["booking_confirmed", "booking_cancelled", "payment_processed", "hold_expired"].includes(n.type);
    if (filter === "venues") return n.type === "hall_booking_confirmed";
    return true;
  });
  const notifIcon = (type: Notification["type"]) =>
    ({
      booking_confirmed: <CheckCircle size={15} className="text-green-500" />,
      booking_cancelled: <XCircle size={15} className="text-red-500" />,
      event_reminder: <Clock size={15} className="text-amber-500" />,
      event_updated: <AlertCircle size={15} className="text-blue-500" />,
      hold_expired: <Clock size={15} className="text-orange-500" />,
      payment_processed: <Ticket size={15} className="text-green-600" />,
      hall_booking_confirmed: <Building2 size={15} className="text-primary" />,
      new_event: <Sparkles size={15} className="text-primary" />,
    })[type];
  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/30" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-80 sm:w-96 z-40 flex flex-col bg-card border-l border-border shadow-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/40 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-foreground">Notifications</h2>
            {unreadCount > 0 && <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{unreadCount}</span>}
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button type="button" onClick={onMarkAllRead} className="text-xs text-primary hover:underline font-medium">
                Mark all read
              </button>
            )}
            <button type="button" onClick={onClose} aria-label="Close notifications" className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex gap-1.5 px-4 py-2.5 border-b border-border overflow-x-auto scrollbar-none shrink-0">
          {(["all", "unread", "bookings", "venues"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cx(
                "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors capitalize",
                filter === f ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
              {f === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16">
              <Bell size={36} className="text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">All caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onMarkRead(n.id)}
                  className={cx("w-full text-left flex gap-3 px-4 py-3.5 cursor-pointer hover:bg-muted/60 transition-colors relative", !n.read && "bg-primary/5")}
                >
                  {!n.read && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-r-full" />}
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">{notifIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className={cx("text-sm leading-tight text-foreground", !n.read ? "font-semibold" : "font-medium")}>{n.title}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{n.timestamp}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="px-4 py-3 border-t border-border shrink-0">
            <button type="button" onClick={onClearAll} className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors py-1">
              Clear all notifications
            </button>
          </div>
        )}
      </div>
    </>
  );
}
