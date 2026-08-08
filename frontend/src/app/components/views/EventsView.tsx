import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { CATEGORY_GROUPS, PRICE_FILTERS, SORT_OPTIONS } from "../../lib/constants";
import type { SeatFlowEvent } from "../../lib/types";
import { EmptyState, FilterChip } from "../atoms";
import { EventCard } from "./EventCard";

export function EventsView({ events, onSelectEvent }: { events: SeatFlowEvent[]; onSelectEvent: (e: SeatFlowEvent) => void }) {
  const [search, setSearch] = useState(""),
    [activeCategory, setActiveCategory] = useState("All"),
    [priceFilter, setPriceFilter] = useState("All Prices"),
    [sort, setSort] = useState("Date");
  const filtered = events
    .filter((e) => {
      const matchCat = activeCategory === "All" || e.category === activeCategory;
      const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.venue.toLowerCase().includes(search.toLowerCase());
      const matchPrice =
        priceFilter === "All Prices" ||
        (priceFilter === "Under ৳500" && e.priceFrom < 500) ||
        (priceFilter === "৳500-৳2000" && e.priceFrom >= 500 && e.priceFrom <= 2000) ||
        (priceFilter === "৳2000+" && e.priceFrom > 2000);
      return matchCat && matchSearch && matchPrice;
    })
    .sort((a, b) =>
      sort === "Popularity" ? b.soldSeats - a.soldSeats : sort === "Availability" ? a.totalSeats - a.soldSeats - (b.totalSeats - b.soldSeats) : sort === "Price" ? a.priceFrom - b.priceFrom : 0,
    );
  const hasFilters = activeCategory !== "All" || priceFilter !== "All Prices" || !!search;
  const selectCls =
    "appearance-none pl-3 pr-8 py-2 rounded-lg bg-card border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer";
  return (
    <div>
      <div className="relative bg-slate-900 text-white">
        <div className="absolute inset-0 opacity-30 bg-cover bg-center" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1440&q=60)" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-900/60" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-3">SeatFlow</p>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold mb-3 leading-tight max-w-xl">Book the best seats in Dhaka</h1>
          <p className="text-slate-300 text-sm sm:text-base mb-6 max-w-lg">Concerts, conferences, theatre, and cricket — search, pick a seat, and confirm in minutes.</p>
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-slate-400 pointer-events-none" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events, venues, artists…"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white text-slate-900 placeholder-slate-400 shadow-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              aria-label="Search events"
            />
          </div>
        </div>
      </div>
      <div className="sticky top-16 z-10 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 flex-wrap">
          <div className="flex gap-2 overflow-x-auto scrollbar-none items-center">
            <FilterChip active={activeCategory === "All"} onClick={() => setActiveCategory("All")}>
              All
            </FilterChip>
            <div className="relative">
              <label className="sr-only" htmlFor="event-category">
                Category
              </label>
              <select
                id="event-category"
                value={activeCategory === "All" ? "" : activeCategory}
                onChange={(e) => setActiveCategory(e.target.value || "All")}
                className={selectCls}
              >
                <option value="">Category</option>
                {CATEGORY_GROUPS.map((group) => (
                  <optgroup key={group.name} label={`${group.emoji} ${group.name}`}>
                    {group.items.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <label className="sr-only" htmlFor="event-sort">
                Sort
              </label>
              <select id="event-sort" value={sort} onChange={(e) => setSort(e.target.value)} className={selectCls}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            <div className="relative">
              <label className="sr-only" htmlFor="event-price">
                Price
              </label>
              <select id="event-price" value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)} className={selectCls}>
                {PRICE_FILTERS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {filtered.length} event{filtered.length !== 1 ? "s" : ""} found
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setActiveCategory("All");
                setPriceFilter("All Prices");
                setSearch("");
              }}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No events found"
            description="Try another search or clear filters to see everything on sale."
            action={
              hasFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("All");
                    setPriceFilter("All Prices");
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} onClick={() => onSelectEvent(event)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
