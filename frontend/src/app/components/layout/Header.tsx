import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogIn, LogOut, Menu, Moon, Sun, Ticket, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { springFast } from "../../lib/animations";
import type { View } from "../../lib/types";
import { cx, getInitials } from "../../lib/utils";

export function Header({
  view,
  isLoggedIn,
  userName,
  userRole,
  unreadCount,
  isDark,
  onNav,
  onOpenAuth,
  onSignOut,
  onToggleNotifications,
  onToggleDark,
}: {
  view: View;
  isLoggedIn: boolean;
  userName: string;
  userRole?: string;
  unreadCount: number;
  isDark: boolean;
  onNav: (v: View) => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onToggleNotifications: () => void;
  onToggleDark: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false),
    [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const isOrganizer = userRole === "organizer" || userRole === "admin";
  const navItems: [string, View][] = [
    ["Events", "events"],
    ["Venues", "venue-browse"],
    ["My Bookings", "dashboard"],
    ...(isOrganizer ? ([["Organizer", "organizer"]] as [string, View][]) : []),
  ];
  const isVenueView = ["venue-browse", "venue-detail", "hall-booking", "hall-confirmation"].includes(view);
  const activeNav = isVenueView ? "venue-browse" : view === "event-detail" || view === "seat-selection" || view === "booking-details" || view === "payment" || view === "confirmation" ? "events" : view;
  return (
    <header className="sticky top-0 z-20 h-16 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <button type="button" onClick={() => onNav("events")} className="flex items-center gap-2.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg" aria-label="SeatFlow home">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm">
            <Ticket size={16} className="text-white" />
          </div>
          <span className="font-display font-extrabold text-foreground text-lg">
            Seat<span className="text-primary">Flow</span>
          </span>
        </button>
        <nav className="hidden sm:flex items-center gap-0.5" aria-label="Primary">
          {navItems.map(([label, v]) => (
            <button
              key={v}
              type="button"
              onClick={() => onNav(v)}
              className={cx(
                "px-3.5 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeNav === v ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleDark}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Sun size={18} />
                </motion.div>
              ) : (
                <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Moon size={18} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
          <button
            type="button"
            onClick={onToggleNotifications}
            className="relative p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  key={unreadCount}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.3, opacity: 0 }}
                  transition={springFast}
                  className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-0.5 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          {isLoggedIn ? (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">{getInitials(userName)}</div>
                <span className="text-sm font-semibold text-foreground hidden sm:block">{userName.split(" ")[0]}</span>
                <ChevronDown size={14} className="text-muted-foreground hidden sm:block" />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: -8 }}
                    transition={{ duration: 0.18 }}
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-48 surface-raised rounded-xl overflow-hidden z-30"
                  >
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-semibold text-foreground">{userName}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">{userRole || "customer"}</p>
                    </div>
                    {([["My Bookings", "dashboard"], ...(isOrganizer ? ([["Organizer Panel", "organizer"]] as [string, View][]) : []), ["Venues", "venue-browse"]] as [string, View][]).map(([label, v]) => (
                      <button
                        key={v}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onNav(v);
                          setProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        {label}
                      </button>
                    ))}
                    <div className="border-t border-border">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onSignOut();
                          setProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-2"
                      >
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogIn size={14} /> Sign In
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="sm:hidden border-t border-border px-4 py-3 space-y-1 overflow-hidden bg-card">
            {navItems.map(([label, v]) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  onNav(v);
                  setMobileOpen(false);
                }}
                className={cx("w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", activeNav === v ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
