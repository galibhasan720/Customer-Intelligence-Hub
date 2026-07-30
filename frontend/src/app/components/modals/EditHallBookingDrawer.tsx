import { useState } from "react";
import { Check, X } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ADD_ON_OPTIONS, BOOKING_PURPOSES } from "../../lib/constants";
import type { Hall, HallBooking } from "../../lib/types";
import { cx } from "../../lib/utils";

export function EditHallBookingDrawer({booking,halls,onSave,onClose}:{booking:HallBooking;halls:Hall[];onSave:(b:HallBooking)=>void;onClose:()=>void}) {
  const [date,setDate]=useState(booking.date), [durationType,setDurationType]=useState(booking.durationType);
  const [purpose,setPurpose]=useState(booking.purpose), [guestCount,setGuestCount]=useState(booking.guestCount);
  const [addOns,setAddOns]=useState<string[]>(booking.addOns);
  const [contactName,setContactName]=useState(booking.contactName), [contactPhone,setContactPhone]=useState(booking.contactPhone), [contactEmail,setContactEmail]=useState(booking.contactEmail||"");
  const hall=halls.find(h=>h.id===booking.hallId);
  const basePrice=durationType==="full-day"?(hall?.priceFullDay||0):durationType==="half-day"?(hall?.priceHalfDay||0):(hall?.pricePerHour||0)*3;
  const addOnTotal=addOns.reduce((sum,id)=>{const ao=ADD_ON_OPTIONS.find(a=>a.id===id);if(!ao)return sum;return sum+(ao.unit==="per person"?ao.price*guestCount:ao.price);},0);
  const total=basePrice+addOnTotal;
  const toggleAddOn=(id:string)=>setAddOns(prev=>prev.includes(id)?prev.filter(a=>a!==id):[...prev,id]);
  const save=async()=>{if(!contactName.trim()){toast.error("Contact name is required");return;}try{await onSave({...booking,date,durationType,purpose,guestCount,addOns,total,contactName,contactPhone,contactEmail});onClose();}catch{/* parent toasts */}};
  const inp="w-full px-4 py-2.5 rounded-lg glass-input focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm";
  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{x:"100%",opacity:0}} animate={{x:0,opacity:1}} exit={{x:"100%",opacity:0}} transition={{type:"spring",stiffness:280,damping:30}}
        className="fixed inset-y-0 right-0 w-full sm:w-[460px] glass-float z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 shrink-0">
          <div><h2 className="font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Edit Hall Booking</h2><p className="text-xs text-muted-foreground">{booking.hallName} · {booking.venueName}</p></div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/20 transition-colors"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div><label className="block text-sm font-semibold text-foreground mb-1.5">Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} className={inp}/></div>
          <div><label className="block text-sm font-semibold text-foreground mb-2">Duration</label><div className="grid grid-cols-3 gap-2">{(["hourly","half-day","full-day"] as const).map(val=><button key={val} onClick={()=>setDurationType(val)} className={cx("py-2 rounded-lg text-sm font-semibold border-2 transition-all",durationType===val?"border-violet-600 bg-violet-600 text-white":"border-white/30 dark:border-white/10 text-foreground hover:border-violet-400")}>{val==="hourly"?"Hourly":val==="half-day"?"Half Day":"Full Day"}</button>)}</div></div>
          <div><label className="block text-sm font-semibold text-foreground mb-1.5">Purpose</label><select value={purpose} onChange={e=>setPurpose(e.target.value)} className={cx(inp,"text-foreground")}>{BOOKING_PURPOSES.map(p=><option key={p}>{p}</option>)}</select></div>
          <div><label className="block text-sm font-semibold text-foreground mb-1.5">Guest Count</label><input type="number" min={1} value={guestCount} onChange={e=>setGuestCount(Number(e.target.value))} className={inp}/></div>
          <div><label className="block text-sm font-semibold text-foreground mb-2">Add-ons</label><div className="space-y-2">{ADD_ON_OPTIONS.map(ao=><label key={ao.id} className={cx("flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all",addOns.includes(ao.id)?"border-violet-500 bg-violet-50/60 dark:bg-violet-900/20":"border-white/30 dark:border-white/10 hover:border-violet-300")}><div className="flex items-center gap-2"><input type="checkbox" checked={addOns.includes(ao.id)} onChange={()=>toggleAddOn(ao.id)} className="w-4 h-4 accent-violet-600"/><span className="text-sm text-foreground">{ao.label}</span></div><span className="text-xs font-semibold text-violet-600">৳{ao.price.toLocaleString()}{ao.unit==="per person"?"/p":""}</span></label>)}</div></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Contact Name</label><input value={contactName} onChange={e=>setContactName(e.target.value)} className={inp}/></div>
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Phone</label><input value={contactPhone} onChange={e=>setContactPhone(e.target.value)} className={inp}/></div>
          </div>
          <div><label className="block text-sm font-semibold text-foreground mb-1.5">Email</label><input value={contactEmail} onChange={e=>setContactEmail(e.target.value)} type="email" className={inp}/></div>
          <div className="glass-subtle rounded-xl p-4 flex justify-between items-center"><span className="text-sm font-semibold text-foreground">Updated Total</span><span className="text-lg font-extrabold text-violet-600">৳{total.toLocaleString()}</span></div>
        </div>
        <div className="px-6 py-4 border-t border-white/20 flex gap-3 shrink-0">
          <motion.button whileTap={{scale:0.96}} onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/40 dark:border-white/10 text-sm font-semibold text-foreground hover:bg-white/20 transition-colors">Discard</motion.button>
          <motion.button whileTap={{scale:0.96}} onClick={save} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors flex items-center justify-center gap-1.5"><Check size={14}/> Save Changes</motion.button>
        </div>
      </motion.div>
    </>
  );
}
