import { useState } from "react";
import { ArrowLeft, Check, ChevronDown, ChevronRight, Plus, Sparkles, Trash2, Upload, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { CATEGORY_GROUPS, SUGGESTED_TAGS_FEATURED, SUGGESTED_TAGS_MORE } from "../../lib/constants";
import { springFast } from "../../lib/animations";
import type { SeatFlowEvent, TicketTier, Venue } from "../../lib/types";
import { cx } from "../../lib/utils";
import { EventCard } from "./EventCard";

export function EventCreationWizard({venues,onClose,onPublish}:{venues:Venue[];onClose:()=>void;onPublish:(event:SeatFlowEvent)=>void}) {
  const [step,setStep]=useState(1);
  const [title,setTitle]=useState(""), [category,setCategory]=useState(""), [tagline,setTagline]=useState(""), [description,setDescription]=useState("");
  const [date,setDate]=useState(""), [startTime,setStartTime]=useState(""), [venueType,setVenueType]=useState<"existing"|"custom">("custom"), [venueId,setVenueId]=useState(""), [customVenue,setCustomVenue]=useState(""), [city,setCity]=useState("Dhaka");
  const [isFree,setIsFree]=useState(false), [tiers,setTiers]=useState<TicketTier[]>([{name:"VIP",price:2500,quantity:10},{name:"Standard",price:800,quantity:90},{name:"Accessible",price:500,quantity:20}]), [maxPerPerson,setMaxPerPerson]=useState(4);
  const [coverUrl,setCoverUrl]=useState(""), [previewImg,setPreviewImg]=useState(""), [tags,setTags]=useState<string[]>([]), [tagInput,setTagInput]=useState("");
  const totalCapacity=tiers.reduce((s,t)=>s+t.quantity,0);
  const venueName=venueType==="existing"?(venues.find(v=>v.id===venueId)?.name||""):customVenue;
  const addTier=()=>setTiers(prev=>[...prev,{name:"",price:0,quantity:0}]);
  const removeTier=(i:number)=>setTiers(prev=>prev.filter((_,idx)=>idx!==i));
  const updateTier=(i:number,field:keyof TicketTier,value:string|number)=>setTiers(prev=>prev.map((t,idx)=>idx===i?{...t,[field]:value}:t));
  const [uploadPreview,setUploadPreview]=useState("");
  const addTag=(e:React.KeyboardEvent)=>{if(e.key==="Enter"&&tagInput.trim()){setTags(prev=>[...prev,tagInput.trim()]);setTagInput("");}};
  const handleFileUpload=(e:React.ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];if(!file)return;const url=URL.createObjectURL(file);setUploadPreview(url);setPreviewImg(url);};
  const publish=(asDraft=false)=>{if(!title||!category||!date){toast.error("Please complete required fields.");return;}onPublish({id:`evt-${Date.now()}`,title,category,date,time:startTime||"TBD",venue:venueName||"TBD",city,priceFrom:isFree?0:(tiers[0]?.price||0),priceTo:isFree?0:(tiers.reduce((m,t)=>Math.max(m,t.price),0)),totalSeats:totalCapacity,soldSeats:0,image:coverUrl||uploadPreview||"https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",description:description||tagline,tags:[category,...tags.slice(0,3)],status:asDraft?"draft":"published"});toast.success(asDraft?"Draft saved! Publish it anytime from My Events.":"Event published successfully!");onClose();};
  const stepLabel=["Event Identity","Date & Location","Tickets","Media","Publish"];
  const inp="w-full px-4 py-2.5 rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-primary text-sm";
  const selectCls="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-white/60 dark:bg-slate-800/80 backdrop-blur-sm border border-white/40 dark:border-white/10 text-sm font-medium text-gray-900 dark:text-white [&>option]:text-gray-900 [&>option]:bg-white dark:[&>option]:text-white dark:[&>option]:bg-slate-800 focus:outline-none cursor-pointer w-full";
  const previewEvent:SeatFlowEvent={id:"preview",title:title||"Your Event Title",category:category||"Concert",date:date||"Date TBD",time:startTime||"TBD",venue:venueName||"Venue TBD",city,priceFrom:isFree?0:(tiers[0]?.price||0),priceTo:0,totalSeats:totalCapacity,soldSeats:0,image:previewImg||"https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",description:description||tagline,tags:[category]};
  return (
    <div className="fixed inset-0 z-50 glass-overlay overflow-y-auto">
      <div className="sticky top-0 z-10 glass border-b border-white/20 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center"><Ticket size={14} className="text-white"/></div><span className="font-extrabold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Create New Event</span></div><button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/20 transition-colors"><X size={18}/></button></div>
          <div className="flex items-center gap-1">{stepLabel.map((label,i)=>{const n=i+1,active=n===step,done=n<step;return(<div key={label} className="flex items-center gap-1 flex-1"><motion.div initial={{scale:0.6}} animate={{scale:1}} transition={springFast} className={cx("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",done?"bg-green-500 text-white":active?"bg-primary text-white":"bg-white/40 dark:bg-white/10 text-muted-foreground")}>{done?<Check size={10}/>:n}</motion.div><span className={cx("text-xs hidden sm:block truncate",active?"text-foreground font-semibold":"text-muted-foreground")}>{label}</span>{i<stepLabel.length-1&&<div className={cx("flex-1 h-0.5 mx-1",done?"bg-green-400":"bg-white/30")}/>}</div>);})}</div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.22}}>
            {step===1&&<div className="glass rounded-xl p-6 shadow-xl space-y-5">
              <h2 className="font-bold text-xl text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Event Identity</h2>
              <div><label className="block text-sm font-semibold text-foreground mb-1.5">Event Title *</label><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Eid Night Gala 2025" className={inp}/></div>
              <div><label className="block text-sm font-semibold text-foreground mb-3">Category *</label><div className="space-y-4">{CATEGORY_GROUPS.map(group=><div key={group.name}><p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">{group.emoji} {group.name}</p><div className="flex flex-wrap gap-2">{group.items.map(item=><motion.button key={item} whileTap={{scale:0.95}} onClick={()=>setCategory(item)} className={cx("px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all",category===item?"border-primary bg-primary text-white":"border-white/30 dark:border-white/10 text-foreground hover:border-primary")}>{item}</motion.button>)}</div></div>)}</div></div>
              <div><label className="block text-sm font-semibold text-foreground mb-1.5">Tagline</label><input value={tagline} onChange={e=>setTagline(e.target.value)} maxLength={120} placeholder="One-line summary…" className={inp}/></div>
              <div><label className="block text-sm font-semibold text-foreground mb-1.5">Description</label><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={5} placeholder="Tell people what to expect…" className={cx(inp,"resize-none")}/></div>
            </div>}
            {step===2&&<div className="glass rounded-xl p-6 shadow-xl space-y-5">
              <h2 className="font-bold text-xl text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Date & Location</h2>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-semibold text-foreground mb-1.5">Date *</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} className={inp}/></div><div><label className="block text-sm font-semibold text-foreground mb-1.5">Start Time</label><input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} className={inp}/></div></div>
              <div><label className="block text-sm font-semibold text-foreground mb-2">Venue</label><div className="flex gap-2 mb-3">{(["existing","custom"] as const).map(t=><button key={t} onClick={()=>setVenueType(t)} className={cx("flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all",venueType===t?"border-primary bg-primary/10 text-primary":"border-white/30 dark:border-white/10 text-foreground hover:border-primary")}>{t==="existing"?"Existing Venue":"Custom Address"}</button>)}</div>{venueType==="existing"?(<div className="relative"><select value={venueId} onChange={e=>setVenueId(e.target.value)} className={selectCls}><option value="">Select a venue…</option>{venues.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select><ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 pointer-events-none"/></div>):<input value={customVenue} onChange={e=>setCustomVenue(e.target.value)} placeholder="Venue name" className={inp}/>}</div>
              <div><label className="block text-sm font-semibold text-foreground mb-1.5">City</label><div className="relative"><select value={city} onChange={e=>setCity(e.target.value)} className={selectCls}>{["Dhaka","Chittagong","Sylhet","Rajshahi","Khulna","Barisal","Mymensingh","Rangpur","Other"].map(c=><option key={c}>{c}</option>)}</select><ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 pointer-events-none"/></div></div>
            </div>}
            {step===3&&<div className="glass rounded-xl p-6 shadow-xl space-y-5">
              <h2 className="font-bold text-xl text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Tickets & Capacity</h2>
              <label className={cx("flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all",isFree?"border-green-500 bg-green-50/60 dark:bg-green-900/20":"border-white/30 dark:border-white/10")}><div><p className="font-semibold text-foreground text-sm">Free Event</p><p className="text-xs text-muted-foreground">No ticket price</p></div><div className={cx("w-11 h-6 rounded-full transition-colors relative cursor-pointer",isFree?"bg-green-500":"bg-white/30 dark:bg-white/10")} onClick={()=>setIsFree(!isFree)}><div className={cx("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",isFree?"left-5":"left-0.5")}/></div></label>
              {!isFree&&<div><div className="flex items-center justify-between mb-3"><p className="text-sm font-semibold text-foreground">Ticket Tiers</p><button onClick={addTier} className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"><Plus size={12}/> Add Tier</button></div><div className="space-y-2">{tiers.map((tier,i)=><div key={i} className="grid grid-cols-7 gap-2 items-center"><input value={tier.name} onChange={e=>updateTier(i,"name",e.target.value)} placeholder="Name" className={cx(inp,"col-span-3")}/><input type="number" value={tier.price} onChange={e=>updateTier(i,"price",Number(e.target.value))} placeholder="৳" className={cx(inp,"col-span-2")}/><input type="number" value={tier.quantity} onChange={e=>updateTier(i,"quantity",Number(e.target.value))} placeholder="Qty" className={cx(inp,"col-span-1")}/><button onClick={()=>removeTier(i)} className="flex items-center justify-center text-destructive hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg p-2 transition-colors"><Trash2 size={14}/></button></div>)}</div><p className="text-xs text-muted-foreground mt-3 glass-subtle px-3 py-2 rounded-lg">Total: <strong>{totalCapacity.toLocaleString()} seats</strong></p></div>}
              <div><label className="block text-sm font-semibold text-foreground mb-1.5">Max Tickets Per Person</label><div className="flex items-center gap-3"><button onClick={()=>setMaxPerPerson(m=>Math.max(1,m-1))} className="w-8 h-8 rounded-lg glass-subtle flex items-center justify-center font-bold hover:bg-white/40 transition-colors">-</button><span className="w-8 text-center font-bold text-foreground">{maxPerPerson}</span><button onClick={()=>setMaxPerPerson(m=>Math.min(10,m+1))} className="w-8 h-8 rounded-lg glass-subtle flex items-center justify-center font-bold hover:bg-white/40 transition-colors">+</button></div></div>
            </div>}
            {step===4&&<div className="space-y-5">
              <div className="glass rounded-xl p-6 shadow-xl space-y-6">
                <h2 className="font-bold text-xl text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Media & Preview</h2>

                {/* Cover Photo */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Cover Photo</label>
                  <div className="flex gap-2 mb-2"><input value={coverUrl} onChange={e=>setCoverUrl(e.target.value)} placeholder="Paste image URL…" className={cx(inp,"flex-1")}/><motion.button whileTap={{scale:0.97}} onClick={()=>setPreviewImg(coverUrl)} className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shrink-0">Preview</motion.button></div>
                  <div className="flex items-center gap-3 my-2"><div className="flex-1 h-px bg-white/20"/><span className="text-xs text-muted-foreground">or upload from device</span><div className="flex-1 h-px bg-white/20"/></div>
                  <label className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-white/30 dark:border-white/10 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary cursor-pointer transition-colors">
                    <Upload size={15}/><span>Choose photo from device</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload}/>
                  </label>
                  {(previewImg||uploadPreview)&&<div className="mt-3 rounded-xl overflow-hidden h-48 shadow-lg"><img src={previewImg||uploadPreview} alt="Cover preview" className="w-full h-full object-cover" onError={()=>{setPreviewImg("");setUploadPreview("");}}/></div>}
                </div>

                {/* Suggested Tags */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Suggested Tags <span className="text-muted-foreground font-normal">(click to add)</span></label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {SUGGESTED_TAGS_FEATURED.map(t=>{
                      const added=tags.includes(t);
                      return (
                        <button key={t} onClick={()=>!added&&setTags(prev=>[...prev,t])}
                          className={cx("px-3 py-1 rounded-full text-xs font-semibold border-2 transition-all",added?"border-primary bg-primary text-white cursor-default":"border-white/30 dark:border-white/10 text-foreground bg-white/40 dark:bg-white/08 hover:border-primary hover:text-primary cursor-pointer")}>
                          {added?<span className="flex items-center gap-1"><Check size={10}/>{t}</span>:t}
                        </button>
                      );
                    })}
                    <div className="relative">
                      <select value="" onChange={e=>{if(e.target.value&&!tags.includes(e.target.value))setTags(prev=>[...prev,e.target.value]);e.target.value="";}}
                        className="appearance-none pl-3 pr-7 py-1 rounded-full text-xs font-semibold border-2 border-white/30 dark:border-white/10 bg-white/50 dark:bg-slate-800/80 text-gray-900 dark:text-white [&>option]:text-gray-900 [&>option]:bg-white dark:[&>option]:text-white dark:[&>option]:bg-slate-800 cursor-pointer focus:outline-none">
                        <option value="">More tags…</option>
                        {SUGGESTED_TAGS_MORE.filter(t=>!tags.includes(t)).map(t=><option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 pointer-events-none"/>
                    </div>
                  </div>

                  {/* Custom tag input */}
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 mt-3">Custom Tag <span className="font-normal">(press Enter to add)</span></label>
                  <input value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={addTag} placeholder="Type a custom tag…" className={inp}/>

                  {/* Applied tags */}
                  {tags.length>0&&<div className="flex flex-wrap gap-1.5 mt-2">{tags.map(t=><span key={t} className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">{t}<button onClick={()=>setTags(prev=>prev.filter(x=>x!==t))} className="hover:text-red-500"><X size={10}/></button></span>)}</div>}
                </div>
              </div>
              <div className="glass rounded-xl p-6 shadow-xl"><h3 className="font-bold text-foreground mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Live Preview</h3><div className="max-w-xs"><EventCard event={previewEvent} onClick={()=>{}}/></div></div>
            </div>}
            {step===5&&<div className="glass rounded-xl p-6 shadow-xl space-y-5">
              <h2 className="font-bold text-xl text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Publish Settings</h2>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-semibold text-foreground mb-1.5">Booking Opens</label><input type="date" className={inp}/></div><div><label className="block text-sm font-semibold text-foreground mb-1.5">Booking Closes</label><input type="date" className={inp}/></div></div>
              <div><label className="block text-sm font-semibold text-foreground mb-2">Visibility</label><div className="flex gap-3">{["Public","Private"].map(v=><label key={v} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="vis" defaultChecked={v==="Public"} className="accent-primary"/><span className="text-sm font-medium text-foreground">{v}</span></label>)}</div></div>
              <div className="glass-subtle rounded-xl p-4 space-y-2 text-sm">{[["Event",title||"(untitled)"],["Category",category||"—"],["Date",date||"—"],["Venue",venueName||"—"],["Capacity",isFree?"Free":`${totalCapacity} seats from ৳${tiers[0]?.price||0}`]].map(([l,v])=><div key={l} className="flex justify-between"><span className="text-muted-foreground">{l}</span><span className="font-semibold text-foreground">{v}</span></div>)}</div>
              <div className="flex gap-3 pt-2"><motion.button whileTap={{scale:0.97}} onClick={()=>publish(true)} className="flex-1 py-3 rounded-xl border-2 border-white/30 dark:border-white/10 text-sm font-bold text-foreground hover:border-primary hover:text-primary transition-colors">Save as Draft</motion.button><motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={()=>publish(false)} className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg"><Sparkles size={15}/> Publish Now</motion.button></div>
            </div>}
          </motion.div>
        </AnimatePresence>
        <div className="flex justify-between pt-2"><motion.button whileTap={{scale:0.96}} onClick={()=>setStep(s=>Math.max(1,s-1))} className={cx("flex items-center gap-2 px-5 py-2.5 rounded-xl glass text-sm font-semibold text-foreground hover:bg-white/40 transition-colors",step===1&&"invisible")}><ArrowLeft size={15}/> Back</motion.button>{step<5&&<motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={()=>setStep(s=>Math.min(5,s+1))} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg">Next <ChevronRight size={15}/></motion.button>}</div>
      </div>
    </div>
  );
}
