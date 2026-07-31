export type View =
  | "events" | "event-detail" | "seat-selection" | "booking-details"
  | "payment" | "confirmation" | "dashboard" | "organizer"
  | "venue-browse" | "venue-detail" | "hall-booking" | "hall-confirmation";

export type SeatStatus = "available" | "selected" | "held" | "reserved" | "sold" | "vip-available" | "accessible" | "companion" | "blocked";

export interface Seat { id: string; apiId?: string; row: string; number: number; status: SeatStatus; price: number; category: "VIP" | "Standard" | "Accessible" | "Companion"; }
export interface SeatFlowEvent { id: string; title: string; category: string; date: string; time: string; venue: string; city: string; priceFrom: number; priceTo: number; totalSeats: number; soldSeats: number; image: string; description: string; tags: string[]; status?: "draft" | "published"; }
export interface Booking { id: string; eventId: string; eventTitle: string; date: string; venue: string; seats: string[]; total: number; status: "Confirmed" | "Pending" | "Cancelled" | "Expired"; bookedAt: string; guestName?: string; guestEmail?: string; }
export interface Notification { id: string; type: "booking_confirmed" | "booking_cancelled" | "event_reminder" | "event_updated" | "hold_expired" | "payment_processed" | "hall_booking_confirmed" | "new_event"; title: string; message: string; timestamp: string; read: boolean; }
export interface Venue { id: string; name: string; type: string; address: string; city: string; image: string; rating: number; reviewCount: number; totalHalls: number; priceFrom: number; description: string; amenities: string[]; }
export interface Hall { id: string; venueId: string; name: string; capacity: number; areaSqft: number; floor: number; pricePerHour: number; priceHalfDay: number; priceFullDay: number; amenities: string[]; image: string; available: boolean; }
export interface HallBooking { id: string; venueId: string; hallId: string; venueName: string; hallName: string; date: string; startTime: string; endTime: string; durationType: "hourly" | "half-day" | "full-day"; purpose: string; guestCount: number; addOns: string[]; total: number; status: "Confirmed" | "Pending" | "Cancelled"; bookedAt: string; contactName: string; contactPhone: string; contactEmail?: string; }
export interface OrganizerProfile { name: string; organizationName: string; bio: string; phone: string; email: string; website: string; city: string; address: string; verified: boolean; eventsCreated: number; totalBookings: number; rating: number; memberSince: string; }
export interface TicketTier { name: string; price: number; quantity: number; }
