import { useCallback, useEffect, useState } from "react";
import { Ticket } from "lucide-react";
import { Toaster, toast } from "sonner";
import { AnimatePresence } from "motion/react";
import { api, ApiError } from "../lib/api";
import {
  clearSession,
  getStoredUser,
  getToken,
  isAdmin,
  isOrganizerOrAdmin,
  updateStoredUser,
  type AuthUser,
} from "../lib/auth";
import { PageTransition } from "./lib/animations";
import {
  BASE_EVENTS,
  DEFAULT_ORGANIZER_PROFILE,
  HALLS,
  INITIAL_NOTIFICATIONS,
  VENUES,
} from "./lib/constants";
import {
  mapApiEvent,
  mapApiHall,
  mapApiHallBooking,
  mapApiVenue,
} from "./lib/mappers";
import type {
  Hall,
  HallBooking,
  Notification,
  OrganizerProfile,
  Seat,
  SeatFlowEvent,
  Venue,
  View,
} from "./lib/types";
import { Header } from "./components/layout/Header";
import { AuthModal } from "./components/modals/AuthModal";
import { NotificationPanel } from "./components/modals/NotificationPanel";
import {
  BookingDetailsView,
  ConfirmationView,
  PaymentView,
} from "./components/views/BookingFlowViews";
import { DashboardView } from "./components/views/DashboardView";
import { EventDetailView } from "./components/views/EventDetailView";
import { EventsView } from "./components/views/EventsView";
import { AdminView } from "./components/views/AdminView";
import { OrganizerView } from "./components/views/OrganizerView";
import { SeatSelectionView } from "./components/views/SeatSelectionView";
import {
  HallBookingView,
  HallConfirmationView,
  VenueBrowseView,
  VenueDetailView,
} from "./components/views/VenueViews";

