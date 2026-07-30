import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { CATEGORY_GROUPS } from "../../lib/constants";
import type { SeatFlowEvent } from "../../lib/types";
import { cx } from "../../lib/utils";

export function EventEditDrawer({event,onSave,onClose}:{event:SeatFlowEvent;onSave:(updated:SeatFlowEvent)=>void;onClose:()=>void}) {
  const [title,setTitle]=useState(event.title);
  const [category,setCategory]=useState(event.category);
  const [date,setDate]=useState(event.date);
  const [time,setTime]=useState(event.time);
  const [venue,setVenue]=useState(event.venue);
  const [city,setCity]=useState(event.city);
  const [priceFrom,setPriceFrom]=useState(event.priceFrom);
  const [priceTo,setPriceTo]=useState(event.priceTo);
  const [totalSeats,setTotalSeats]=useState(event.totalSeats);
  const [coverUrl,setCoverUrl]=useState(event.image);
  const [description,setDescription]=useState(event.description);
  const [tags,setTags]=useState<string[]>(event.tags);
  const [tagInput,setTagInput]=useState("");
  const [previewImg,setPreviewImg]=useState(event.image);
  const addTag=(e:React.KeyboardEvent)=>{if(e.key==="Enter"&&tagInput.trim()){setTags(prev=>[...prev,tagInput.trim()]);setTagInput("");}};
  const save=()=>{
    if(!title.trim()){toast.error("Event title is required.");return;}
    onSave({...event,title,category,date,time,venue,city,priceFrom,priceTo,totalSeats,image:coverUrl||event.image,description,tags});
    toast.success("Event updated successfully!");
    onClose();
  };
  const inp="w-full px-4 py-2.5 rounded-lg glass-input focus:outline-none focus:ring-2 focus:ring-primary text-sm";
  const selectCls="appearance-none pl-3 pr-8 py-2.5 rounded-lg bg-white/60 dark:bg-slate-800/80 backdrop-blur-sm border border-white/40 dark:border-white/10 text-sm font-medium text-gray-900 dark:text-white [&>option]:text-gray-900 [&>option]:bg-white dark:[&>option]:text-white dark:[&>option]:bg-slate-800 focus:outline-none cursor-pointer w-full";
  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{x:"100%",opacity:0}} animate={{x:0,opacity:1}} exit={{x:"100%",opacity:0}} transition={{type:"spring",stiffness:280,damping:30}}
        className="fixed inset-y-0 right-0 w-full sm:w-[520px] glass-float z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 shrink-0">
          <div><h2 className="font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Edit Event</h2><p className="text-xs text-muted-foreground">{event.id}</p></div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/20 transition-colors"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Basic info */}
          <div className="space-y-4">
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Event Title *</label><input value={title} onChange={e=>setTitle(e.target.value)} className={inp}/></div>
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Category</label><div className="relative"><select value={category} onChange={e=>setCategory(e.target.value)} className={selectCls}>{CATEGORY_GROUPS.map(g=><optgroup key={g.name} label={`${g.emoji} ${g.name}`}>{g.items.map(item=><option key={item} value={item}>{item}</option>)}</optgroup>)}</select><ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 pointer-events-none"/></div></div>
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Description</label><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={4} className={cx(inp,"resize-none")}/></div>
          </div>
          {/* Date & Location */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Date & Location</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-semibold text-foreground mb-1.5">Date</label><input value={date} onChange={e=>setDate(e.target.value)} placeholder="e.g. Sat, 12 Jul 2025" className={inp}/></div>
              <div><label className="block text-sm font-semibold text-foreground mb-1.5">Time</label><input value={time} onChange={e=>setTime(e.target.value)} placeholder="e.g. 8:00 PM" className={inp}/></div>
            </div>
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Venue Name</label><input value={venue} onChange={e=>setVenue(e.target.value)} className={inp}/></div>
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">City</label><div className="relative"><select value={city} onChange={e=>setCity(e.target.value)} className={selectCls}>{["Dhaka","Chittagong","Sylhet","Rajshahi","Khulna","Barisal","Mymensingh","Rangpur","Other"].map(c=><option key={c}>{c}</option>)}</select><ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 pointer-events-none"/></div></div>
          </div>
          {/* Pricing & Capacity */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Pricing & Capacity</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-semibold text-foreground mb-1.5">Price From (৳)</label><input type="number" value={priceFrom} onChange={e=>setPriceFrom(Number(e.target.value))} className={inp}/></div>
              <div><label className="block text-sm font-semibold text-foreground mb-1.5">Price To (৳)</label><input type="number" value={priceTo} onChange={e=>setPriceTo(Number(e.target.value))} className={inp}/></div>
            </div>
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Total Seats</label><div className="flex items-center gap-3"><input type="number" value={totalSeats} onChange={e=>setTotalSeats(Number(e.target.value))} className={cx(inp,"flex-1")}/><span className="glass-subtle rounded-lg px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{event.soldSeats} already sold</span></div></div>
          </div>
          {/* Media */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Media</p>
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Cover Image URL</label><div className="flex gap-2"><input value={coverUrl} onChange={e=>setCoverUrl(e.target.value)} placeholder="https://..." className={cx(inp,"flex-1")}/><motion.button whileTap={{scale:0.97}} onClick={()=>setPreviewImg(coverUrl)} className="px-3 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shrink-0">Preview</motion.button></div>{previewImg&&<div className="mt-2 rounded-xl overflow-hidden h-32"><img src={previewImg} alt="Cover" className="w-full h-full object-cover" onError={()=>setPreviewImg("")}/></div>}</div>
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Tags <span className="text-muted-foreground font-normal">(Enter to add)</span></label><input value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={addTag} placeholder="e.g. Outdoor, Family…" className={inp}/>{tags.length>0&&<div className="flex flex-wrap gap-1.5 mt-2">{tags.map(t=><span key={t} className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">{t}<button onClick={()=>setTags(prev=>prev.filter(x=>x!==t))} className="hover:text-red-500"><X size={10}/></button></span>)}</div>}</div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/20 flex gap-3 shrink-0">
          <motion.button whileTap={{scale:0.96}} onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/40 dark:border-white/10 text-sm font-semibold text-foreground hover:bg-white/20 transition-colors">Discard</motion.button>
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={save} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg"><Check size={14}/> Save Changes</motion.button>
        </div>
      </motion.div>
    </>
  );
}
