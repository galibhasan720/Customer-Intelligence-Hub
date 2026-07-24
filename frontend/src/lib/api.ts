/** Thin fetch wrapper for the Seat-Flow FastAPI backend. */

import { clearSession, getToken } from "./auth";

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "")
  || "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = false,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    if (res.status === 401) clearSession();
    const detail =
      typeof data === "object" && data && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : res.statusText || "Request failed";
    throw new ApiError(res.status, detail);
  }
  return data as T;
}

export type ApiUser = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: ApiUser;
};

export type ApiEvent = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  venue: string;
  city: string;
  event_date: string;
  price: number;
  price_from: number;
  price_to: number;
  status: string;
  booking_window_open: boolean;
  organizer_id: string;
  total_seats: number;
  sold_seats: number;
  image: string;
  tags: string[];
};

export type ApiSeat = {
  id: string;
  seat_number: string;
  category: string;
  status: string;
  price: number;
};

export type ApiBooking = {
  id: string;
  event_id: string;
  event_title: string;
  venue: string;
  event_date: string;
  seats: string[];
  seat_ids: string[];
  total: number;
  status: string;
  booked_at: string;
};

export const api = {
  health: () => request<{ status: string }>("/health"),
  register: (body: {
    full_name: string;
    email: string;
    password: string;
    role?: string;
  }) =>
    request<AuthResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    request<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  me: () => request<ApiUser>("/api/v1/users/me", {}, true),
  listEvents: (params?: { q?: string; category?: string }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.category) qs.set("category", params.category);
    const suffix = qs.toString() ? `?${qs}` : "";
    return request<ApiEvent[]>(`/api/v1/events${suffix}`);
  },
  myEvents: () => request<ApiEvent[]>("/api/v1/events/mine", {}, true),
  getEvent: (id: string) => request<ApiEvent>(`/api/v1/events/${id}`),
  createEvent: (body: Record<string, unknown>) =>
    request<ApiEvent>("/api/v1/events", {
      method: "POST",
      body: JSON.stringify(body),
    }, true),
  updateEvent: (id: string, body: Record<string, unknown>) =>
    request<ApiEvent>(`/api/v1/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, true),
  deleteEvent: (id: string) =>
    request<void>(`/api/v1/events/${id}`, { method: "DELETE" }, true),
  listSeats: (eventId: string) =>
    request<ApiSeat[]>(`/api/v1/events/${eventId}/seats`),
  myBookings: () => request<ApiBooking[]>("/api/v1/bookings/me", {}, true),
  createBooking: (body: { event_id: string; seat_ids: string[] }) =>
    request<ApiBooking>("/api/v1/bookings", {
      method: "POST",
      body: JSON.stringify(body),
    }, true),
  cancelBooking: (id: string) =>
    request<ApiBooking>(`/api/v1/bookings/${id}/cancel`, { method: "POST" }, true),

  listVenues: () => request<ApiVenue[]>("/api/v1/venues"),
  getVenue: (id: string) => request<ApiVenue>(`/api/v1/venues/${id}`),
  listHalls: (venueId: string) =>
    request<ApiHall[]>(`/api/v1/venues/${venueId}/halls`),
  myHallBookings: () =>
    request<ApiHallBooking[]>("/api/v1/hall-bookings/me", {}, true),
  createHallBooking: (body: Record<string, unknown>) =>
    request<ApiHallBooking>("/api/v1/hall-bookings", {
      method: "POST",
      body: JSON.stringify(body),
    }, true),
  updateHallBooking: (id: string, body: Record<string, unknown>) =>
    request<ApiHallBooking>(`/api/v1/hall-bookings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, true),
  cancelHallBooking: (id: string) =>
    request<ApiHallBooking>(`/api/v1/hall-bookings/${id}/cancel`, {
      method: "POST",
    }, true),
};

export type ApiVenue = {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  image: string;
  rating: number;
  review_count: number;
  total_halls: number;
  price_from: number;
  description: string;
  amenities: string[];
};

export type ApiHall = {
  id: string;
  venue_id: string;
  name: string;
  capacity: number;
  area_sqft: number;
  floor: number;
  price_per_hour: number;
  price_half_day: number;
  price_full_day: number;
  amenities: string[];
  image: string;
  available: boolean;
};

export type ApiHallBooking = {
  id: string;
  venue_id: string;
  hall_id: string;
  venue_name: string;
  hall_name: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_type: "hourly" | "half-day" | "full-day";
  purpose: string;
  guest_count: number;
  add_ons: string[];
  total: number;
  status: string;
  booked_at: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
};

export function formatEventDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
  });
  return { date, time };
}
