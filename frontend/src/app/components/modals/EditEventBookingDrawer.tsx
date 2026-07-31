import { useState } from "react";
import { AlertCircle, Check, X } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { Booking } from "../../lib/types";

export function EditEventBookingDrawer({booking,onSave,onClose}:{booking:Booking;onSave:(b:Booking)=>void;onClose:()=>void}) {
  const [name,setName]=useState(booking.guestName||""), [email,setEmail]=useState(booking.guestEmail||""), [error,setError]=useState("");
  const save=()=>{if(!name.trim()){setError("Name is required");return;}if(!email.includes("@")){setError("Valid email required");return;}onSave({...booking,guestName:name,guestEmail:email});toast.success("Booking updated!");onClose();};
  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{x:"100%",opacity:0}} animate={{x:0,opacity:1}} exit={{x:"100%",opacity:0}} transition={{type:"spring",stiffness:280,damping:30}}
        className="fixed inset-y-0 right-0 w-full sm:w-[420px] glass-float z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 shrink-0">
          <div><h2 className="font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Edit Booking</h2><p className="text-xs text-muted-foreground">Ref: {booking.id}</p></div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/20 transition-colors"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="glass-subtle rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Booking Details (read-only)</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[{l:"Event",v:booking.eventTitle},{l:"Date",v:booking.date},{l:"Venue",v:booking.venue},{l:"Seats",v:booking.seats.join(", ")}].map(({l,v})=><div key={l}><p className="text-xs text-muted-foreground">{l}</p><p className="font-semibold text-foreground text-xs leading-tight">{v}</p></div>)}
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-sm font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Update Your Details</p>
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Full Name</label><input value={name} onChange={e=>setName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg glass-input focus:outline-none focus:ring-2 focus:ring-primary text-sm"/></div>
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Email Address</label><input value={email} onChange={e=>setEmail(e.target.value)} type="email" className="w-full px-4 py-2.5 rounded-lg glass-input focus:outline-none focus:ring-2 focus:ring-primary text-sm"/></div>
            {error&&<p className="text-xs text-destructive flex items-center gap-1"><AlertCircle size={12}/>{error}</p>}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/20 flex gap-3 shrink-0">
          <motion.button whileTap={{scale:0.96}} onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/40 dark:border-white/10 text-sm font-semibold text-foreground hover:bg-white/20 transition-colors">Discard</motion.button>
          <motion.button whileTap={{scale:0.96}} onClick={save} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"><Check size={14}/> Save Changes</motion.button>
        </div>
      </motion.div>
    </>
  );
}
