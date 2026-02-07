
-- Role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'teacher', 'viewer');

-- Schools table
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  location TEXT,
  phone TEXT,
  email TEXT,
  academic_year_start DATE,
  academic_year_end DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- User roles table (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, school_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Trades table
CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  class_id UUID REFERENCES public.classes(id),
  trade_id UUID REFERENCES public.trades(id),
  academic_year TEXT,
  date_of_birth DATE,
  gender TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  home_location TEXT,
  admission_date DATE,
  status TEXT NOT NULL DEFAULT 'Active',
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id, registration_number)
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Discipline records
CREATE TABLE public.discipline_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  mistake_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  description TEXT,
  action_taken TEXT,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.discipline_records ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user's school_id
CREATE OR REPLACE FUNCTION public.get_user_school_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Function to check if user belongs to a school
CREATE OR REPLACE FUNCTION public.user_belongs_to_school(_user_id UUID, _school_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND school_id = _school_id
  )
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Profiles: users can read/update their own
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Schools: users can see schools they belong to, and create new ones
CREATE POLICY "Users can view their schools" ON public.schools FOR SELECT USING (public.user_belongs_to_school(auth.uid(), id));
CREATE POLICY "Authenticated users can create schools" ON public.schools FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Super admins can update their school" ON public.schools FOR UPDATE USING (public.user_belongs_to_school(auth.uid(), id));

-- User roles: users can see roles in their school
CREATE POLICY "Users can view roles in their school" ON public.user_roles FOR SELECT USING (public.user_belongs_to_school(auth.uid(), school_id));
CREATE POLICY "Users can insert their own role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Classes: school members only
CREATE POLICY "School members can view classes" ON public.classes FOR SELECT USING (public.user_belongs_to_school(auth.uid(), school_id));
CREATE POLICY "School members can insert classes" ON public.classes FOR INSERT WITH CHECK (public.user_belongs_to_school(auth.uid(), school_id));
CREATE POLICY "School members can update classes" ON public.classes FOR UPDATE USING (public.user_belongs_to_school(auth.uid(), school_id));
CREATE POLICY "School members can delete classes" ON public.classes FOR DELETE USING (public.user_belongs_to_school(auth.uid(), school_id));

-- Trades: school members only
CREATE POLICY "School members can view trades" ON public.trades FOR SELECT USING (public.user_belongs_to_school(auth.uid(), school_id));
CREATE POLICY "School members can insert trades" ON public.trades FOR INSERT WITH CHECK (public.user_belongs_to_school(auth.uid(), school_id));
CREATE POLICY "School members can update trades" ON public.trades FOR UPDATE USING (public.user_belongs_to_school(auth.uid(), school_id));
CREATE POLICY "School members can delete trades" ON public.trades FOR DELETE USING (public.user_belongs_to_school(auth.uid(), school_id));

-- Students: school members only, soft delete
CREATE POLICY "School members can view students" ON public.students FOR SELECT USING (public.user_belongs_to_school(auth.uid(), school_id) AND is_deleted = false);
CREATE POLICY "School members can insert students" ON public.students FOR INSERT WITH CHECK (public.user_belongs_to_school(auth.uid(), school_id));
CREATE POLICY "School members can update students" ON public.students FOR UPDATE USING (public.user_belongs_to_school(auth.uid(), school_id));

-- Discipline records: school members only
CREATE POLICY "School members can view discipline" ON public.discipline_records FOR SELECT USING (public.user_belongs_to_school(auth.uid(), school_id));
CREATE POLICY "School members can insert discipline" ON public.discipline_records FOR INSERT WITH CHECK (public.user_belongs_to_school(auth.uid(), school_id));
CREATE POLICY "School members can update discipline" ON public.discipline_records FOR UPDATE USING (public.user_belongs_to_school(auth.uid(), school_id));
