import type { Booking, Hall, Notification, OrganizerProfile, SeatFlowEvent, Venue } from "./types";

export const CATEGORY_GROUPS = [
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

export const POPULAR_CATEGORIES = ["Concert", "Wedding", "Conference", "Food Festival"];
export const CAT_COLORS: Record<string, string> = {};
CATEGORY_GROUPS.forEach(g => g.items.forEach(item => { CAT_COLORS[item] = g.color; }));

export const BADGE_COLORS: Record<string, string> = {
  blue:"bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300",
  green:"bg-green-100 text-green-800 dark:bg-green-950/70 dark:text-green-300",
  amber:"bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300",
  violet:"bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300",
  red:"bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300",
  slate:"bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  pink:"bg-pink-100 text-pink-800 dark:bg-pink-950/70 dark:text-pink-300",
  teal:"bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300",
  orange:"bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300",
  emerald:"bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300",
  indigo:"bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300",
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const BASE_EVENTS: SeatFlowEvent[] = [
  { id:"evt-1", title:"Artcell Live — Dhaka Concert Night", category:"Concert", date:"Sat, 12 Jul 2025", time:"8:00 PM", venue:"Bashundhara International Convention City", city:"Dhaka", priceFrom:500, priceTo:2500, totalSeats:120, soldSeats:74, image:"https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80", description:"An electrifying night with one of Bangladesh's greatest rock bands. Expect iconic anthems, special guests, and a stunning light show at the largest indoor venue in Dhaka.", tags:["Live Music","Band","Rock"] },
  { id:"evt-2", title:"DigitalBangladesh TechSummit 2025", category:"Conference", date:"Wed, 23 Jul 2025", time:"9:00 AM", venue:"Bangladesh-China Friendship Conference Centre", city:"Dhaka", priceFrom:1500, priceTo:8000, totalSeats:120, soldSeats:45, image:"https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80", description:"Bangladesh's largest technology summit bringing together entrepreneurs, engineers, and investors for two days of keynotes, workshops, and networking. 2025 theme: AI & the Future.", tags:["Technology","AI","Networking"] },
  { id:"evt-3", title:"Nuruldiner Sarajiban — Stage Play", category:"Theatre", date:"Fri, 1 Aug 2025", time:"7:30 PM", venue:"Bangladesh Shilpakala Academy", city:"Dhaka", priceFrom:300, priceTo:1200, totalSeats:120, soldSeats:98, image:"https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=800&q=80", description:"A landmark new production of Syed Shamsul Haq's timeless masterpiece with the country's finest actors in an unforgettable performance.", tags:["Theatre","Stage","Culture"] },
  { id:"evt-4", title:"BPL Final: Dhaka vs Chattogram", category:"Cricket", date:"Sun, 10 Aug 2025", time:"3:00 PM", venue:"Mirpur Shere Bangla National Cricket Stadium", city:"Dhaka", priceFrom:400, priceTo:3000, totalSeats:120, soldSeats:112, image:"https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80", description:"The thrilling Bangladesh Premier League final. Dhaka Capitals take on Chattogram Challengers. Secure your seat before they sell out.", tags:["Cricket","BPL","Final"] },
];

export const INITIAL_BOOKINGS: Booking[] = [
  { id:"BK-29471", eventId:"evt-1", eventTitle:"Artcell Live — Dhaka Concert Night", date:"Sat, 12 Jul 2025", venue:"Bashundhara Convention City, Dhaka", seats:["B5","B6"], total:1000, status:"Confirmed", bookedAt:"10 Jun 2025", guestName:"Ahmed Rahman", guestEmail:"ahmed@example.com" },
  { id:"BK-18302", eventId:"evt-2", eventTitle:"DigitalBangladesh TechSummit 2025", date:"Wed, 23 Jul 2025", venue:"Bangladesh-China Friendship Centre, Dhaka", seats:["C3"], total:1500, status:"Pending", bookedAt:"15 Jun 2025", guestName:"Fatema Khatun", guestEmail:"fatema@example.com" },
  { id:"BK-09911", eventId:"evt-3", eventTitle:"Nuruldiner Sarajiban — Stage Play", date:"Fri, 14 Feb 2025", venue:"Shilpakala Academy, Dhaka", seats:["F7","F8"], total:600, status:"Cancelled", bookedAt:"1 Jan 2025", guestName:"Rafiq Islam", guestEmail:"rafiq@example.com" },
];

export const BOOKING_TREND = [
  {day:"Mon",bookings:12},{day:"Tue",bookings:19},{day:"Wed",bookings:31},
  {day:"Thu",bookings:24},{day:"Fri",bookings:42},{day:"Sat",bookings:58},{day:"Sun",bookings:37},
];
export const CATEGORY_DATA = [{name:"Concert",value:38,fill:"#1D4ED8"},{name:"Sports",value:29,fill:"#16A34A"},{name:"Conference",value:18,fill:"#D97706"},{name:"Theatre",value:15,fill:"#7C3AED"}];
export const BOOKING_STATUS = [{label:"Confirmed",value:78,color:"#16A34A"},{label:"Pending",value:14,color:"#D97706"},{label:"Cancelled",value:8,color:"#DC2626"}];
export const REVENUE_DATA = [
  {event:"BPL Final: Dhaka vs Chattogram",revenue:11200,target:13200,color:"#16A34A"},
  {event:"Artcell Live — Dhaka Concert Night",revenue:8500,target:12000,color:"#1D4ED8"},
  {event:"DigitalBangladesh TechSummit 2025",revenue:6750,target:9000,color:"#7C3AED"},
  {event:"Nuruldiner Sarajiban — Stage Play",revenue:2100,target:2700,color:"#D97706"},
];
export const PRICE_FILTERS = ["All Prices","Under ৳500","৳500-৳2000","৳2000+"];
export const SORT_OPTIONS = ["Date","Popularity","Availability","Price"];
export const VENUE_TYPES = ["All","Convention Center","Hotel Banquet","Community Hall","Conference Center","Rooftop","Restaurant & Banquet"];
export const BOOKING_PURPOSES = ["Wedding","Corporate Meeting","Birthday Celebration","Conference / Seminar","Training Program","Exhibition","Engagement Ceremony","Eid Gathering","Religious Program","Graduation Party","Product Launch","Other"];
export const ADD_ON_OPTIONS = [
  {id:"catering",label:"Catering Service",price:500,unit:"per person"},
  {id:"av",label:"AV Equipment Setup",price:5000,unit:"flat"},
  {id:"decoration",label:"Stage Decoration",price:15000,unit:"flat"},
  {id:"photography",label:"Photography Package",price:10000,unit:"flat"},
  {id:"security",label:"Security Personnel",price:3000,unit:"flat"},
  {id:"valet",label:"Valet Parking",price:2000,unit:"flat"},
];
export const CANCEL_REASONS = ["Change of plans","Can't attend","Found a better option","Event details changed","Other"];
export const SUGGESTED_TAGS_FEATURED = ["Outdoor","Indoor","Family-friendly","Live","Night","Weekend","Youth","Cultural"];
export const SUGGESTED_TAGS_MORE = ["Educational","Corporate","Free Entry","Premium","Networking","Charity","Workshop","Exhibition","Performance","Festival","Community","Sports","Health","Food","Tech","Art","Music","Dance"];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {id:"n-1",type:"booking_confirmed",title:"Booking Confirmed",message:"Your booking for Artcell Live — Dhaka Concert Night has been confirmed. Seats B5, B6 are yours!",timestamp:"2 min ago",read:false},
  {id:"n-2",type:"event_reminder",title:"Event Tomorrow",message:"Artcell Live — Dhaka Concert Night is tomorrow at 8:00 PM. Don't forget your tickets!",timestamp:"1 hour ago",read:false},
  {id:"n-3",type:"new_event",title:"New Event Near You",message:"BPL Final: Dhaka vs Chattogram has just been listed. Get your seats before they sell out.",timestamp:"3 hours ago",read:true},
  {id:"n-4",type:"payment_processed",title:"Payment Processed",message:"৳1,500 payment for DigitalBangladesh TechSummit 2025 has been processed successfully.",timestamp:"Yesterday",read:true},
  {id:"n-5",type:"event_updated",title:"Event Updated",message:"Nuruldiner Sarajiban — Stage Play has updated its start time to 7:30 PM.",timestamp:"Yesterday",read:true},
  {id:"n-6",type:"hall_booking_confirmed",title:"Hall Booking Confirmed",message:"Your booking for Grand Ballroom at Bashundhara Convention City on 15 Jul 2025 is confirmed.",timestamp:"2 days ago",read:true},
  {id:"n-7",type:"booking_cancelled",title:"Booking Cancelled",message:"Your booking BK-09911 has been cancelled. Refund is being processed.",timestamp:"3 days ago",read:true},
  {id:"n-8",type:"hold_expired",title:"Seat Hold Expired",message:"Your seat hold for BPL Final: Dhaka vs Chattogram has expired. Seats released.",timestamp:"1 week ago",read:true},
];

export const VENUES: Venue[] = [
  {id:"v-1",name:"Bashundhara International Convention City",type:"Convention Center",address:"Ka-244 Pragati Sharani, Bashundhara R/A",city:"Dhaka",image:"https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",rating:4.7,reviewCount:312,totalHalls:6,priceFrom:25000,description:"Bangladesh's largest convention facility with world-class infrastructure spanning over 1 million sqft. Hosts international conferences, wedding receptions, and cultural events of all scales.",amenities:["WiFi","Parking","Catering","AV Equipment","AC","Generator","Prayer Room","VIP Lounge","Stage"]},
  {id:"v-2",name:"Radisson Blu Dhaka Water Garden",type:"Hotel Banquet",address:"Airport Road, Nikunja 2",city:"Dhaka",image:"https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",rating:4.8,reviewCount:527,totalHalls:4,priceFrom:40000,description:"5-star luxury hotel offering premium banquet and conference facilities with exceptional catering services. Perfect for high-profile corporate events and lavish wedding receptions.",amenities:["WiFi","Parking","Catering","AV Equipment","AC","Generator","Valet Parking","Fine Dining"]},
  {id:"v-3",name:"Pan Pacific Sonargaon Dhaka",type:"Hotel Banquet",address:"107 Kazi Nazrul Islam Avenue",city:"Dhaka",image:"https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",rating:4.6,reviewCount:289,totalHalls:3,priceFrom:50000,description:"Iconic 5-star hotel in the heart of Dhaka offering grand ballrooms and intimate meeting rooms. Renowned for its flawless event management and premium hospitality.",amenities:["WiFi","Parking","Catering","AV Equipment","AC","Generator","Business Centre","Spa"]},
  {id:"v-4",name:"BRAC Inn Conference Centre",type:"Conference Center",address:"KA-244, Progoti Sarani, Gulshan",city:"Dhaka",image:"https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",rating:4.4,reviewCount:178,totalHalls:5,priceFrom:8000,description:"Purpose-built professional conference and training facility by BRAC. Ideal for corporate workshops, seminars, and NGO events at affordable rates.",amenities:["WiFi","Catering","AV Equipment","AC","Generator","Prayer Room","Whiteboard"]},
];

export const HALLS: Hall[] = [
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

export const DEFAULT_ORGANIZER_PROFILE: OrganizerProfile = {
  name:"Rahim Uddin Ahmed", organizationName:"Dhaka Events Co.",
  bio:"Professional event organizer with 8+ years of experience managing concerts, corporate events, and cultural programs across Bangladesh.",
  phone:"+880 1711-234567", email:"rahim@dhakaevents.com", website:"www.dhakaevents.com",
  city:"Dhaka", address:"House 12, Road 5, Gulshan 2, Dhaka-1212",
  verified:true, eventsCreated:47, totalBookings:3240, rating:4.8, memberSince:"March 2019",
};
