import { Calendar, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { AvailabilityBar, CategoryBadge } from "../atoms";
import type { SeatFlowEvent } from "../../lib/types";
import { cx } from "../../lib/utils";

export function EventCard({event,onClick}:{event:SeatFlowEvent;onClick:()=>void}) {
  const pct=Math.round((event.soldSeats/event.totalSeats)*100);
  return (
    <motion.div onClick={onClick} whileHover={{y:-6,scale:1.015}} whileTap={{scale:0.98}} transition={{type:"spring",stiffness:380,damping:28}} className="glass rounded-xl overflow-hidden shadow-xl cursor-pointer group">
      <div className="relative h-48 overflow-hidden"><img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/><div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent"/><div className="absolute top-3 left-3"><CategoryBadge category={event.category}/></div><div className="absolute bottom-3 left-3 right-3"><p className="text-white font-bold text-base leading-snug line-clamp-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{event.title}</p></div></div>
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Calendar size={12}/><span>{event.date} · {event.time}</span></div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3"><MapPin size={12}/><span>{event.venue}, {event.city}</span></div>
        <div className="flex items-center justify-between"><span className="text-sm font-semibold text-foreground">From <span className="text-primary text-base">৳{event.priceFrom}</span></span><span className={cx("text-xs font-medium",pct>=90?"text-red-600":pct>=60?"text-amber-600":"text-green-600")}>{pct>=90?"Almost sold out":pct>=60?"Selling fast":"Available"}</span></div>
        <AvailabilityBar total={event.totalSeats} sold={event.soldSeats}/>
      </div>
    </motion.div>
  );
}
