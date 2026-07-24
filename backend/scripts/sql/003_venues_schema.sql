-- Venues / halls / hall_bookings (local + cloud)

CREATE TABLE IF NOT EXISTS public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Dhaka',
    image TEXT,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
    review_count INTEGER NOT NULL DEFAULT 0,
    price_from NUMERIC(12, 2) NOT NULL DEFAULT 0,
    description TEXT,
    amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.halls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES public.venues (id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 0,
    area_sqft INTEGER NOT NULL DEFAULT 0,
    floor INTEGER NOT NULL DEFAULT 1,
    price_per_hour NUMERIC(12, 2) NOT NULL DEFAULT 0,
    price_half_day NUMERIC(12, 2) NOT NULL DEFAULT 0,
    price_full_day NUMERIC(12, 2) NOT NULL DEFAULT 0,
    amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
    image TEXT,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_halls_venue_id ON public.halls (venue_id);

CREATE TABLE IF NOT EXISTS public.hall_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles (id),
    venue_id UUID NOT NULL REFERENCES public.venues (id),
    hall_id UUID NOT NULL REFERENCES public.halls (id),
    booking_date DATE NOT NULL,
    start_time VARCHAR(16) NOT NULL,
    end_time VARCHAR(16) NOT NULL,
    duration_type VARCHAR(32) NOT NULL
        CHECK (duration_type IN ('hourly', 'half-day', 'full-day')),
    purpose VARCHAR(255) NOT NULL,
    guest_count INTEGER NOT NULL DEFAULT 1,
    add_ons JSONB NOT NULL DEFAULT '[]'::jsonb,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'Confirmed'
        CHECK (status IN ('Pending', 'Confirmed', 'Cancelled')),
    contact_name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(64) NOT NULL,
    contact_email VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hall_bookings_user_created
    ON public.hall_bookings (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hall_bookings_hall_date
    ON public.hall_bookings (hall_id, booking_date);
