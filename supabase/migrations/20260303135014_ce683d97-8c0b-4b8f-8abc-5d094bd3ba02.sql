
-- Platform admins table
CREATE TABLE public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Platform admins can view themselves
CREATE POLICY "Platform admins can view own record"
  ON public.platform_admins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Security definer function to check platform admin status
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = _user_id
  )
$$;

-- Allow platform admins to SELECT all schools
CREATE POLICY "Platform admins can view all schools"
  ON public.schools FOR SELECT
  TO authenticated
  USING (is_platform_admin(auth.uid()));

-- Allow platform admins to UPDATE all schools
CREATE POLICY "Platform admins can update all schools"
  ON public.schools FOR UPDATE
  TO authenticated
  USING (is_platform_admin(auth.uid()));

-- Allow platform admins to DELETE schools
CREATE POLICY "Platform admins can delete schools"
  ON public.schools FOR DELETE
  TO authenticated
  USING (is_platform_admin(auth.uid()));

-- Allow platform admins to view all students
CREATE POLICY "Platform admins can view all students"
  ON public.students FOR SELECT
  TO authenticated
  USING (is_platform_admin(auth.uid()));

-- Allow platform admins to view all user_roles
CREATE POLICY "Platform admins can view all user_roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (is_platform_admin(auth.uid()));

-- Allow platform admins to delete user_roles
CREATE POLICY "Platform admins can delete user_roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (is_platform_admin(auth.uid()));

-- Allow platform admins to view all classes
CREATE POLICY "Platform admins can view all classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (is_platform_admin(auth.uid()));

-- Allow platform admins to view all trades
CREATE POLICY "Platform admins can view all trades"
  ON public.trades FOR SELECT
  TO authenticated
  USING (is_platform_admin(auth.uid()));

-- Allow platform admins to view all discipline records
CREATE POLICY "Platform admins can view all discipline"
  ON public.discipline_records FOR SELECT
  TO authenticated
  USING (is_platform_admin(auth.uid()));

-- Allow platform admins to view all profiles
CREATE POLICY "Platform admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (is_platform_admin(auth.uid()));

-- Allow platform admins to view all invitations
CREATE POLICY "Platform admins can view all invitations"
  ON public.school_invitations FOR SELECT
  TO authenticated
  USING (is_platform_admin(auth.uid()));
