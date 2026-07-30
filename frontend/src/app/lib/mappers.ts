import { formatEventDate, type ApiBooking, type ApiEvent, type ApiHall, type ApiHallBooking, type ApiSeat, type ApiVenue } from "../../lib/api";
import type { Booking, Hall, HallBooking, Seat, SeatFlowEvent, SeatStatus, Venue } from "./types";

export function mapApiEvent(e: ApiEvent): SeatFlowEvent {
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

export function mapApiSeat(s: ApiSeat): Seat {
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

export function mapApiBooking(b: ApiBooking): Booking {
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

export function mapApiVenue(v: ApiVenue): Venue {
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

export function mapApiHall(h: ApiHall): Hall {
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

export function mapApiHallBooking(b: ApiHallBooking): HallBooking {
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
