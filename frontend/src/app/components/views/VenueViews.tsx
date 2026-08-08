import { useState } from "react";
import { ArrowLeft, Building2, Check, CheckCircle, ChevronDown, Loader2, MapPin, Phone, Search, Users } from "lucide-react";
import { Badge, BookingStepper, EmptyState, Field, FilterChip, Skeleton, StarsRow, Surface } from "../atoms";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ADD_ON_OPTIONS, BOOKING_PURPOSES, VENUE_TYPES } from "../../lib/constants";
import type { Hall, HallBooking, Venue } from "../../lib/types";
import { cx } from "../../lib/utils";

export function VenueBrowseView({ venues, loading, onSelectVenue }: { venues: Venue[]; loading?: boolean; onSelectVenue: (v: Venue) => void }) {
  const [search, setSearch] = useState(""),
    [typeFilter, setTypeFilter] = useState("All"),
    [sort, setSort] = useState("Rating");
  const filtered = venues
    .filter((v) => (typeFilter === "All" || v.type === typeFilter) && (v.name.toLowerCase().includes(search.toLowerCase()) || v.city.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => (sort === "Price" ? a.priceFrom - b.priceFrom : b.rating - a.rating));
  const hasFilters = typeFilter !== "All" || !!search;
  const selectCls =
    "appearance-none pl-3 pr-8 py-2 rounded-lg bg-card border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer";
  return (
    <div>
      <div className="relative bg-slate-900 text-white">
        <div className="absolute inset-0 opacity-30 bg-cover bg-center" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1440&q=60)" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-900/60" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-3">Venues</p>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold mb-3 leading-tight max-w-xl">Book the right hall</h1>
          <p className="text-slate-300 text-sm sm:text-base mb-6 max-w-lg">Convention centres, hotel banquets, and conference rooms — same booking language as events.</p>
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-slate-400 pointer-events-none" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search venues or cities…"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white text-slate-900 placeholder-slate-400 shadow-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              aria-label="Search venues"
            />
          </div>
        </div>
      </div>
      <div className="sticky top-16 z-10 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 flex-wrap">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {VENUE_TYPES.map((t) => (
              <FilterChip key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>
                {t}
              </FilterChip>
            ))}
          </div>
          <div className="relative ml-auto">
            <label className="sr-only" htmlFor="venue-sort">
              Sort
            </label>
            <select id="venue-sort" value={sort} onChange={(e) => setSort(e.target.value)} className={selectCls}>
              {["Rating", "Price"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">{loading ? "Loading venues…" : `${filtered.length} venue${filtered.length !== 1 ? "s" : ""} found`}</p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setTypeFilter("All");
                setSearch("");
              }}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No venues found"
            description="Try another city or clear filters to see all halls."
            action={
              hasFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter("All");
                    setSearch("");
                  }}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Clear filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((venue) => (
              <button
                key={venue.id}
                type="button"
                onClick={() => onSelectVenue(venue)}
                className="text-left surface-raised rounded-xl overflow-hidden cursor-pointer group w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow hover:shadow-md"
              >
                <div className="relative h-48 overflow-hidden bg-muted">
                  <ImageWithFallback src={venue.image} alt={venue.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="bg-primary text-white text-xs font-semibold px-2 py-1 rounded-full">{venue.type}</span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-display font-bold text-sm leading-snug line-clamp-2">{venue.name}</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <MapPin size={11} />
                    <span className="truncate">{venue.address}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <StarsRow rating={venue.rating} />
                      <span className="text-xs text-muted-foreground">
                        {venue.rating} ({venue.reviewCount})
                      </span>
                    </div>
                    <span className="text-xs bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 font-semibold px-2 py-0.5 rounded-full">{venue.totalHalls} halls</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {venue.amenities.slice(0, 4).map((a) => (
                      <span key={a} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {a}
                      </span>
                    ))}
                    {venue.amenities.length > 4 && <span className="text-xs text-primary font-medium">+{venue.amenities.length - 4} more</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      From <span className="text-foreground font-bold">৳{venue.priceFrom.toLocaleString()}</span>/day
                    </span>
                    <span className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-semibold">View Halls</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function VenueDetailView({ venue, halls, loading, onSelectHall, onBack }: { venue: Venue; halls: Hall[]; loading?: boolean; onSelectHall: (h: Hall) => void; onBack: () => void }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
        <button type="button" onClick={onBack} className="hover:text-primary flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
          <ArrowLeft size={16} /> Venues
        </button>
        <span aria-hidden>/</span>
        <span className="text-foreground font-medium truncate">{venue.name}</span>
      </nav>
      <div className="rounded-xl overflow-hidden h-64 sm:h-80 mb-6 relative bg-muted">
        <ImageWithFallback src={venue.image} alt={venue.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-5 left-6 right-6">
          <span className="bg-primary text-white text-xs font-semibold px-2.5 py-1 rounded-full mb-2 inline-block">{venue.type}</span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">{venue.name}</h1>
          <p className="text-white/80 text-sm flex items-center gap-1.5 mt-1">
            <MapPin size={13} />
            {venue.address}, {venue.city}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-7">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <StarsRow rating={venue.rating} />
              <span className="font-semibold text-sm text-foreground">{venue.rating}</span>
              <span className="text-muted-foreground text-sm">({venue.reviewCount} reviews)</span>
            </div>
            <span className="text-muted-foreground text-sm">{venue.totalHalls} halls</span>
          </div>
          <p className="text-muted-foreground leading-relaxed text-sm">{venue.description}</p>
          <div>
            <h3 className="font-display font-bold text-foreground mb-3">Amenities & Facilities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {venue.amenities.map((a) => (
                <Surface muted key={a} className="flex items-center gap-2 px-3 py-2">
                  <Check size={13} className="text-green-500 shrink-0" />
                  <span className="text-sm text-foreground">{a}</span>
                </Surface>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-foreground text-lg">Our Halls & Rooms</h3>
              <span className="text-sm text-muted-foreground">{loading ? "Loading…" : `${halls.length} spaces`}</span>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {halls.map((hall) => (
                  <Surface raised key={hall.id} className={cx("overflow-hidden", !hall.available && "opacity-60")}>
                    <div className="relative h-40 overflow-hidden bg-muted">
                      <ImageWithFallback src={hall.image} alt={hall.name} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2">
                        <span className={cx("text-xs font-semibold px-2 py-0.5 rounded-full", hall.available ? "bg-green-500 text-white" : "bg-slate-400 text-white")}>
                          {hall.available ? "Available" : "Fully Booked"}
                        </span>
                      </div>
                      <div className="absolute top-2 left-2">
                        <span className="bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">Floor {hall.floor}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-display font-bold text-foreground text-sm mb-1">{hall.name}</h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Users size={11} />
                          {hall.capacity.toLocaleString()} guests
                        </span>
                        <span>{hall.areaSqft.toLocaleString()} sqft</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {hall.amenities.slice(0, 3).map((a) => (
                          <span key={a} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            {a}
                          </span>
                        ))}
                      </div>
                      <div className="space-y-0.5 text-xs text-muted-foreground mb-3">
                        <div className="flex justify-between">
                          <span>Per hour</span>
                          <span className="font-semibold text-foreground">৳{hall.pricePerHour.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Half day</span>
                          <span className="font-semibold text-foreground">৳{hall.priceHalfDay.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Full day</span>
                          <span className="font-semibold text-foreground">৳{hall.priceFullDay.toLocaleString()}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!hall.available}
                        onClick={() => hall.available && onSelectHall(hall)}
                        className={cx(
                          "w-full py-2 rounded-xl text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          hall.available ? "bg-primary text-white hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed",
                        )}
                      >
                        {hall.available ? "Book This Hall" : "Fully Booked"}
                      </button>
                    </div>
                  </Surface>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <Surface raised className="p-5 sticky top-24">
            <p className="text-sm text-muted-foreground mb-1">Starting from</p>
            <p className="text-2xl font-bold text-primary mb-1">৳{venue.priceFrom.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mb-4">per day · varies by hall</p>
            <div className="space-y-2 mb-4">
              {halls
                .filter((h) => h.available)
                .slice(0, 3)
                .map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => onSelectHall(h)}
                    className="w-full text-left px-3 py-2.5 rounded-xl surface-muted hover:border-primary/40 border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">{h.name}</span>
                      <span className="text-xs text-muted-foreground">cap. {h.capacity.toLocaleString()}</span>
                    </div>
                    <span className="text-xs text-primary font-semibold">from ৳{h.priceFullDay.toLocaleString()}/day</span>
                  </button>
                ))}
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground surface-muted rounded-lg p-3">
              <Phone size={12} className="shrink-0 mt-0.5" />
              <span>Contact venue for custom packages and group bookings.</span>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}

export function HallBookingView({
  venue,
  hall,
  onConfirm,
  onBack,
  busy,
}: {
  venue: Venue;
  hall: Hall;
  onConfirm: (b: HallBooking) => void;
  onBack: () => void;
  busy?: boolean;
}) {
  const [date, setDate] = useState(""),
    [durationType, setDurationType] = useState<"hourly" | "half-day" | "full-day">("full-day");
  const [startTime, setStartTime] = useState("09:00"),
    [endTime, setEndTime] = useState("17:00"),
    [halfPeriod, setHalfPeriod] = useState<"morning" | "afternoon">("morning");
  const [purpose, setPurpose] = useState(""),
    [guestCount, setGuestCount] = useState(50),
    [addOns, setAddOns] = useState<string[]>([]);
  const [contactName, setContactName] = useState(""),
    [contactPhone, setContactPhone] = useState(""),
    [contactEmail, setContactEmail] = useState(""),
    [specialReqs, setSpecialReqs] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const basePrice =
    durationType === "full-day"
      ? hall.priceFullDay
      : durationType === "half-day"
        ? hall.priceHalfDay
        : (() => {
            const [sh] = startTime.split(":").map(Number),
              [eh] = endTime.split(":").map(Number);
            return hall.pricePerHour * Math.max(1, eh - sh);
          })();
  const addOnTotal = addOns.reduce((sum, id) => {
    const ao = ADD_ON_OPTIONS.find((a) => a.id === id);
    if (!ao) return sum;
    return sum + (ao.unit === "per person" ? ao.price * guestCount : ao.price);
  }, 0);
  const totalPrice = basePrice + addOnTotal;
  const toggleAddOn = (id: string) => setAddOns((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  const validate = () => {
    const e: Record<string, string> = {};
    if (!date) e.date = "Please select a date";
    if (!purpose) e.purpose = "Please select a purpose";
    if (guestCount < 1 || guestCount > hall.capacity) e.guests = `Between 1 and ${hall.capacity}`;
    if (!contactName.trim()) e.contactName = "Name is required";
    if (!contactPhone.trim()) e.contactPhone = "Phone is required";
    if (!contactEmail.includes("@")) e.contactEmail = "Valid email required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const handleConfirm = () => {
    if (!validate() || busy) return;
    const actualStart = durationType === "half-day" && halfPeriod === "afternoon" ? "14:00" : durationType === "full-day" ? "08:00" : startTime;
    const actualEnd = durationType === "full-day" ? "20:00" : durationType === "half-day" ? (halfPeriod === "morning" ? "14:00" : "20:00") : endTime;
    onConfirm({
      id: `HB-${Math.floor(10000 + Math.random() * 90000)}`,
      venueId: venue.id,
      hallId: hall.id,
      venueName: venue.name,
      hallName: hall.name,
      date,
      startTime: actualStart,
      endTime: actualEnd,
      durationType,
      purpose,
      guestCount,
      addOns,
      total: totalPrice,
      status: "Confirmed",
      bookedAt: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      contactName,
      contactPhone,
      contactEmail,
    });
  };
  const inp = (err?: string) => cx("field-input", err && "ring-2 ring-destructive border-destructive");
  const step = !date ? 1 : !purpose || guestCount < 1 ? 2 : addOns.length === 0 && !contactName ? 3 : 4;
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-primary text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
          <ArrowLeft size={16} /> Back to halls
        </button>
        <BookingStepper step={step as 1 | 2 | 3 | 4} labels={["When", "Event", "Add-ons", "Contact"]} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        <div className="lg:col-span-2 space-y-5">
          <Surface raised className="p-6 space-y-4">
            <h2 className="font-display font-bold text-lg text-foreground">1. When?</h2>
            <Field label="Date" error={errors.date}>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inp(errors.date)} />
            </Field>
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Duration</p>
              <div className="grid grid-cols-3 gap-2">
                {(["hourly", "half-day", "full-day"] as const).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDurationType(val)}
                    className={cx(
                      "py-2.5 rounded-xl text-sm font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      durationType === val ? "border-primary bg-primary text-white" : "border-border text-foreground hover:border-primary/40",
                    )}
                  >
                    {val === "hourly" ? "Hourly" : val === "half-day" ? "Half Day" : "Full Day"}
                  </button>
                ))}
              </div>
            </div>
            {durationType === "hourly" && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Start Time">
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="field-input" />
                </Field>
                <Field label="End Time">
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="field-input" />
                </Field>
              </div>
            )}
            {durationType === "half-day" && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Period</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["morning", "afternoon"] as const).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setHalfPeriod(val)}
                      className={cx(
                        "py-2 rounded-xl text-sm font-medium border transition-colors",
                        halfPeriod === val ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-primary/40",
                      )}
                    >
                      {val === "morning" ? "Morning (8am–2pm)" : "Afternoon (2pm–8pm)"}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {durationType === "full-day" && <p className="text-xs text-muted-foreground surface-muted px-3 py-2 rounded-lg">Full day: 8:00 AM — 8:00 PM</p>}
          </Surface>
          <Surface raised className="p-6 space-y-4">
            <h2 className="font-display font-bold text-lg text-foreground">2. Your Event</h2>
            <Field label="Purpose of Booking" error={errors.purpose}>
              <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className={cx(inp(errors.purpose), "text-foreground")}>
                <option value="">Select purpose…</option>
                {BOOKING_PURPOSES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label={`Estimated Guests (max ${hall.capacity.toLocaleString()})`} error={errors.guests}>
              <input type="number" min={1} max={hall.capacity} value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))} className={inp(errors.guests)} />
            </Field>
          </Surface>
          <Surface raised className="p-6">
            <h2 className="font-display font-bold text-lg text-foreground mb-5">3. Add-ons (Optional)</h2>
            <div className="space-y-3">
              {ADD_ON_OPTIONS.map((ao) => (
                <label
                  key={ao.id}
                  className={cx(
                    "flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-colors",
                    addOns.includes(ao.id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={addOns.includes(ao.id)} onChange={() => toggleAddOn(ao.id)} className="w-4 h-4 accent-primary" />
                    <span className="text-sm font-medium text-foreground">{ao.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    ৳{ao.price.toLocaleString()}
                    {ao.unit === "per person" ? "/person" : ""}
                  </span>
                </label>
              ))}
            </div>
          </Surface>
          <Surface raised className="p-6 space-y-4">
            <h2 className="font-display font-bold text-lg text-foreground">4. Contact Details</h2>
            <Field label="Contact Person Name" error={errors.contactName}>
              <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Ahmed Rahman" className={inp(errors.contactName)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone" error={errors.contactPhone}>
                <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+880 1X00-000000" className={inp(errors.contactPhone)} />
              </Field>
              <Field label="Email" error={errors.contactEmail}>
                <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} type="email" placeholder="ahmed@example.com" className={inp(errors.contactEmail)} />
              </Field>
            </div>
            <Field label="Special Requests (optional)">
              <textarea value={specialReqs} onChange={(e) => setSpecialReqs(e.target.value)} rows={3} placeholder="Any special requirements…" className="field-input resize-none" />
            </Field>
          </Surface>
        </div>
        <div>
          <Surface raised className="p-5 sticky top-24 space-y-4">
            <div className="flex items-center gap-3">
              <ImageWithFallback src={hall.image} alt={hall.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
              <div>
                <p className="font-display font-bold text-sm text-foreground">{hall.name}</p>
                <p className="text-xs text-muted-foreground">{venue.name}</p>
                <p className="text-xs text-muted-foreground">
                  Floor {hall.floor} · Cap. {hall.capacity.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="space-y-1.5 text-sm border-t border-border pt-3">
              <div className="flex justify-between text-muted-foreground">
                <span>Date</span>
                <span className="text-foreground font-medium">{date || "—"}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Duration</span>
                <span className="text-foreground font-medium capitalize">{durationType}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Base price</span>
                <span>৳{basePrice.toLocaleString()}</span>
              </div>
              {addOns.map((id) => {
                const ao = ADD_ON_OPTIONS.find((a) => a.id === id)!;
                const p = ao.unit === "per person" ? ao.price * guestCount : ao.price;
                return (
                  <div key={id} className="flex justify-between text-muted-foreground text-xs">
                    <span>{ao.label}</span>
                    <span>৳{p.toLocaleString()}</span>
                  </div>
                );
              })}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">৳{totalPrice.toLocaleString()}</span>
              </div>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={handleConfirm}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              {busy ? "Confirming…" : "Confirm Booking"}
            </button>
            <p className="text-xs text-muted-foreground text-center">Confirmation sent to your email.</p>
          </Surface>
        </div>
      </div>
    </div>
  );
}

export function HallConfirmationView({ booking, onBackVenues, onMyBookings }: { booking: HallBooking; onBackVenues: () => void; onMyBookings: () => void }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 size={28} className="text-primary" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-foreground mb-2">Hall booking confirmed</h1>
        <p className="text-muted-foreground text-sm">Your venue is reserved. Confirmation sent to your email.</p>
      </div>
      <Surface raised className="overflow-hidden">
        <div className="bg-primary px-6 py-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Booking reference</p>
              <p className="text-xl font-bold font-display">{booking.id}</p>
            </div>
            <Badge color="green">Confirmed</Badge>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-5 mb-5">
            {[
              { label: "Hall", value: booking.hallName },
              { label: "Venue", value: booking.venueName },
              { label: "Date", value: booking.date },
              { label: "Duration", value: booking.durationType.replace("-", " ") },
              { label: "Time", value: `${booking.startTime} — ${booking.endTime}` },
              { label: "Purpose", value: booking.purpose },
              { label: "Guests", value: `${booking.guestCount} people` },
              { label: "Contact", value: booking.contactName },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                <p className="font-semibold text-sm text-foreground capitalize">{value}</p>
              </div>
            ))}
          </div>
          {booking.addOns.length > 0 && (
            <div className="border-t border-border pt-4 mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Add-ons</p>
              <div className="flex flex-wrap gap-1.5">
                {booking.addOns.map((id) => {
                  const ao = ADD_ON_OPTIONS.find((a) => a.id === id);
                  return ao ? (
                    <span key={id} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      {ao.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
          <div className="border-t border-border pt-4 flex justify-between items-center">
            <span className="font-semibold text-foreground">Total paid</span>
            <span className="text-xl font-extrabold text-primary">৳{booking.total.toLocaleString()}</span>
          </div>
        </div>
      </Surface>
      <div className="flex gap-3 mt-6">
        <button type="button" onClick={onBackVenues} className="flex-1 flex items-center justify-center gap-2 py-2.5 surface rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Building2 size={15} /> Back to Venues
        </button>
        <button type="button" onClick={onMyBookings} className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          My Bookings
        </button>
      </div>
    </div>
  );
}
