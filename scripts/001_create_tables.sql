-- Create allowed_users table
CREATE TABLE IF NOT EXISTS public.allowed_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create interview_slots table
CREATE TABLE IF NOT EXISTS public.interview_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  time_start TEXT NOT NULL,
  time_end TEXT NOT NULL,
  capacity INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.allowed_users(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES public.interview_slots(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, slot_id)
);

-- Enable RLS on all tables
ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for allowed_users (read-only for regular users, they can only see their own data)
CREATE POLICY "Users can view their own profile"
  ON public.allowed_users FOR SELECT
  USING (id = (SELECT id FROM public.allowed_users WHERE email = auth.email()));

CREATE POLICY "Admins can view all users"
  ON public.allowed_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.allowed_users au
      WHERE au.email = auth.email() AND au.is_admin = TRUE
    )
  );

-- RLS Policies for interview_slots (everyone can read, only admins can write)
CREATE POLICY "Anyone can view interview slots"
  ON public.interview_slots FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert slots"
  ON public.interview_slots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.allowed_users
      WHERE email = auth.email() AND is_admin = TRUE
    )
  );

CREATE POLICY "Only admins can update slots"
  ON public.interview_slots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.allowed_users
      WHERE email = auth.email() AND is_admin = TRUE
    )
  );

CREATE POLICY "Only admins can delete slots"
  ON public.interview_slots FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.allowed_users
      WHERE email = auth.email() AND is_admin = TRUE
    )
  );

-- RLS Policies for reservations (users can only see/manage their own)
CREATE POLICY "Users can view their own reservations"
  ON public.reservations FOR SELECT
  USING (
    user_id = (SELECT id FROM public.allowed_users WHERE email = auth.email())
  );

CREATE POLICY "Users can create their own reservations"
  ON public.reservations FOR INSERT
  WITH CHECK (
    user_id = (SELECT id FROM public.allowed_users WHERE email = auth.email())
  );

CREATE POLICY "Users can delete their own reservations"
  ON public.reservations FOR DELETE
  USING (
    user_id = (SELECT id FROM public.allowed_users WHERE email = auth.email())
  );

CREATE POLICY "Admins can view all reservations"
  ON public.reservations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.allowed_users
      WHERE email = auth.email() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can delete any reservation"
  ON public.reservations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.allowed_users
      WHERE email = auth.email() AND is_admin = TRUE
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS allowed_users_email_idx ON public.allowed_users(email);
CREATE INDEX IF NOT EXISTS reservations_user_id_idx ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS reservations_slot_id_idx ON public.reservations(slot_id);
CREATE INDEX IF NOT EXISTS interview_slots_date_idx ON public.interview_slots(date);
