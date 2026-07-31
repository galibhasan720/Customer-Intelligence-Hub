import { useState } from "react";
import { AlertCircle, Ticket, X } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { api, ApiError } from "../../../lib/api";
import { setSession, type AuthUser } from "../../../lib/auth";
import { modalVariants } from "../../lib/animations";
import { cx } from "../../lib/utils";

export function AuthModal({onClose,onAuth}:{onClose:()=>void;onAuth:(user:AuthUser)=>void}) {
  const [tab,setTab]=useState<"signin"|"register">("signin");
  const [name,setName]=useState(""), [email,setEmail]=useState(""), [password,setPassword]=useState(""), [confirm,setConfirm]=useState(""), [error,setError]=useState("");
  const [role,setRole]=useState<"customer"|"organizer">("customer");
  const [busy,setBusy]=useState(false);
  const submit=async()=>{
    setError("");
    try{
      setBusy(true);
      if(tab==="signin"){
        if(!email||!password){setError("Please fill in all fields.");return;}
        const res=await api.login({email,password});
        setSession(res.access_token,{id:res.user.id,full_name:res.user.full_name,email:res.user.email,role:res.user.role});
        onAuth({id:res.user.id,full_name:res.user.full_name,email:res.user.email,role:res.user.role});
        toast.success(`Welcome back, ${res.user.full_name}!`);
      }else{
        if(!name||!email||!password){setError("Please fill in all fields.");return;}
        if(password!==confirm){setError("Passwords do not match.");return;}
        const res=await api.register({full_name:name,email,password,role});
        setSession(res.access_token,{id:res.user.id,full_name:res.user.full_name,email:res.user.email,role:res.user.role});
        onAuth({id:res.user.id,full_name:res.user.full_name,email:res.user.email,role:res.user.role});
        toast.success(`Welcome, ${res.user.full_name}!`);
      }
      onClose();
    }catch(err){
      setError(err instanceof ApiError?err.message:"Authentication failed");
    }finally{
      setBusy(false);
    }
  };
  const inp="w-full px-4 py-2.5 rounded-lg glass-input focus:outline-none focus:ring-2 focus:ring-primary text-sm";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md" onClick={onClose}>
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="glass rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600/90 to-indigo-700/90 backdrop-blur-md px-6 py-5 text-white">
          <div className="flex items-center justify-between mb-1"><div className="flex items-center gap-2"><div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center"><Ticket size={14} className="text-white"/></div><span className="font-extrabold" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>SeatFlow</span></div><button onClick={onClose} className="text-white/70 hover:text-white"><X size={18}/></button></div>
          <p className="text-blue-100 text-sm mt-2">{tab==="signin"?"Sign in to manage your bookings":"Create your account to get started"}</p>
          <p className="text-blue-200/80 text-xs mt-1">Demo: customer@example.com / password123</p>
        </div>
        <div className="flex border-b border-white/20">{(["signin","register"] as const).map(t=><button key={t} onClick={()=>{setTab(t);setError("");}} className={cx("flex-1 py-3 text-sm font-semibold transition-colors",tab===t?"text-primary border-b-2 border-primary":"text-muted-foreground hover:text-foreground")}>{t==="signin"?"Sign In":"Register"}</button>)}</div>
        <div className="p-6 space-y-4">
          {tab==="register"&&<div><label className="block text-sm font-semibold text-foreground mb-1.5">Full Name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Ahmed Rahman" className={inp}/></div>}
          <div><label className="block text-sm font-semibold text-foreground mb-1.5">Email Address</label><input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="customer@example.com" className={inp}/></div>
          <div><div className="flex justify-between mb-1.5"><label className="text-sm font-semibold text-foreground">Password</label></div><input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="••••••••" className={inp}/></div>
          {tab==="register"&&<div><label className="block text-sm font-semibold text-foreground mb-1.5">Confirm Password</label><input value={confirm} onChange={e=>setConfirm(e.target.value)} type="password" placeholder="••••••••" className={inp}/></div>}
          {tab==="register"&&(
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Account type</label>
              <select value={role} onChange={e=>setRole(e.target.value as "customer"|"organizer")} className={inp}>
                <option value="customer">Customer</option>
                <option value="organizer">Organizer</option>
              </select>
            </div>
          )}
          {error&&<p className="text-xs text-destructive flex items-center gap-1.5"><AlertCircle size={12}/>{error}</p>}
          <motion.button whileTap={{scale:0.97}} disabled={busy} onClick={submit} className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60">{busy?"Please wait…":tab==="signin"?"Sign In":"Create Account"}</motion.button>
        </div>
      </motion.div>
    </div>
  );
}
