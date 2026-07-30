import { AlertCircle, ArrowLeft, Calendar, Clock, MapPin, Ticket, Users } from "lucide-react";
import { motion } from "motion/react";
import { AvailabilityBar, Badge, CategoryBadge } from "../atoms";
import type { SeatFlowEvent } from "../../lib/types";

export function EventDetailView({event,onSelectSeats,onBack}:{event:SeatFlowEvent;onSelectSeats:()=>void;onBack:()=>void}) {
  const pct=Math.round((event.soldSeats/event.totalSeats)*100);
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <motion.button whileTap={{scale:0.96}} onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-primary text-sm mb-6 transition-colors"><ArrowLeft size={16}/> Back to events</motion.button>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl overflow-hidden h-64 sm:h-80 shadow-xl"><img src={event.image} alt={event.title} className="w-full h-full object-cover"/></div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2"><CategoryBadge category={event.category}/>{event.tags.slice(1).map(t=><Badge key={t} color="slate">{t}</Badge>)}</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{event.title}</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              {[{icon:Calendar,label:"Date",value:event.date},{icon:Clock,label:"Time",value:event.time},{icon:MapPin,label:"Venue",value:event.venue},{icon:MapPin,label:"City",value:event.city},{icon:Users,label:"Capacity",value:`${event.totalSeats} seats`},{icon:Ticket,label:"From",value:`৳${event.priceFrom}`}].map(({icon:Icon,label,value})=>(
                <div key={label} className="glass-subtle rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">{label}</p><div className="flex items-center gap-1.5"><Icon size={13} className="text-primary shrink-0"/><p className="text-sm font-semibold text-foreground">{value}</p></div></div>
              ))}
            </div>
            <p className="text-muted-foreground leading-relaxed text-sm">{event.description}</p>
          </div>
        </div>
        <div>
          <div className="glass rounded-xl p-5 shadow-xl sticky top-20">
            <p className="text-sm text-muted-foreground mb-1">Price range</p>
            <p className="text-2xl font-bold text-primary mb-1">৳{event.priceFrom} <span className="text-base text-muted-foreground">— ৳{event.priceTo}</span></p>
            <p className="text-xs text-muted-foreground mb-4">Per seat · VIP available</p>
            <AvailabilityBar total={event.totalSeats} sold={event.soldSeats}/>
            <div className="mt-2 mb-5 text-xs text-muted-foreground">{event.totalSeats-event.soldSeats} of {event.totalSeats} seats remaining</div>
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={onSelectSeats} className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg"><Ticket size={16}/> Select Seats</motion.button>
            {pct>=80&&<div className="mt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/50 rounded-xl p-3"><AlertCircle size={13} className="shrink-0 mt-0.5"/><span>High demand — seats selling fast. Book now!</span></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
