import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle, ChevronRight, Clock, CreditCard, Download, Lock } from "lucide-react";
import { toast } from "sonner";
import { Badge, BookingStepper, Field, OrderSummary, QRCode, Surface } from "../atoms";
import type { Seat, SeatFlowEvent } from "../../lib/types";
import { cx } from "../../lib/utils";

export function BookingDetailsView({
  event,
  seats,
  onConfirm,
  onBack,
  initialName = "",
  initialEmail = "",
}: {
  event: SeatFlowEvent;
  seats: Seat[];
  onConfirm: (name: string, email: string) => void;
  onBack: () => void;
  initialName?: string;
  initialEmail?: string;
}) {
  const [name, setName] = useState(initialName),
    [email, setEmail] = useState(initialEmail),
    [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  useEffect(() => {
    if (initialName) setName(initialName);
    if (initialEmail) setEmail(initialEmail);
  }, [initialName, initialEmail]);
  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.includes("@")) e.email = "Valid email required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const inp = (err?: string) => cx("field-input", err && "ring-2 ring-destructive border-destructive");
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-primary text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
          <ArrowLeft size={16} /> Back
        </button>
        <BookingStepper step={2} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Surface raised className="p-6">
            <h2 className="font-display font-bold text-lg text-foreground mb-5">Your Details</h2>
            <div className="space-y-4">
              <Field label="Full Name" error={errors.name}>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ahmed Rahman" className={inp(errors.name)} />
              </Field>
              <Field label="Email Address" error={errors.email}>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="ahmed@example.com" className={inp(errors.email)} />
              </Field>
            </div>
          </Surface>
          <Surface muted className="p-4 flex items-start gap-3">
            <Clock size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Seats are being held</p>
              <p className="text-xs text-muted-foreground mt-0.5">Complete booking within the hold window to keep these seats.</p>
            </div>
          </Surface>
        </div>
        <div>
          <div className="sticky top-24">
            <OrderSummary event={event} seats={seats} />
            <button
              type="button"
              onClick={() => validate() && onConfirm(name, email)}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight size={16} /> Continue to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PaymentView({
  event,
  seats,
  name,
  onPay,
  onBack,
  paying,
}: {
  event: SeatFlowEvent;
  seats: Seat[];
  name: string;
  onPay: () => void;
  onBack: () => void;
  paying?: boolean;
}) {
  const [method, setMethod] = useState<"card" | "paypal" | "apple">("card");
  const [cardNum, setCardNum] = useState(""),
    [expiry, setExpiry] = useState(""),
    [cvv, setCvv] = useState(""),
    [error, setError] = useState("");
  const total = seats.reduce((s, seat) => s + seat.price, 0);
  const formatCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };
  const submit = () => {
    if (method === "card" && (cardNum.replace(/\s/g, "").length < 16 || !expiry || cvv.length < 3)) {
      setError("Please complete all card details.");
      return;
    }
    onPay();
  };
  const METHODS = [
    { id: "card" as const, label: "Credit / Debit Card", icon: CreditCard, stub: false },
    { id: "paypal" as const, label: "PayPal", icon: Lock, stub: true },
    { id: "apple" as const, label: "Apple Pay", icon: Lock, stub: true },
  ];
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-primary text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
          <ArrowLeft size={16} /> Back
        </button>
        <BookingStepper step={3} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Surface raised className="p-6">
            <h2 className="font-display font-bold text-lg text-foreground mb-5">Payment Method</h2>
            <div className="space-y-2 mb-5">
              {METHODS.map(({ id, label, icon: Icon, stub }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setMethod(id);
                    setError("");
                  }}
                  className={cx(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    method === id ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-primary/40",
                  )}
                >
                  <div className={cx("w-4 h-4 rounded-full border-2 shrink-0", method === id ? "border-primary" : "border-slate-300 dark:border-slate-600")}>
                    {method === id && <div className="w-2 h-2 rounded-full bg-primary m-auto mt-0.5" />}
                  </div>
                  <Icon size={16} className={method === id ? "text-primary" : "text-muted-foreground"} />
                  {label}
                  {stub && <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Demo</span>}
                </button>
              ))}
            </div>
            {method === "card" && (
              <div className="space-y-4 border-t border-border pt-5">
                <Field label="Card Number">
                  <input value={cardNum} onChange={(e) => setCardNum(formatCard(e.target.value))} placeholder="1234 5678 9012 3456" className="field-input font-mono tracking-wider" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Expiry">
                    <input value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" className="field-input font-mono" />
                  </Field>
                  <Field label="CVV">
                    <input value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} type="password" placeholder="•••" className="field-input font-mono" />
                  </Field>
                </div>
                <Field label="Name on Card">
                  <input defaultValue={name} placeholder="Ahmed Rahman" className="field-input" />
                </Field>
              </div>
            )}
            {method !== "card" && (
              <div className="border-t border-border pt-5">
                <Surface muted className="p-6 text-center text-muted-foreground text-sm">
                  <Lock size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="font-medium">Redirecting to {method === "paypal" ? "PayPal" : "Apple Pay"}…</p>
                  <p className="text-xs mt-1 opacity-70">Payment is simulated in demo mode.</p>
                </Surface>
              </div>
            )}
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1.5 mt-3">
                <AlertCircle size={12} />
                {error}
              </p>
            )}
          </Surface>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock size={12} /> Your payment details are encrypted and never stored.
          </div>
        </div>
        <div>
          <div className="sticky top-24 space-y-4">
            <OrderSummary event={event} seats={seats} />
            <button
              type="button"
              disabled={paying}
              onClick={submit}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Lock size={14} /> {paying ? "Processing…" : `Pay ৳${total}`}
            </button>
            <p className="text-xs text-muted-foreground text-center">No charge in demo mode</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function downloadEventTicket(opts: {
  ref: string;
  eventTitle: string;
  date: string;
  time: string;
  venue: string;
  guestName: string;
  seats: string[];
  total: number;
}): void {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>SeatFlow Ticket — ${escapeHtml(opts.ref)}</title>
  <style>
    body{font-family:Georgia,serif;background:#f1f5f9;margin:0;padding:32px;color:#0f172a}
    .ticket{max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,.12)}
    .head{background:#1e40af;color:#fff;padding:24px}
    .head p{margin:0 0 6px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;opacity:.8}
    .head h1{margin:0;font-size:22px}
    .badge{display:inline-block;margin-top:12px;background:#15803d;color:#fff;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px}
    .body{padding:24px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
    .label{font-size:11px;color:#64748b;margin:0 0 4px}
    .value{font-size:14px;font-weight:700;margin:0}
    .seats{display:flex;flex-wrap:wrap;gap:6px}
    .seat{background:#dbeafe;color:#1e40af;font-size:12px;font-weight:700;padding:4px 8px;border-radius:6px}
    .total{border-top:1px dashed #cbd5e1;padding-top:16px;display:flex;justify-content:space-between;align-items:center;font-weight:700}
    .total span:last-child{color:#1e40af;font-size:20px}
    .foot{text-align:center;font-size:12px;color:#94a3b8;margin-top:24px}
  </style>
</head>
<body>
  <div class="ticket">
    <div class="head">
      <p>Booking reference</p>
      <h1>${escapeHtml(opts.ref)}</h1>
      <span class="badge">Confirmed</span>
    </div>
    <div class="body">
      <div class="grid">
        <div><p class="label">Event</p><p class="value">${escapeHtml(opts.eventTitle)}</p></div>
        <div><p class="label">Date &amp; time</p><p class="value">${escapeHtml(opts.date)} · ${escapeHtml(opts.time)}</p></div>
        <div><p class="label">Venue</p><p class="value">${escapeHtml(opts.venue)}</p></div>
        <div><p class="label">Guest</p><p class="value">${escapeHtml(opts.guestName || "Guest")}</p></div>
      </div>
      <p class="label">Seats</p>
      <div class="seats">${opts.seats.map((s) => `<span class="seat">${escapeHtml(s)}</span>`).join("") || `<span class="seat">—</span>`}</div>
      <div class="total"><span>Total paid</span><span>৳${opts.total.toLocaleString()}</span></div>
    </div>
  </div>
  <p class="foot">SeatFlow · Show this ticket at the entrance</p>
</body>
</html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `SeatFlow-Ticket-${opts.ref}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ConfirmationView({ event, seats, name, onDone }: { event: SeatFlowEvent; seats: Seat[]; name: string; onDone: () => void }) {
  const ref = useRef(`BK-${Math.floor(10000 + Math.random() * 90000)}`).current;
  const total = seats.reduce((s, seat) => s + seat.price, 0);
  const handleDownload = () => {
    downloadEventTicket({
      ref,
      eventTitle: event.title,
      date: event.date,
      time: event.time,
      venue: event.venue,
      guestName: name,
      seats: seats.map((s) => s.id),
      total,
    });
    toast.success("Ticket downloaded");
  };
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-center mb-8">
        <BookingStepper step={4} />
      </div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-foreground mb-2">Booking confirmed</h1>
        <p className="text-muted-foreground text-sm">A confirmation has been sent to your email.</p>
      </div>
      <Surface raised className="overflow-hidden">
        <div className="bg-primary px-6 py-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Booking reference</p>
              <p className="text-xl font-bold font-display">{ref}</p>
            </div>
            <Badge color="green">Confirmed</Badge>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-6 mb-6">
            {[
              { label: "Event", value: event.title },
              { label: "Date & Time", value: `${event.date} · ${event.time}` },
              { label: "Venue", value: event.venue },
              { label: "Guest", value: name },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className="font-bold text-sm text-foreground">{value}</p>
              </div>
            ))}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Seats</p>
              <div className="flex flex-wrap gap-1">
                {seats.map((s) => (
                  <span key={s.id} className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded">
                    {s.id}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total paid</p>
              <p className="font-bold text-lg text-primary">৳{total}</p>
            </div>
          </div>
          <div className="flex items-center justify-center py-4 border-t border-dashed border-border">
            <div className="text-center">
              <QRCode />
              <p className="text-xs text-muted-foreground mt-2">Scan at entrance</p>
            </div>
          </div>
        </div>
      </Surface>
      <div className="flex gap-3 mt-6">
        <button type="button" onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 py-2.5 surface rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Download size={15} /> Download Ticket
        </button>
        <button type="button" onClick={onDone} className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Back to Events
        </button>
      </div>
    </div>
  );
}
