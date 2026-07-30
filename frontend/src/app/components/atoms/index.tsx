import { Check, ChevronRight, Star } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { BADGE_COLORS, CAT_COLORS } from "../../lib/constants";
import { springFast } from "../../lib/animations";
import type { Seat, SeatFlowEvent } from "../../lib/types";
import { cx } from "../../lib/utils";

export function Badge({children,color="blue"}:{children:React.ReactNode;color?:string}) {
  return <span className={cx("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",BADGE_COLORS[color]??BADGE_COLORS.blue)}>{children}</span>;
}
export function CategoryBadge({category}:{category:string}) { return <Badge color={CAT_COLORS[category]??"slate"}>{category}</Badge>; }
export function AvailabilityBar({total,sold}:{total:number;sold:number}) {
  const pct=Math.round((sold/total)*100);
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>{total-sold} seats left</span><span>{pct}% full</span></div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.3)"}}><div className={cx("h-full rounded-full",pct>=90?"bg-red-500":pct>=60?"bg-amber-500":"bg-green-500")} style={{width:`${pct}%`}}/></div>
    </div>
  );
}
export function StarsRow({rating}:{rating:number}) {
  return <div className="flex items-center gap-0.5">{[1,2,3,4,5].map(i=><Star key={i} size={12} className={i<=Math.floor(rating)?"text-amber-400 fill-amber-400":"text-slate-300 fill-slate-300"}/>)}</div>;
}
export function BookingStepper({step}:{step:1|2|3|4}) {
  const steps=["Select Seats","Your Details","Payment","Confirmed"];
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((label,i)=>{
        const n=i+1,active=n===step,done=n<step;
        return (
          <div key={label} className="flex items-center gap-1.5">
            <motion.div initial={{scale:0.6,opacity:0}} animate={{scale:1,opacity:1}} transition={{...springFast,delay:i*0.05}}
              className={cx("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",done?"bg-green-500 text-white":active?"bg-primary text-white":"bg-white/40 dark:bg-white/10 text-muted-foreground")}>
              {done?<Check size={12}/>:n}
            </motion.div>
            <span className={cx("text-xs hidden sm:block whitespace-nowrap",active?"font-semibold text-foreground":"text-muted-foreground")}>{label}</span>
            {i<steps.length-1&&<ChevronRight size={14} className="text-muted-foreground/40 shrink-0"/>}
          </div>
        );
      })}
    </div>
  );
}
export function SeatLegend() {
  const items=[{fill:"#DBEAFE",stroke:"#60A5FA",label:"Available"},{fill:"#22C55E",stroke:"#16A34A",label:"Selected"},{fill:"#FCD34D",stroke:"#F59E0B",label:"Held"},{fill:"#FECDD3",stroke:"#FB7185",label:"Reserved"},{fill:"#E2E8F0",stroke:"#CBD5E1",label:"Sold"},{fill:"#EDE9FE",stroke:"#A78BFA",label:"VIP"},{fill:"#CCFBF1",stroke:"#2DD4BF",label:"Accessible"},{fill:"#CFFAFE",stroke:"#22D3EE",label:"Companion"}];
  return (
    <div className="flex flex-wrap gap-3">
      {items.map(({fill,stroke,label})=>(
        <div key={label} className="flex items-center gap-1.5">
          <svg width={14} height={14} viewBox="0 0 14 14"><rect x={1} y={1} width={12} height={12} rx={3} fill={fill} stroke={stroke} strokeWidth={1.5}/></svg>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}
export function QRCode() {
  const size=120,cell=size/10;
  const pat=[[1,1,1,1,1,1,1,0,1,0],[1,0,0,0,0,0,1,0,0,1],[1,0,1,1,1,0,1,0,1,0],[1,0,1,1,1,0,1,1,0,1],[1,0,1,1,1,0,1,0,1,0],[1,0,0,0,0,0,1,1,0,0],[1,1,1,1,1,1,1,0,1,1],[0,0,0,0,0,0,0,0,0,1],[1,0,1,1,0,1,1,1,0,1],[0,1,0,0,1,0,1,0,1,1]];
  return (<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded"><rect width={size} height={size} fill="white"/>{pat.map((row,ri)=>row.map((v,ci)=>v?<rect key={`${ri}-${ci}`} x={ci*cell} y={ri*cell} width={cell} height={cell} fill="#0F172A"/>:null))}</svg>);
}
export function OrderSummary({event,seats}:{event:SeatFlowEvent;seats:Seat[]}) {
  const total=seats.reduce((s,seat)=>s+seat.price,0);
  return (
    <div className="glass rounded-xl p-5 shadow-xl sticky top-20">
      <h3 className="font-bold text-foreground mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Order Summary</h3>
      <div className="mb-3"><p className="font-semibold text-sm text-foreground">{event.title}</p><p className="text-xs text-muted-foreground">{event.date} · {event.time}</p><p className="text-xs text-muted-foreground">{event.venue}</p></div>
      <div className="space-y-2 border-t border-white/20 dark:border-white/08 pt-3 mb-3">{seats.map(s=><div key={s.id} className="flex justify-between text-sm"><span className="text-muted-foreground">Seat {s.id} ({s.category})</span><span>৳{s.price}</span></div>)}</div>
      <div className="border-t border-white/20 dark:border-white/08 pt-3 flex justify-between font-bold text-sm"><span>Total</span><span className="text-primary text-base">৳{total}</span></div>
    </div>
  );
}
