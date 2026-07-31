import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Clock, Ticket } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { api, ApiError } from "../../../lib/api";
import { BookingStepper, SeatLegend } from "../atoms";
import { HoldModal } from "../modals/HoldModal";
import { itemVariants, listVariants } from "../../lib/animations";
import { mapApiSeat } from "../../lib/mappers";
import type { Seat, SeatFlowEvent, SeatStatus } from "../../lib/types";
import { cx } from "../../lib/utils";

export function SeatSelectionView({event,onContinue,onBack}:{event:SeatFlowEvent;onContinue:(seats:Seat[])=>void;onBack:()=>void}) {
  const [seats,setSeats]=useState<Seat[]>([]);
  const [loading,setLoading]=useState(true);
  const [hoveredId,setHoveredId]=useState<string|null>(null);
  const [showHoldModal,setShowHoldModal]=useState(false);
  const selected=seats.filter(s=>s.status==="selected");
  const total=selected.reduce((sum,s)=>sum+s.price,0);

  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      try{
        setLoading(true);
        const rows=await api.listSeats(event.id);
        if(!cancelled) setSeats(rows.map(mapApiSeat));
      }catch(err){
        toast.error(err instanceof ApiError?err.message:"Failed to load seats");
        if(!cancelled) setSeats([]);
      }finally{
        if(!cancelled) setLoading(false);
      }
    })();
    return()=>{cancelled=true;};
  },[event.id]);

  const toggleSeat=useCallback((id:string)=>{setSeats(prev=>{
    const currentSelected=prev.filter(s=>s.status==="selected").length;
    return prev.map(s=>{
      if(s.id!==id)return s;
      if(s.status==="selected"){
        const r:SeatStatus=s.category==="VIP"?"vip-available":"available";
        return{...s,status:r};
      }
      if(["available","vip-available"].includes(s.status)){
        if(currentSelected>=6)return s;
        return{...s,status:"selected"};
      }
      return s;
    });
  });},[]);
  const releaseSeat=useCallback(()=>{setSeats(prev=>prev.map(s=>{if(s.status!=="selected")return s;const r:SeatStatus=s.category==="VIP"?"vip-available":"available";return{...s,status:r};}));setShowHoldModal(false);},[]);

  const vip=seats.filter(s=>s.category==="VIP");
  const standard=seats.filter(s=>s.category==="Standard");

  const renderSeat=(seat:Seat)=>(
    <button
      key={seat.id}
      type="button"
      disabled={!["available","vip-available","selected"].includes(seat.status)}
      onClick={()=>toggleSeat(seat.id)}
      onMouseEnter={()=>setHoveredId(seat.id)}
      onMouseLeave={()=>setHoveredId(null)}
      className={cx(
        "w-10 h-10 rounded-md text-[10px] font-bold border transition-colors",
        seat.status==="selected"&&"bg-green-500 text-white border-green-600",
        seat.status==="vip-available"&&"bg-violet-100 text-violet-700 border-violet-300 hover:bg-violet-200",
        seat.status==="available"&&"bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200",
        seat.status==="sold"&&"bg-slate-300 text-slate-500 border-slate-400 cursor-not-allowed opacity-60",
      )}
      title={`${seat.id} · ${seat.category} · ৳${seat.price}`}
    >
      {seat.id}
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {showHoldModal&&<HoldModal seats={selected} total={total} onProceed={()=>{setShowHoldModal(false);onContinue(selected);}} onRelease={releaseSeat}/>}
      <div className="flex items-center justify-between mb-6"><motion.button whileTap={{scale:0.96}} onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-primary text-sm transition-colors"><ArrowLeft size={16}/> Back</motion.button><BookingStepper step={1}/></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="glass rounded-xl p-5 shadow-xl">
            <div className="mb-4"><h2 className="font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{event.title}</h2><p className="text-sm text-muted-foreground">{event.venue} · {event.date}</p></div>
            <div className="w-full bg-gradient-to-b from-slate-700 to-slate-800 text-white text-center py-2 rounded-xl text-xs font-semibold tracking-widest mb-6 shadow-md">STAGE / SCREEN</div>
            {loading?(<p className="text-sm text-muted-foreground py-10 text-center">Loading seats…</p>):seats.length===0?(<p className="text-sm text-muted-foreground py-10 text-center">No seats found for this event.</p>):(
              <div className="space-y-6">
                {vip.length>0&&(
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 mb-2">VIP</p>
                    <div className="flex flex-wrap gap-2">{vip.map(renderSeat)}</div>
                  </div>
                )}
                {standard.length>0&&(
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Standard</p>
                    <div className="flex flex-wrap gap-2">{standard.map(renderSeat)}</div>
                  </div>
                )}
              </div>
            )}
            {hoveredId&&(()=>{const seat=seats.find(s=>s.id===hoveredId);if(!seat)return null;return<div className="mt-4 text-xs text-muted-foreground">Seat {seat.id} · {seat.category} · ৳{seat.price} · {seat.status}</div>;})()}
            <div className="mt-5 pt-4 border-t border-white/20"><SeatLegend/></div>
          </div>
        </div>
        <div>
          <div className="glass rounded-xl p-5 shadow-xl sticky top-20">
            <h3 className="font-bold text-foreground mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Booking Summary</h3>
            {selected.length===0?(<div className="text-center py-8 text-muted-foreground"><Ticket size={28} className="mx-auto mb-2 opacity-30"/><p className="text-sm">Click seats to select them</p><p className="text-xs mt-1">Up to 6 seats per booking</p></div>):(
              <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-2 mb-4">
                {selected.map(s=><motion.div key={s.id} variants={itemVariants} className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded bg-green-500 text-white flex items-center justify-center text-[9px] font-bold">{s.id}</div><span className="text-muted-foreground">{s.category}</span></div><span className="font-semibold">৳{s.price}</span></motion.div>)}
                <div className="border-t border-white/20 pt-3 flex justify-between font-bold text-sm"><span>Total</span><span className="text-primary">৳{total}</span></div>
              </motion.div>
            )}
            <motion.button whileHover={selected.length>0?{scale:1.02}:{}} whileTap={selected.length>0?{scale:0.97}:{}} disabled={selected.length===0} onClick={()=>selected.length>0&&setShowHoldModal(true)} className={cx("w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",selected.length>0?"bg-primary text-white hover:bg-blue-700 shadow-lg":"bg-white/30 dark:bg-white/08 text-muted-foreground cursor-not-allowed")}>
              {selected.length>0?<><Clock size={15}/> Hold & Continue</>:"Select Seats to Continue"}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
