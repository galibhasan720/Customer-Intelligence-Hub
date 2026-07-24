import { useState, useCallback, useEffect, useRef } from "react";
import {
  Search, Calendar, MapPin, Users, Ticket, BarChart2, ChevronRight, X, Check,
  Clock, Bell, LogIn, LogOut, User, Settings, Plus, Edit2, Trash2, Eye,
  TrendingUp, TrendingDown, AlertCircle, CheckCircle, XCircle, Menu, ArrowLeft,
  Download, CreditCard, ChevronDown, SlidersHorizontal, Lock, Star, Building2,
  Phone, Globe, BadgeCheck, Sparkles, ChevronUp, Sun, Moon, Upload,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { api, ApiError, formatEventDate, type ApiBooking, type ApiEvent, type ApiHall, type ApiHallBooking, type ApiSeat, type ApiVenue } from "../lib/api";
import { clearSession, getStoredUser, getToken, setSession, type AuthUser } from "../lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

type View =
  | "events" | "event-detail" | "seat-selection" | "booking-details"
  | "payment" | "confirmation" | "dashboard" | "organizer"
  | "venue-browse" | "venue-detail" | "hall-booking" | "hall-confirmation";

type SeatStatus = "available" | "selected" | "held" | "reserved" | "sold" | "vip-available" | "accessible" | "companion" | "blocked";

interface Seat { id: string; apiId?: string; row: string; number: number; status: SeatStatus; price: number; category: "VIP" | "Standard" | "Accessible" | "Companion"; }
interface SeatFlowEvent { id: string; title: string; category: string; date: string; time: string; venue: string; city: string; priceFrom: number; priceTo: number; totalSeats: number; soldSeats: number; image: string; description: string; tags: string[]; status?: "draft" | "published"; }
interface Booking { id: string; eventId: string; eventTitle: string; date: string; venue: string; seats: string[]; total: number; status: "Confirmed" | "Pending" | "Cancelled" | "Expired"; bookedAt: string; guestName?: string; guestEmail?: string; }
interface Notification { id: string; type: "booking_confirmed" | "booking_cancelled" | "event_reminder" | "event_updated" | "hold_expired" | "payment_processed" | "hall_booking_confirmed" | "new_event"; title: string; message: string; timestamp: string; read: boolean; }
interface Venue { id: string; name: string; type: string; address: string; city: string; image: string; rating: number; reviewCount: number; totalHalls: number; priceFrom: number; description: string; amenities: string[]; }
interface Hall { id: string; venueId: string; name: string; capacity: number; areaSqft: number; floor: number; pricePerHour: number; priceHalfDay: number; priceFullDay: number; amenities: string[]; image: string; available: boolean; }
interface HallBooking { id: string; venueId: string; hallId: string; venueName: string; hallName: string; date: string; startTime: string; endTime: string; durationType: "hourly" | "half-day" | "full-day"; purpose: string; guestCount: number; addOns: string[]; total: number; status: "Confirmed" | "Pending" | "Cancelled"; bookedAt: string; contactName: string; contactPhone: string; contactEmail?: string; }
interface OrganizerProfile { name: string; organizationName: string; bio: string; phone: string; email: string; website: string; city: string; address: string; verified: boolean; eventsCreated: number; totalBookings: number; rating: number; memberSince: string; }
interface TicketTier { name: string; price: number; quantity: number; }

function mapApiEvent(e: ApiEvent): SeatFlowEvent {
  const { date, time } = formatEventDate(e.event_date);
  return {
    id: e.id,
    title: e.title,
    category: e.category,
    date,
    time,
    venue: e.venue,
    city: e.city || "Dhaka",
    priceFrom: Number(e.price_from),
    priceTo: Number(e.price_to),
    totalSeats: e.total_seats,
    soldSeats: e.sold_seats,
    image: e.image || "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
    description: e.description || "",
    tags: e.tags?.length ? e.tags : [e.category],
    status: e.status === "Draft" ? "draft" : "published",
  };
}

function mapApiSeat(s: ApiSeat): Seat {
  const available = s.status === "Available";
  const status: SeatStatus =
    s.status === "Booked" || s.status === "Locked"
      ? "sold"
      : s.category === "VIP"
        ? "vip-available"
        : "available";
  const numMatch = s.seat_number.match(/(\d+)/);
  return {
    id: s.seat_number,
    apiId: s.id,
    row: s.seat_number.split("-")[0] || "S",
    number: numMatch ? Number(numMatch[1]) : 0,
    status: available ? status : "sold",
    price: s.price,
    category: s.category === "VIP" ? "VIP" : "Standard",
  };
}

function mapApiBooking(b: ApiBooking): Booking {
  const { date } = formatEventDate(b.event_date);
  return {
    id: b.id,
    eventId: b.event_id,
    eventTitle: b.event_title,
    date,
    venue: b.venue,
    seats: b.seats,
    total: b.total,
    status: b.status as Booking["status"],
    bookedAt: formatEventDate(b.booked_at).date,
  };
}

function mapApiVenue(v: ApiVenue): Venue {
  return {
    id: v.id,
    name: v.name,
    type: v.type,
    address: v.address,
    city: v.city,
    image: v.image,
    rating: Number(v.rating),
    reviewCount: v.review_count,
    totalHalls: v.total_halls,
    priceFrom: Number(v.price_from),
    description: v.description || "",
    amenities: v.amenities || [],
  };
}

function mapApiHall(h: ApiHall): Hall {
  return {
    id: h.id,
    venueId: h.venue_id,
    name: h.name,
    capacity: h.capacity,
    areaSqft: h.area_sqft,
    floor: h.floor,
    pricePerHour: Number(h.price_per_hour),
    priceHalfDay: Number(h.price_half_day),
    priceFullDay: Number(h.price_full_day),
    amenities: h.amenities || [],
    image: h.image,
    available: h.available,
  };
}

function mapApiHallBooking(b: ApiHallBooking): HallBooking {
  return {
    id: b.id,
    venueId: b.venue_id,
    hallId: b.hall_id,
    venueName: b.venue_name,
    hallName: b.hall_name,
    date: typeof b.booking_date === "string" ? b.booking_date : String(b.booking_date),
    startTime: b.start_time,
    endTime: b.end_time,
    durationType: (b.duration_type as HallBooking["durationType"]) || "full-day",
    purpose: b.purpose,
    guestCount: b.guest_count,
    addOns: b.add_ons || [],
    total: Number(b.total),
    status: (b.status as HallBooking["status"]) || "Confirmed",
    bookedAt: formatEventDate(b.booked_at).date,
    contactName: b.contact_name,
    contactPhone: b.contact_phone,
    contactEmail: b.contact_email || undefined,
  };
}

// ─── Category Groups ──────────────────────────────────────────────────────────

const CATEGORY_GROUPS = [
  { name: "Music & Entertainment", emoji: "🎵", color: "blue", items: ["Concert", "Live Music", "DJ Night", "Music Festival", "Comedy Show", "Stand-up Comedy"] },
  { name: "Arts & Culture", emoji: "🎭", color: "violet", items: ["Theatre", "Dance Performance", "Art Exhibition", "Film Screening", "Poetry Night", "Cultural Festival"] },
  { name: "Sports & Recreation", emoji: "🏏", color: "green", items: ["Cricket", "Football", "Badminton", "Basketball", "Marathon", "Esports Tournament", "Kabaddi", "Volleyball"] },
  { name: "Business & Professional", emoji: "💼", color: "slate", items: ["Conference", "Workshop", "Seminar", "Networking Mixer", "Product Launch", "Award Ceremony", "Job Fair", "Trade Show"] },
  { name: "Education", emoji: "📚", color: "amber", items: ["Training Program", "Hackathon", "Tech Talk", "Science Fair", "Academic Competition", "Debate Competition", "Book Fair"] },
  { name: "Social & Celebrations", emoji: "🎊", color: "pink", items: ["Wedding", "Birthday Party", "Anniversary", "Baby Shower", "Graduation Party", "Engagement Ceremony", "Family Reunion"] },
  { name: "Community & Charity", emoji: "🤝", color: "teal", items: ["Charity Gala", "Fundraiser", "Blood Drive", "Community Meetup", "Volunteer Day"] },
  { name: "Food & Lifestyle", emoji: "🍽️", color: "orange", items: ["Food Festival", "Cooking Class", "Health & Wellness Expo", "Fitness Boot Camp", "Yoga Retreat"] },
  { name: "Religious & Cultural", emoji: "🕌", color: "emerald", items: ["Eid Celebration", "Durga Puja", "Milad Mahfil", "Religious Conference", "Bishwa Ijtema"] },
  { name: "Government & Civic", emoji: "🏛️", color: "indigo", items: ["Town Hall Meeting", "Government Conference", "Civic Forum"] },
];

const POPULAR_CATEGORIES = ["Concert", "Wedding", "Conference", "Food Festival"];
const CAT_COLORS: Record<string, string> = {};
CATEGORY_GROUPS.forEach(g => g.items.forEach(item => { CAT_COLORS[item] = g.color; }));

const BADGE_COLORS: Record<string, string> = {
  blue:"bg-blue-100 text-blue-700", green:"bg-green-100 text-green-700", amber:"bg-amber-100 text-amber-700",
  violet:"bg-violet-100 text-violet-700", red:"bg-red-100 text-red-700", slate:"bg-slate-100 text-slate-600",
  pink:"bg-pink-100 text-pink-700", teal:"bg-teal-100 text-teal-700", orange:"bg-orange-100 text-orange-700",
  emerald:"bg-emerald-100 text-emerald-700", indigo:"bg-indigo-100 text-indigo-700",
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const BASE_EVENTS: SeatFlowEvent[] = [
  { id:"evt-1", title:"Artcell Live — Dhaka Concert Night", category:"Concert", date:"Sat, 12 Jul 2025", time:"8:00 PM", venue:"Bashundhara International Convention City", city:"Dhaka", priceFrom:500, priceTo:2500, totalSeats:120, soldSeats:74, image:"https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80", description:"An electrifying night with one of Bangladesh's greatest rock bands. Expect iconic anthems, special guests, and a stunning light show at the largest indoor venue in Dhaka.", tags:["Live Music","Band","Rock"] },
  { id:"evt-2", title:"DigitalBangladesh TechSummit 2025", category:"Conference", date:"Wed, 23 Jul 2025", time:"9:00 AM", venue:"Bangladesh-China Friendship Conference Centre", city:"Dhaka", priceFrom:1500, priceTo:8000, totalSeats:120, soldSeats:45, image:"https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80", description:"Bangladesh's largest technology summit bringing together entrepreneurs, engineers, and investors for two days of keynotes, workshops, and networking. 2025 theme: AI & the Future.", tags:["Technology","AI","Networking"] },
  { id:"evt-3", title:"Nuruldiner Sarajiban — Stage Play", category:"Theatre", date:"Fri, 1 Aug 2025", time:"7:30 PM", venue:"Bangladesh Shilpakala Academy", city:"Dhaka", priceFrom:300, priceTo:1200, totalSeats:120, soldSeats:98, image:"https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=800&q=80", description:"A landmark new production of Syed Shamsul Haq's timeless masterpiece with the country's finest actors in an unforgettable performance.", tags:["Theatre","Stage","Culture"] },
  { id:"evt-4", title:"BPL Final: Dhaka vs Chattogram", category:"Cricket", date:"Sun, 10 Aug 2025", time:"3:00 PM", venue:"Mirpur Shere Bangla National Cricket Stadium", city:"Dhaka", priceFrom:400, priceTo:3000, totalSeats:120, soldSeats:112, image:"https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80", description:"The thrilling Bangladesh Premier League final. Dhaka Capitals take on Chattogram Challengers. Secure your seat before they sell out.", tags:["Cricket","BPL","Final"] },
];

const INITIAL_BOOKINGS: Booking[] = [
  { id:"BK-29471", eventId:"evt-1", eventTitle:"Artcell Live — Dhaka Concert Night", date:"Sat, 12 Jul 2025", venue:"Bashundhara Convention City, Dhaka", seats:["B5","B6"], total:1000, status:"Confirmed", bookedAt:"10 Jun 2025", guestName:"Ahmed Rahman", guestEmail:"ahmed@example.com" },
  { id:"BK-18302", eventId:"evt-2", eventTitle:"DigitalBangladesh TechSummit 2025", date:"Wed, 23 Jul 2025", venue:"Bangladesh-China Friendship Centre, Dhaka", seats:["C3"], total:1500, status:"Pending", bookedAt:"15 Jun 2025", guestName:"Fatema Khatun", guestEmail:"fatema@example.com" },
  { id:"BK-09911", eventId:"evt-3", eventTitle:"Nuruldiner Sarajiban — Stage Play", date:"Fri, 14 Feb 2025", venue:"Shilpakala Academy, Dhaka", seats:["F7","F8"], total:600, status:"Cancelled", bookedAt:"1 Jan 2025", guestName:"Rafiq Islam", guestEmail:"rafiq@example.com" },
];

const BOOKING_TREND = [
  {day:"Mon",bookings:12},{day:"Tue",bookings:19},{day:"Wed",bookings:31},
  {day:"Thu",bookings:24},{day:"Fri",bookings:42},{day:"Sat",bookings:58},{day:"Sun",bookings:37},
];
const CATEGORY_DATA = [{name:"Concert",value:38,fill:"#1D4ED8"},{name:"Sports",value:29,fill:"#16A34A"},{name:"Conference",value:18,fill:"#D97706"},{name:"Theatre",value:15,fill:"#7C3AED"}];
const BOOKING_STATUS = [{label:"Confirmed",value:78,color:"#16A34A"},{label:"Pending",value:14,color:"#D97706"},{label:"Cancelled",value:8,color:"#DC2626"}];
const REVENUE_DATA = [
  {event:"BPL Final: Dhaka vs Chattogram",revenue:11200,target:13200,color:"#16A34A"},
  {event:"Artcell Live — Dhaka Concert Night",revenue:8500,target:12000,color:"#1D4ED8"},
  {event:"DigitalBangladesh TechSummit 2025",revenue:6750,target:9000,color:"#7C3AED"},
  {event:"Nuruldiner Sarajiban — Stage Play",revenue:2100,target:2700,color:"#D97706"},
];
const PRICE_FILTERS = ["All Prices","Under ৳500","৳500-৳2000","৳2000+"];
const SORT_OPTIONS = ["Date","Popularity","Availability","Price"];
const VENUE_TYPES = ["All","Convention Center","Hotel Banquet","Community Hall","Conference Center","Rooftop","Restaurant & Banquet"];
const BOOKING_PURPOSES = ["Wedding","Corporate Meeting","Birthday Celebration","Conference / Seminar","Training Program","Exhibition","Engagement Ceremony","Eid Gathering","Religious Program","Graduation Party","Product Launch","Other"];
const ADD_ON_OPTIONS = [
  {id:"catering",label:"Catering Service",price:500,unit:"per person"},
  {id:"av",label:"AV Equipment Setup",price:5000,unit:"flat"},
  {id:"decoration",label:"Stage Decoration",price:15000,unit:"flat"},
  {id:"photography",label:"Photography Package",price:10000,unit:"flat"},
  {id:"security",label:"Security Personnel",price:3000,unit:"flat"},
  {id:"valet",label:"Valet Parking",price:2000,unit:"flat"},
];
const CANCEL_REASONS = ["Change of plans","Can't attend","Found a better option","Event details changed","Other"];
const SUGGESTED_TAGS_FEATURED = ["Outdoor","Indoor","Family-friendly","Live","Night","Weekend","Youth","Cultural"];
const SUGGESTED_TAGS_MORE = ["Educational","Corporate","Free Entry","Premium","Networking","Charity","Workshop","Exhibition","Performance","Festival","Community","Sports","Health","Food","Tech","Art","Music","Dance"];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {id:"n-1",type:"booking_confirmed",title:"Booking Confirmed",message:"Your booking for Artcell Live — Dhaka Concert Night has been confirmed. Seats B5, B6 are yours!",timestamp:"2 min ago",read:false},
  {id:"n-2",type:"event_reminder",title:"Event Tomorrow",message:"Artcell Live — Dhaka Concert Night is tomorrow at 8:00 PM. Don't forget your tickets!",timestamp:"1 hour ago",read:false},
  {id:"n-3",type:"new_event",title:"New Event Near You",message:"BPL Final: Dhaka vs Chattogram has just been listed. Get your seats before they sell out.",timestamp:"3 hours ago",read:false},
  {id:"n-4",type:"payment_processed",title:"Payment Processed",message:"৳1,500 payment for DigitalBangladesh TechSummit 2025 has been processed successfully.",timestamp:"Yesterday",read:false},
  {id:"n-5",type:"event_updated",title:"Event Updated",message:"Nuruldiner Sarajiban — Stage Play has updated its start time to 7:30 PM.",timestamp:"Yesterday",read:true},
  {id:"n-6",type:"hall_booking_confirmed",title:"Hall Booking Confirmed",message:"Your booking for Grand Ballroom at Bashundhara Convention City on 15 Jul 2025 is confirmed.",timestamp:"2 days ago",read:true},
  {id:"n-7",type:"booking_cancelled",title:"Booking Cancelled",message:"Your booking BK-09911 has been cancelled. Refund is being processed.",timestamp:"3 days ago",read:true},
  {id:"n-8",type:"hold_expired",title:"Seat Hold Expired",message:"Your seat hold for BPL Final: Dhaka vs Chattogram has expired. Seats released.",timestamp:"1 week ago",read:true},
];

const VENUES: Venue[] = [
  {id:"v-1",name:"Bashundhara International Convention City",type:"Convention Center",address:"Ka-244 Pragati Sharani, Bashundhara R/A",city:"Dhaka",image:"https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",rating:4.7,reviewCount:312,totalHalls:6,priceFrom:25000,description:"Bangladesh's largest convention facility with world-class infrastructure spanning over 1 million sqft. Hosts international conferences, wedding receptions, and cultural events of all scales.",amenities:["WiFi","Parking","Catering","AV Equipment","AC","Generator","Prayer Room","VIP Lounge","Stage"]},
  {id:"v-2",name:"Radisson Blu Dhaka Water Garden",type:"Hotel Banquet",address:"Airport Road, Nikunja 2",city:"Dhaka",image:"https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",rating:4.8,reviewCount:527,totalHalls:4,priceFrom:40000,description:"5-star luxury hotel offering premium banquet and conference facilities with exceptional catering services. Perfect for high-profile corporate events and lavish wedding receptions.",amenities:["WiFi","Parking","Catering","AV Equipment","AC","Generator","Valet Parking","Fine Dining"]},
  {id:"v-3",name:"Pan Pacific Sonargaon Dhaka",type:"Hotel Banquet",address:"107 Kazi Nazrul Islam Avenue",city:"Dhaka",image:"https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",rating:4.6,reviewCount:289,totalHalls:3,priceFrom:50000,description:"Iconic 5-star hotel in the heart of Dhaka offering grand ballrooms and intimate meeting rooms. Renowned for its flawless event management and premium hospitality.",amenities:["WiFi","Parking","Catering","AV Equipment","AC","Generator","Business Centre","Spa"]},
  {id:"v-4",name:"BRAC Inn Conference Centre",type:"Conference Center",address:"KA-244, Progoti Sarani, Gulshan",city:"Dhaka",image:"https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",rating:4.4,reviewCount:178,totalHalls:5,priceFrom:8000,description:"Purpose-built professional conference and training facility by BRAC. Ideal for corporate workshops, seminars, and NGO events at affordable rates.",amenities:["WiFi","Catering","AV Equipment","AC","Generator","Prayer Room","Whiteboard"]},
];

const HALLS: Hall[] = [
  {id:"h-1",venueId:"v-1",name:"Grand Ballroom",capacity:2000,areaSqft:45000,floor:1,pricePerHour:15000,priceHalfDay:60000,priceFullDay:100000,amenities:["Stage","AV System","LED Wall","Catering","VIP Room"],image:"https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",available:true},
  {id:"h-2",venueId:"v-1",name:"Hall A",capacity:500,areaSqft:10000,floor:2,pricePerHour:5000,priceHalfDay:20000,priceFullDay:35000,amenities:["AV System","Stage","Catering","AC"],image:"https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",available:true},
  {id:"h-3",venueId:"v-1",name:"Conference Room 1",capacity:100,areaSqft:2000,floor:3,pricePerHour:2000,priceHalfDay:8000,priceFullDay:14000,amenities:["Projector","Whiteboard","Video Conferencing","AC"],image:"https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",available:false},
  {id:"h-4",venueId:"v-1",name:"Board Room",capacity:30,areaSqft:800,floor:4,pricePerHour:800,priceHalfDay:3000,priceFullDay:5000,amenities:["Smart TV","Whiteboard","Video Conferencing"],image:"https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",available:true},
  {id:"h-5",venueId:"v-2",name:"Magnolia Ballroom",capacity:800,areaSqft:15000,floor:1,pricePerHour:20000,priceHalfDay:75000,priceFullDay:120000,amenities:["Luxury Catering","Stage","AV System","Valet Parking"],image:"https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",available:true},
  {id:"h-6",venueId:"v-2",name:"Jasmine Hall",capacity:250,areaSqft:5000,floor:2,pricePerHour:8000,priceHalfDay:30000,priceFullDay:50000,amenities:["AV System","Catering","Stage","AC"],image:"https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",available:true},
  {id:"h-7",venueId:"v-2",name:"Executive Boardroom",capacity:20,areaSqft:600,floor:5,pricePerHour:3000,priceHalfDay:12000,priceFullDay:20000,amenities:["Smart TV","Video Conferencing","Fine Dining"],image:"https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",available:false},
  {id:"h-8",venueId:"v-3",name:"Grand Pavilion",capacity:1200,areaSqft:25000,floor:1,pricePerHour:25000,priceHalfDay:90000,priceFullDay:150000,amenities:["Luxury Catering","Stage","LED System","Valet","VIP Lounge"],image:"https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",available:true},
  {id:"h-9",venueId:"v-3",name:"Crystal Hall",capacity:400,areaSqft:8000,floor:2,pricePerHour:10000,priceHalfDay:40000,priceFullDay:70000,amenities:["AV System","Catering","Dance Floor"],image:"https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",available:true},
  {id:"h-10",venueId:"v-4",name:"Seminar Hall A",capacity:200,areaSqft:4000,floor:1,pricePerHour:2500,priceHalfDay:10000,priceFullDay:18000,amenities:["Projector","AC","Whiteboard","Sound System"],image:"https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",available:true},
  {id:"h-11",venueId:"v-4",name:"Training Room 1",capacity:50,areaSqft:1200,floor:2,pricePerHour:1200,priceHalfDay:5000,priceFullDay:8000,amenities:["Projector","Whiteboard","Video Conferencing","AC"],image:"https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",available:true},
  {id:"h-12",venueId:"v-4",name:"Meeting Room 3",capacity:25,areaSqft:600,floor:3,pricePerHour:800,priceHalfDay:3000,priceFullDay:5000,amenities:["Smart TV","Whiteboard"],image:"https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",available:false},
];

const DEFAULT_ORGANIZER_PROFILE: OrganizerProfile = {
  name:"Rahim Uddin Ahmed", organizationName:"Dhaka Events Co.",
  bio:"Professional event organizer with 8+ years of experience managing concerts, corporate events, and cultural programs across Bangladesh.",
  phone:"+880 1711-234567", email:"rahim@dhakaevents.com", website:"www.dhakaevents.com",
  city:"Dhaka", address:"House 12, Road 5, Gulshan 2, Dhaka-1212",
  verified:true, eventsCreated:47, totalBookings:3240, rating:4.8, memberSince:"March 2019",
};

// ─── Seat Grid ────────────────────────────────────────────────────────────────

function generateSeats(): Seat[] {
  const rows = ["A","B","C","D","E","F","G","H","I","J"];
  const sold: Record<string,boolean> = {A1:true,A2:true,A5:true,A8:true,A10:true,B3:true,B4:true,B7:true,B11:true,C2:true,C6:true,C9:true,D1:true,D5:true,D8:true,D12:true,E3:true,E4:true,E7:true,F2:true,F9:true,F11:true,G1:true,G6:true,G10:true,H4:true,H5:true,H8:true,I2:true,I7:true,I11:true,J3:true,J6:true,J9:true};
  const held: Record<string,boolean> = {B5:true,B6:true,D3:true,D4:true,F6:true};
  const reserved: Record<string,boolean> = {E1:true,E2:true,E11:true,E12:true};
  const accessible: Record<string,boolean> = {J1:true,J2:true,J11:true,J12:true};
  const companion: Record<string,boolean> = {J4:true,J10:true};
  const seats: Seat[] = [];
  rows.forEach(row => {
    for (let n=1; n<=12; n++) {
      const id=`${row}${n}`, isVip=row==="A", isAcc=!!accessible[id], isCom=!!companion[id];
      let status: SeatStatus = "available";
      if(sold[id]) status="sold"; else if(held[id]) status="held"; else if(reserved[id]) status="reserved";
      else if(isCom) status="companion"; else if(isAcc) status="accessible"; else if(isVip) status="vip-available";
      const price=isVip?2500:isAcc||isCom?500:800;
      const category: Seat["category"]=isVip?"VIP":isAcc?"Accessible":isCom?"Companion":"Standard";
      seats.push({id,row,number:n,status,price,category});
    }
  });
  return seats;
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function cx(...c: (string|boolean|undefined|null)[]): string { return c.filter(Boolean).join(" "); }
function getInitials(name: string): string { return name.split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase(); }
function statusColor(s: Booking["status"]) { return {Confirmed:"bg-green-100 text-green-700",Pending:"bg-amber-100 text-amber-700",Cancelled:"bg-red-100 text-red-700",Expired:"bg-slate-100 text-slate-500"}[s]; }
function seatFill(s: SeatStatus) {
  const m: Record<SeatStatus,{fill:string;stroke:string;interactive:boolean}> = {
    available:{fill:"#DBEAFE",stroke:"#60A5FA",interactive:true}, selected:{fill:"#22C55E",stroke:"#16A34A",interactive:true},
    held:{fill:"#FCD34D",stroke:"#F59E0B",interactive:false}, reserved:{fill:"#FECDD3",stroke:"#FB7185",interactive:false},
    sold:{fill:"#E2E8F0",stroke:"#CBD5E1",interactive:false}, "vip-available":{fill:"#EDE9FE",stroke:"#A78BFA",interactive:true},
    accessible:{fill:"#CCFBF1",stroke:"#2DD4BF",interactive:true}, companion:{fill:"#CFFAFE",stroke:"#22D3EE",interactive:true},
    blocked:{fill:"#F1F5F9",stroke:"#E2E8F0",interactive:false},
  };
  return m[s];
}

// ─── Animation Presets ────────────────────────────────────────────────────────

const spring = {type:"spring" as const,stiffness:320,damping:26};
const springFast = {type:"spring" as const,stiffness:420,damping:30};
const listVariants = { hidden:{}, visible:{transition:{staggerChildren:0.07}} };
const itemVariants = { hidden:{opacity:0,y:18}, visible:{opacity:1,y:0,transition:{type:"spring" as const,stiffness:280,damping:26}} };
const modalVariants = { hidden:{opacity:0,scale:0.90,y:24}, visible:{opacity:1,scale:1,y:0,transition:spring}, exit:{opacity:0,scale:0.92,y:12,transition:{duration:0.18}} };

function PageTransition({children,k}:{children:React.ReactNode;k:string}) {
  return (
    <motion.div key={k} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.26,ease:[0.25,0.46,0.45,0.94]}}>
      {children}
    </motion.div>
  );
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function Badge({children,color="blue"}:{children:React.ReactNode;color?:string}) {
  return <span className={cx("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",BADGE_COLORS[color]??BADGE_COLORS.blue)}>{children}</span>;
}
function CategoryBadge({category}:{category:string}) { return <Badge color={CAT_COLORS[category]??"slate"}>{category}</Badge>; }
function AvailabilityBar({total,sold}:{total:number;sold:number}) {
  const pct=Math.round((sold/total)*100);
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>{total-sold} seats left</span><span>{pct}% full</span></div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.3)"}}><div className={cx("h-full rounded-full",pct>=90?"bg-red-500":pct>=60?"bg-amber-500":"bg-green-500")} style={{width:`${pct}%`}}/></div>
    </div>
  );
}
function StarsRow({rating}:{rating:number}) {
  return <div className="flex items-center gap-0.5">{[1,2,3,4,5].map(i=><Star key={i} size={12} className={i<=Math.floor(rating)?"text-amber-400 fill-amber-400":"text-slate-300 fill-slate-300"}/>)}</div>;
}
function BookingStepper({step}:{step:1|2|3|4}) {
  const steps=["Select Seats","Your Details","Payment","Confirmed"];
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((label,i)=>{
        const n=i+1,active=n===step,done=n<step;
        return (
          <div key={label} className="flex items-center gap-1.5">
            <motion.div initial={{scale:0.6,opacity:0}} animate={{scale:1,opacity:1}} transition={{...springFast,delay:i*0.05}}
              className={cx("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",done?"bg-green-500 text-white":active?"bg-primary text-white":"bg-white/40 dark:bg-white/10 text-muted-foreground")}>
              {done?<Check size={12}/>:n}
            </motion.div>
            <span className={cx("text-xs hidden sm:block whitespace-nowrap",active?"font-semibold text-foreground":"text-muted-foreground")}>{label}</span>
            {i<steps.length-1&&<ChevronRight size={14} className="text-muted-foreground/40 shrink-0"/>}
          </div>
        );
      })}
    </div>
  );
}
function SeatLegend() {
  const items=[{fill:"#DBEAFE",stroke:"#60A5FA",label:"Available"},{fill:"#22C55E",stroke:"#16A34A",label:"Selected"},{fill:"#FCD34D",stroke:"#F59E0B",label:"Held"},{fill:"#FECDD3",stroke:"#FB7185",label:"Reserved"},{fill:"#E2E8F0",stroke:"#CBD5E1",label:"Sold"},{fill:"#EDE9FE",stroke:"#A78BFA",label:"VIP"},{fill:"#CCFBF1",stroke:"#2DD4BF",label:"Accessible"},{fill:"#CFFAFE",stroke:"#22D3EE",label:"Companion"}];
  return (
    <div className="flex flex-wrap gap-3">
      {items.map(({fill,stroke,label})=>(
        <div key={label} className="flex items-center gap-1.5">
          <svg width={14} height={14} viewBox="0 0 14 14"><rect x={1} y={1} width={12} height={12} rx={3} fill={fill} stroke={stroke} strokeWidth={1.5}/></svg>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}
function QRCode() {
  const size=120,cell=size/10;
  const pat=[[1,1,1,1,1,1,1,0,1,0],[1,0,0,0,0,0,1,0,0,1],[1,0,1,1,1,0,1,0,1,0],[1,0,1,1,1,0,1,1,0,1],[1,0,1,1,1,0,1,0,1,0],[1,0,0,0,0,0,1,1,0,0],[1,1,1,1,1,1,1,0,1,1],[0,0,0,0,0,0,0,0,0,1],[1,0,1,1,0,1,1,1,0,1],[0,1,0,0,1,0,1,0,1,1]];
  return (<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded"><rect width={size} height={size} fill="white"/>{pat.map((row,ri)=>row.map((v,ci)=>v?<rect key={`${ri}-${ci}`} x={ci*cell} y={ri*cell} width={cell} height={cell} fill="#0F172A"/>:null))}</svg>);
}
function OrderSummary({event,seats}:{event:SeatFlowEvent;seats:Seat[]}) {
  const total=seats.reduce((s,seat)=>s+seat.price,0);
  return (
    <div className="glass rounded-xl p-5 shadow-xl sticky top-20">
      <h3 className="font-bold text-foreground mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Order Summary</h3>
      <div className="mb-3"><p className="font-semibold text-sm text-foreground">{event.title}</p><p className="text-xs text-muted-foreground">{event.date} · {event.time}</p><p className="text-xs text-muted-foreground">{event.venue}</p></div>
      <div className="space-y-2 border-t border-white/20 dark:border-white/08 pt-3 mb-3">{seats.map(s=><div key={s.id} className="flex justify-between text-sm"><span className="text-muted-foreground">Seat {s.id} ({s.category})</span><span>৳{s.price}</span></div>)}</div>
      <div className="border-t border-white/20 dark:border-white/08 pt-3 flex justify-between font-bold text-sm"><span>Total</span><span className="text-primary text-base">৳{total}</span></div>
    </div>
  );
}

// ─── Cancel Confirm Modal ─────────────────────────────────────────────────────

function CancelConfirmModal({bookingRef,title,onConfirm,onClose}:{bookingRef:string;title:string;onConfirm:(r:string)=>void;onClose:()=>void}) {
  const [reason,setReason]=useState(CANCEL_REASONS[0]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        className="glass rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-center w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full mx-auto mb-4"><AlertCircle size={28} className="text-amber-500"/></div>
        <h2 className="text-lg font-extrabold text-foreground text-center mb-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Cancel this booking?</h2>
        <p className="text-sm text-muted-foreground text-center mb-4">Ref: <span className="font-semibold text-foreground">{bookingRef}</span></p>
        <div className="glass-subtle rounded-lg px-3 py-2.5 mb-4"><p className="text-xs text-muted-foreground mb-0.5">Booking</p><p className="text-sm font-semibold text-foreground line-clamp-1">{title}</p></div>
        <div className="mb-5">
          <label className="block text-sm font-semibold text-foreground mb-1.5">Reason for cancellation</label>
          <select value={reason} onChange={e=>setReason(e.target.value)} className="w-full px-3 py-2.5 rounded-lg glass-input focus:outline-none focus:ring-2 focus:ring-primary text-sm text-foreground">
            {CANCEL_REASONS.map(r=><option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <motion.button whileTap={{scale:0.96}} onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/40 dark:border-white/10 text-sm font-semibold text-foreground hover:bg-white/20 transition-colors">Keep Booking</motion.button>
          <motion.button whileTap={{scale:0.96}} onClick={()=>onConfirm(reason)} className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-sm font-bold hover:bg-red-700 transition-colors">Yes, Cancel</motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Edit Event Booking Drawer ────────────────────────────────────────────────

function EditEventBookingDrawer({booking,onSave,onClose}:{booking:Booking;onSave:(b:Booking)=>void;onClose:()=>void}) {
  const [name,setName]=useState(booking.guestName||""), [email,setEmail]=useState(booking.guestEmail||""), [error,setError]=useState("");
  const save=()=>{if(!name.trim()){setError("Name is required");return;}if(!email.includes("@")){setError("Valid email required");return;}onSave({...booking,guestName:name,guestEmail:email});toast.success("Booking updated!");onClose();};
  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{x:"100%",opacity:0}} animate={{x:0,opacity:1}} exit={{x:"100%",opacity:0}} transition={{type:"spring",stiffness:280,damping:30}}
        className="fixed inset-y-0 right-0 w-full sm:w-[420px] glass-float z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 shrink-0">
          <div><h2 className="font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Edit Booking</h2><p className="text-xs text-muted-foreground">Ref: {booking.id}</p></div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/20 transition-colors"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="glass-subtle rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Booking Details (read-only)</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[{l:"Event",v:booking.eventTitle},{l:"Date",v:booking.date},{l:"Venue",v:booking.venue},{l:"Seats",v:booking.seats.join(", ")}].map(({l,v})=><div key={l}><p className="text-xs text-muted-foreground">{l}</p><p className="font-semibold text-foreground text-xs leading-tight">{v}</p></div>)}
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-sm font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Update Your Details</p>
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Full Name</label><input value={name} onChange={e=>setName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg glass-input focus:outline-none focus:ring-2 focus:ring-primary text-sm"/></div>
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Email Address</label><input value={email} onChange={e=>setEmail(e.target.value)} type="email" className="w-full px-4 py-2.5 rounded-lg glass-input focus:outline-none focus:ring-2 focus:ring-primary text-sm"/></div>
            {error&&<p className="text-xs text-destructive flex items-center gap-1"><AlertCircle size={12}/>{error}</p>}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/20 flex gap-3 shrink-0">
          <motion.button whileTap={{scale:0.96}} onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/40 dark:border-white/10 text-sm font-semibold text-foreground hover:bg-white/20 transition-colors">Discard</motion.button>
          <motion.button whileTap={{scale:0.96}} onClick={save} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"><Check size={14}/> Save Changes</motion.button>
        </div>
      </motion.div>
    </>
  );
}

// ─── Edit Hall Booking Drawer ─────────────────────────────────────────────────

function EditHallBookingDrawer({booking,halls,onSave,onClose}:{booking:HallBooking;halls:Hall[];onSave:(b:HallBooking)=>void;onClose:()=>void}) {
  const [date,setDate]=useState(booking.date), [durationType,setDurationType]=useState(booking.durationType);
  const [purpose,setPurpose]=useState(booking.purpose), [guestCount,setGuestCount]=useState(booking.guestCount);
  const [addOns,setAddOns]=useState<string[]>(booking.addOns);
  const [contactName,setContactName]=useState(booking.contactName), [contactPhone,setContactPhone]=useState(booking.contactPhone), [contactEmail,setContactEmail]=useState(booking.contactEmail||"");
  const hall=halls.find(h=>h.id===booking.hallId);
  const basePrice=durationType==="full-day"?(hall?.priceFullDay||0):durationType==="half-day"?(hall?.priceHalfDay||0):(hall?.pricePerHour||0)*3;
  const addOnTotal=addOns.reduce((sum,id)=>{const ao=ADD_ON_OPTIONS.find(a=>a.id===id);if(!ao)return sum;return sum+(ao.unit==="per person"?ao.price*guestCount:ao.price);},0);
  const total=basePrice+addOnTotal;
  const toggleAddOn=(id:string)=>setAddOns(prev=>prev.includes(id)?prev.filter(a=>a!==id):[...prev,id]);
  const save=async()=>{if(!contactName.trim()){toast.error("Contact name is required");return;}try{await onSave({...booking,date,durationType,purpose,guestCount,addOns,total,contactName,contactPhone,contactEmail});onClose();}catch{/* parent toasts */}};
  const inp="w-full px-4 py-2.5 rounded-lg glass-input focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm";
  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{x:"100%",opacity:0}} animate={{x:0,opacity:1}} exit={{x:"100%",opacity:0}} transition={{type:"spring",stiffness:280,damping:30}}
        className="fixed inset-y-0 right-0 w-full sm:w-[460px] glass-float z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 shrink-0">
          <div><h2 className="font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Edit Hall Booking</h2><p className="text-xs text-muted-foreground">{booking.hallName} · {booking.venueName}</p></div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/20 transition-colors"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div><label className="block text-sm font-semibold text-foreground mb-1.5">Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} className={inp}/></div>
          <div><label className="block text-sm font-semibold text-foreground mb-2">Duration</label><div className="grid grid-cols-3 gap-2">{(["hourly","half-day","full-day"] as const).map(val=><button key={val} onClick={()=>setDurationType(val)} className={cx("py-2 rounded-lg text-sm font-semibold border-2 transition-all",durationType===val?"border-violet-600 bg-violet-600 text-white":"border-white/30 dark:border-white/10 text-foreground hover:border-violet-400")}>{val==="hourly"?"Hourly":val==="half-day"?"Half Day":"Full Day"}</button>)}</div></div>
          <div><label className="block text-sm font-semibold text-foreground mb-1.5">Purpose</label><select value={purpose} onChange={e=>setPurpose(e.target.value)} className={cx(inp,"text-foreground")}>{BOOKING_PURPOSES.map(p=><option key={p}>{p}</option>)}</select></div>
          <div><label className="block text-sm font-semibold text-foreground mb-1.5">Guest Count</label><input type="number" min={1} value={guestCount} onChange={e=>setGuestCount(Number(e.target.value))} className={inp}/></div>
          <div><label className="block text-sm font-semibold text-foreground mb-2">Add-ons</label><div className="space-y-2">{ADD_ON_OPTIONS.map(ao=><label key={ao.id} className={cx("flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all",addOns.includes(ao.id)?"border-violet-500 bg-violet-50/60 dark:bg-violet-900/20":"border-white/30 dark:border-white/10 hover:border-violet-300")}><div className="flex items-center gap-2"><input type="checkbox" checked={addOns.includes(ao.id)} onChange={()=>toggleAddOn(ao.id)} className="w-4 h-4 accent-violet-600"/><span className="text-sm text-foreground">{ao.label}</span></div><span className="text-xs font-semibold text-violet-600">৳{ao.price.toLocaleString()}{ao.unit==="per person"?"/p":""}</span></label>)}</div></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Contact Name</label><input value={contactName} onChange={e=>setContactName(e.target.value)} className={inp}/></div>
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Phone</label><input value={contactPhone} onChange={e=>setContactPhone(e.target.value)} className={inp}/></div>
          </div>
          <div><label className="block text-sm font-semibold text-foreground mb-1.5">Email</label><input value={contactEmail} onChange={e=>setContactEmail(e.target.value)} type="email" className={inp}/></div>
          <div className="glass-subtle rounded-xl p-4 flex justify-between items-center"><span className="text-sm font-semibold text-foreground">Updated Total</span><span className="text-lg font-extrabold text-violet-600">৳{total.toLocaleString()}</span></div>
        </div>
        <div className="px-6 py-4 border-t border-white/20 flex gap-3 shrink-0">
          <motion.button whileTap={{scale:0.96}} onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/40 dark:border-white/10 text-sm font-semibold text-foreground hover:bg-white/20 transition-colors">Discard</motion.button>
          <motion.button whileTap={{scale:0.96}} onClick={save} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors flex items-center justify-center gap-1.5"><Check size={14}/> Save Changes</motion.button>
        </div>
      </motion.div>
    </>
  );
}

// ─── Notification Panel ───────────────────────────────────────────────────────

function NotificationPanel({notifications,onClose,onMarkAllRead,onClearAll,onMarkRead}:{notifications:Notification[];onClose:()=>void;onMarkAllRead:()=>void;onClearAll:()=>void;onMarkRead:(id:string)=>void}) {
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

// ─── Auth Modal ───────────────────────────────────────────────────────────────

function AuthModal({onClose,onAuth}:{onClose:()=>void;onAuth:(user:AuthUser)=>void}) {
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

// ─── Hold Modal ───────────────────────────────────────────────────────────────

function HoldModal({seats,total,onProceed,onRelease}:{seats:Seat[];total:number;onProceed:()=>void;onRelease:()=>void}) {
  const [seconds,setSeconds]=useState(600);
  const timerRef=useRef<ReturnType<typeof setInterval>|null>(null);
  useEffect(()=>{timerRef.current=setInterval(()=>{setSeconds(s=>{if(s<=1){clearInterval(timerRef.current!);toast.warning("Your seat hold expired.");onRelease();return 0;}return s-1;});},1000);return()=>{if(timerRef.current)clearInterval(timerRef.current);};},[onRelease]);
  const mins=String(Math.floor(seconds/60)).padStart(2,"0"),secs=String(seconds%60).padStart(2,"0"),pct=(seconds/600)*100,urgent=seconds<120;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
      <motion.div variants={modalVariants} initial="hidden" animate="visible" className="glass rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className={cx("px-6 py-5 text-white text-center",urgent?"bg-gradient-to-r from-red-600/90 to-red-700/90":"bg-gradient-to-r from-amber-500/90 to-amber-600/90")}>
          <motion.div animate={{rotate:[0,10,-10,0]}} transition={{repeat:Infinity,duration:2}}><Clock size={28} className="mx-auto mb-2 opacity-90"/></motion.div>
          <p className="text-3xl font-extrabold tracking-widest" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{mins}:{secs}</p>
          <p className="text-sm opacity-80 mt-1">{urgent?"Hurry — seats releasing soon!":"Seats are being held for you"}</p>
        </div>
        <div className="h-1.5" style={{background:"rgba(255,255,255,0.2)"}}><div className={cx("h-full transition-all duration-1000",urgent?"bg-red-500":"bg-amber-400")} style={{width:`${pct}%`}}/></div>
        <div className="p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Selected Seats</p>
          <div className="space-y-1.5 mb-4">
            {seats.map(s=><div key={s.id} className="flex justify-between text-sm"><span className="flex items-center gap-2"><span className="w-7 h-7 rounded bg-green-500 text-white flex items-center justify-center text-xs font-bold">{s.id}</span><span className="text-muted-foreground">{s.category}</span></span><span className="font-semibold">৳{s.price}</span></div>)}
            <div className="border-t border-white/20 pt-2 flex justify-between font-bold text-sm"><span>Total</span><span className="text-primary">৳{total}</span></div>
          </div>
          <motion.button whileTap={{scale:0.97}} onClick={onProceed} className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors mb-2">Proceed to Details</motion.button>
          <button onClick={onRelease} className="w-full py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-white/20 transition-colors">Release Seats</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({event,onClick}:{event:SeatFlowEvent;onClick:()=>void}) {
  const pct=Math.round((event.soldSeats/event.totalSeats)*100);
  return (
    <motion.div onClick={onClick} whileHover={{y:-6,scale:1.015}} whileTap={{scale:0.98}} transition={{type:"spring",stiffness:380,damping:28}} className="glass rounded-xl overflow-hidden shadow-xl cursor-pointer group">
      <div className="relative h-48 overflow-hidden"><img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/><div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent"/><div className="absolute top-3 left-3"><CategoryBadge category={event.category}/></div><div className="absolute bottom-3 left-3 right-3"><p className="text-white font-bold text-base leading-snug line-clamp-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{event.title}</p></div></div>
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Calendar size={12}/><span>{event.date} · {event.time}</span></div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3"><MapPin size={12}/><span>{event.venue}, {event.city}</span></div>
        <div className="flex items-center justify-between"><span className="text-sm font-semibold text-foreground">From <span className="text-primary text-base">৳{event.priceFrom}</span></span><span className={cx("text-xs font-medium",pct>=90?"text-red-600":pct>=60?"text-amber-600":"text-green-600")}>{pct>=90?"Almost sold out":pct>=60?"Selling fast":"Available"}</span></div>
        <AvailabilityBar total={event.totalSeats} sold={event.soldSeats}/>
      </div>
    </motion.div>
  );
}

// ─── Events View ──────────────────────────────────────────────────────────────

function EventsView({events,onSelectEvent}:{events:SeatFlowEvent[];onSelectEvent:(e:SeatFlowEvent)=>void}) {
  const [search,setSearch]=useState(""), [activeCategory,setActiveCategory]=useState("All"), [priceFilter,setPriceFilter]=useState("All Prices"), [sort,setSort]=useState("Date");
  const filtered=events.filter(e=>{
    const matchCat=activeCategory==="All"||e.category===activeCategory;
    const matchSearch=e.title.toLowerCase().includes(search.toLowerCase())||e.venue.toLowerCase().includes(search.toLowerCase());
    const matchPrice=priceFilter==="All Prices"||(priceFilter==="Under ৳500"&&e.priceFrom<500)||(priceFilter==="৳500-৳2000"&&e.priceFrom>=500&&e.priceFrom<=2000)||(priceFilter==="৳2000+"&&e.priceFrom>2000);
    return matchCat&&matchSearch&&matchPrice;
  }).sort((a,b)=>sort==="Popularity"?b.soldSeats-a.soldSeats:sort==="Availability"?(a.totalSeats-a.soldSeats)-(b.totalSeats-b.soldSeats):sort==="Price"?a.priceFrom-b.priceFrom:0);
  const hasFilters=activeCategory!=="All"||priceFilter!=="All Prices"||!!search;
  const pillCls=(active:boolean)=>cx("px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border",active?"bg-primary text-white border-primary shadow-sm":"bg-white/40 dark:bg-white/08 text-foreground border-white/30 dark:border-white/10 hover:border-primary hover:text-primary");
  return (
    <div>
      <div className="relative h-80 sm:h-96 bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-800 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:"url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1440&q=60)",backgroundSize:"cover",backgroundPosition:"center"}}/>
        <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.6,ease:[0.25,0.46,0.45,0.94]}} className="relative z-10 text-center px-4 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-3 leading-tight" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Find Your Next<br/>Unforgettable Event</h1>
          <p className="text-blue-100 text-sm sm:text-lg mb-6">Concerts, conferences, theatre, cricket — book the best seats instantly.</p>
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-slate-500 dark:text-slate-300 pointer-events-none" size={18}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search events, venues, artists..." className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/90 dark:bg-white/12 backdrop-blur-md text-gray-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 shadow-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm border border-white/60 dark:border-white/20"/>
          </div>
        </motion.div>
      </div>
      <div className="glass border-b border-white/20 sticky top-[57px] z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 flex-wrap">
          <div className="flex gap-2 overflow-x-auto scrollbar-none items-center">
            <button onClick={()=>setActiveCategory("All")} className={pillCls(activeCategory==="All")}>All</button>
            <div className="relative">
              <select
                value={activeCategory==="All"?"":activeCategory}
                onChange={e=>setActiveCategory(e.target.value||"All")}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-white/60 dark:bg-slate-800/80 backdrop-blur-sm border border-white/40 dark:border-white/10 text-sm font-medium text-gray-900 dark:text-white [&>option]:text-gray-900 [&>option]:bg-white dark:[&>option]:text-white dark:[&>option]:bg-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="">Category</option>
                {CATEGORY_GROUPS.map(group=>(
                  <optgroup key={group.name} label={`${group.emoji} ${group.name}`}>
                    {group.items.map(item=><option key={item} value={item}>{item}</option>)}
                  </optgroup>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 pointer-events-none"/>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative"><select value={sort} onChange={e=>setSort(e.target.value)} className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-white/60 dark:bg-slate-800/80 backdrop-blur-sm border border-white/40 dark:border-white/10 text-sm font-medium text-gray-900 dark:text-white [&>option]:text-gray-900 [&>option]:bg-white dark:[&>option]:text-white dark:[&>option]:bg-slate-800 focus:outline-none cursor-pointer">{SORT_OPTIONS.map(o=><option key={o}>{o}</option>)}</select><ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 pointer-events-none"/></div>
            <div className="relative"><select value={priceFilter} onChange={e=>setPriceFilter(e.target.value)} className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-white/60 dark:bg-slate-800/80 backdrop-blur-sm border border-white/40 dark:border-white/10 text-sm font-medium text-gray-900 dark:text-white [&>option]:text-gray-900 [&>option]:bg-white dark:[&>option]:text-white dark:[&>option]:bg-slate-800 focus:outline-none cursor-pointer">{PRICE_FILTERS.map(f=><option key={f}>{f}</option>)}</select><ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 pointer-events-none"/></div>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4"><p className="text-sm text-muted-foreground">{filtered.length} event{filtered.length!==1?"s":""} found</p>{hasFilters&&<button onClick={()=>{setActiveCategory("All");setPriceFilter("All Prices");setSearch("");}} className="text-xs text-primary hover:underline">Clear filters</button>}</div>
        {filtered.length===0?(<div className="text-center py-20 text-muted-foreground"><Search size={40} className="mx-auto mb-3 opacity-30"/><p className="text-lg font-medium">No events found</p></div>):(
          <motion.div variants={listVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(event=><motion.div key={event.id} variants={itemVariants}><EventCard event={event} onClick={()=>onSelectEvent(event)}/></motion.div>)}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Event Detail View ────────────────────────────────────────────────────────

function EventDetailView({event,onSelectSeats,onBack}:{event:SeatFlowEvent;onSelectSeats:()=>void;onBack:()=>void}) {
  const pct=Math.round((event.soldSeats/event.totalSeats)*100);
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <motion.button whileTap={{scale:0.96}} onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-primary text-sm mb-6 transition-colors"><ArrowLeft size={16}/> Back to events</motion.button>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl overflow-hidden h-64 sm:h-80 shadow-xl"><img src={event.image} alt={event.title} className="w-full h-full object-cover"/></div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2"><CategoryBadge category={event.category}/>{event.tags.slice(1).map(t=><Badge key={t} color="slate">{t}</Badge>)}</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{event.title}</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              {[{icon:Calendar,label:"Date",value:event.date},{icon:Clock,label:"Time",value:event.time},{icon:MapPin,label:"Venue",value:event.venue},{icon:MapPin,label:"City",value:event.city},{icon:Users,label:"Capacity",value:`${event.totalSeats} seats`},{icon:Ticket,label:"From",value:`৳${event.priceFrom}`}].map(({icon:Icon,label,value})=>(
                <div key={label} className="glass-subtle rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">{label}</p><div className="flex items-center gap-1.5"><Icon size={13} className="text-primary shrink-0"/><p className="text-sm font-semibold text-foreground">{value}</p></div></div>
              ))}
            </div>
            <p className="text-muted-foreground leading-relaxed text-sm">{event.description}</p>
          </div>
        </div>
        <div>
          <div className="glass rounded-xl p-5 shadow-xl sticky top-20">
            <p className="text-sm text-muted-foreground mb-1">Price range</p>
            <p className="text-2xl font-bold text-primary mb-1">৳{event.priceFrom} <span className="text-base text-muted-foreground">— ৳{event.priceTo}</span></p>
            <p className="text-xs text-muted-foreground mb-4">Per seat · VIP available</p>
            <AvailabilityBar total={event.totalSeats} sold={event.soldSeats}/>
            <div className="mt-2 mb-5 text-xs text-muted-foreground">{event.totalSeats-event.soldSeats} of {event.totalSeats} seats remaining</div>
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={onSelectSeats} className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg"><Ticket size={16}/> Select Seats</motion.button>
            {pct>=80&&<div className="mt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/50 rounded-xl p-3"><AlertCircle size={13} className="shrink-0 mt-0.5"/><span>High demand — seats selling fast. Book now!</span></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Seat Selection View ──────────────────────────────────────────────────────

function SeatSelectionView({event,onContinue,onBack}:{event:SeatFlowEvent;onContinue:(seats:Seat[])=>void;onBack:()=>void}) {
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

// ─── Booking Details + Payment + Confirmation Views ───────────────────────────

function BookingDetailsView({event,seats,onConfirm,onBack}:{event:SeatFlowEvent;seats:Seat[];onConfirm:(name:string,email:string)=>void;onBack:()=>void}) {
  const [name,setName]=useState(""), [email,setEmail]=useState(""), [errors,setErrors]=useState<{name?:string;email?:string}>({});
  const validate=()=>{const e:typeof errors={};if(!name.trim())e.name="Name is required";if(!email.includes("@"))e.email="Valid email required";setErrors(e);return Object.keys(e).length===0;};
  const inp=(err?:string)=>cx("w-full px-4 py-2.5 rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-primary text-sm",err&&"ring-2 ring-destructive");
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6"><motion.button whileTap={{scale:0.96}} onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-primary text-sm transition-colors"><ArrowLeft size={16}/> Back</motion.button><BookingStepper step={2}/></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="glass rounded-xl p-6 shadow-xl">
            <h2 className="font-bold text-lg text-foreground mb-5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Your Details</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold text-foreground mb-1.5">Full Name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Ahmed Rahman" className={inp(errors.name)}/>{errors.name&&<p className="text-xs text-destructive mt-1">{errors.name}</p>}</div>
              <div><label className="block text-sm font-semibold text-foreground mb-1.5">Email Address</label><input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="ahmed@example.com" className={inp(errors.email)}/>{errors.email&&<p className="text-xs text-destructive mt-1">{errors.email}</p>}</div>
            </div>
          </div>
          <div className="glass-subtle rounded-xl p-4 flex items-start gap-3"><Clock size={18} className="text-amber-500 shrink-0 mt-0.5"/><div><p className="text-sm font-semibold text-foreground">Seats are being held for you</p><p className="text-xs text-muted-foreground mt-0.5">Complete your booking within the hold window to secure these seats.</p></div></div>
        </div>
        <div><div className="sticky top-20"><OrderSummary event={event} seats={seats}/><motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={()=>validate()&&onConfirm(name,email)} className="w-full bg-secondary text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg mt-4"><ChevronRight size={16}/> Continue to Payment</motion.button></div></div>
      </div>
    </div>
  );
}

function PaymentView({event,seats,name,onPay,onBack}:{event:SeatFlowEvent;seats:Seat[];name:string;onPay:()=>void;onBack:()=>void}) {
  const [method,setMethod]=useState<"card"|"paypal"|"apple">("card");
  const [cardNum,setCardNum]=useState(""), [expiry,setExpiry]=useState(""), [cvv,setCvv]=useState(""), [error,setError]=useState("");
  const total=seats.reduce((s,seat)=>s+seat.price,0);
  const formatCard=(v:string)=>v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const formatExpiry=(v:string)=>{const d=v.replace(/\D/g,"").slice(0,4);return d.length>2?`${d.slice(0,2)}/${d.slice(2)}`:d;};
  const submit=()=>{if(method==="card"&&(cardNum.replace(/\s/g,"").length<16||!expiry||cvv.length<3)){setError("Please complete all card details.");return;}onPay();};
  const METHODS=[{id:"card" as const,label:"Credit / Debit Card",icon:CreditCard},{id:"paypal" as const,label:"PayPal",icon:Lock},{id:"apple" as const,label:"Apple Pay",icon:Lock}];
  const inp="w-full px-4 py-2.5 rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-primary text-sm";
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6"><motion.button whileTap={{scale:0.96}} onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-primary text-sm transition-colors"><ArrowLeft size={16}/> Back</motion.button><BookingStepper step={3}/></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="glass rounded-xl p-6 shadow-xl">
            <h2 className="font-bold text-lg text-foreground mb-5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Payment Method</h2>
            <div className="space-y-3 mb-5">{METHODS.map(({id,label,icon:Icon})=><motion.button key={id} whileTap={{scale:0.98}} onClick={()=>{setMethod(id);setError("");}} className={cx("w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left",method===id?"border-primary bg-primary/10 text-primary":"border-white/30 dark:border-white/10 text-foreground hover:border-primary/50")}><div className={cx("w-4 h-4 rounded-full border-2 shrink-0",method===id?"border-primary":"border-slate-300")}>{method===id&&<div className="w-2 h-2 rounded-full bg-primary m-auto mt-0.5"/>}</div><Icon size={16} className={method===id?"text-primary":"text-muted-foreground"}/>{label}{id!=="card"&&<span className="ml-auto text-xs text-muted-foreground bg-white/40 dark:bg-white/08 px-2 py-0.5 rounded-full">Stub</span>}</motion.button>)}</div>
            {method==="card"&&<div className="space-y-4 border-t border-white/20 pt-5"><div><label className="block text-sm font-semibold text-foreground mb-1.5">Card Number</label><input value={cardNum} onChange={e=>setCardNum(formatCard(e.target.value))} placeholder="1234 5678 9012 3456" className={cx(inp,"font-mono tracking-wider")}/></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-semibold text-foreground mb-1.5">Expiry</label><input value={expiry} onChange={e=>setExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" className={cx(inp,"font-mono")}/></div><div><label className="block text-sm font-semibold text-foreground mb-1.5">CVV</label><input value={cvv} onChange={e=>setCvv(e.target.value.replace(/\D/g,"").slice(0,4))} type="password" placeholder="•••" className={cx(inp,"font-mono")}/></div></div><div><label className="block text-sm font-semibold text-foreground mb-1.5">Name on Card</label><input defaultValue={name} placeholder="Ahmed Rahman" className={inp}/></div></div>}
            {method!=="card"&&<div className="border-t border-white/20 pt-5"><div className="glass-subtle rounded-xl p-6 text-center text-muted-foreground text-sm"><Lock size={24} className="mx-auto mb-2 opacity-40"/><p className="font-medium">Redirecting to {method==="paypal"?"PayPal":"Apple Pay"}…</p><p className="text-xs mt-1 opacity-70">Payment is simulated in demo mode.</p></div></div>}
            {error&&<p className="text-xs text-destructive flex items-center gap-1.5 mt-3"><AlertCircle size={12}/>{error}</p>}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Lock size={12}/> Your payment details are encrypted and secure.</div>
        </div>
        <div><div className="sticky top-20 space-y-4"><OrderSummary event={event} seats={seats}/><motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={submit} className="w-full bg-secondary text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg"><Lock size={14}/> Pay ৳{total}</motion.button><p className="text-xs text-muted-foreground text-center">No charge in demo mode</p></div></div>
      </div>
    </div>
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadEventTicket(opts: {
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
    .head{background:linear-gradient(135deg,#1d4ed8,#4338ca);color:#fff;padding:24px}
    .head p{margin:0 0 6px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;opacity:.8}
    .head h1{margin:0;font-size:22px}
    .badge{display:inline-block;margin-top:12px;background:#22c55e;color:#fff;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px}
    .body{padding:24px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
    .label{font-size:11px;color:#64748b;margin:0 0 4px}
    .value{font-size:14px;font-weight:700;margin:0}
    .seats{display:flex;flex-wrap:wrap;gap:6px}
    .seat{background:#dbeafe;color:#1d4ed8;font-size:12px;font-weight:700;padding:4px 8px;border-radius:6px}
    .total{border-top:1px dashed #cbd5e1;padding-top:16px;display:flex;justify-content:space-between;align-items:center;font-weight:700}
    .total span:last-child{color:#1d4ed8;font-size:20px}
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

function ConfirmationView({event,seats,name,onDone}:{event:SeatFlowEvent;seats:Seat[];name:string;onDone:()=>void}) {
  const ref=useRef(`BK-${Math.floor(10000+Math.random()*90000)}`).current;
  const total=seats.reduce((s,seat)=>s+seat.price,0);
  const handleDownload=()=>{
    downloadEventTicket({
      ref,
      eventTitle:event.title,
      date:event.date,
      time:event.time,
      venue:event.venue,
      guestName:name,
      seats:seats.map(s=>s.id),
      total,
    });
    toast.success("Ticket downloaded");
  };
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-center mb-8"><BookingStepper step={4}/></div>
      <div className="text-center mb-8">
        <motion.div initial={{scale:0,rotate:-20}} animate={{scale:1,rotate:0}} transition={{type:"spring",stiffness:260,damping:18,delay:0.1}} className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} className="text-green-500"/></motion.div>
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.25,duration:0.4}}><h1 className="text-2xl font-extrabold text-foreground mb-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Booking Confirmed!</h1><p className="text-muted-foreground text-sm">A confirmation has been sent to your email address.</p></motion.div>
      </div>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.35,duration:0.4}} className="glass rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700/90 to-indigo-700/90 backdrop-blur-sm px-6 py-4 text-white"><div className="flex justify-between items-start"><div><p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">Booking Reference</p><p className="text-xl font-bold">{ref}</p></div><Badge color="green">Confirmed</Badge></div></div>
        <div className="relative h-4"><div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-white/30"/><div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-slate-950"/><div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-slate-950"/></div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-6 mb-6">{[{label:"Event",value:event.title},{label:"Date & Time",value:`${event.date} · ${event.time}`},{label:"Venue",value:event.venue},{label:"Guest",value:name}].map(({label,value})=><div key={label}><p className="text-xs text-muted-foreground mb-1">{label}</p><p className="font-bold text-sm text-foreground">{value}</p></div>)}<div><p className="text-xs text-muted-foreground mb-1">Seats</p><div className="flex flex-wrap gap-1">{seats.map(s=><span key={s.id} className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-0.5 rounded">{s.id}</span>)}</div></div><div><p className="text-xs text-muted-foreground mb-1">Total Paid</p><p className="font-bold text-lg text-primary">৳{total}</p></div></div>
          <div className="flex items-center justify-center py-4 border-t border-white/20 border-dashed"><div className="text-center"><QRCode/><p className="text-xs text-muted-foreground mt-2">Scan at entrance</p></div></div>
        </div>
      </motion.div>
      <div className="flex gap-3 mt-6"><motion.button whileTap={{scale:0.97}} type="button" onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 py-2.5 glass rounded-xl text-sm font-semibold text-foreground hover:bg-white/40 transition-colors"><Download size={15}/> Download Ticket</motion.button><motion.button whileTap={{scale:0.97}} onClick={onDone} className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg">Back to Events</motion.button></div>
    </div>
  );
}

// ─── Venue Browse + Detail + Hall Booking + Hall Confirmation Views ────────────

function VenueBrowseView({venues,loading,onSelectVenue}:{venues:Venue[];loading?:boolean;onSelectVenue:(v:Venue)=>void}) {
  const [search,setSearch]=useState(""), [typeFilter,setTypeFilter]=useState("All"), [sort,setSort]=useState("Rating");
  const filtered=venues.filter(v=>(typeFilter==="All"||v.type===typeFilter)&&(v.name.toLowerCase().includes(search.toLowerCase())||v.city.toLowerCase().includes(search.toLowerCase()))).sort((a,b)=>sort==="Price"?a.priceFrom-b.priceFrom:b.rating-a.rating);
  return (
    <div>
      <div className="relative h-72 bg-gradient-to-br from-violet-900 via-violet-700 to-indigo-800 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:"url(https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1440&q=60)",backgroundSize:"cover",backgroundPosition:"center"}}/>
        <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.6}} className="relative z-10 text-center px-4 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Book the Perfect Venue</h1>
          <p className="text-violet-100 text-sm mb-5">Convention centers, hotel banquets, conference halls — all in one place.</p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-slate-500 dark:text-slate-300 pointer-events-none" size={16}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search venues or cities..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 dark:bg-white/12 backdrop-blur-md text-gray-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 shadow-xl focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm border border-white/60 dark:border-white/20"/>
          </div>
        </motion.div>
      </div>
      <div className="glass border-b border-white/20 sticky top-[57px] z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 flex-wrap">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">{VENUE_TYPES.map(t=><button key={t} onClick={()=>setTypeFilter(t)} className={cx("px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border",typeFilter===t?"bg-violet-600 text-white border-violet-600 shadow-sm":"bg-white/40 dark:bg-white/08 text-foreground border-white/30 dark:border-white/10 hover:border-violet-400 hover:text-violet-600")}>{t}</button>)}</div>
          <div className="relative ml-auto"><select value={sort} onChange={e=>setSort(e.target.value)} className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-white/60 dark:bg-slate-800/80 backdrop-blur-sm border border-white/40 dark:border-white/10 text-sm font-medium text-gray-900 dark:text-white [&>option]:text-gray-900 [&>option]:bg-white dark:[&>option]:text-white dark:[&>option]:bg-slate-800 focus:outline-none cursor-pointer">{["Rating","Price"].map(o=><option key={o}>{o}</option>)}</select><ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 pointer-events-none"/></div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-sm text-muted-foreground mb-5">{loading?"Loading venues…":`${filtered.length} venue${filtered.length!==1?"s":""} found`}</p>
        {!loading&&filtered.length===0?(<div className="text-center py-20 text-muted-foreground"><Building2 size={40} className="mx-auto mb-3 opacity-30"/><p className="text-lg font-medium">No venues found</p></div>):(
          <motion.div variants={listVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(venue=>(
              <motion.div key={venue.id} variants={itemVariants} whileHover={{y:-6,scale:1.015}} whileTap={{scale:0.98}} transition={{type:"spring",stiffness:380,damping:28}} onClick={()=>onSelectVenue(venue)} className="glass rounded-xl overflow-hidden shadow-xl cursor-pointer group">
                <div className="relative h-52 overflow-hidden"><img src={venue.image} alt={venue.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/><div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent"/><div className="absolute top-3 left-3"><span className="bg-violet-600 text-white text-xs font-semibold px-2 py-1 rounded-full">{venue.type}</span></div><div className="absolute bottom-3 left-3 right-3"><p className="text-white font-bold text-sm leading-snug line-clamp-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{venue.name}</p></div></div>
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2"><MapPin size={11}/><span className="truncate">{venue.address}</span></div>
                  <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-1.5"><StarsRow rating={venue.rating}/><span className="text-xs text-muted-foreground">{venue.rating} ({venue.reviewCount})</span></div><span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-semibold px-2 py-0.5 rounded-full">{venue.totalHalls} halls</span></div>
                  <div className="flex flex-wrap gap-1 mb-3">{venue.amenities.slice(0,4).map(a=><span key={a} className="text-xs bg-white/40 dark:bg-white/08 text-muted-foreground dark:text-white px-2 py-0.5 rounded-full">{a}</span>)}{venue.amenities.length>4&&<span className="text-xs text-primary font-medium">+{venue.amenities.length-4} more</span>}</div>
                  <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">From <span className="text-foreground font-bold">৳{venue.priceFrom.toLocaleString()}</span>/day</span><button className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-violet-700 transition-colors">View Halls</button></div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function VenueDetailView({venue,halls,loading,onSelectHall,onBack}:{venue:Venue;halls:Hall[];loading?:boolean;onSelectHall:(h:Hall)=>void;onBack:()=>void}) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <motion.button whileTap={{scale:0.96}} onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-primary text-sm mb-6 transition-colors"><ArrowLeft size={16}/> Back to venues</motion.button>
      <div className="rounded-2xl overflow-hidden h-64 sm:h-80 mb-6 relative shadow-2xl"><img src={venue.image} alt={venue.name} className="w-full h-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent"/><div className="absolute bottom-5 left-6 right-6"><span className="bg-violet-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full mb-2 inline-block">{venue.type}</span><h1 className="text-2xl sm:text-3xl font-extrabold text-white" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{venue.name}</h1><p className="text-white/80 text-sm flex items-center gap-1.5 mt-1"><MapPin size={13}/>{venue.address}, {venue.city}</p></div></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-7">
          <div className="flex items-center gap-5"><div className="flex items-center gap-2"><StarsRow rating={venue.rating}/><span className="font-semibold text-sm text-foreground">{venue.rating}</span><span className="text-muted-foreground text-sm">({venue.reviewCount} reviews)</span></div><span className="text-muted-foreground text-sm">{venue.totalHalls} halls</span></div>
          <p className="text-muted-foreground leading-relaxed text-sm">{venue.description}</p>
          <div><h3 className="font-bold text-foreground mb-3" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Amenities & Facilities</h3><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{venue.amenities.map(a=><div key={a} className="flex items-center gap-2 glass-subtle rounded-lg px-3 py-2"><Check size={13} className="text-green-500 shrink-0"/><span className="text-sm text-foreground dark:text-white">{a}</span></div>)}</div></div>
          <div>
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-foreground text-lg" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Our Halls & Rooms</h3><span className="text-sm text-muted-foreground">{loading?"Loading…":`${halls.length} spaces`}</span></div>
            <motion.div variants={listVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {halls.map(hall=>(
                <motion.div key={hall.id} variants={itemVariants} className={cx("glass rounded-xl overflow-hidden shadow-lg",!hall.available&&"opacity-60")}>
                  <div className="relative h-40 overflow-hidden"><img src={hall.image} alt={hall.name} className="w-full h-full object-cover"/><div className="absolute top-2 right-2"><span className={cx("text-xs font-semibold px-2 py-0.5 rounded-full",hall.available?"bg-green-500 text-white":"bg-slate-400 text-white")}>{hall.available?"Available":"Fully Booked"}</span></div><div className="absolute top-2 left-2"><span className="bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">Floor {hall.floor}</span></div></div>
                  <div className="p-4">
                    <h4 className="font-bold text-foreground text-sm mb-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{hall.name}</h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground dark:text-white/70 mb-2"><span className="flex items-center gap-1"><Users size={11}/>{hall.capacity.toLocaleString()} guests</span><span>{hall.areaSqft.toLocaleString()} sqft</span></div>
                    <div className="flex flex-wrap gap-1 mb-3">{hall.amenities.slice(0,3).map(a=><span key={a} className="text-xs bg-white/40 dark:bg-white/08 text-muted-foreground dark:text-white px-2 py-0.5 rounded-full">{a}</span>)}</div>
                    <div className="space-y-0.5 text-xs text-muted-foreground dark:text-white/70 mb-3"><div className="flex justify-between"><span>Per hour</span><span className="font-semibold text-foreground dark:text-white">৳{hall.pricePerHour.toLocaleString()}</span></div><div className="flex justify-between"><span>Half day</span><span className="font-semibold text-foreground dark:text-white">৳{hall.priceHalfDay.toLocaleString()}</span></div><div className="flex justify-between"><span>Full day</span><span className="font-semibold text-foreground dark:text-white">৳{hall.priceFullDay.toLocaleString()}</span></div></div>
                    <motion.button whileHover={hall.available?{scale:1.02}:{}} whileTap={hall.available?{scale:0.97}:{}} disabled={!hall.available} onClick={()=>hall.available&&onSelectHall(hall)} className={cx("w-full py-2 rounded-xl text-sm font-bold transition-colors",hall.available?"bg-violet-600 text-white hover:bg-violet-700":"bg-white/30 dark:bg-white/08 text-muted-foreground cursor-not-allowed")}>{hall.available?"Book This Hall":"Fully Booked"}</motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
        <div>
          <div className="glass rounded-xl p-5 shadow-xl sticky top-20">
            <p className="text-sm text-muted-foreground mb-1">Starting from</p>
            <p className="text-2xl font-bold text-violet-600 mb-1">৳{venue.priceFrom.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mb-4">per day · varies by hall</p>
            <div className="space-y-2 mb-4">{halls.filter(h=>h.available).slice(0,3).map(h=><motion.button key={h.id} whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={()=>onSelectHall(h)} className="w-full text-left px-3 py-2.5 rounded-xl glass-subtle hover:border-violet-400 transition-all"><div className="flex justify-between items-center"><span className="text-sm font-medium text-foreground">{h.name}</span><span className="text-xs text-muted-foreground dark:text-white/70">cap. {h.capacity.toLocaleString()}</span></div><span className="text-xs text-violet-600 font-semibold">from ৳{h.priceFullDay.toLocaleString()}/day</span></motion.button>)}</div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground glass-subtle rounded-lg p-3"><Phone size={12} className="shrink-0 mt-0.5"/><span>Contact venue for custom packages and group bookings.</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HallBookingView({venue,hall,onConfirm,onBack}:{venue:Venue;hall:Hall;onConfirm:(b:HallBooking)=>void;onBack:()=>void}) {
  const [date,setDate]=useState(""), [durationType,setDurationType]=useState<"hourly"|"half-day"|"full-day">("full-day");
  const [startTime,setStartTime]=useState("09:00"), [endTime,setEndTime]=useState("17:00"), [halfPeriod,setHalfPeriod]=useState<"morning"|"afternoon">("morning");
  const [purpose,setPurpose]=useState(""), [guestCount,setGuestCount]=useState(50), [addOns,setAddOns]=useState<string[]>([]);
  const [contactName,setContactName]=useState(""), [contactPhone,setContactPhone]=useState(""), [contactEmail,setContactEmail]=useState(""), [specialReqs,setSpecialReqs]=useState("");
  const [errors,setErrors]=useState<Record<string,string>>({});
  const basePrice=durationType==="full-day"?hall.priceFullDay:durationType==="half-day"?hall.priceHalfDay:(()=>{const [sh]=startTime.split(":").map(Number),[eh]=endTime.split(":").map(Number);return hall.pricePerHour*Math.max(1,eh-sh);})();
  const addOnTotal=addOns.reduce((sum,id)=>{const ao=ADD_ON_OPTIONS.find(a=>a.id===id);if(!ao)return sum;return sum+(ao.unit==="per person"?ao.price*guestCount:ao.price);},0);
  const totalPrice=basePrice+addOnTotal;
  const toggleAddOn=(id:string)=>setAddOns(prev=>prev.includes(id)?prev.filter(a=>a!==id):[...prev,id]);
  const validate=()=>{const e:Record<string,string>={};if(!date)e.date="Please select a date";if(!purpose)e.purpose="Please select a purpose";if(guestCount<1||guestCount>hall.capacity)e.guests=`Between 1 and ${hall.capacity}`;if(!contactName.trim())e.contactName="Name is required";if(!contactPhone.trim())e.contactPhone="Phone is required";if(!contactEmail.includes("@"))e.contactEmail="Valid email required";setErrors(e);return Object.keys(e).length===0;};
  const handleConfirm=()=>{if(!validate())return;const actualStart=durationType==="half-day"&&halfPeriod==="afternoon"?"14:00":durationType==="full-day"?"08:00":startTime;const actualEnd=durationType==="full-day"?"20:00":durationType==="half-day"?halfPeriod==="morning"?"14:00":"20:00":endTime;onConfirm({id:`HB-${Math.floor(10000+Math.random()*90000)}`,venueId:venue.id,hallId:hall.id,venueName:venue.name,hallName:hall.name,date,startTime:actualStart,endTime:actualEnd,durationType,purpose,guestCount,addOns,total:totalPrice,status:"Confirmed",bookedAt:new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}),contactName,contactPhone,contactEmail});};
  const inp="w-full px-4 py-2.5 rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm";
  const errField=(k:string)=>errors[k]&&<p className="text-xs text-destructive mt-1">{errors[k]}</p>;
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <motion.button whileTap={{scale:0.96}} onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-primary text-sm mb-6 transition-colors"><ArrowLeft size={16}/> Back to halls</motion.button>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-xl p-6 shadow-xl space-y-4">
            <h2 className="font-bold text-lg text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>1. When?</h2>
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} className={inp}/>{errField("date")}</div>
            <div><label className="block text-sm font-semibold text-foreground mb-3">Duration</label><div className="grid grid-cols-3 gap-2">{(["hourly","half-day","full-day"] as const).map(val=><motion.button key={val} whileTap={{scale:0.96}} onClick={()=>setDurationType(val)} className={cx("py-2.5 rounded-xl text-sm font-semibold border-2 transition-all",durationType===val?"border-violet-600 bg-violet-600 text-white":"border-white/30 dark:border-white/10 text-foreground hover:border-violet-400")}>{val==="hourly"?"Hourly":val==="half-day"?"Half Day":"Full Day"}</motion.button>)}</div></div>
            {durationType==="hourly"&&<div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-semibold text-foreground mb-1.5">Start Time</label><input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} className={inp}/></div><div><label className="block text-sm font-semibold text-foreground mb-1.5">End Time</label><input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} className={inp}/></div></div>}
            {durationType==="half-day"&&<div><label className="block text-sm font-semibold text-foreground mb-2">Period</label><div className="grid grid-cols-2 gap-2">{(["morning","afternoon"] as const).map(val=><button key={val} onClick={()=>setHalfPeriod(val)} className={cx("py-2 rounded-xl text-sm font-medium border-2 transition-all",halfPeriod===val?"border-violet-600 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300":"border-white/30 dark:border-white/10 text-foreground hover:border-violet-400")}>{val==="morning"?"Morning (8am–2pm)":"Afternoon (2pm–8pm)"}</button>)}</div></div>}
            {durationType==="full-day"&&<p className="text-xs text-muted-foreground glass-subtle px-3 py-2 rounded-lg">Full day: 8:00 AM — 8:00 PM</p>}
          </div>
          <div className="glass rounded-xl p-6 shadow-xl space-y-4">
            <h2 className="font-bold text-lg text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>2. Your Event</h2>
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Purpose of Booking</label><select value={purpose} onChange={e=>setPurpose(e.target.value)} className={cx(inp,"text-foreground")}><option value="">Select purpose…</option>{BOOKING_PURPOSES.map(p=><option key={p}>{p}</option>)}</select>{errField("purpose")}</div>
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Estimated Guests <span className="text-muted-foreground font-normal">(max {hall.capacity.toLocaleString()})</span></label><input type="number" min={1} max={hall.capacity} value={guestCount} onChange={e=>setGuestCount(Number(e.target.value))} className={inp}/>{errField("guests")}</div>
          </div>
          <div className="glass rounded-xl p-6 shadow-xl">
            <h2 className="font-bold text-lg text-foreground mb-5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>3. Add-ons (Optional)</h2>
            <div className="space-y-3">{ADD_ON_OPTIONS.map(ao=><motion.label key={ao.id} whileHover={{scale:1.01}} className={cx("flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all",addOns.includes(ao.id)?"border-violet-500 bg-violet-50/60 dark:bg-violet-900/20":"border-white/30 dark:border-white/10 hover:border-violet-300")}><div className="flex items-center gap-3"><input type="checkbox" checked={addOns.includes(ao.id)} onChange={()=>toggleAddOn(ao.id)} className="w-4 h-4 accent-violet-600"/><span className="text-sm font-medium text-foreground">{ao.label}</span></div><span className="text-sm font-semibold text-violet-600">৳{ao.price.toLocaleString()}{ao.unit==="per person"?"/person":""}</span></motion.label>)}</div>
          </div>
          <div className="glass rounded-xl p-6 shadow-xl space-y-4">
            <h2 className="font-bold text-lg text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>4. Contact Details</h2>
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Contact Person Name</label><input value={contactName} onChange={e=>setContactName(e.target.value)} placeholder="Ahmed Rahman" className={inp}/>{errField("contactName")}</div>
            <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-semibold text-foreground mb-1.5">Phone</label><input value={contactPhone} onChange={e=>setContactPhone(e.target.value)} placeholder="+880 1X00-000000" className={inp}/>{errField("contactPhone")}</div><div><label className="block text-sm font-semibold text-foreground mb-1.5">Email</label><input value={contactEmail} onChange={e=>setContactEmail(e.target.value)} type="email" placeholder="ahmed@example.com" className={inp}/>{errField("contactEmail")}</div></div>
            <div><label className="block text-sm font-semibold text-foreground mb-1.5">Special Requests <span className="text-muted-foreground font-normal">(optional)</span></label><textarea value={specialReqs} onChange={e=>setSpecialReqs(e.target.value)} rows={3} placeholder="Any special requirements…" className={cx(inp,"resize-none")}/></div>
          </div>
        </div>
        <div>
          <div className="glass rounded-xl p-5 shadow-xl sticky top-20 space-y-4">
            <div className="flex items-center gap-3"><img src={hall.image} alt={hall.name} className="w-14 h-14 rounded-xl object-cover shrink-0"/><div><p className="font-bold text-sm text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{hall.name}</p><p className="text-xs text-muted-foreground">{venue.name}</p><p className="text-xs text-muted-foreground">Floor {hall.floor} · Cap. {hall.capacity.toLocaleString()}</p></div></div>
            <div className="space-y-1.5 text-sm border-t border-white/20 pt-3"><div className="flex justify-between text-muted-foreground"><span>Date</span><span className="text-foreground font-medium">{date||"—"}</span></div><div className="flex justify-between text-muted-foreground"><span>Duration</span><span className="text-foreground font-medium capitalize">{durationType}</span></div><div className="flex justify-between text-muted-foreground"><span>Base price</span><span>৳{basePrice.toLocaleString()}</span></div>{addOns.map(id=>{const ao=ADD_ON_OPTIONS.find(a=>a.id===id)!;const p=ao.unit==="per person"?ao.price*guestCount:ao.price;return<div key={id} className="flex justify-between text-muted-foreground text-xs"><span>{ao.label}</span><span>৳{p.toLocaleString()}</span></div>;})} <div className="flex justify-between font-bold text-base pt-2 border-t border-white/20"><span>Total</span><span className="text-violet-600">৳{totalPrice.toLocaleString()}</span></div></div>
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={handleConfirm} className="w-full bg-violet-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 shadow-lg"><CheckCircle size={16}/> Confirm Booking</motion.button>
            <p className="text-xs text-muted-foreground text-center">Confirmation sent to your email.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HallConfirmationView({booking,onBackVenues,onMyBookings}:{booking:HallBooking;onBackVenues:()=>void;onMyBookings:()=>void}) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <motion.div initial={{scale:0,rotate:-20}} animate={{scale:1,rotate:0}} transition={{type:"spring",stiffness:260,damping:18,delay:0.1}} className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-4"><Building2 size={28} className="text-violet-600"/></motion.div>
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.25}}><h1 className="text-2xl font-extrabold text-foreground mb-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Hall Booking Confirmed!</h1><p className="text-muted-foreground text-sm">Your venue is reserved. Confirmation sent to your email.</p></motion.div>
      </div>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.35}} className="glass rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-violet-700/90 to-indigo-700/90 backdrop-blur-sm px-6 py-4 text-white"><div className="flex justify-between items-start"><div><p className="text-violet-200 text-xs font-semibold uppercase tracking-widest mb-1">Booking Reference</p><p className="text-xl font-bold">{booking.id}</p></div><Badge color="green">Confirmed</Badge></div></div>
        <div className="relative h-4"><div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-white/30"/><div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-slate-950"/><div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-slate-950"/></div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-5 mb-5">{[{label:"Hall",value:booking.hallName},{label:"Venue",value:booking.venueName},{label:"Date",value:booking.date},{label:"Duration",value:booking.durationType.replace("-"," ")},{label:"Time",value:`${booking.startTime} — ${booking.endTime}`},{label:"Purpose",value:booking.purpose},{label:"Guests",value:`${booking.guestCount} people`},{label:"Contact",value:booking.contactName}].map(({label,value})=><div key={label}><p className="text-xs text-muted-foreground mb-0.5">{label}</p><p className="font-semibold text-sm text-foreground capitalize">{value}</p></div>)}</div>
          {booking.addOns.length>0&&<div className="border-t border-white/20 pt-4 mb-4"><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Add-ons</p><div className="flex flex-wrap gap-1.5">{booking.addOns.map(id=>{const ao=ADD_ON_OPTIONS.find(a=>a.id===id);return ao?<span key={id} className="text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full font-medium">{ao.label}</span>:null;})}</div></div>}
          <div className="border-t border-white/20 pt-4 flex justify-between items-center"><span className="font-semibold text-foreground">Total Paid</span><span className="text-xl font-extrabold text-violet-600">৳{booking.total.toLocaleString()}</span></div>
        </div>
      </motion.div>
      <div className="flex gap-3 mt-6"><motion.button whileTap={{scale:0.97}} onClick={onBackVenues} className="flex-1 flex items-center justify-center gap-2 py-2.5 glass rounded-xl text-sm font-semibold text-foreground hover:bg-white/40 transition-colors"><Building2 size={15}/> Back to Venues</motion.button><motion.button whileTap={{scale:0.97}} onClick={onMyBookings} className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg">My Bookings</motion.button></div>
    </div>
  );
}

// ─── Dashboard View ───────────────────────────────────────────────────────────

function DashboardView({hallBookings,halls,onCancelHall,onUpdateHall,addNotification,isLoggedIn,onNeedAuth}:{hallBookings:HallBooking[];halls:Hall[];onCancelHall:(id:string)=>void|Promise<void>;onUpdateHall:(b:HallBooking)=>void|Promise<void>;addNotification:(n:Omit<Notification,"id"|"read">)=>void;isLoggedIn:boolean;onNeedAuth:()=>void}) {
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

// ─── Event Creation Wizard ────────────────────────────────────────────────────

function EventCreationWizard({venues,onClose,onPublish}:{venues:Venue[];onClose:()=>void;onPublish:(event:SeatFlowEvent)=>void}) {
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

// ─── Organizer View ───────────────────────────────────────────────────────────


// ─── Event View Modal ────────────────────────────────────────────────────────

function EventViewModal({event,onClose,onEdit}:{event:SeatFlowEvent;onClose:()=>void;onEdit:()=>void}) {
  const pct=Math.round((event.soldSeats/event.totalSeats)*100);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md" onClick={onClose}>
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        className="glass rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e=>e.stopPropagation()}>
        {/* Hero image */}
        <div className="relative h-48 shrink-0 overflow-hidden">
          <img src={event.image} alt={event.title} className="w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/>
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"><X size={16}/></button>
          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center gap-2 mb-1"><CategoryBadge category={event.category}/>{event.tags.slice(1,3).map(t=><Badge key={t} color="slate">{t}</Badge>)}</div>
            <h2 className="text-xl font-extrabold text-white leading-tight" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{event.title}</h2>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[{icon:Calendar,label:"Date",value:event.date},{icon:Clock,label:"Time",value:event.time},{icon:MapPin,label:"Venue",value:event.venue},{icon:MapPin,label:"City",value:event.city},{icon:Users,label:"Capacity",value:`${event.totalSeats} seats`},{icon:Ticket,label:"Price",value:`৳${event.priceFrom} – ৳${event.priceTo}`}].map(({icon:Icon,label,value})=>(
              <div key={label} className="glass-subtle rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">{label}</p><div className="flex items-center gap-1.5"><Icon size={12} className="text-primary shrink-0"/><p className="text-sm font-semibold text-foreground">{value}</p></div></div>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1"><span>{event.soldSeats} sold / {event.totalSeats} total</span><span>{pct}% full</span></div>
            <div className="h-2 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.2)"}}><div className={cx("h-full rounded-full",pct>=90?"bg-red-500":pct>=60?"bg-amber-500":"bg-green-500")} style={{width:`${pct}%`}}/></div>
          </div>
          {event.description&&<p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>}
          {event.tags.length>0&&<div className="flex flex-wrap gap-1.5">{event.tags.map(t=><span key={t} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{t}</span>)}</div>}
        </div>
        <div className="px-6 py-4 border-t border-white/20 flex gap-3 shrink-0">
          <motion.button whileTap={{scale:0.96}} onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/40 dark:border-white/10 text-sm font-semibold text-foreground hover:bg-white/20 transition-colors">Close</motion.button>
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={onEdit} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg"><Edit2 size={14}/> Edit Event</motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Event Edit Drawer ────────────────────────────────────────────────────────

function EventEditDrawer({event,onSave,onClose}:{event:SeatFlowEvent;onSave:(updated:SeatFlowEvent)=>void;onClose:()=>void}) {
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

// ─── Event Delete Confirm Modal ───────────────────────────────────────────────

function EventDeleteConfirmModal({event,onConfirm,onClose}:{event:SeatFlowEvent;onConfirm:()=>void;onClose:()=>void}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md" onClick={onClose}>
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        className="glass rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-center w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4"><Trash2 size={24} className="text-destructive"/></div>
        <h2 className="text-lg font-extrabold text-foreground text-center mb-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Delete this event?</h2>
        <p className="text-xs text-muted-foreground text-center mb-4">This action cannot be undone.</p>
        <div className="glass-subtle rounded-lg px-3 py-2.5 mb-3">
          <p className="text-xs text-muted-foreground mb-0.5">Event</p>
          <p className="text-sm font-semibold text-foreground line-clamp-1">{event.title}</p>
          <p className="text-xs text-muted-foreground">{event.date} · {event.soldSeats} tickets sold</p>
        </div>
        {event.soldSeats>0&&<div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 rounded-lg p-3 mb-4"><AlertCircle size={13} className="shrink-0 mt-0.5"/><span>This event has {event.soldSeats} sold tickets. Deleting it may affect existing bookings.</span></div>}
        <div className="flex gap-3">
          <motion.button whileTap={{scale:0.96}} onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/40 dark:border-white/10 text-sm font-semibold text-foreground hover:bg-white/20 transition-colors">Keep Event</motion.button>
          <motion.button whileTap={{scale:0.96}} onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-sm font-bold hover:bg-red-700 transition-colors">Yes, Delete</motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Organizer View ───────────────────────────────────────────────────────────

function OrganizerView({events,venues,onAddEvent,onUpdateEvent,onDeleteEvent,profile,onUpdateProfile}:{events:SeatFlowEvent[];venues:Venue[];onAddEvent:(e:SeatFlowEvent)=>void;onUpdateEvent:(e:SeatFlowEvent)=>void;onDeleteEvent:(id:string)=>void;profile:OrganizerProfile;onUpdateProfile:(p:OrganizerProfile)=>void}) {
  const [tab,setTab]=useState<"analytics"|"events"|"profile">("analytics");
  const [showWizard,setShowWizard]=useState(false);
  const [viewingEvent,setViewingEvent]=useState<SeatFlowEvent|null>(null);
  const [editingEvent,setEditingEvent]=useState<SeatFlowEvent|null>(null);
  const [deletingEventId,setDeletingEventId]=useState<string|null>(null);
  const [localProfile,setLocalProfile]=useState<OrganizerProfile>(profile);
  const saveProfile=()=>{onUpdateProfile(localProfile);toast.success("Profile updated successfully!");};
  const updateField=(field:keyof OrganizerProfile,value:string|boolean)=>setLocalProfile(prev=>({...prev,[field]:value}));
  const inp="w-full px-4 py-2.5 rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-primary text-sm";
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {showWizard&&<EventCreationWizard venues={venues} onClose={()=>setShowWizard(false)} onPublish={event=>{onAddEvent(event);setTab("events");}}/>}
      <AnimatePresence>
        {viewingEvent&&<EventViewModal key="view" event={viewingEvent} onClose={()=>setViewingEvent(null)} onEdit={()=>{setEditingEvent(viewingEvent);setViewingEvent(null);}}/>}
        {editingEvent&&<EventEditDrawer key="edit" event={editingEvent} onSave={updated=>{onUpdateEvent(updated);setEditingEvent(null);}} onClose={()=>setEditingEvent(null)}/>}
        {deletingEventId&&(()=>{const ev=events.find(e=>e.id===deletingEventId);return ev?<EventDeleteConfirmModal key="del" event={ev} onConfirm={()=>{onDeleteEvent(deletingEventId);setDeletingEventId(null);toast.success("Event deleted.");}} onClose={()=>setDeletingEventId(null)}/>:null;})()}
      </AnimatePresence>
      <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center"><Settings size={18} className="text-violet-600"/></div><div><h2 className="font-bold text-foreground" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Organizer Panel</h2><p className="text-sm text-muted-foreground">Manage events and view performance</p></div></div>
      <div className="flex gap-1 glass rounded-xl p-1 mb-6 w-fit">{(["analytics","events","profile"] as const).map(t=><button key={t} onClick={()=>setTab(t)} className={cx("px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all",tab===t?"bg-primary/90 text-white shadow-sm":"text-muted-foreground hover:text-foreground")}>{t==="analytics"?"Analytics":t==="events"?"My Events":"Profile"}</button>)}</div>

      {tab==="analytics"&&(
        <div className="space-y-6">

          {/* ── Section 1: 6 KPI cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {label:"Total Bookings",value:"223",delta:"+12%",positive:true,icon:Ticket},
              {label:"Seats Sold",value:"329 / 480",delta:"68.5%",positive:true,icon:Users},
              {label:"Est. Revenue",value:"৳18,420",delta:"+8.3%",positive:true,icon:BarChart2},
              {label:"Cancellation Rate",value:"4.2%",delta:"-0.8%",positive:true,icon:XCircle},
              {label:"Active Events",value:String(events.length),delta:"+1 this month",positive:true,icon:Sparkles},
              {label:"Avg. Ticket Price",value:"৳987",delta:"+৳43",positive:true,icon:Ticket},
            ].map(({label,value,delta,positive,icon:Icon})=>(
              <motion.div key={label} whileHover={{scale:1.03}} className="glass rounded-xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3"><p className="text-xs text-muted-foreground font-medium">{label}</p><Icon size={16} className="text-muted-foreground"/></div>
                <p className="text-xl font-extrabold text-foreground mb-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{value}</p>
                <span className={cx("flex items-center gap-1 text-xs font-semibold",positive?"text-green-600":"text-red-600")}>{positive?<TrendingUp size={12}/>:<TrendingDown size={12}/>} {delta} vs last week</span>
              </motion.div>
            ))}
          </div>

          {/* ── Section 2: Weekly trend + Status donut ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-xl p-5 shadow-lg">
              <h3 className="font-bold text-sm text-foreground mb-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Bookings This Week</h3>
              <p className="text-xs text-muted-foreground mb-4">This week total: <span className="font-semibold text-foreground">223 bookings</span></p>
              <div className="flex items-end gap-2 h-44">
                {(()=>{const max=Math.max(...BOOKING_TREND.map(d=>d.bookings));return BOOKING_TREND.map(d=>(
                  <div key={d.day} className="flex flex-col items-center gap-1.5 flex-1">
                    <span className="text-xs font-semibold text-muted-foreground">{d.bookings}</span>
                    <div className="w-full rounded-t-lg transition-all duration-700" style={{height:`${Math.round((d.bookings/max)*120)}px`,background:d.bookings===max?"#1D4ED8":"rgba(29,78,216,0.55)"}}/>
                    <span className="text-xs text-muted-foreground">{d.day}</span>
                  </div>
                ));})()}
              </div>
            </div>

            <div className="glass rounded-xl p-5 shadow-lg">
              <h3 className="font-bold text-sm text-foreground mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Booking Status Distribution</h3>
              <div className="flex items-center gap-6">
                <div className="relative shrink-0 w-32 h-32">
                  <div className="w-32 h-32 rounded-full" style={{background:`conic-gradient(#16A34A 0% 78%, #D97706 78% 92%, #DC2626 92% 100%)`}}/>
                  <div className="absolute inset-3 rounded-full bg-card flex flex-col items-center justify-center">
                    <p className="text-base font-extrabold text-foreground leading-tight">223</p>
                    <p className="text-xs text-muted-foreground">total</p>
                  </div>
                </div>
                <div className="space-y-3 flex-1">
                  {BOOKING_STATUS.map(s=>(
                    <div key={s.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:s.color}}/><span className="text-sm text-foreground">{s.label}</span></div>
                      <span className="text-sm font-bold" style={{color:s.color}}>{s.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 3: Revenue by event ── */}
          <div className="glass rounded-xl p-5 shadow-lg">
            <h3 className="font-bold text-sm text-foreground mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Revenue by Event</h3>
            <div className="space-y-4">
              {REVENUE_DATA.map(d=>{
                const pct=Math.round((d.revenue/d.target)*100);
                return (
                  <div key={d.event}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-sm font-medium text-foreground truncate max-w-[60%]">{d.event}</span>
                      <div className="text-right shrink-0 ml-2">
                        <span className="text-sm font-bold" style={{color:d.color}}>৳{d.revenue.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground ml-1">/ ৳{d.target.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.15)"}}>
                      <div className="h-full rounded-full transition-all duration-700" style={{width:`${pct}%`,background:d.color}}/>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{pct}% of target</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Section 4: Category breakdown + Top Events ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-xl p-5 shadow-lg">
              <h3 className="font-bold text-sm text-foreground mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>By Category</h3>
              <div className="space-y-3">
                {CATEGORY_DATA.map(d=>{const max=Math.max(...CATEGORY_DATA.map(x=>x.value));const pct=Math.round((d.value/max)*100);return(
                  <div key={d.name}><div className="flex items-center justify-between text-xs mb-1.5"><span className="font-medium text-foreground">{d.name}</span><span className="text-muted-foreground font-semibold">{d.value}%</span></div><div className="h-2.5 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.15)"}}><div className="h-full rounded-full transition-all duration-700" style={{width:`${pct}%`,background:d.fill}}/></div></div>
                );})}
              </div>
            </div>

            <div className="glass rounded-xl p-5 shadow-lg">
              <h3 className="font-bold text-sm text-foreground mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Top Events by Occupancy</h3>
              <div className="space-y-3">
                {[...events].sort((a,b)=>b.soldSeats-a.soldSeats).slice(0,4).map((event,i)=>{
                  const pct=Math.round((event.soldSeats/event.totalSeats)*100);
                  const rankColors=["#1D4ED8","#16A34A","#D97706","#7C3AED"];
                  return (
                    <div key={event.id} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{background:rankColors[i]}}>#{i+1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{event.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.15)"}}><div className="h-full rounded-full" style={{width:`${pct}%`,background:rankColors[i]}}/></div>
                          <span className={cx("text-xs font-bold px-1.5 py-0.5 rounded-full",pct>=90?"bg-red-100 text-red-700":pct>=75?"bg-amber-100 text-amber-700":"bg-green-100 text-green-700")}>{pct}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Section 5: Seat Availability ── */}
          <div className="glass rounded-xl p-5 shadow-lg">
            <h3 className="font-bold text-sm text-foreground mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Seat Availability</h3>
            <div className="space-y-3">
              {events.slice(0,4).map(event=>{
                const pct=Math.round((event.soldSeats/event.totalSeats)*100);
                return (
                  <div key={event.id}>
                    <div className="flex justify-between text-sm mb-1 items-center">
                      <div className="flex items-center gap-2"><span className="text-foreground font-medium">{event.title}</span>{pct>=90&&<span className="text-xs font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">URGENT</span>}{pct>=75&&pct<90&&<span className="text-xs font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">FULL SOON</span>}</div>
                      <span className="text-muted-foreground shrink-0 ml-2">{event.soldSeats}/{event.totalSeats} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.25)"}}><div className={cx("h-full rounded-full",pct>=90?"bg-red-500":pct>=60?"bg-amber-500":"bg-green-500")} style={{width:`${pct}%`}}/></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab==="events"&&(
        <div className="space-y-4">
          <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{events.length} events listed</p><motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={()=>setShowWizard(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg"><Plus size={15}/> Create Event</motion.button></div>
          <div className="glass rounded-xl shadow-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/20"><th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Event</th><th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Date</th><th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Seats</th><th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Status</th><th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th></tr></thead>
              <tbody className="divide-y divide-white/10">{events.map(event=>{
                const pct=Math.round((event.soldSeats/event.totalSeats)*100);
                const isDraft=event.status==="draft";
                return(
                  <tr key={event.id} className={cx("hover:bg-white/10 transition-colors",isDraft&&"opacity-80")}>
                    <td className="p-4"><div className="flex items-center gap-3"><img src={event.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0"/><div><p className="font-semibold text-foreground text-sm leading-tight">{event.title}</p><div className="flex items-center gap-1.5 mt-0.5"><p className="text-xs text-muted-foreground">{event.venue}</p>{isDraft&&<span className="text-xs text-amber-600 dark:text-amber-400 font-bold">• Draft</span>}</div></div></div></td>
                    <td className="p-4 text-muted-foreground text-sm hidden sm:table-cell">{event.date}</td>
                    <td className="p-4 hidden md:table-cell"><div><div className="text-xs text-muted-foreground mb-1">{event.soldSeats}/{event.totalSeats}</div><div className="h-1.5 w-20 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.2)"}}><div className={cx("h-full rounded-full",pct>=90?"bg-red-500":pct>=60?"bg-amber-500":"bg-green-500")} style={{width:`${pct}%`}}/></div></div></td>
                    <td className="p-4 hidden md:table-cell">{isDraft?<Badge color="slate">Draft</Badge>:<Badge color={pct>=90?"red":pct>=60?"amber":"green"}>{pct>=90?"Almost Full":pct>=60?"Selling":"Open"}</Badge>}</td>
                    <td className="p-4"><div className="flex items-center justify-end gap-2">
                      {isDraft&&<motion.button whileTap={{scale:0.93}} onClick={()=>{onUpdateEvent({...event,status:"published"});toast.success(`"${event.title}" is now live!`);}} className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors" title="Publish event"><Sparkles size={11}/> Publish</motion.button>}
                      <motion.button whileTap={{scale:0.93}} onClick={()=>setViewingEvent(event)} title="View event" className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-white/20 transition-colors"><Eye size={14}/></motion.button>
                      <motion.button whileTap={{scale:0.93}} onClick={()=>setEditingEvent(event)} title="Edit event" className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-white/20 transition-colors"><Edit2 size={14}/></motion.button>
                      <motion.button whileTap={{scale:0.93}} onClick={()=>setDeletingEventId(event.id)} title="Delete event" className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={14}/></motion.button>
                    </div></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="profile"&&(
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 shadow-xl text-center">
              <div className="relative inline-block mb-4"><div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-white text-3xl font-extrabold mx-auto" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{getInitials(localProfile.name)}</div>{localProfile.verified&&<motion.div initial={{scale:0}} animate={{scale:1}} transition={spring} className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900"><BadgeCheck size={14} className="text-white"/></motion.div>}</div>
              <p className="font-bold text-foreground text-lg" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{localProfile.name}</p>
              <p className="text-sm text-muted-foreground mb-1">{localProfile.organizationName}</p>
              <p className="text-xs text-muted-foreground">Member since {localProfile.memberSince}</p>
              <div className="flex justify-center gap-1 mt-2"><StarsRow rating={localProfile.rating}/><span className="text-xs text-muted-foreground ml-1">{localProfile.rating}</span></div>
            </div>
            <div className="grid grid-cols-3 gap-3">{[{label:"Events",value:localProfile.eventsCreated},{label:"Bookings",value:localProfile.totalBookings.toLocaleString()},{label:"Rating",value:localProfile.rating}].map(({label,value})=><motion.div key={label} whileHover={{scale:1.05}} className="glass rounded-xl p-3 text-center shadow-lg"><p className="text-lg font-extrabold text-primary">{value}</p><p className="text-xs text-muted-foreground">{label}</p></motion.div>)}</div>
            <div className="glass rounded-xl p-4 shadow-lg"><label className="flex items-center justify-between cursor-pointer"><div><p className="text-sm font-semibold text-foreground flex items-center gap-1.5"><BadgeCheck size={14} className="text-green-500"/> Verified Organizer</p><p className="text-xs text-muted-foreground mt-0.5">Reviewed by SeatFlow admin</p></div><div className={cx("w-11 h-6 rounded-full transition-colors relative",localProfile.verified?"bg-green-500":"bg-white/30 dark:bg-white/10")} onClick={()=>updateField("verified",!localProfile.verified)}><div className={cx("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",localProfile.verified?"left-5":"left-0.5")}/></div></label></div>
          </div>
          <div className="lg:col-span-2">
            <div className="glass rounded-xl p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-foreground text-lg mb-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Edit Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-semibold text-foreground mb-1.5">Full Name</label><input value={localProfile.name} onChange={e=>updateField("name",e.target.value)} className={inp}/></div><div><label className="block text-sm font-semibold text-foreground mb-1.5">Organization</label><input value={localProfile.organizationName} onChange={e=>updateField("organizationName",e.target.value)} className={inp}/></div></div>
              <div><label className="block text-sm font-semibold text-foreground mb-1.5">Bio</label><textarea value={localProfile.bio} onChange={e=>updateField("bio",e.target.value)} rows={3} className={cx(inp,"resize-none")}/></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1"><Phone size={13} className="text-primary"/> Phone</label><input value={localProfile.phone} onChange={e=>updateField("phone",e.target.value)} className={inp}/></div><div><label className="block text-sm font-semibold text-foreground mb-1.5">Email</label><input value={localProfile.email} onChange={e=>updateField("email",e.target.value)} type="email" className={inp}/></div></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1"><Globe size={13} className="text-primary"/> Website</label><input value={localProfile.website} onChange={e=>updateField("website",e.target.value)} className={inp}/></div><div><label className="block text-sm font-semibold text-foreground mb-1.5">City</label><input value={localProfile.city} onChange={e=>updateField("city",e.target.value)} className={inp}/></div></div>
              <div><label className="block text-sm font-semibold text-foreground mb-1.5">Address</label><input value={localProfile.address} onChange={e=>updateField("address",e.target.value)} className={inp}/></div>
              <div className="flex justify-end pt-2"><motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={saveProfile} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"><Check size={15}/> Save Changes</motion.button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({view,isLoggedIn,userName,unreadCount,isDark,onNav,onOpenAuth,onSignOut,onToggleNotifications,onToggleDark}:{view:View;isLoggedIn:boolean;userName:string;unreadCount:number;isDark:boolean;onNav:(v:View)=>void;onOpenAuth:()=>void;onSignOut:()=>void;onToggleNotifications:()=>void;onToggleDark:()=>void}) {
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

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [view,setView]=useState<View>("events");
  const [allEvents,setAllEvents]=useState<SeatFlowEvent[]>([]);
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
    const stored=getStoredUser();
    if(stored&&getToken()){
      setIsLoggedIn(true);
      setUserName(stored.full_name);
      setUserRole(stored.role);
      setOrganizerProfile(prev=>({...prev,name:stored.full_name,email:stored.email}));
      refreshHallBookings();
    }
    api.health().catch(()=>toast.message("Backend not ready yet — start with npm run dev from repo root."));
    refreshEvents();
    refreshVenues();
  },[refreshEvents,refreshVenues,refreshHallBookings]);

  useEffect(()=>{
    if(view==="dashboard"&&isLoggedIn) refreshHallBookings();
  },[view,isLoggedIn,refreshHallBookings]);

  const navigate=(v:View)=>setView(v);
  const unreadCount=notifications.filter(n=>!n.read).length;
  const addNotification=(n:Omit<Notification,"id"|"read">)=>setNotifications(prev=>[{...n,id:`n-${Date.now()}`,read:false},...prev]);
  const handleAuth=(user:AuthUser)=>{
    setIsLoggedIn(true);
    setUserName(user.full_name);
    setUserRole(user.role);
    setOrganizerProfile(prev=>({...prev,name:user.full_name,email:user.email}));
    refreshHallBookings();
  };
  const handleSignOut=()=>{clearSession();setIsLoggedIn(false);setUserName("");setUserRole("customer");setHallBookings([]);toast.info("You have been signed out.");};
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
      setAllEvents(prev=>[mapApiEvent(created),...prev]);
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
      setAllEvents(prev=>prev.map(e=>e.id===event.id?mapApiEvent(updated):e));
      toast.success("Event updated");
    }catch(err){
      toast.error(err instanceof ApiError?err.message:"Failed to update event");
    }
  };

  const handleDeleteEvent=async(id:string)=>{
    try{
      await api.deleteEvent(id);
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
      <Header view={view} isLoggedIn={isLoggedIn} userName={userName} unreadCount={unreadCount} isDark={isDark} onNav={navigate} onOpenAuth={()=>setShowAuthModal(true)} onSignOut={handleSignOut} onToggleNotifications={()=>setShowNotifications(!showNotifications)} onToggleDark={()=>setIsDark(!isDark)}/>
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
            {view==="organizer"&&<OrganizerView events={allEvents} venues={venues} onAddEvent={handleAddEvent} onUpdateEvent={handleUpdateEvent} onDeleteEvent={handleDeleteEvent} profile={organizerProfile} onUpdateProfile={setOrganizerProfile}/>}
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
