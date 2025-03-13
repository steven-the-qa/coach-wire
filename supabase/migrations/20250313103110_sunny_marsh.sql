/*
  # Initial Schema Setup for CoachWire

  1. New Tables
    - `profiles`
      - Extends Supabase auth.users
      - Stores user profile information
      - Supports both coach and client roles
    
    - `gyms`
      - Represents a coach's business/gym
      - Contains gym details and settings
    
    - `classes`
      - Represents available classes
      - Includes schedule and capacity
    
    - `bookings`
      - Tracks class bookings
      - Links clients to classes
    
    - `messages`
      - Handles communication between coaches and clients
      - Supports threaded conversations

  2. Security
    - RLS policies for each table
    - Separate access rules for coaches and clients
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('coach', 'client');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'client',
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create gyms table
CREATE TABLE IF NOT EXISTS gyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT coach_must_be_coach CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = coach_id 
      AND profiles.role = 'coach'
    )
  )
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES gyms(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  duration interval NOT NULL,
  capacity int NOT NULL CHECK (capacity > 0),
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  stripe_payment_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Gyms policies
CREATE POLICY "Gyms are viewable by everyone"
  ON gyms FOR SELECT
  USING (true);

CREATE POLICY "Coaches can insert their own gym"
  ON gyms FOR INSERT
  WITH CHECK (
    auth.uid() = coach_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  );

CREATE POLICY "Coaches can update their own gym"
  ON gyms FOR UPDATE
  USING (auth.uid() = coach_id);

-- Classes policies
CREATE POLICY "Classes are viewable by everyone"
  ON classes FOR SELECT
  USING (true);

CREATE POLICY "Coaches can manage their gym's classes"
  ON classes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM gyms
      WHERE gyms.id = classes.gym_id
      AND gyms.coach_id = auth.uid()
    )
  );

-- Bookings policies
CREATE POLICY "Clients can view their own bookings"
  ON bookings FOR SELECT
  USING (
    auth.uid() = client_id OR
    EXISTS (
      SELECT 1 FROM classes
      JOIN gyms ON classes.gym_id = gyms.id
      WHERE classes.id = bookings.class_id
      AND gyms.coach_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- Messages policies
CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (
    auth.uid() = sender_id OR
    auth.uid() = receiver_id
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);