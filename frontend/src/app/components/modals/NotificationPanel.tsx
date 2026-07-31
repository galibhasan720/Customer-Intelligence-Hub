import { useState } from "react";
import { AlertCircle, Bell, Building2, CheckCircle, Clock, Sparkles, Ticket, X, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { springFast } from "../../lib/animations";
import type { Notification } from "../../lib/types";
import { cx } from "../../lib/utils";

export function NotificationPanel({notifications,onClose,onMarkAllRead,onClearAll,onMarkRead}:{notifications:Notification[];onClose:()=>void;onMarkAllRead:()=>void;onClearAll:()=>void;onMarkRead:(id:string)=>void}) {
  const [filter,setFilter]=useState<"all"|"unread"|"bookings"|"venues">("all");
  const unreadCount=notifications.filter(n=>!n.read).length;
  const filtered=notifications.filter(n=>{if(filter==="unread")return!n.read;if(filter==="bookings")return["booking_confirmed","booking_cancelled","payment_processed","hold_expired"].includes(n.type);if(filter==="venues")return n.type==="hall_booking_confirmed";return true;});
  const notifIcon=(type:Notification["type"])=>({booking_confirmed:<CheckCircle size={15} className="text-green-500"/>,booking_cancelled:<XCircle size={15} className="text-red-500"/>,event_reminder:<Clock size={15} className="text-amber-500"/>,event_updated:<AlertCircle size={15} className="text-blue-500"/>,hold_expired:<Clock size={15} className="text-orange-500"/>,payment_processed:<Ticket size={15} className="text-green-600"/>,hall_booking_confirmed:<Building2 size={15} className="text-violet-500"/>,new_event:<Sparkles size={15} className="text-primary"/>}[type]);
  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}} className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{x:"100%",opacity:0}} animate={{x:0,opacity:1}} exit={{x:"100%",opacity:0}} transition={{type:"spring",stiffness:280,damping:30}} className="fixed inset-y-0 right-0 w-80 sm:w-96 z-40 flex flex-col bg-white/96 dark:bg-slate-900/96 backdrop-blur-2xl border-l-2 border-primary/40 dark:border-primary/30 shadow-[4px_0_40px_rgba(0,0,0,0.18)] dark:shadow-[4px_0_40px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10 bg-primary/5 dark:bg-primary/10 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-900 dark:text-white" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Notifications</h2>
            <AnimatePresence mode="wait">{unreadCount>0&&<motion.span key={unreadCount} initial={{scale:0.5}} animate={{scale:1}} exit={{scale:0}} transition={springFast} className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{unreadCount}</motion.span>}</AnimatePresence>
          </div>
          <div className="flex items-center gap-3">{unreadCount>0&&<button onClick={onMarkAllRead} className="text-xs text-primary hover:underline font-medium">Mark all read</button>}<button onClick={onClose} className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"><X size={18}/></button></div>
        </div>
        <div className="flex gap-1.5 px-4 py-2.5 border-b border-slate-100 dark:border-white/08 overflow-x-auto scrollbar-none shrink-0">
          {(["all","unread","bookings","venues"] as const).map(f=><button key={f} onClick={()=>setFilter(f)} className={cx("px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors capitalize",filter===f?"bg-primary text-white":"bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/15")}>{f}{f==="unread"&&unreadCount>0?` (${unreadCount})`:""}</button>)}
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length===0?(<div className="flex flex-col items-center justify-center h-full py-16"><Bell size={36} className="text-slate-300 dark:text-slate-600 mb-3"/><p className="text-sm font-medium text-slate-400 dark:text-slate-500">All caught up!</p></div>):(
            <div className="divide-y divide-slate-100 dark:divide-white/08">
              {filtered.map(n=>(
                <motion.div key={n.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} onClick={()=>onMarkRead(n.id)} className={cx("flex gap-3 px-4 py-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/05 transition-colors relative",!n.read&&"bg-blue-50 dark:bg-blue-950/50")}>
                  {!n.read&&<div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-r-full"/>}
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/15 flex items-center justify-center shrink-0 mt-0.5">{notifIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2"><p className={cx("text-sm leading-tight text-slate-800 dark:text-slate-100",!n.read?"font-semibold":"font-medium")}>{n.title}</p><span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">{n.timestamp}</span></div>
                    <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        {notifications.length>0&&<div className="px-4 py-3 border-t border-slate-100 dark:border-white/08 shrink-0"><button onClick={onClearAll} className="w-full text-xs text-slate-400 dark:text-slate-500 hover:text-destructive transition-colors py-1">Clear all notifications</button></div>}
      </motion.div>
    </>
  );
}
