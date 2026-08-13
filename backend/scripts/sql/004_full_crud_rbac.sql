-- Profile extras, notification title, guest fields, add-ons, payments

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_name VARCHAR(255);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(64);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address VARCHAR(255);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT '';

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_name VARCHAR(255);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_email VARCHAR(255);

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

CREATE TABLE IF NOT EXISTS public.add_ons (
    id VARCHAR(64) PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(32) NOT NULL DEFAULT 'flat'
        CHECK (unit IN ('flat', 'per_person')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles (id),
    booking_id UUID REFERENCES public.bookings (id) ON DELETE SET NULL,
    hall_booking_id UUID REFERENCES public.hall_bookings (id) ON DELETE SET NULL,
    method VARCHAR(32) NOT NULL DEFAULT 'card'
        CHECK (method IN ('card', 'paypal', 'apple')),
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'Paid'
        CHECK (status IN ('Pending', 'Paid', 'Refunded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_created
    ON public.payments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_booking
    ON public.payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_hall_booking
    ON public.payments (hall_booking_id);
