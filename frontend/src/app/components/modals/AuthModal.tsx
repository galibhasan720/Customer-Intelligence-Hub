import { useState } from "react";
import { AlertCircle, Eye, EyeOff, Ticket, X } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "../../../lib/api";
import { setSession, type AuthUser } from "../../../lib/auth";
import { Field } from "../atoms";
import { cx } from "../../lib/utils";

export function AuthModal({ onClose, onAuth }: { onClose: () => void; onAuth: (user: AuthUser) => void }) {
  const [tab, setTab] = useState<"signin" | "register">("signin");
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [error, setError] = useState("");
  const [role, setRole] = useState<"customer" | "organizer">("customer");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const submit = async () => {
    setError("");
    try {
      setBusy(true);
      if (tab === "signin") {
        if (!email || !password) {
          setError("Please fill in all fields.");
          return;
        }
        const res = await api.login({ email, password });
        setSession(res.access_token, { id: res.user.id, full_name: res.user.full_name, email: res.user.email, role: res.user.role });
        onAuth({ id: res.user.id, full_name: res.user.full_name, email: res.user.email, role: res.user.role });
        toast.success(`Welcome back, ${res.user.full_name}!`);
      } else {
        if (!name || !email || !password) {
          setError("Please fill in all fields.");
          return;
        }
        if (password !== confirm) {
          setError("Passwords do not match.");
          return;
        }
        const res = await api.register({ full_name: name, email, password, role });
        setSession(res.access_token, { id: res.user.id, full_name: res.user.full_name, email: res.user.email, role: res.user.role });
        onAuth({ id: res.user.id, full_name: res.user.full_name, email: res.user.email, role: res.user.role });
        toast.success(`Welcome, ${res.user.full_name}!`);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="surface-raised w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div className="bg-primary px-6 py-5 text-white">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                <Ticket size={14} className="text-white" />
              </div>
              <span id="auth-title" className="font-display font-extrabold">
                SeatFlow
              </span>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="text-white/70 hover:text-white p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <X size={18} />
            </button>
          </div>
          <p className="text-white/80 text-sm mt-2">{tab === "signin" ? "Sign in to manage your bookings" : "Create your account to get started"}</p>
          <p className="text-white/55 text-xs mt-1">Demo: customer@example.com / password123</p>
        </div>
        <div className="flex border-b border-border">
          {(["signin", "register"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setError("");
              }}
              className={cx("flex-1 py-3 text-sm font-semibold transition-colors", tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}
            >
              {t === "signin" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>
        <div className="p-6 space-y-4">
          {tab === "register" && (
            <Field label="Full Name">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ahmed Rahman" className="field-input" />
            </Field>
          )}
          <Field label="Email Address">
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="customer@example.com" className="field-input" />
          </Field>
          <Field label="Password">
            <div className="relative">
              <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? "text" : "password"} placeholder="••••••••" className="field-input pr-10" />
              <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          {tab === "register" && (
            <Field label="Confirm Password">
              <div className="relative">
                <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type={showConfirm ? "text" : "password"} placeholder="••••••••" className="field-input pr-10" />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
          )}
          {tab === "register" && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-1.5">Account type</p>
              <div className="grid grid-cols-2 gap-2">
                {(["customer", "organizer"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cx(
                      "py-2.5 rounded-xl text-sm font-semibold border capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      role === r ? "border-primary bg-primary text-white" : "border-border text-foreground hover:border-primary/40",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
          {error && (
            <p className="text-xs text-destructive flex items-center gap-1.5">
              <AlertCircle size={12} />
              {error}
            </p>
          )}
          <button type="button" disabled={busy} onClick={submit} className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {busy ? "Please wait…" : tab === "signin" ? "Sign In" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
