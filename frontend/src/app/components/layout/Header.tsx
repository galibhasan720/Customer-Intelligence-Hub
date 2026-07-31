import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogIn, LogOut, Menu, Moon, Sun, Ticket, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { springFast } from "../../lib/animations";
import type { View } from "../../lib/types";
import { cx, getInitials } from "../../lib/utils";

export function Header({view,isLoggedIn,userName,unreadCount,isDark,onNav,onOpenAuth,onSignOut,onToggleNotifications,onToggleDark}:{view:View;isLoggedIn:boolean;userName:string;unreadCount:number;isDark:boolean;onNav:(v:View)=>void;onOpenAuth:()=>void;onSignOut:()=>void;onToggleNotifications:()=>void;onToggleDark:()=>void}) {
  const [mobileOpen,setMobileOpen]=useState(false), [profileOpen,setProfileOpen]=useState(false);
  const profileRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{const h=(e:MouseEvent)=>{if(profileRef.current&&!profileRef.current.contains(e.target as Node))setProfileOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const navItems:[string,View][]=[["Events","events"],["Venues","venue-browse"],["My Bookings","dashboard"],["Organizer","organizer"]];
  const isVenueView=["venue-browse","venue-detail","hall-booking","hall-confirmation"].includes(view);
  const activeNav=isVenueView?"venue-browse":view;
  return (
    <header className="glass border-b border-white/20 sticky top-0 z-20 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} onClick={()=>onNav("events")} className="flex items-center gap-2"><div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md"><Ticket size={16} className="text-white"/></div><span className="font-extrabold text-foreground text-lg" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Seat<span className="text-primary">Flow</span></span></motion.button>
        <nav className="hidden sm:flex items-center gap-1">{navItems.map(([label,v])=><motion.button key={v} whileTap={{scale:0.95}} onClick={()=>onNav(v)} className={cx("px-3 py-1.5 rounded-xl text-sm font-medium transition-colors",activeNav===v?"bg-primary/15 text-primary":"text-muted-foreground hover:text-foreground hover:bg-white/30 dark:hover:bg-white/08")}>{label}</motion.button>)}</nav>
        <div className="flex items-center gap-1.5">
          <motion.button whileTap={{scale:0.88,rotate:isDark?-30:30}} onClick={onToggleDark} className="p-2 rounded-xl hover:bg-white/30 dark:hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground" title={isDark?"Light mode":"Dark mode"}>
            <AnimatePresence mode="wait">{isDark?<motion.div key="sun" initial={{rotate:-90,opacity:0}} animate={{rotate:0,opacity:1}} exit={{rotate:90,opacity:0}} transition={{duration:0.2}}><Sun size={18}/></motion.div>:<motion.div key="moon" initial={{rotate:90,opacity:0}} animate={{rotate:0,opacity:1}} exit={{rotate:-90,opacity:0}} transition={{duration:0.2}}><Moon size={18}/></motion.div>}</AnimatePresence>
          </motion.button>
          <motion.button whileTap={{scale:0.9}} onClick={onToggleNotifications} className="relative p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-white/30 dark:hover:bg-white/10 transition-colors">
            <Bell size={18}/>
            <AnimatePresence>{unreadCount>0&&<motion.span key={unreadCount} initial={{scale:0.3,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.3,opacity:0}} transition={springFast} className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">{unreadCount>9?"9+":unreadCount}</motion.span>}</AnimatePresence>
          </motion.button>
          {isLoggedIn?(
            <div className="relative" ref={profileRef}>
              <motion.button whileTap={{scale:0.96}} onClick={()=>setProfileOpen(!profileOpen)} className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/30 dark:hover:bg-white/10 transition-colors"><div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">{getInitials(userName)}</div><span className="text-sm font-semibold text-foreground hidden sm:block">{userName.split(" ")[0]}</span><ChevronDown size={14} className="text-muted-foreground hidden sm:block"/></motion.button>
              <AnimatePresence>{profileOpen&&<motion.div initial={{opacity:0,scale:0.94,y:-8}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.94,y:-8}} transition={{duration:0.18}} className="absolute right-0 top-full mt-2 w-44 glass rounded-xl shadow-2xl overflow-hidden z-30">
                <div className="px-4 py-3 border-b border-white/20"><p className="text-sm font-semibold text-foreground">{userName}</p></div>
                {([["My Bookings","dashboard"],["Organizer Panel","organizer"],["Venues","venue-browse"]] as [string,View][]).map(([label,v])=><button key={v} onClick={()=>{onNav(v);setProfileOpen(false);}} className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-white/30 transition-colors">{label}</button>)}
                <div className="border-t border-white/20"><button onClick={()=>{onSignOut();setProfileOpen(false);}} className="w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"><LogOut size={14}/> Sign Out</button></div>
              </motion.div>}</AnimatePresence>
            </div>
          ):<motion.button whileHover={{scale:1.03}} whileTap={{scale:0.96}} onClick={onOpenAuth} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-blue-700 transition-all shadow-md"><LogIn size={14}/> Sign In</motion.button>}
          <button onClick={()=>setMobileOpen(!mobileOpen)} className="sm:hidden p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-white/30 transition-colors">{mobileOpen?<X size={18}/>:<Menu size={18}/>}</button>
        </div>
      </div>
      <AnimatePresence>{mobileOpen&&<motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.2}} className="sm:hidden border-t border-white/20 px-4 py-3 space-y-1 overflow-hidden">{navItems.map(([label,v])=><button key={v} onClick={()=>{onNav(v);setMobileOpen(false);}} className={cx("w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors",activeNav===v?"bg-primary/15 text-primary":"text-muted-foreground hover:bg-white/20")}>{label}</button>)}</motion.div>}</AnimatePresence>
    </header>
  );
}