export default function App() {
  const [view,setView]=useState<View>("events");
  const [allEvents,setAllEvents]=useState<SeatFlowEvent[]>([]);
  const [myEvents,setMyEvents]=useState<SeatFlowEvent[]>([]);
  const [eventsLoading,setEventsLoading]=useState(true);
  const [selectedEvent,setSelectedEvent]=useState<SeatFlowEvent|null>(null);
  const [selectedSeats,setSelectedSeats]=useState<Seat[]>([]);
  const [guestName,setGuestName]=useState("");
  const [isLoggedIn,setIsLoggedIn]=useState(false);
  const [userName,setUserName]=useState("");
  const [userRole,setUserRole]=useState("customer");
  const [showAuthModal,setShowAuthModal]=useState(false);
  const [notifications,setNotifications]=useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [showNotifications,setShowNotifications]=useState(false);
  const [organizerProfile,setOrganizerProfile]=useState<OrganizerProfile>(DEFAULT_ORGANIZER_PROFILE);
  const [selectedVenue,setSelectedVenue]=useState<Venue|null>(null);
  const [selectedHall,setSelectedHall]=useState<Hall|null>(null);
  const [venues,setVenues]=useState<Venue[]>(VENUES);
  const [halls,setHalls]=useState<Hall[]>(HALLS);
  const [venuesLoading,setVenuesLoading]=useState(false);
  const [hallsLoading,setHallsLoading]=useState(false);
  const [hallBookings,setHallBookings]=useState<HallBooking[]>([]);
  const [lastHallBooking,setLastHallBooking]=useState<HallBooking|null>(null);
  const [isDark,setIsDark]=useState(false);
  const [paying,setPaying]=useState(false);
  const [hallBookingBusy,setHallBookingBusy]=useState(false);

  const refreshEvents=useCallback(async()=>{
    try{
      setEventsLoading(true);
      const rows=await api.listEvents();
      setAllEvents(rows.map(mapApiEvent));
    }catch(err){
      toast.error(err instanceof ApiError?err.message:"API unreachable — is the backend running?");
      setAllEvents(BASE_EVENTS);
    }finally{
      setEventsLoading(false);
    }
  },[]);

  const refreshMyEvents=useCallback(async()=>{
    if(!getToken()){setMyEvents([]);return;}
    const stored=getStoredUser();
    if(!stored||!isOrganizerOrAdmin(stored.role)){setMyEvents([]);return;}
    try{
      const rows=await api.myEvents();
      setMyEvents(rows.map(mapApiEvent));
    }catch{
      setMyEvents([]);
    }
  },[]);

  const refreshVenues=useCallback(async()=>{
    try{
      setVenuesLoading(true);
      const rows=await api.listVenues();
      setVenues(rows.map(mapApiVenue));
    }catch(err){
      toast.error(err instanceof ApiError?err.message:"Failed to load venues");
      setVenues(VENUES);
    }finally{
      setVenuesLoading(false);
    }
  },[]);

  const refreshHallBookings=useCallback(async()=>{
    if(!getToken()){setHallBookings([]);return;}
    try{
      const rows=await api.myHallBookings();
      setHallBookings(rows.map(mapApiHallBooking));
    }catch{
      setHallBookings([]);
    }
  },[]);

  const loadHallsForVenue=useCallback(async(venueId:string)=>{
    try{
      setHallsLoading(true);
      const rows=await api.listHalls(venueId);
      const mapped=rows.map(mapApiHall);
      setHalls(prev=>{
        const others=prev.filter(h=>h.venueId!==venueId);
        return [...others,...mapped];
      });
    }catch(err){
      toast.error(err instanceof ApiError?err.message:"Failed to load halls");
      setHalls(prev=>{
        const fallback=HALLS.filter(h=>h.venueId===venueId);
        if(fallback.length===0) return prev;
        const others=prev.filter(h=>h.venueId!==venueId);
        return [...others,...fallback];
      });
    }finally{
      setHallsLoading(false);
    }
  },[]);

  useEffect(()=>{document.documentElement.classList.toggle("dark",isDark);},[isDark]);

  useEffect(()=>{
    const syncSession=async()=>{
      const token=getToken();
      const stored=getStoredUser();
      if(!token||!stored)return;
      setIsLoggedIn(true);
      setUserName(stored.full_name);
      setUserRole(stored.role);
      setOrganizerProfile(prev=>({
        ...DEFAULT_ORGANIZER_PROFILE,
        name:stored.full_name,
        email:stored.email,
        memberSince:prev.email===stored.email&&prev.memberSince?prev.memberSince:DEFAULT_ORGANIZER_PROFILE.memberSince,
      }));
      try{
        const me=await api.me();
        const synced:AuthUser={id:me.id,full_name:me.full_name,email:me.email,role:me.role};
        updateStoredUser(synced);
        setUserName(synced.full_name);
        setUserRole(synced.role);
        setOrganizerProfile(prev=>({...prev,name:synced.full_name,email:synced.email}));
      }catch{
        clearSession();
        setIsLoggedIn(false);
        setUserName("");
        setUserRole("customer");
      }
      refreshHallBookings();
      refreshMyEvents();
    };
    syncSession();
    api.health().catch(()=>toast.message("Backend not ready yet — start with npm run dev from repo root."));
    refreshEvents();
    refreshVenues();
  },[refreshEvents,refreshVenues,refreshHallBookings,refreshMyEvents]);

  useEffect(()=>{
    if(view==="dashboard"&&isLoggedIn) refreshHallBookings();
  },[view,isLoggedIn,refreshHallBookings]);

  useEffect(()=>{
    if(view==="organizer"&&isLoggedIn&&isOrganizerOrAdmin(userRole)) refreshMyEvents();
  },[view,isLoggedIn,userRole,refreshMyEvents]);

  const navigate=(v:View)=>{
    const authRequired:View[]=["dashboard","organizer","admin","seat-selection","booking-details","payment","hall-booking"];
    if(authRequired.includes(v)&&!isLoggedIn&&!getToken()){
      setShowAuthModal(true);
      toast.error("Please sign in to continue");
      return;
    }
    if(v==="organizer"&&!isOrganizerOrAdmin(userRole)){
      toast.error("Organizer account required");
      setView("events");
      return;
    }
    if(v==="admin"&&!isAdmin(userRole)){
      toast.error("Admin account required");
      setView("events");
      return;
    }
    setView(v);
  };
  const unreadCount=notifications.filter(n=>!n.read).length;
  const addNotification=(n:Omit<Notification,"id"|"read">)=>setNotifications(prev=>[{...n,id:`n-${Date.now()}`,read:false},...prev]);
  const handleAuth=(user:AuthUser)=>{
    setIsLoggedIn(true);
    setUserName(user.full_name);
    setUserRole(user.role);
    setOrganizerProfile({
      ...DEFAULT_ORGANIZER_PROFILE,
      name:user.full_name,
      email:user.email,
      memberSince:new Date().toLocaleString("en-GB",{month:"long",year:"numeric"}),
    });
    refreshHallBookings();
    if(isOrganizerOrAdmin(user.role)) refreshMyEvents();
    else setMyEvents([]);
  };
  const handleSignOut=()=>{
    clearSession();
    setIsLoggedIn(false);
    setUserName("");
    setUserRole("customer");
    setHallBookings([]);
    setMyEvents([]);
    setView("events");
    toast.info("You have been signed out.");
  };
  const requireAuth=()=>{if(!isLoggedIn){setShowAuthModal(true);return false;}return true;};

  const handlePayment=async()=>{
    if(!selectedEvent)return;
    if(!requireAuth())return;
    const seatIds=selectedSeats.map(s=>s.apiId).filter(Boolean) as string[];
    if(seatIds.length===0){toast.error("Missing seat IDs — reload seats and try again.");return;}
    try{
      setPaying(true);
      await api.createBooking({event_id:selectedEvent.id,seat_ids:seatIds});
      navigate("confirmation");
      toast.success("Booking confirmed!");
      addNotification({type:"booking_confirmed",title:"Booking Confirmed",message:`Your booking for ${selectedEvent.title} is confirmed!`,timestamp:"Just now"});
      refreshEvents();
    }catch(err){
      toast.error(err instanceof ApiError?err.message:"Booking failed");
    }finally{
      setPaying(false);
    }
  };

  const handleHallConfirm=async(booking:HallBooking)=>{
    if(!requireAuth())return;
    if(hallBookingBusy)return;
    try{
      setHallBookingBusy(true);
      const created=await api.createHallBooking({
        venue_id:booking.venueId,
        hall_id:booking.hallId,
        booking_date:booking.date,
        start_time:booking.startTime,
        end_time:booking.endTime,
        duration_type:booking.durationType,
        purpose:booking.purpose,
        guest_count:booking.guestCount,
        add_ons:booking.addOns,
        contact_name:booking.contactName,
        contact_phone:booking.contactPhone,
        contact_email:booking.contactEmail||null,
      });
      const mapped=mapApiHallBooking(created);
      setHallBookings(prev=>[mapped,...prev]);
      setLastHallBooking(mapped);
      navigate("hall-confirmation");
      toast.success("Hall booking saved!");
      addNotification({type:"hall_booking_confirmed",title:"Hall Booking Confirmed",message:`${mapped.hallName} at ${mapped.venueName} is confirmed.`,timestamp:"Just now"});
    }catch(err){
      toast.error(err instanceof ApiError?err.message:"Hall booking failed");
    }finally{
      setHallBookingBusy(false);
    }
  };

  const handleCancelHallBooking=async(id:string)=>{
    try{
      const updated=await api.cancelHallBooking(id);
      setHallBookings(prev=>prev.map(b=>b.id===id?mapApiHallBooking(updated):b));
    }catch(err){
      toast.error(err instanceof ApiError?err.message:"Failed to cancel hall booking");
      throw err;
    }
  };

  const handleUpdateHallBooking=async(updated:HallBooking)=>{
    try{
      const saved=await api.updateHallBooking(updated.id,{
        booking_date:updated.date,
        start_time:updated.startTime,
        end_time:updated.endTime,
        duration_type:updated.durationType,
        purpose:updated.purpose,
        guest_count:updated.guestCount,
        add_ons:updated.addOns,
        contact_name:updated.contactName,
        contact_phone:updated.contactPhone,
        contact_email:updated.contactEmail||null,
      });
      const mapped=mapApiHallBooking(saved);
      setHallBookings(prev=>prev.map(b=>b.id===mapped.id?mapped:b));
      toast.success("Hall booking updated");
    }catch(err){
      toast.error(err instanceof ApiError?err.message:"Failed to update hall booking");
      throw err;
    }
  };

  const handleAddEvent=async(event:SeatFlowEvent)=>{
    if(!requireAuth())return;
    if(userRole!=="organizer"&&userRole!=="admin"){
      toast.error("Organizer account required. Register as organizer or use organizer@example.com");
      return;
    }
    try{
      const iso=new Date(`${event.date} ${event.time}`).toISOString();
      const created=await api.createEvent({
        title:event.title,
        description:event.description,
        venue:event.venue,
        event_date:Number.isNaN(Date.parse(iso))?new Date(Date.now()+7*86400000).toISOString():iso,
        price:event.priceFrom,
        category:event.category||"Concert",
        status:event.status==="draft"?"Draft":"Published",
        booking_window_open:true,
        vip_seats:8,
        standard_seats:Math.max(8,event.totalSeats-8),
      });
      const mapped=mapApiEvent(created);
      setMyEvents(prev=>[mapped,...prev]);
      if(created.status==="Published") setAllEvents(prev=>[mapped,...prev]);
      toast.success("Event published to API");
    }catch(err){
      toast.error(err instanceof ApiError?err.message:"Failed to create event");
    }
  };

  const handleUpdateEvent=async(event:SeatFlowEvent)=>{
    try{
      const updated=await api.updateEvent(event.id,{
        title:event.title,
        description:event.description,
        venue:event.venue,
        category:event.category,
        price:event.priceFrom,
        status:event.status==="draft"?"Draft":"Published",
      });
      const mapped=mapApiEvent(updated);
      setMyEvents(prev=>prev.map(e=>e.id===event.id?mapped:e));
      setAllEvents(prev=>{
        if(updated.status==="Published"){
          const exists=prev.some(e=>e.id===event.id);
          return exists?prev.map(e=>e.id===event.id?mapped:e):[mapped,...prev];
        }
        return prev.filter(e=>e.id!==event.id);
      });
      toast.success("Event updated");
    }catch(err){
      toast.error(err instanceof ApiError?err.message:"Failed to update event");
    }
  };

  const handleDeleteEvent=async(id:string)=>{
    try{
      await api.deleteEvent(id);
      setMyEvents(prev=>prev.filter(e=>e.id!==id));
      setAllEvents(prev=>prev.filter(e=>e.id!==id));
      toast.success("Event deleted");
    }catch(err){
      toast.error(err instanceof ApiError?err.message:"Failed to delete event");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-right" richColors closeButton/>
      <AnimatePresence>
        {showAuthModal&&<AuthModal key="auth" onClose={()=>setShowAuthModal(false)} onAuth={handleAuth}/>}
        {showNotifications&&<NotificationPanel key="notif" notifications={notifications} onClose={()=>setShowNotifications(false)} onMarkAllRead={()=>setNotifications(prev=>prev.map(n=>({...n,read:true})))} onClearAll={()=>setNotifications([])} onMarkRead={id=>setNotifications(prev=>prev.map(n=>n.id===id?{...n,read:true}:n))}/>}
      </AnimatePresence>
      <Header view={view} isLoggedIn={isLoggedIn} userName={userName} userRole={userRole} unreadCount={unreadCount} isDark={isDark} onNav={navigate} onOpenAuth={()=>setShowAuthModal(true)} onSignOut={handleSignOut} onToggleNotifications={()=>setShowNotifications(!showNotifications)} onToggleDark={()=>setIsDark(!isDark)}/>
      <main className="flex-1">
        {view==="events"&&eventsLoading&&<p className="text-center text-sm text-muted-foreground py-4">Loading events from API…</p>}
        <AnimatePresence mode="wait">
          <PageTransition k={view}>
            {view==="events"&&<EventsView events={allEvents} onSelectEvent={event=>{setSelectedEvent(event);navigate("event-detail");}}/>}
            {view==="event-detail"&&selectedEvent&&<EventDetailView event={selectedEvent} onSelectSeats={()=>{if(!requireAuth())return;navigate("seat-selection");}} onBack={()=>navigate("events")}/>}
            {view==="seat-selection"&&selectedEvent&&<SeatSelectionView event={selectedEvent} onContinue={seats=>{setSelectedSeats(seats);navigate("booking-details");}} onBack={()=>navigate("event-detail")}/>}
            {view==="booking-details"&&selectedEvent&&<BookingDetailsView event={selectedEvent} seats={selectedSeats} onConfirm={name=>{setGuestName(name);navigate("payment");}} onBack={()=>navigate("seat-selection")}/>}
            {view==="payment"&&selectedEvent&&<PaymentView event={selectedEvent} seats={selectedSeats} name={guestName} onPay={()=>{if(!paying)handlePayment();}} onBack={()=>navigate("booking-details")}/>}
            {view==="confirmation"&&selectedEvent&&<ConfirmationView event={selectedEvent} seats={selectedSeats} name={guestName} onDone={()=>navigate("events")}/>}
            {view==="venue-browse"&&<VenueBrowseView venues={venues} loading={venuesLoading} onSelectVenue={venue=>{setSelectedVenue(venue);loadHallsForVenue(venue.id);navigate("venue-detail");}}/>}
            {view==="venue-detail"&&selectedVenue&&<VenueDetailView venue={selectedVenue} halls={halls.filter(h=>h.venueId===selectedVenue.id)} loading={hallsLoading} onSelectHall={hall=>{setSelectedHall(hall);navigate("hall-booking");}} onBack={()=>navigate("venue-browse")}/>}
            {view==="hall-booking"&&selectedVenue&&selectedHall&&<HallBookingView venue={selectedVenue} hall={selectedHall} onConfirm={handleHallConfirm} onBack={()=>navigate("venue-detail")}/>}
            {view==="hall-confirmation"&&lastHallBooking&&<HallConfirmationView booking={lastHallBooking} onBackVenues={()=>navigate("venue-browse")} onMyBookings={()=>navigate("dashboard")}/>}
            {view==="dashboard"&&<DashboardView hallBookings={hallBookings} halls={halls} onCancelHall={handleCancelHallBooking} onUpdateHall={handleUpdateHallBooking} addNotification={addNotification} isLoggedIn={isLoggedIn} onNeedAuth={()=>{setShowAuthModal(true);}}/>}
            {view==="organizer"&&(
              isOrganizerOrAdmin(userRole)
                ? <OrganizerView events={myEvents} venues={venues} onAddEvent={handleAddEvent} onUpdateEvent={handleUpdateEvent} onDeleteEvent={handleDeleteEvent} profile={organizerProfile} onUpdateProfile={setOrganizerProfile}/>
                : (
                  <div className="max-w-lg mx-auto px-4 py-16 text-center">
                    <h2 className="font-bold text-foreground text-lg mb-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Organizer account required</h2>
                    <p className="text-sm text-muted-foreground mb-4">Register as an organizer or sign in with organizer@example.com to manage events.</p>
                    <button onClick={()=>navigate("events")} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold">Back to Events</button>
                  </div>
                )
            )}
            {view==="admin"&&(
              isAdmin(userRole)
                ? <AdminView onUpdateEvent={handleUpdateEvent} onDeleteEvent={handleDeleteEvent}/>
                : (
                  <div className="max-w-lg mx-auto px-4 py-16 text-center">
                    <h2 className="font-bold text-foreground text-lg mb-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Admin account required</h2>
                    <p className="text-sm text-muted-foreground mb-4">Sign in with admin@example.com to access platform governance tools.</p>
                    <button onClick={()=>navigate("events")} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold">Back to Events</button>
                  </div>
                )
            )}
          </PageTransition>
        </AnimatePresence>
      </main>
      <footer className="bg-slate-900/95 backdrop-blur-sm text-slate-400 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2"><div className="w-6 h-6 bg-primary rounded flex items-center justify-center"><Ticket size={12} className="text-white"/></div><span className="font-bold text-white text-sm" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>SeatFlow</span></div>
          <p className="text-xs text-slate-500">© 2025 SeatFlow. Event Seat Booking & Management System.</p>
          <div className="flex gap-4 text-xs">{["Privacy","Terms","Support","API"].map(link=><button key={link} className="hover:text-white transition-colors">{link}</button>)}</div>
        </div>
      </footer>
    </div>
  );
}
