import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { motion } from "motion/react";
import { CATEGORY_GROUPS, PRICE_FILTERS, SORT_OPTIONS } from "../../lib/constants";
import { itemVariants, listVariants } from "../../lib/animations";
import type { SeatFlowEvent } from "../../lib/types";
import { cx } from "../../lib/utils";
import { EventCard } from "./EventCard";

export function EventsView({events,onSelectEvent}:{events:SeatFlowEvent[];onSelectEvent:(e:SeatFlowEvent)=>void}) {
  const [search,setSearch]=useState(""), [activeCategory,setActiveCategory]=useState("All"), [priceFilter,setPriceFilter]=useState("All Prices"), [sort,setSort]=useState("Date");
  const filtered=events.filter(e=>{
    const matchCat=activeCategory==="All"||e.category===activeCategory;
    const matchSearch=e.title.toLowerCase().includes(search.toLowerCase())||e.venue.toLowerCase().includes(search.toLowerCase());
    const matchPrice=priceFilter==="All Prices"||(priceFilter==="Under ৳500"&&e.priceFrom<500)||(priceFilter==="৳500-৳2000"&&e.priceFrom>=500&&e.priceFrom<=2000)||(priceFilter==="৳2000+"&&e.priceFrom>2000);
    return matchCat&&matchSearch&&matchPrice;
  }).sort((a,b)=>sort==="Popularity"?b.soldSeats-a.soldSeats:sort==="Availability"?(a.totalSeats-a.soldSeats)-(b.totalSeats-b.soldSeats):sort==="Price"?a.priceFrom-b.priceFrom:0);
  const hasFilters=activeCategory!=="All"||priceFilter!=="All Prices"||!!search;
  const pillCls=(active:boolean)=>cx("px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border",active?"bg-primary text-white border-primary shadow-sm":"bg-white/40 dark:bg-white/08 text-foreground border-white/30 dark:border-white/10 hover:border-primary hover:text-primary");
  return (
    <div>
      <div className="relative h-80 sm:h-96 bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-800 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:"url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1440&q=60)",backgroundSize:"cover",backgroundPosition:"center"}}/>
        <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.6,ease:[0.25,0.46,0.45,0.94]}} className="relative z-10 text-center px-4 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-3 leading-tight" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Find Your Next<br/>Unforgettable Event</h1>
          <p className="text-blue-100 text-sm sm:text-lg mb-6">Concerts, conferences, theatre, cricket — book the best seats instantly.</p>
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-slate-500 dark:text-slate-300 pointer-events-none" size={18}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search events, venues, artists..." className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/90 dark:bg-white/12 backdrop-blur-md text-gray-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 shadow-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm border border-white/60 dark:border-white/20"/>
          </div>
        </motion.div>
      </div>
      <div className="glass border-b border-white/20 sticky top-[57px] z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 flex-wrap">
          <div className="flex gap-2 overflow-x-auto scrollbar-none items-center">
            <button onClick={()=>setActiveCategory("All")} className={pillCls(activeCategory==="All")}>All</button>
            <div className="relative">
              <select
                value={activeCategory==="All"?"":activeCategory}
                onChange={e=>setActiveCategory(e.target.value||"All")}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-white/60 dark:bg-slate-800/80 backdrop-blur-sm border border-white/40 dark:border-white/10 text-sm font-medium text-gray-900 dark:text-white [&>option]:text-gray-900 [&>option]:bg-white dark:[&>option]:text-white dark:[&>option]:bg-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="">Category</option>
                {CATEGORY_GROUPS.map(group=>(
                  <optgroup key={group.name} label={`${group.emoji} ${group.name}`}>
                    {group.items.map(item=><option key={item} value={item}>{item}</option>)}
                  </optgroup>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 pointer-events-none"/>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative"><select value={sort} onChange={e=>setSort(e.target.value)} className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-white/60 dark:bg-slate-800/80 backdrop-blur-sm border border-white/40 dark:border-white/10 text-sm font-medium text-gray-900 dark:text-white [&>option]:text-gray-900 [&>option]:bg-white dark:[&>option]:text-white dark:[&>option]:bg-slate-800 focus:outline-none cursor-pointer">{SORT_OPTIONS.map(o=><option key={o}>{o}</option>)}</select><ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 pointer-events-none"/></div>
            <div className="relative"><select value={priceFilter} onChange={e=>setPriceFilter(e.target.value)} className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-white/60 dark:bg-slate-800/80 backdrop-blur-sm border border-white/40 dark:border-white/10 text-sm font-medium text-gray-900 dark:text-white [&>option]:text-gray-900 [&>option]:bg-white dark:[&>option]:text-white dark:[&>option]:bg-slate-800 focus:outline-none cursor-pointer">{PRICE_FILTERS.map(f=><option key={f}>{f}</option>)}</select><ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 pointer-events-none"/></div>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4"><p className="text-sm text-muted-foreground">{filtered.length} event{filtered.length!==1?"s":""} found</p>{hasFilters&&<button onClick={()=>{setActiveCategory("All");setPriceFilter("All Prices");setSearch("");}} className="text-xs text-primary hover:underline">Clear filters</button>}</div>
        {filtered.length===0?(<div className="text-center py-20 text-muted-foreground"><Search size={40} className="mx-auto mb-3 opacity-30"/><p className="text-lg font-medium">No events found</p></div>):(
          <motion.div variants={listVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(event=><motion.div key={event.id} variants={itemVariants}><EventCard event={event} onClick={()=>onSelectEvent(event)}/></motion.div>)}
          </motion.div>
        )}
      </div>
    </div>
  );
}
