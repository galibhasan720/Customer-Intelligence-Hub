import { useState } from "react";
import { BadgeCheck, BarChart2, Edit2, Eye, Globe, Phone, Plus, Settings, Sparkles, Ticket, Trash2, TrendingDown, TrendingUp, Users, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Badge, StarsRow } from "../atoms";
import { EventDeleteConfirmModal } from "../modals/EventDeleteConfirmModal";
import { EventEditDrawer } from "../modals/EventEditDrawer";
import { EventViewModal } from "../modals/EventViewModal";
import { BOOKING_STATUS, BOOKING_TREND, CATEGORY_DATA, REVENUE_DATA } from "../../lib/constants";
import { spring } from "../../lib/animations";
import type { OrganizerProfile, SeatFlowEvent, Venue } from "../../lib/types";
import { cx, getInitials } from "../../lib/utils";
import { EventCreationWizard } from "./EventCreationWizard";

export function OrganizerView({events,venues,onAddEvent,onUpdateEvent,onDeleteEvent,profile,onUpdateProfile}:{events:SeatFlowEvent[];venues:Venue[];onAddEvent:(e:SeatFlowEvent)=>void;onUpdateEvent:(e:SeatFlowEvent)=>void;onDeleteEvent:(id:string)=>void;profile:OrganizerProfile;onUpdateProfile:(p:OrganizerProfile)=>void}) {
  const [tab,setTab]=useState<"analytics"|"events"|"profile">("analytics");
  const [showWizard,setShowWizard]=useState(false);
  const [viewingEvent,setViewingEvent]=useState<SeatFlowEvent|null>(null);
  const [editingEvent,setEditingEvent]=useState<SeatFlowEvent|null>(null);
  const [deletingEventId,setDeletingEventId]=useState<string|null>(null);
  const [localProfile,setLocalProfile]=useState<OrganizerProfile>(profile);
  const saveProfile=()=>{onUpdateProfile(localProfile);toast.success("Profile updated successfully!");};
  const updateField=(field:keyof OrganizerProfile,value:string|boolean)=>setLocalProfile(prev=>({...prev,[field]:value}));
  const inp="w-full px-4 py-2.5 rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-primary text-sm";
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {showWizard&&<EventCreationWizard venues={venues} onClose={()=>setShowWizard(false)} onPublish={event=>{onAddEvent(event);setTab("events");}}/>}
      <AnimatePresence>
        {viewingEvent&&<EventViewModal key="view" event={viewingEvent} onClose={()=>setViewingEvent(null)} onEdit={()=>{setEditingEvent(viewingEvent);setViewingEvent(null);}}/>}
        {editingEvent&&<EventEditDrawer key="edit" event={editingEvent} onSave={updated=>{onUpdateEvent(updated);setEditingEvent(null);}} onClose={()=>setEditingEvent(null)}/>}
        {deletingEventId&&(()=>{const ev=events.find(e=>e.id===deletingEventId);return ev?<EventDeleteConfirmModal key="del" event={ev} onConfirm={()=>{onDeleteEvent(deletingEventId);setDeletingEventId(null);toast.success("Event deleted.");}} onClose={()=>setDeletingEventId(null)}/>:null;})()}
      </AnimatePresence>
      <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center"><Settings size={18} className="text-violet-600"/></div><div><h2 className="font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Organizer Panel</h2><p className="text-sm text-muted-foreground">Manage events and view performance</p></div></div>
      <div className="flex gap-1 glass rounded-xl p-1 mb-6 w-fit">{(["analytics","events","profile"] as const).map(t=><button key={t} onClick={()=>setTab(t)} className={cx("px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all",tab===t?"bg-primary/90 text-white shadow-sm":"text-muted-foreground hover:text-foreground")}>{t==="analytics"?"Analytics":t==="events"?"My Events":"Profile"}</button>)}</div>

      {tab==="analytics"&&(
        <div className="space-y-6">

          {/* ── Section 1: 6 KPI cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {label:"Total Bookings",value:"223",delta:"+12%",positive:true,icon:Ticket},
              {label:"Seats Sold",value:"329 / 480",delta:"68.5%",positive:true,icon:Users},
              {label:"Est. Revenue",value:"৳18,420",delta:"+8.3%",positive:true,icon:BarChart2},
              {label:"Cancellation Rate",value:"4.2%",delta:"-0.8%",positive:true,icon:XCircle},
              {label:"Active Events",value:String(events.length),delta:"+1 this month",positive:true,icon:Sparkles},
              {label:"Avg. Ticket Price",value:"৳987",delta:"+৳43",positive:true,icon:Ticket},
            ].map(({label,value,delta,positive,icon:Icon})=>(
              <motion.div key={label} whileHover={{scale:1.03}} className="glass rounded-xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3"><p className="text-xs text-muted-foreground font-medium">{label}</p><Icon size={16} className="text-muted-foreground"/></div>
                <p className="text-xl font-extrabold text-foreground mb-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{value}</p>
                <span className={cx("flex items-center gap-1 text-xs font-semibold",positive?"text-green-600":"text-red-600")}>{positive?<TrendingUp size={12}/>:<TrendingDown size={12}/>} {delta} vs last week</span>
              </motion.div>
            ))}
          </div>

          {/* ── Section 2: Weekly trend + Status donut ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-xl p-5 shadow-lg">
              <h3 className="font-bold text-sm text-foreground mb-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Bookings This Week</h3>
              <p className="text-xs text-muted-foreground mb-4">This week total: <span className="font-semibold text-foreground">223 bookings</span></p>
              <div className="flex items-end gap-2 h-44">
                {(()=>{const max=Math.max(...BOOKING_TREND.map(d=>d.bookings));return BOOKING_TREND.map(d=>(
                  <div key={d.day} className="flex flex-col items-center gap-1.5 flex-1">
                    <span className="text-xs font-semibold text-muted-foreground">{d.bookings}</span>
                    <div className="w-full rounded-t-lg transition-all duration-700" style={{height:`${Math.round((d.bookings/max)*120)}px`,background:d.bookings===max?"#1D4ED8":"rgba(29,78,216,0.55)"}}/>
                    <span className="text-xs text-muted-foreground">{d.day}</span>
                  </div>
                ));})()}
              </div>
            </div>

            <div className="glass rounded-xl p-5 shadow-lg">
              <h3 className="font-bold text-sm text-foreground mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Booking Status Distribution</h3>
              <div className="flex items-center gap-6">
                <div className="relative shrink-0 w-32 h-32">
                  <div className="w-32 h-32 rounded-full" style={{background:`conic-gradient(#16A34A 0% 78%, #D97706 78% 92%, #DC2626 92% 100%)`}}/>
                  <div className="absolute inset-3 rounded-full bg-card flex flex-col items-center justify-center">
                    <p className="text-base font-extrabold text-foreground leading-tight">223</p>
                    <p className="text-xs text-muted-foreground">total</p>
                  </div>
                </div>
                <div className="space-y-3 flex-1">
                  {BOOKING_STATUS.map(s=>(
                    <div key={s.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:s.color}}/><span className="text-sm text-foreground">{s.label}</span></div>
                      <span className="text-sm font-bold" style={{color:s.color}}>{s.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 3: Revenue by event ── */}
          <div className="glass rounded-xl p-5 shadow-lg">
            <h3 className="font-bold text-sm text-foreground mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Revenue by Event</h3>
            <div className="space-y-4">
              {REVENUE_DATA.map(d=>{
                const pct=Math.round((d.revenue/d.target)*100);
                return (
                  <div key={d.event}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-sm font-medium text-foreground truncate max-w-[60%]">{d.event}</span>
                      <div className="text-right shrink-0 ml-2">
                        <span className="text-sm font-bold" style={{color:d.color}}>৳{d.revenue.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground ml-1">/ ৳{d.target.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.15)"}}>
                      <div className="h-full rounded-full transition-all duration-700" style={{width:`${pct}%`,background:d.color}}/>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{pct}% of target</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Section 4: Category breakdown + Top Events ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-xl p-5 shadow-lg">
              <h3 className="font-bold text-sm text-foreground mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>By Category</h3>
              <div className="space-y-3">
                {CATEGORY_DATA.map(d=>{const max=Math.max(...CATEGORY_DATA.map(x=>x.value));const pct=Math.round((d.value/max)*100);return(
                  <div key={d.name}><div className="flex items-center justify-between text-xs mb-1.5"><span className="font-medium text-foreground">{d.name}</span><span className="text-muted-foreground font-semibold">{d.value}%</span></div><div className="h-2.5 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.15)"}}><div className="h-full rounded-full transition-all duration-700" style={{width:`${pct}%`,background:d.fill}}/></div></div>
                );})}
              </div>
            </div>

            <div className="glass rounded-xl p-5 shadow-lg">
              <h3 className="font-bold text-sm text-foreground mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Top Events by Occupancy</h3>
              <div className="space-y-3">
                {[...events].sort((a,b)=>b.soldSeats-a.soldSeats).slice(0,4).map((event,i)=>{
                  const pct=Math.round((event.soldSeats/event.totalSeats)*100);
                  const rankColors=["#1D4ED8","#16A34A","#D97706","#7C3AED"];
                  return (
                    <div key={event.id} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{background:rankColors[i]}}>#{i+1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{event.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.15)"}}><div className="h-full rounded-full" style={{width:`${pct}%`,background:rankColors[i]}}/></div>
                          <span className={cx("text-xs font-bold px-1.5 py-0.5 rounded-full",pct>=90?"bg-red-100 text-red-700":pct>=75?"bg-amber-100 text-amber-700":"bg-green-100 text-green-700")}>{pct}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Section 5: Seat Availability ── */}
          <div className="glass rounded-xl p-5 shadow-lg">
            <h3 className="font-bold text-sm text-foreground mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Seat Availability</h3>
            <div className="space-y-3">
              {events.slice(0,4).map(event=>{
                const pct=Math.round((event.soldSeats/event.totalSeats)*100);
                return (
                  <div key={event.id}>
                    <div className="flex justify-between text-sm mb-1 items-center">
                      <div className="flex items-center gap-2"><span className="text-foreground font-medium">{event.title}</span>{pct>=90&&<span className="text-xs font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">URGENT</span>}{pct>=75&&pct<90&&<span className="text-xs font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">FULL SOON</span>}</div>
                      <span className="text-muted-foreground shrink-0 ml-2">{event.soldSeats}/{event.totalSeats} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.25)"}}><div className={cx("h-full rounded-full",pct>=90?"bg-red-500":pct>=60?"bg-amber-500":"bg-green-500")} style={{width:`${pct}%`}}/></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab==="events"&&(
        <div className="space-y-4">
          <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{events.length} events listed</p><motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={()=>setShowWizard(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg"><Plus size={15}/> Create Event</motion.button></div>
          <div className="glass rounded-xl shadow-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/20"><th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Event</th><th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Date</th><th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Seats</th><th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Status</th><th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th></tr></thead>
              <tbody className="divide-y divide-white/10">{events.map(event=>{
                const pct=Math.round((event.soldSeats/event.totalSeats)*100);
                const isDraft=event.status==="draft";
                return(
                  <tr key={event.id} className={cx("hover:bg-white/10 transition-colors",isDraft&&"opacity-80")}>
                    <td className="p-4"><div className="flex items-center gap-3"><img src={event.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0"/><div><p className="font-semibold text-foreground text-sm leading-tight">{event.title}</p><div className="flex items-center gap-1.5 mt-0.5"><p className="text-xs text-muted-foreground">{event.venue}</p>{isDraft&&<span className="text-xs text-amber-600 dark:text-amber-400 font-bold">• Draft</span>}</div></div></div></td>
                    <td className="p-4 text-muted-foreground text-sm hidden sm:table-cell">{event.date}</td>
                    <td className="p-4 hidden md:table-cell"><div><div className="text-xs text-muted-foreground mb-1">{event.soldSeats}/{event.totalSeats}</div><div className="h-1.5 w-20 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.2)"}}><div className={cx("h-full rounded-full",pct>=90?"bg-red-500":pct>=60?"bg-amber-500":"bg-green-500")} style={{width:`${pct}%`}}/></div></div></td>
                    <td className="p-4 hidden md:table-cell">{isDraft?<Badge color="slate">Draft</Badge>:<Badge color={pct>=90?"red":pct>=60?"amber":"green"}>{pct>=90?"Almost Full":pct>=60?"Selling":"Open"}</Badge>}</td>
                    <td className="p-4"><div className="flex items-center justify-end gap-2">
                      {isDraft&&<motion.button whileTap={{scale:0.93}} onClick={()=>{onUpdateEvent({...event,status:"published"});toast.success(`"${event.title}" is now live!`);}} className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors" title="Publish event"><Sparkles size={11}/> Publish</motion.button>}
                      <motion.button whileTap={{scale:0.93}} onClick={()=>setViewingEvent(event)} title="View event" className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-white/20 transition-colors"><Eye size={14}/></motion.button>
                      <motion.button whileTap={{scale:0.93}} onClick={()=>setEditingEvent(event)} title="Edit event" className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-white/20 transition-colors"><Edit2 size={14}/></motion.button>
                      <motion.button whileTap={{scale:0.93}} onClick={()=>setDeletingEventId(event.id)} title="Delete event" className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={14}/></motion.button>
                    </div></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="profile"&&(
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 shadow-xl text-center">
              <div className="relative inline-block mb-4"><div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-white text-3xl font-extrabold mx-auto" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{getInitials(localProfile.name)}</div>{localProfile.verified&&<motion.div initial={{scale:0}} animate={{scale:1}} transition={spring} className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900"><BadgeCheck size={14} className="text-white"/></motion.div>}</div>
              <p className="font-bold text-foreground text-lg" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{localProfile.name}</p>
              <p className="text-sm text-muted-foreground mb-1">{localProfile.organizationName}</p>
              <p className="text-xs text-muted-foreground">Member since {localProfile.memberSince}</p>
              <div className="flex justify-center gap-1 mt-2"><StarsRow rating={localProfile.rating}/><span className="text-xs text-muted-foreground ml-1">{localProfile.rating}</span></div>
            </div>
            <div className="grid grid-cols-3 gap-3">{[{label:"Events",value:localProfile.eventsCreated},{label:"Bookings",value:localProfile.totalBookings.toLocaleString()},{label:"Rating",value:localProfile.rating}].map(({label,value})=><motion.div key={label} whileHover={{scale:1.05}} className="glass rounded-xl p-3 text-center shadow-lg"><p className="text-lg font-extrabold text-primary">{value}</p><p className="text-xs text-muted-foreground">{label}</p></motion.div>)}</div>
            <div className="glass rounded-xl p-4 shadow-lg"><label className="flex items-center justify-between cursor-pointer"><div><p className="text-sm font-semibold text-foreground flex items-center gap-1.5"><BadgeCheck size={14} className="text-green-500"/> Verified Organizer</p><p className="text-xs text-muted-foreground mt-0.5">Reviewed by SeatFlow admin</p></div><div className={cx("w-11 h-6 rounded-full transition-colors relative",localProfile.verified?"bg-green-500":"bg-white/30 dark:bg-white/10")} onClick={()=>updateField("verified",!localProfile.verified)}><div className={cx("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",localProfile.verified?"left-5":"left-0.5")}/></div></label></div>
          </div>
          <div className="lg:col-span-2">
            <div className="glass rounded-xl p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-foreground text-lg mb-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Edit Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-semibold text-foreground mb-1.5">Full Name</label><input value={localProfile.name} onChange={e=>updateField("name",e.target.value)} className={inp}/></div><div><label className="block text-sm font-semibold text-foreground mb-1.5">Organization</label><input value={localProfile.organizationName} onChange={e=>updateField("organizationName",e.target.value)} className={inp}/></div></div>
              <div><label className="block text-sm font-semibold text-foreground mb-1.5">Bio</label><textarea value={localProfile.bio} onChange={e=>updateField("bio",e.target.value)} rows={3} className={cx(inp,"resize-none")}/></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1"><Phone size={13} className="text-primary"/> Phone</label><input value={localProfile.phone} onChange={e=>updateField("phone",e.target.value)} className={inp}/></div><div><label className="block text-sm font-semibold text-foreground mb-1.5">Email</label><input value={localProfile.email} onChange={e=>updateField("email",e.target.value)} type="email" className={inp}/></div></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1"><Globe size={13} className="text-primary"/> Website</label><input value={localProfile.website} onChange={e=>updateField("website",e.target.value)} className={inp}/></div><div><label className="block text-sm font-semibold text-foreground mb-1.5">City</label><input value={localProfile.city} onChange={e=>updateField("city",e.target.value)} className={inp}/></div></div>
              <div><label className="block text-sm font-semibold text-foreground mb-1.5">Address</label><input value={localProfile.address} onChange={e=>updateField("address",e.target.value)} className={inp}/></div>
              <div className="flex justify-end pt-2"><motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={saveProfile} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"><Check size={15}/> Save Changes</motion.button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
