import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { modalVariants } from "../../lib/animations";
import type { Seat } from "../../lib/types";
import { cx } from "../../lib/utils";

export function HoldModal({seats,total,onProceed,onRelease}:{seats:Seat[];total:number;onProceed:()=>void;onRelease:()=>void}) {
  const [seconds,setSeconds]=useState(600);
  const timerRef=useRef<ReturnType<typeof setInterval>|null>(null);
  useEffect(()=>{timerRef.current=setInterval(()=>{setSeconds(s=>{if(s<=1){clearInterval(timerRef.current!);toast.warning("Your seat hold expired.");onRelease();return 0;}return s-1;});},1000);return()=>{if(timerRef.current)clearInterval(timerRef.current);};},[onRelease]);
  const mins=String(Math.floor(seconds/60)).padStart(2,"0"),secs=String(seconds%60).padStart(2,"0"),pct=(seconds/600)*100,urgent=seconds<120;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
      <motion.div variants={modalVariants} initial="hidden" animate="visible" className="glass rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className={cx("px-6 py-5 text-white text-center",urgent?"bg-gradient-to-r from-red-600/90 to-red-700/90":"bg-gradient-to-r from-amber-500/90 to-amber-600/90")}>
          <motion.div animate={{rotate:[0,10,-10,0]}} transition={{repeat:Infinity,duration:2}}><Clock size={28} className="mx-auto mb-2 opacity-90"/></motion.div>
          <p className="text-3xl font-extrabold tracking-widest" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{mins}:{secs}</p>
          <p className="text-sm opacity-80 mt-1">{urgent?"Hurry — seats releasing soon!":"Seats are being held for you"}</p>
        </div>
        <div className="h-1.5" style={{background:"rgba(255,255,255,0.2)"}}><div className={cx("h-full transition-all duration-1000",urgent?"bg-red-500":"bg-amber-400")} style={{width:`${pct}%`}}/></div>
        <div className="p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Selected Seats</p>
          <div className="space-y-1.5 mb-4">
            {seats.map(s=><div key={s.id} className="flex justify-between text-sm"><span className="flex items-center gap-2"><span className="w-7 h-7 rounded bg-green-500 text-white flex items-center justify-center text-xs font-bold">{s.id}</span><span className="text-muted-foreground">{s.category}</span></span><span className="font-semibold">৳{s.price}</span></div>)}
            <div className="border-t border-white/20 pt-2 flex justify-between font-bold text-sm"><span>Total</span><span className="text-primary">৳{total}</span></div>
          </div>
          <motion.button whileTap={{scale:0.97}} onClick={onProceed} className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors mb-2">Proceed to Details</motion.button>
          <button onClick={onRelease} className="w-full py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-white/20 transition-colors">Release Seats</button>
        </div>
      </motion.div>
    </div>
  );
}
