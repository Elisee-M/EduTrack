
-- Add status to schools
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Announcements table
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  target_type text NOT NULL DEFAULT 'all', -- 'all' or 'specific'
  target_school_ids uuid[] DEFAULT '{}',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage announcements" ON public.announcements
  FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "School members can view their announcements" ON public.announcements
  FOR SELECT TO authenticated
  USING (
    target_type = 'all' 
    OR get_user_school_id(auth.uid()) = ANY(target_school_ids)
  );

-- Audit logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb DEFAULT '{}',
  school_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can view all audit logs" ON public.audit_logs
  FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "School members can view their audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (user_belongs_to_school(auth.uid(), school_id));
