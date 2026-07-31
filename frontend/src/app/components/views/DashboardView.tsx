import { useEffect, useState } from "react";
import { AlertCircle, Building2, CheckCircle, Clock, Edit2, Ticket, User, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { api, ApiError } from "../../../lib/api";
import { CancelConfirmModal } from "../modals/CancelConfirmModal";
import { EditEventBookingDrawer } from "../modals/EditEventBookingDrawer";
import { EditHallBookingDrawer } from "../modals/EditHallBookingDrawer";
import { itemVariants, listVariants } from "../../lib/animations";
import { mapApiBooking } from "../../lib/mappers";
import type { Booking, Hall, HallBooking, Notification } from "../../lib/types";
import { cx, statusColor } from "../../lib/utils";

export function DashboardView({hallBookings,halls,onCancelHall,onUpdateHall,addNotification,isLoggedIn,onNeedAuth}:{hallBookings:HallBooking[];halls:Hall[];onCancelHall:(id:string)=>void|Promise<void>;onUpdateHall:(b:HallBooking)=>void|Promise<void>;addNotification:(n:Omit<Notification,"id"|"read">)=>void;isLoggedIn:boolean;onNeedAuth:()=>void}) {
  const [bookings,setBookings]=useState<Booking[]>([]);
  const [loading,setLoading]=useState(false);
  const [tab,setTab]=useState<"events"|"venues">("events");
  const [cancellingId,setCancellingId]=useState<string|null>(null);
  const [cancellingHallId,setCancellingHallId]=useState<string|null>(null);
  const [editingBooking,setEditingBooking]=useState<Booking|null>(null);
  const [editingHallBooking,setEditingHallBooking]=useState<HallBooking|null>(null);
  const [localHallBookings,setLocalHallBookings]=useState<HallBooking[]>(hallBookings);
  useEffect(()=>{setLocalHallBookings(hallBookings);},[hallBookings]);

  useEffect(()=>{
    if(!isLoggedIn){setBookings([]);return;}
    let cancelled=false;
    (async()=>{
      try{
        setLoading(true);
        const rows=await api.myBookings();
        if(!cancelled) setBookings(rows.map(mapApiBooking));
      }catch(err){
        if(!cancelled) toast.error(err instanceof ApiError?err.message:"Failed to load bookings");
      }finally{
        if(!cancelled) setLoading(false);
      }
    })();
    return()=>{cancelled=true;};
  },[isLoggedIn]);

  const cancel=async(id:string,reason:string)=>{
    try{
      const updated=await api.cancelBooking(id);
      setBookings(prev=>prev.map(b=>b.id===id?mapApiBooking(updated):b));
      toast.info("Booking cancelled.");
      addNotification({type:"booking_cancelled",title:"Booking Cancelled",message:`Booking cancelled (${reason}).`,timestamp:"Just now"});
    }catch(err){
      toast.error(err instanceof ApiError?err.message:"Cancel failed");
    }finally{
      setCancellingId(null);
    }
  };
  const cancelHall=async(id:string)=>{
    try{
      await onCancelHall(id);
      setLocalHallBookings(prev=>prev.map(b=>b.id===id?{...b,status:"Cancelled"}:b));
      toast.info("Hall booking cancelled.");
    }catch{/* parent shows error */}
    finally{setCancellingHallId(null);}
  };

  const cancelTarget=bookings.find(b=>b.id===cancellingId);
  const cancelHallTarget=localHallBookings.find(b=>b.id===cancellingHallId);
  const statusIcon=(s:Booking["status"])=>({Confirmed:<CheckCircle size={13} className="text-green-500"/>,Pending:<Clock size={13} className="text-amber-500"/>,Cancelled:<XCircle size={13} className="text-red-500"/>,Expired:<AlertCircle size={13} className="text-slate-400"/>}[s]);

  if(!isLoggedIn){
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">Sign in to view your bookings.</p>
        <button onClick={onNeedAuth} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold">Sign In</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <AnimatePresence>
        {cancellingId&&cancelTarget&&<CancelConfirmModal key="ce" bookingRef={cancellingId} title={cancelTarget.eventTitle} onConfirm={reason=>cancel(cancellingId,reason)} onClose={()=>setCancellingId(null)}/>}
        {cancellingHallId&&cancelHallTarget&&<CancelConfirmModal key="ch" bookingRef={cancellingHallId} title={`${cancelHallTarget.hallName} at ${cancelHallTarget.venueName}`} onConfirm={()=>cancelHall(cancellingHallId)} onClose={()=>setCancellingHallId(null)}/>}
        {editingBooking&&<EditEventBookingDrawer key="eb" booking={editingBooking} onSave={updated=>{setBookings(prev=>prev.map(b=>b.id===updated.id?updated:b));}} onClose={()=>setEditingBooking(null)}/>}
        {editingHallBooking&&<EditHallBookingDrawer key="ehb" booking={editingHallBooking} halls={halls} onSave={async updated=>{await onUpdateHall(updated);setLocalHallBookings(prev=>prev.map(b=>b.id===updated.id?updated:b));}} onClose={()=>setEditingHallBooking(null)}/>}
      </AnimatePresence>

      <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center"><User size={18} className="text-primary"/></div><div><h2 className="font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>My Bookings</h2><p className="text-sm text-muted-foreground">{loading?"Loading…":"Manage your reservations"}</p></div></div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[{label:"Total",value:bookings.length+localHallBookings.length,color:"text-primary"},{label:"Confirmed",value:bookings.filter(b=>b.status==="Confirmed").length+localHallBookings.filter(b=>b.status==="Confirmed").length,color:"text-green-600"},{label:"Cancelled",value:bookings.filter(b=>b.status==="Cancelled").length+localHallBookings.filter(b=>b.status==="Cancelled").length,color:"text-red-600"}].map(({label,value,color})=>(
          <motion.div key={label} whileHover={{scale:1.03}} className="glass rounded-xl p-4 text-center shadow-lg"><p className={cx("text-2xl font-extrabold",color)}>{value}</p><p className="text-xs text-muted-foreground mt-1">{label}</p></motion.div>
        ))}
      </div>

      <div className="flex gap-1 glass rounded-xl p-1 mb-6 w-fit">
        {(["events","venues"] as const).map(t=><button key={t} onClick={()=>setTab(t)} className={cx("px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all",tab===t?"bg-primary/90 text-white shadow-sm":"text-muted-foreground hover:text-foreground")}>{t==="events"?"Event Tickets":"Venue Bookings"}</button>)}
      </div>

      {tab==="events"&&(
        <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-4">
          {bookings.length===0&&!loading&&<div className="text-center py-16 text-muted-foreground"><Ticket size={36} className="mx-auto mb-3 opacity-30"/><p className="font-medium">No event bookings yet</p></div>}
          {bookings.map(booking=>(
            <motion.div key={booking.id} variants={itemVariants} className="glass rounded-xl p-5 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-3"><div><p className="font-bold text-foreground text-sm" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{booking.eventTitle}</p><p className="text-xs text-muted-foreground">{booking.date} · {booking.venue}</p></div><span className={cx("flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",statusColor(booking.status))}>{statusIcon(booking.status)} {booking.status}</span></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><p className="text-xs text-muted-foreground">Seats:</p><div className="flex gap-1">{booking.seats.map(s=><span key={s} className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold px-1.5 py-0.5 rounded">{s}</span>)}</div></div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-primary">৳{booking.total}</span>
                  {booking.status==="Confirmed"&&(
                    <div className="flex items-center gap-2">
                      <motion.button whileTap={{scale:0.93}} onClick={()=>setCancellingId(booking.id)} className="text-xs text-destructive font-semibold hover:underline">Cancel</motion.button>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Ref: {booking.id}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {tab==="venues"&&(
        <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-4">
          {localHallBookings.length===0?(<div className="text-center py-16 text-muted-foreground"><Building2 size={36} className="mx-auto mb-3 opacity-30"/><p className="font-medium">No venue bookings yet</p><p className="text-sm mt-1">Browse venues to book a hall</p></div>):
          localHallBookings.map(b=>(
            <motion.div key={b.id} variants={itemVariants} className="glass rounded-xl p-5 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-3"><div><p className="font-bold text-foreground text-sm" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{b.hallName}</p><p className="text-xs text-muted-foreground">{b.venueName}</p><p className="text-xs text-muted-foreground">{b.date} · {b.startTime}–{b.endTime}</p></div><span className={cx("flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",statusColor(b.status))}>{b.status==="Confirmed"?<CheckCircle size={13} className="text-green-500"/>:<XCircle size={13} className="text-red-500"/>} {b.status}</span></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><span>{b.purpose}</span><span>·</span><span>{b.guestCount} guests</span></div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-violet-600">৳{b.total.toLocaleString()}</span>
                  {b.status==="Confirmed"&&(
                    <div className="flex items-center gap-2">
                      <motion.button whileTap={{scale:0.93}} onClick={()=>setEditingHallBooking(b)} className="text-xs text-violet-600 font-semibold hover:underline flex items-center gap-1"><Edit2 size={11}/> Edit</motion.button>
                      <motion.button whileTap={{scale:0.93}} onClick={()=>setCancellingHallId(b.id)} className="text-xs text-destructive font-semibold hover:underline">Cancel</motion.button>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Booked on {b.bookedAt} · Ref: {b.id}</p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
