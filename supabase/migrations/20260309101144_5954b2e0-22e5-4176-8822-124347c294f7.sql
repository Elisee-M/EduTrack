
CREATE TABLE public.class_subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(class_id, subject_id)
);

ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School members can view class_subjects"
  ON public.class_subjects FOR SELECT TO authenticated
  USING (user_belongs_to_school(auth.uid(), school_id));

CREATE POLICY "School members can insert class_subjects"
  ON public.class_subjects FOR INSERT TO authenticated
  WITH CHECK (user_belongs_to_school(auth.uid(), school_id));

CREATE POLICY "School members can delete class_subjects"
  ON public.class_subjects FOR DELETE TO authenticated
  USING (user_belongs_to_school(auth.uid(), school_id));

CREATE POLICY "Platform admins can view all class_subjects"
  ON public.class_subjects FOR SELECT TO authenticated
  USING (is_platform_admin(auth.uid()));
