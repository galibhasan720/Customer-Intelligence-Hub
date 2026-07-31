import { AlertCircle, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { modalVariants } from "../../lib/animations";
import type { SeatFlowEvent } from "../../lib/types";

export function EventDeleteConfirmModal({event,onConfirm,onClose}:{event:SeatFlowEvent;onConfirm:()=>void;onClose:()=>void}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md" onClick={onClose}>
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        className="glass rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-center w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4"><Trash2 size={24} className="text-destructive"/></div>
        <h2 className="text-lg font-extrabold text-foreground text-center mb-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Delete this event?</h2>
        <p className="text-xs text-muted-foreground text-center mb-4">This action cannot be undone.</p>
        <div className="glass-subtle rounded-lg px-3 py-2.5 mb-3">
          <p className="text-xs text-muted-foreground mb-0.5">Event</p>
          <p className="text-sm font-semibold text-foreground line-clamp-1">{event.title}</p>
          <p className="text-xs text-muted-foreground">{event.date} · {event.soldSeats} tickets sold</p>
        </div>
        {event.soldSeats>0&&<div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 rounded-lg p-3 mb-4"><AlertCircle size={13} className="shrink-0 mt-0.5"/><span>This event has {event.soldSeats} sold tickets. Deleting it may affect existing bookings.</span></div>}
        <div className="flex gap-3">
          <motion.button whileTap={{scale:0.96}} onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/40 dark:border-white/10 text-sm font-semibold text-foreground hover:bg-white/20 transition-colors">Keep Event</motion.button>
          <motion.button whileTap={{scale:0.96}} onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-sm font-bold hover:bg-red-700 transition-colors">Yes, Delete</motion.button>
        </div>
      </motion.div>
    </div>
  );
}
