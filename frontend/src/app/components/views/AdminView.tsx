import { useCallback, useEffect, useState } from "react";
import {
  Edit2,
  FolderOpen,
  Plus,
  Shield,
  Ticket,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  api,
  ApiError,
  type ApiAdminBooking,
  type ApiAdminUser,
  type ApiCategory,
} from "../../../lib/api";
import { spring } from "../../lib/animations";
import type { SeatFlowEvent } from "../../lib/types";
import { mapApiEvent } from "../../lib/mappers";
import { cx } from "../../lib/utils";
import { EventDeleteConfirmModal } from "../modals/EventDeleteConfirmModal";
import { EventEditDrawer } from "../modals/EventEditDrawer";

type Tab = "users" | "categories" | "bookings" | "events";

export function AdminView({
  onUpdateEvent,
  onDeleteEvent,
}: {
  onUpdateEvent: (e: SeatFlowEvent) => Promise<void> | void;
  onDeleteEvent: (id: string) => Promise<void> | void;
}) {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<ApiAdminUser[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [bookings, setBookings] = useState<ApiAdminBooking[]>([]);
  const [events, setEvents] = useState<SeatFlowEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [editingCat, setEditingCat] = useState<ApiCategory | null>(null);
  const [editingEvent, setEditingEvent] = useState<SeatFlowEvent | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [u, c, b, e] = await Promise.all([
        api.adminListUsers(),
        api.adminListCategories(),
        api.adminListBookings(),
        api.adminListEvents(),
      ]);
      setUsers(u);
      setCategories(c);
      setBookings(b);
      setEvents(e.map(mapApiEvent));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const inp =
    "w-full px-3 py-2 rounded-lg glass-input focus:outline-none focus:ring-2 focus:ring-primary text-sm";

  const handleRoleChange = async (user: ApiAdminUser, role: string) => {
    try {
      setBusyId(user.id);
      const updated = await api.adminUpdateUser(user.id, { role });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      toast.success(`Updated ${user.full_name} to ${role}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update role");
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = async (user: ApiAdminUser) => {
    try {
      setBusyId(user.id);
      const updated = await api.adminUpdateUser(user.id, {
        is_active: !user.is_active,
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      toast.success(updated.is_active ? "User activated" : "User deactivated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update user");
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      toast.error("Category name is required");
      return;
    }
    try {
      const created = await api.adminCreateCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim() || null,
      });
      setCategories((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setNewCatName("");
      setNewCatDesc("");
      toast.success("Category created");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create category");
    }
  };

  const handleSaveCategory = async () => {
    if (!editingCat) return;
    try {
      const updated = await api.adminUpdateCategory(editingCat.id, {
        name: editingCat.name,
        description: editingCat.description,
        is_active: editingCat.is_active,
      });
      setCategories((prev) =>
        prev
          .map((c) => (c.id === updated.id ? updated : c))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setEditingCat(null);
      toast.success("Category updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update category");
    }
  };

  const handleToggleCategory = async (cat: ApiCategory) => {
    try {
      const updated = await api.adminUpdateCategory(cat.id, {
        is_active: !cat.is_active,
      });
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? updated : c)));
      toast.success(updated.is_active ? "Category activated" : "Category suspended");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update category");
    }
  };

  const handleForceCancel = async (booking: ApiAdminBooking) => {
    if (booking.status === "Cancelled") return;
    try {
      setBusyId(booking.id);
      const updated = await api.adminForceCancelBooking(booking.id);
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? updated : b)));
      toast.success("Booking force-cancelled");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to cancel booking");
    } finally {
      setBusyId(null);
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "users", label: "Users", icon: Users },
    { id: "categories", label: "Categories", icon: FolderOpen },
    { id: "bookings", label: "Bookings", icon: Ticket },
    { id: "events", label: "Events", icon: Shield },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <AnimatePresence>
        {editingEvent && (
          <EventEditDrawer
            key="edit"
            event={editingEvent}
            onSave={(updated) => {
              void Promise.resolve(onUpdateEvent(updated)).then(() => {
                setEvents((prev) =>
                  prev.map((e) => (e.id === updated.id ? updated : e)),
                );
                setEditingEvent(null);
              });
            }}
            onClose={() => setEditingEvent(null)}
          />
        )}
        {deletingEventId &&
          (() => {
            const ev = events.find((e) => e.id === deletingEventId);
            return ev ? (
              <EventDeleteConfirmModal
                key="del"
                event={ev}
                onConfirm={async () => {
                  await onDeleteEvent(deletingEventId);
                  setEvents((prev) => prev.filter((e) => e.id !== deletingEventId));
                  setDeletingEventId(null);
                  toast.success("Event deleted.");
                }}
                onClose={() => setDeletingEventId(null)}
              />
            ) : null;
          })()}
      </AnimatePresence>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
          <Shield size={18} className="text-amber-700 dark:text-amber-400" />
        </div>
        <div>
          <h2
            className="font-bold text-foreground"
            style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
          >
            Admin Panel
          </h2>
          <p className="text-sm text-muted-foreground">
            Oversee users, categories, bookings, and platform events
          </p>
        </div>
      </div>

      <div className="flex gap-1 glass rounded-xl p-1 mb-6 w-fit flex-wrap">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cx(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5",
              tab === id
                ? "bg-primary/90 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading admin data…</p>
      ) : (
        <>
          {tab === "users" && (
            <div className="glass rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/20 text-left text-muted-foreground">
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-white/10 last:border-0">
                        <td className="px-4 py-3 font-medium text-foreground">
                          {user.full_name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                        <td className="px-4 py-3">
                          <select
                            value={user.role}
                            disabled={busyId === user.id}
                            onChange={(e) => handleRoleChange(user, e.target.value)}
                            className="px-2 py-1.5 rounded-lg glass-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="customer">Customer</option>
                            <option value="organizer">Organizer</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cx(
                              "text-xs font-semibold px-2 py-1 rounded-full",
                              user.is_active
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                            )}
                          >
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            disabled={busyId === user.id}
                            onClick={() => handleToggleActive(user)}
                            className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                          >
                            {user.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "categories" && (
            <div className="space-y-4">
              <div className="glass rounded-xl p-5 shadow-lg space-y-3">
                <h3
                  className="font-bold text-sm text-foreground"
                  style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
                >
                  Create category
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Name"
                    className={inp}
                  />
                  <input
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    placeholder="Description (optional)"
                    className={inp}
                  />
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCreateCategory}
                    className="flex items-center justify-center gap-1.5 bg-primary text-white rounded-xl text-sm font-semibold py-2"
                  >
                    <Plus size={14} /> Add
                  </motion.button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <motion.div
                    key={cat.id}
                    layout
                    transition={spring}
                    className="glass rounded-xl p-4 shadow-lg"
                  >
                    {editingCat?.id === cat.id ? (
                      <div className="space-y-2">
                        <input
                          value={editingCat.name}
                          onChange={(e) =>
                            setEditingCat({ ...editingCat, name: e.target.value })
                          }
                          className={inp}
                        />
                        <input
                          value={editingCat.description || ""}
                          onChange={(e) =>
                            setEditingCat({
                              ...editingCat,
                              description: e.target.value,
                            })
                          }
                          className={inp}
                          placeholder="Description"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveCategory}
                            className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingCat(null)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-white/20"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{cat.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {cat.description || "No description"}
                          </p>
                          <span
                            className={cx(
                              "inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full",
                              cat.is_active
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                            )}
                          >
                            {cat.is_active ? "Active" : "Suspended"}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingCat(cat)}
                            className="p-2 rounded-lg hover:bg-white/30 text-muted-foreground"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleCategory(cat)}
                            className="p-2 rounded-lg hover:bg-white/30 text-muted-foreground"
                            title={cat.is_active ? "Suspend" : "Activate"}
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {tab === "bookings" && (
            <div className="glass rounded-xl shadow-lg overflow-hidden">
              {bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground p-8 text-center">
                  No bookings yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/20 text-left text-muted-foreground">
                        <th className="px-4 py-3 font-semibold">Event</th>
                        <th className="px-4 py-3 font-semibold">Customer</th>
                        <th className="px-4 py-3 font-semibold">Seats</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Total</th>
                        <th className="px-4 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} className="border-b border-white/10 last:border-0">
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">{b.event_title}</p>
                            <p className="text-xs text-muted-foreground">{b.venue}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-foreground">{b.user_name}</p>
                            <p className="text-xs text-muted-foreground">{b.user_email}</p>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {b.seats.join(", ") || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cx(
                                "text-xs font-semibold px-2 py-1 rounded-full",
                                b.status === "Cancelled"
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                              )}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium">৳{b.total.toFixed(0)}</td>
                          <td className="px-4 py-3">
                            {b.status !== "Cancelled" && (
                              <button
                                disabled={busyId === b.id}
                                onClick={() => handleForceCancel(b)}
                                className="text-xs font-semibold text-destructive hover:underline disabled:opacity-50"
                              >
                                Force cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === "events" && (
            <div className="space-y-3">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No events on the platform.
                </p>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="glass rounded-xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {event.category} · {event.venue} · {event.date} {event.time}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.soldSeats}/{event.totalSeats} seats sold ·{" "}
                        {event.status || "published"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingEvent(event)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/30 text-foreground"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button
                        onClick={() => setDeletingEventId(event.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-destructive hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
