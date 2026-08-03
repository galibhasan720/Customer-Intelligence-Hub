import { useState } from "react";
import { ArrowLeft, Building2, Check, CheckCircle, ChevronDown, MapPin, Phone, Search, Users } from "lucide-react";
import { motion } from "motion/react";
import { Badge, StarsRow } from "../atoms";
import { ADD_ON_OPTIONS, BOOKING_PURPOSES, VENUE_TYPES } from "../../lib/constants";
import { itemVariants, listVariants } from "../../lib/animations";
import type { Hall, HallBooking, Venue } from "../../lib/types";
import { cx } from "../../lib/utils";

export function VenueBrowseView({venues,loading,onSelectVenue}:{venues:Venue[];loading?:boolean;onSelectVenue:(v:Venue)=>void}) {
  const [search,setSearch]=useState(""), [typeFilter,setTypeFilter]=useState("All"), [sort,setSort]=useState("Rating");
  const typeMatches=(venueType:string,filter:string)=>{
    if(filter==="All")return true;
    const normalize=(s:string)=>s.trim().toLowerCase().replace(/\s+/g," ").replace(/centre/g,"center");
    return normalize(venueType)===normalize(filter);
  };
  const filtered=venues
    .filter(v=>typeMatches(v.type,typeFilter)&&(v.name.toLowerCase().includes(search.toLowerCase())||v.city.toLowerCase().includes(search.toLowerCase())||v.address.toLowerCase().includes(search.toLowerCase())))
    .sort((a,b)=>sort==="Price"?a.priceFrom-b.priceFrom:b.rating-a.rating);
  return (
    <div>
      <div className="relative h-72 bg-gradient-to-br from-violet-900 via-violet-700 to-indigo-800 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:"url(https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1440&q=60)",backgroundSize:"cover",backgroundPosition:"center"}}/>
        <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.6}} className="relative z-10 text-center px-4 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Book the Perfect Venue</h1>
          <p className="text-violet-100 text-sm mb-5">Convention centers, hotel banquets, conference halls — all in one place.</p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-slate-500 dark:text-slate-300 pointer-events-none" size={16}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search venues or cities..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 dark:bg-white/12 backdrop-blur-md text-gray-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 shadow-xl focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm border border-white/60 dark:border-white/20"/>
          </div>
        </motion.div>
      </div>
      <div className="glass border-b border-white/20 sticky top-[57px] z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 flex-wrap">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">{VENUE_TYPES.map(t=><button key={t} onClick={()=>setTypeFilter(t)} className={cx("px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border",typeFilter===t?"bg-violet-600 text-white border-violet-600 shadow-sm":"bg-white/40 dark:bg-white/08 text-foreground border-white/30 dark:border-white/10 hover:border-violet-400 hover:text-violet-600")}>{t}</button>)}</div>
          <div className="relative ml-auto"><select value={sort} onChange={e=>setSort(e.target.value)} className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-white/60 dark:bg-slate-800/80 backdrop-blur-sm border border-white/40 dark:border-white/10 text-sm font-medium text-gray-900 dark:text-white [&>option]:text-gray-900 [&>option]:bg-white dark:[&>option]:text-white dark:[&>option]:bg-slate-800 focus:outline-none cursor-pointer">{["Rating","Price"].map(o=><option key={o}>{o}</option>)}</select><ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 pointer-events-none"/></div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-sm text-muted-foreground mb-5">{loading?"Loading venues…":`${filtered.length} venue${filtered.length!==1?"s":""} found`}</p>
        {!loading&&filtered.length===0?(<div className="text-center py-20 text-muted-foreground"><Building2 size={40} className="mx-auto mb-3 opacity-30"/><p className="text-lg font-medium">No venues found</p></div>):(
          <motion.div variants={listVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(venue=>(
              <motion.div key={venue.id} variants={itemVariants} whileHover={{y:-6,scale:1.015}} whileTap={{scale:0.98}} transition={{type:"spring",stiffness:380,damping:28}} onClick={()=>onSelectVenue(venue)} className="glass rounded-xl overflow-hidden shadow-xl cursor-pointer group">
                <div className="relative h-52 overflow-hidden"><img src={venue.image} alt={venue.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/><div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent"/><div className="absolute top-3 left-3"><span className="bg-violet-600 text-white text-xs font-semibold px-2 py-1 rounded-full">{venue.type}</span></div><div className="absolute bottom-3 left-3 right-3"><p className="text-white font-bold text-sm leading-snug line-clamp-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{venue.name}</p></div></div>
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2"><MapPin size={11}/><span className="truncate">{venue.address}</span></div>
                  <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-1.5"><StarsRow rating={venue.rating}/><span className="text-xs text-muted-foreground">{venue.rating} ({venue.reviewCount})</span></div><span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-semibold px-2 py-0.5 rounded-full">{venue.totalHalls} halls</span></div>
                  <div className="flex flex-wrap gap-1 mb-3">{venue.amenities.slice(0,4).map(a=><span key={a} className="text-xs bg-white/40 dark:bg-white/08 text-muted-foreground dark:text-white px-2 py-0.5 rounded-full">{a}</span>)}{venue.amenities.length>4&&<span className="text-xs text-primary font-medium">+{venue.amenities.length-4} more</span>}</div>
                  <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">From <span className="text-foreground font-bold">৳{venue.priceFrom.toLocaleString()}</span>/day</span><button className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-violet-700 transition-colors">View Halls</button></div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export function VenueDetailView({venue,halls,loading,onSelectHall,onBack}:{venue:Venue;halls:Hall[];loading?:boolean;onSelectHall:(h:Hall)=>void;onBack:()=>void}) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <motion.button whileTap={{scale:0.96}} onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-primary text-sm mb-6 transition-colors"><ArrowLeft size={16}/> Back to venues</motion.button>
      <div className="rounded-2xl overflow-hidden h-64 sm:h-80 mb-6 relative shadow-2xl"><img src={venue.image} alt={venue.name} className="w-full h-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent"/><div className="absolute bottom-5 left-6 right-6"><span className="bg-violet-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full mb-2 inline-block">{venue.type}</span><h1 className="text-2xl sm:text-3xl font-extrabold text-white" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{venue.name}</h1><p className="text-white/80 text-sm flex items-center gap-1.5 mt-1"><MapPin size={13}/>{venue.address}, {venue.city}</p></div></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-7">
          <div className="flex items-center gap-5"><div className="flex items-center gap-2"><StarsRow rating={venue.rating}/><span className="font-semibold text-sm text-foreground">{venue.rating}</span><span className="text-muted-foreground text-sm">({venue.reviewCount} reviews)</span></div><span className="text-muted-foreground text-sm">{venue.totalHalls} halls</span></div>
          <p className="text-muted-foreground leading-relaxed text-sm">{venue.description}</p>
          <div><h3 className="font-bold text-foreground mb-3" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Amenities & Facilities</h3><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{venue.amenities.map(a=><div key={a} className="flex items-center gap-2 glass-subtle rounded-lg px-3 py-2"><Check size={13} className="text-green-500 shrink-0"/><span className="text-sm text-foreground dark:text-white">{a}</span></div>)}</div></div>
          <div>
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-foreground text-lg" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Our Halls & Rooms</h3><span className="text-sm text-muted-foreground">{loading?"Loading…":`${halls.length} spaces`}</span></div>
            <motion.div variants={listVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {halls.map(hall=>(
                <motion.div key={hall.id} variants={itemVariants} className={cx("glass rounded-xl overflow-hidden shadow-lg",!hall.available&&"opacity-60")}>
                  <div className="relative h-40 overflow-hidden"><img src={hall.image} alt={hall.name} className="w-full h-full object-cover"/><div className="absolute top-2 right-2"><span className={cx("text-xs font-semibold px-2 py-0.5 rounded-full",hall.available?"bg-green-500 text-white":"bg-slate-400 text-white")}>{hall.available?"Available":"Fully Booked"}</span></div><div className="absolute top-2 left-2"><span className="bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">Floor {hall.floor}</span></div></div>
                  <div className="p-4">
                    <h4 className="font-bold text-foreground text-sm mb-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{hall.name}</h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground dark:text-white/70 mb-2"><span className="flex items-center gap-1"><Users size={11}/>{hall.capacity.toLocaleString()} guests</span><span>{hall.areaSqft.toLocaleString()} sqft</span></div>
                    <div className="flex flex-wrap gap-1 mb-3">{hall.amenities.slice(0,3).map(a=><span key={a} className="text-xs bg-white/40 dark:bg-white/08 text-muted-foreground dark:text-white px-2 py-0.5 rounded-full">{a}</span>)}</div>
                    <div className="space-y-0.5 text-xs text-muted-foreground dark:text-white/70 mb-3"><div className="flex justify-between"><span>Per hour</span><span className="font-semibold text-foreground dark:text-white">৳{hall.pricePerHour.toLocaleString()}</span></div><div className="flex justify-between"><span>Half day</span><span className="font-semibold text-foreground dark:text-white">৳{hall.priceHalfDay.toLocaleString()}</span></div><div className="flex justify-between"><span>Full day</span><span className="font-semibold text-foreground dark:text-white">৳{hall.priceFullDay.toLocaleString()}</span></div></div>
                    <motion.button whileHover={hall.available?{scale:1.02}:{}} whileTap={hall.available?{scale:0.97}:{}} disabled={!hall.available} onClick={()=>hall.available&&onSelectHall(hall)} className={cx("w-full py-2 rounded-xl text-sm font-bold transition-colors",hall.available?"bg-violet-600 text-white hover:bg-violet-700":"bg-white/30 dark:bg-white/08 text-muted-foreground cursor-not-allowed")}>{hall.available?"Book This Hall":"Fully Booked"}</motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
        <div>
          <div className="glass rounded-xl p-5 shadow-xl sticky top-20">
            <p className="text-sm text-muted-foreground mb-1">Starting from</p>
            <p className="text-2xl font-bold text-violet-600 mb-1">৳{venue.priceFrom.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mb-4">per day · varies by hall</p>
            <div className="space-y-2 mb-4">{halls.filter(h=>h.available).slice(0,3).map(h=><motion.button key={h.id} whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={()=>onSelectHall(h)} className="w-full text-left px-3 py-2.5 rounded-xl glass-subtle hover:border-violet-400 transition-all"><div className="flex justify-between items-center"><span className="text-sm font-medium text-foreground">{h.name}</span><span className="text-xs text-muted-foreground dark:text-white/70">cap. {h.capacity.toLocaleString()}</span></div><span className="text-xs text-violet-600 font-semibold">from ৳{h.priceFullDay.toLocaleString()}/day</span></motion.button>)}</div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground glass-subtle rounded-lg p-3"><Phone size={12} className="shrink-0 mt-0.5"/><span>Contact venue for custom packages and group bookings.</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HallBookingView({venue,hall,onConfirm,onBack}:{venue:Venue;hall:Hall;onConfirm:(b:HallBooking)=>void;onBack:()=>void}) {
  const [date,setDate]=useState(""), [durationType,setDurationType]=useState<"hourly"|"half-day"|"full-day">("full-day");
  const [startTime,setStartTime]=useState("09:00"), [endTime,setEndTime]=useState("17:00"), [halfPeriod,setHalfPeriod]=useState<"morning"|"afternoon">("morning");
  const [purpose,setPurpose]=useState(""), [guestCount,setGuestCount]=useState(50), [addOns,setAddOns]=useState<string[]>([]);
  const [contactName,setContactName]=useState(""), [contactPhone,setContactPhone]=useState(""), [contactEmail,setContactEmail]=useState(""), [specialReqs,setSpecialReqs]=useState("");
  const [errors,setErrors]=useState<Record<string,string>>({});
  const basePrice=durationType==="full-day"?hall.priceFullDay:durationType==="half-day"?hall.priceHalfDay:(()=>{const [sh]=startTime.split(":").map(Number),[eh]=endTime.split(":").map(Number);return hall.pricePerHour*Math.max(1,eh-sh);})();
  const addOnTotal=addOns.reduce((sum,id)=>{const ao=ADD_ON_OPTIONS.find(a=>a.id===id);if(!ao)return sum;return sum+(ao.unit==="per person"?ao.price*guestCount:ao.price);},0);
  const totalPrice=basePrice+addOnTotal;
  const toggleAddOn=(id:string)=>setAddOns(prev=>prev.includes(id)?prev.filter(a=>a!==id):[...prev,id]);
  const validate=()=>{const e:Record<string,string>={};if(!date)e.date="Please select a date";if(!purpose)e.purpose="Please select a purpose";if(guestCount<1||guestCount>hall.capacity)e.guests=`Between 1 and ${hall.capacity}`;if(!contactName.trim())e.contactName="Name is required";if(!contactPhone.trim())e.contactPhone="Phone is required";if(!contactEmail.includes("@"))e.contactEmail="Valid email required";setErrors(e);return Object.keys(e).length===0;};
  const handleConfirm=()=>{if(!validate())return;const actualStart=durationType==="half-day"&&halfPeriod==="afternoon"?"14:00":durationType==="full-day"?"08:00":startTime;const actualEnd=durationType==="full-day"?"20:00":durationType==="half-day"?halfPeriod==="morning"?"14:00":"20:00":endTime;onConfirm({id:`HB-${Math.floor(10000+Math.random()*90000)}`,venueId:venue.id,hallId:hall.id,venueName:venue.name,hallName:hall.name,date,startTime:actualStart,endTime:actualEnd,durationType,purpose,guestCount,addOns,total:totalPrice,status:"Confirmed",bookedAt:new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}),contactName,contactPhone,contactEmail});};
  const inp="w-full px-4 py-2.5 rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm";
  const errField=(k:string)=>errors[k]&&<p className="text-xs text-destructive mt-1">{errors[k]}</p>;
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <motion.button whileTap={{scale:0.96}} onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-primary text-sm mb-6 transition-colors"><ArrowLeft size={16}/> Back to halls</motion.button>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-xl p-6 shadow-xl space-y-4">
            <h2 className="font-bold text-lg text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>1. When?</h2>
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} className={inp}/>{errField("date")}</div>
            <div><label className="block text-sm font-semibold text-foreground mb-3">Duration</label><div className="grid grid-cols-3 gap-2">{(["hourly","half-day","full-day"] as const).map(val=><motion.button key={val} whileTap={{scale:0.96}} onClick={()=>setDurationType(val)} className={cx("py-2.5 rounded-xl text-sm font-semibold border-2 transition-all",durationType===val?"border-violet-600 bg-violet-600 text-white":"border-white/30 dark:border-white/10 text-foreground hover:border-violet-400")}>{val==="hourly"?"Hourly":val==="half-day"?"Half Day":"Full Day"}</motion.button>)}</div></div>
            {durationType==="hourly"&&<div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-semibold text-foreground mb-1.5">Start Time</label><input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} className={inp}/></div><div><label className="block text-sm font-semibold text-foreground mb-1.5">End Time</label><input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} className={inp}/></div></div>}
            {durationType==="half-day"&&<div><label className="block text-sm font-semibold text-foreground mb-2">Period</label><div className="grid grid-cols-2 gap-2">{(["morning","afternoon"] as const).map(val=><button key={val} onClick={()=>setHalfPeriod(val)} className={cx("py-2 rounded-xl text-sm font-medium border-2 transition-all",halfPeriod===val?"border-violet-600 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300":"border-white/30 dark:border-white/10 text-foreground hover:border-violet-400")}>{val==="morning"?"Morning (8am–2pm)":"Afternoon (2pm–8pm)"}</button>)}</div></div>}
            {durationType==="full-day"&&<p className="text-xs text-muted-foreground glass-subtle px-3 py-2 rounded-lg">Full day: 8:00 AM — 8:00 PM</p>}
          </div>
          <div className="glass rounded-xl p-6 shadow-xl space-y-4">
            <h2 className="font-bold text-lg text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>2. Your Event</h2>
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Purpose of Booking</label><select value={purpose} onChange={e=>setPurpose(e.target.value)} className={cx(inp,"text-foreground")}><option value="">Select purpose…</option>{BOOKING_PURPOSES.map(p=><option key={p}>{p}</option>)}</select>{errField("purpose")}</div>
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Estimated Guests <span className="text-muted-foreground font-normal">(max {hall.capacity.toLocaleString()})</span></label><input type="number" min={1} max={hall.capacity} value={guestCount} onChange={e=>setGuestCount(Number(e.target.value))} className={inp}/>{errField("guests")}</div>
          </div>
          <div className="glass rounded-xl p-6 shadow-xl">
            <h2 className="font-bold text-lg text-foreground mb-5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>3. Add-ons (Optional)</h2>
            <div className="space-y-3">{ADD_ON_OPTIONS.map(ao=><motion.label key={ao.id} whileHover={{scale:1.01}} className={cx("flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all",addOns.includes(ao.id)?"border-violet-500 bg-violet-50/60 dark:bg-violet-900/20":"border-white/30 dark:border-white/10 hover:border-violet-300")}><div className="flex items-center gap-3"><input type="checkbox" checked={addOns.includes(ao.id)} onChange={()=>toggleAddOn(ao.id)} className="w-4 h-4 accent-violet-600"/><span className="text-sm font-medium text-foreground">{ao.label}</span></div><span className="text-sm font-semibold text-violet-600">৳{ao.price.toLocaleString()}{ao.unit==="per person"?"/person":""}</span></motion.label>)}</div>
          </div>
          <div className="glass rounded-xl p-6 shadow-xl space-y-4">
            <h2 className="font-bold text-lg text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>4. Contact Details</h2>
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Contact Person Name</label><input value={contactName} onChange={e=>setContactName(e.target.value)} placeholder="Ahmed Rahman" className={inp}/>{errField("contactName")}</div>
            <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-semibold text-foreground mb-1.5">Phone</label><input value={contactPhone} onChange={e=>setContactPhone(e.target.value)} placeholder="+880 1X00-000000" className={inp}/>{errField("contactPhone")}</div><div><label className="block text-sm font-semibold text-foreground mb-1.5">Email</label><input value={contactEmail} onChange={e=>setContactEmail(e.target.value)} type="email" placeholder="ahmed@example.com" className={inp}/>{errField("contactEmail")}</div></div>
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Special Requests <span className="text-muted-foreground font-normal">(optional)</span></label><textarea value={specialReqs} onChange={e=>setSpecialReqs(e.target.value)} rows={3} placeholder="Any special requirements…" className={cx(inp,"resize-none")}/></div>
          </div>
        </div>
        <div>
          <div className="glass rounded-xl p-5 shadow-xl sticky top-20 space-y-4">
            <div className="flex items-center gap-3"><img src={hall.image} alt={hall.name} className="w-14 h-14 rounded-xl object-cover shrink-0"/><div><p className="font-bold text-sm text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{hall.name}</p><p className="text-xs text-muted-foreground">{venue.name}</p><p className="text-xs text-muted-foreground">Floor {hall.floor} · Cap. {hall.capacity.toLocaleString()}</p></div></div>
            <div className="space-y-1.5 text-sm border-t border-white/20 pt-3"><div className="flex justify-between text-muted-foreground"><span>Date</span><span className="text-foreground font-medium">{date||"—"}</span></div><div className="flex justify-between text-muted-foreground"><span>Duration</span><span className="text-foreground font-medium capitalize">{durationType}</span></div><div className="flex justify-between text-muted-foreground"><span>Base price</span><span>৳{basePrice.toLocaleString()}</span></div>{addOns.map(id=>{const ao=ADD_ON_OPTIONS.find(a=>a.id===id)!;const p=ao.unit==="per person"?ao.price*guestCount:ao.price;return<div key={id} className="flex justify-between text-muted-foreground text-xs"><span>{ao.label}</span><span>৳{p.toLocaleString()}</span></div>;})} <div className="flex justify-between font-bold text-base pt-2 border-t border-white/20"><span>Total</span><span className="text-violet-600">৳{totalPrice.toLocaleString()}</span></div></div>
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={handleConfirm} className="w-full bg-violet-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 shadow-lg"><CheckCircle size={16}/> Confirm Booking</motion.button>
            <p className="text-xs text-muted-foreground text-center">Confirmation sent to your email.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HallConfirmationView({booking,onBackVenues,onMyBookings}:{booking:HallBooking;onBackVenues:()=>void;onMyBookings:()=>void}) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <motion.div initial={{scale:0,rotate:-20}} animate={{scale:1,rotate:0}} transition={{type:"spring",stiffness:260,damping:18,delay:0.1}} className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-4"><Building2 size={28} className="text-violet-600"/></motion.div>
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.25}}><h1 className="text-2xl font-extrabold text-foreground mb-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Hall Booking Confirmed!</h1><p className="text-muted-foreground text-sm">Your venue is reserved. Confirmation sent to your email.</p></motion.div>
      </div>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.35}} className="glass rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-violet-700/90 to-indigo-700/90 backdrop-blur-sm px-6 py-4 text-white"><div className="flex justify-between items-start"><div><p className="text-violet-200 text-xs font-semibold uppercase tracking-widest mb-1">Booking Reference</p><p className="text-xl font-bold">{booking.id}</p></div><Badge color="green">Confirmed</Badge></div></div>
        <div className="relative h-4"><div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-white/30"/><div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-slate-950"/><div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-slate-950"/></div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-5 mb-5">{[{label:"Hall",value:booking.hallName},{label:"Venue",value:booking.venueName},{label:"Date",value:booking.date},{label:"Duration",value:booking.durationType.replace("-"," ")},{label:"Time",value:`${booking.startTime} — ${booking.endTime}`},{label:"Purpose",value:booking.purpose},{label:"Guests",value:`${booking.guestCount} people`},{label:"Contact",value:booking.contactName}].map(({label,value})=><div key={label}><p className="text-xs text-muted-foreground mb-0.5">{label}</p><p className="font-semibold text-sm text-foreground capitalize">{value}</p></div>)}</div>
          {booking.addOns.length>0&&<div className="border-t border-white/20 pt-4 mb-4"><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Add-ons</p><div className="flex flex-wrap gap-1.5">{booking.addOns.map(id=>{const ao=ADD_ON_OPTIONS.find(a=>a.id===id);return ao?<span key={id} className="text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full font-medium">{ao.label}</span>:null;})}</div></div>}
          <div className="border-t border-white/20 pt-4 flex justify-between items-center"><span className="font-semibold text-foreground">Total Paid</span><span className="text-xl font-extrabold text-violet-600">৳{booking.total.toLocaleString()}</span></div>
        </div>
      </motion.div>
      <div className="flex gap-3 mt-6"><motion.button whileTap={{scale:0.97}} onClick={onBackVenues} className="flex-1 flex items-center justify-center gap-2 py-2.5 glass rounded-xl text-sm font-semibold text-foreground hover:bg-white/40 transition-colors"><Building2 size={15}/> Back to Venues</motion.button><motion.button whileTap={{scale:0.97}} onClick={onMyBookings} className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg">My Bookings</motion.button></div>
    </div>
  );
}
