import { Calendar, Clock, Edit2, MapPin, Ticket, Users, X } from "lucide-react";
import { motion } from "motion/react";
import { Badge, CategoryBadge } from "../atoms";
import { modalVariants } from "../../lib/animations";
import type { SeatFlowEvent } from "../../lib/types";
import { cx } from "../../lib/utils";

export function EventViewModal({event,onClose,onEdit}:{event:SeatFlowEvent;onClose:()=>void;onEdit:()=>void}) {
  const pct=Math.round((event.soldSeats/event.totalSeats)*100);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md" onClick={onClose}>
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        className="glass rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e=>e.stopPropagation()}>
        {/* Hero image */}
        <div className="relative h-48 shrink-0 overflow-hidden">
          <img src={event.image} alt={event.title} className="w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/>
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"><X size={16}/></button>
          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center gap-2 mb-1"><CategoryBadge category={event.category}/>{event.tags.slice(1,3).map(t=><Badge key={t} color="slate">{t}</Badge>)}</div>
            <h2 className="text-xl font-extrabold text-white leading-tight" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{event.title}</h2>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[{icon:Calendar,label:"Date",value:event.date},{icon:Clock,label:"Time",value:event.time},{icon:MapPin,label:"Venue",value:event.venue},{icon:MapPin,label:"City",value:event.city},{icon:Users,label:"Capacity",value:`${event.totalSeats} seats`},{icon:Ticket,label:"Price",value:`৳${event.priceFrom} – ৳${event.priceTo}`}].map(({icon:Icon,label,value})=>(
              <div key={label} className="glass-subtle rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">{label}</p><div className="flex items-center gap-1.5"><Icon size={12} className="text-primary shrink-0"/><p className="text-sm font-semibold text-foreground">{value}</p></div></div>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1"><span>{event.soldSeats} sold / {event.totalSeats} total</span><span>{pct}% full</span></div>
            <div className="h-2 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.2)"}}><div className={cx("h-full rounded-full",pct>=90?"bg-red-500":pct>=60?"bg-amber-500":"bg-green-500")} style={{width:`${pct}%`}}/></div>
          </div>
          {event.description&&<p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>}
          {event.tags.length>0&&<div className="flex flex-wrap gap-1.5">{event.tags.map(t=><span key={t} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{t}</span>)}</div>}
        </div>
        <div className="px-6 py-4 border-t border-white/20 flex gap-3 shrink-0">
          <motion.button whileTap={{scale:0.96}} onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/40 dark:border-white/10 text-sm font-semibold text-foreground hover:bg-white/20 transition-colors">Close</motion.button>
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={onEdit} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg"><Edit2 size={14}/> Edit Event</motion.button>
        </div>
      </motion.div>
    </div>
  );
}
