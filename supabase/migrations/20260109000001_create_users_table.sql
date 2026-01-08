-- Create users table for NextAuth integration
-- This table stores user information from OAuth providers (Google, etc.)
-- Required for auth.ts getOrCreateDbUserId() function

CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for email lookup
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- Note: RLS is not enabled for users table because:
-- 1. NextAuth backend handles authentication
-- 2. Users table is only accessed by server-side auth.ts
-- 3. No direct client access to this table

-- Add comment
COMMENT ON TABLE public.users IS 'User accounts table for NextAuth OAuth integration';
