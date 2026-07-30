import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { CANCEL_REASONS } from "../../lib/constants";
import { modalVariants } from "../../lib/animations";

export function CancelConfirmModal({bookingRef,title,onConfirm,onClose}:{bookingRef:string;title:string;onConfirm:(r:string)=>void;onClose:()=>void}) {
  const [reason,setReason]=useState(CANCEL_REASONS[0]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        className="glass rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-center w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full mx-auto mb-4"><AlertCircle size={28} className="text-amber-500"/></div>
        <h2 className="text-lg font-extrabold text-foreground text-center mb-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Cancel this booking?</h2>
        <p className="text-sm text-muted-foreground text-center mb-4">Ref: <span className="font-semibold text-foreground">{bookingRef}</span></p>
        <div className="glass-subtle rounded-lg px-3 py-2.5 mb-4"><p className="text-xs text-muted-foreground mb-0.5">Booking</p><p className="text-sm font-semibold text-foreground line-clamp-1">{title}</p></div>
        <div className="mb-5">
          <label className="block text-sm font-semibold text-foreground mb-1.5">Reason for cancellation</label>
          <select value={reason} onChange={e=>setReason(e.target.value)} className="w-full px-3 py-2.5 rounded-lg glass-input focus:outline-none focus:ring-2 focus:ring-primary text-sm text-foreground">
            {CANCEL_REASONS.map(r=><option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <motion.button whileTap={{scale:0.96}} onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/40 dark:border-white/10 text-sm font-semibold text-foreground hover:bg-white/20 transition-colors">Keep Booking</motion.button>
          <motion.button whileTap={{scale:0.96}} onClick={()=>onConfirm(reason)} className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-sm font-bold hover:bg-red-700 transition-colors">Yes, Cancel</motion.button>
        </div>
      </motion.div>
    </div>
  );
}
