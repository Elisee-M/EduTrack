
-- Create school_invitations table
CREATE TABLE public.school_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'viewer',
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(school_id, email)
);

-- Enable RLS
ALTER TABLE public.school_invitations ENABLE ROW LEVEL SECURITY;

-- School members can view invitations for their school
CREATE POLICY "School members can view invitations"
  ON public.school_invitations FOR SELECT
  USING (user_belongs_to_school(auth.uid(), school_id));

-- Only admins/super_admins can insert invitations (enforced in edge function)
CREATE POLICY "School members can insert invitations"
  ON public.school_invitations FOR INSERT
  WITH CHECK (user_belongs_to_school(auth.uid(), school_id));

-- School members can update invitations
CREATE POLICY "School members can update invitations"
  ON public.school_invitations FOR UPDATE
  USING (user_belongs_to_school(auth.uid(), school_id));

-- School members can delete invitations
CREATE POLICY "School members can delete invitations"
  ON public.school_invitations FOR DELETE
  USING (user_belongs_to_school(auth.uid(), school_id));

-- Allow updating user_roles by admins via RPC
CREATE POLICY "Admins can update roles in their school"
  ON public.user_roles FOR UPDATE
  USING (user_belongs_to_school(auth.uid(), school_id));

CREATE POLICY "Admins can delete roles in their school"
  ON public.user_roles FOR DELETE
  USING (user_belongs_to_school(auth.uid(), school_id));
