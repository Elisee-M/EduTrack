
-- Subjects table
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  abbreviation text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School members can view subjects" ON public.subjects FOR SELECT USING (user_belongs_to_school(auth.uid(), school_id));
CREATE POLICY "School members can insert subjects" ON public.subjects FOR INSERT WITH CHECK (user_belongs_to_school(auth.uid(), school_id));
CREATE POLICY "School members can update subjects" ON public.subjects FOR UPDATE USING (user_belongs_to_school(auth.uid(), school_id));
CREATE POLICY "School members can delete subjects" ON public.subjects FOR DELETE USING (user_belongs_to_school(auth.uid(), school_id));
CREATE POLICY "Platform admins can view all subjects" ON public.subjects FOR SELECT USING (is_platform_admin(auth.uid()));

-- Grades table
CREATE TABLE public.grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  term integer NOT NULL CHECK (term >= 1 AND term <= 3),
  academic_year text NOT NULL,
  marks numeric(5,2) NOT NULL CHECK (marks >= 0 AND marks <= 100),
  remarks text,
  recorded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, subject_id, term, academic_year)
);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School members can view grades" ON public.grades FOR SELECT USING (user_belongs_to_school(auth.uid(), school_id));
CREATE POLICY "School members can insert grades" ON public.grades FOR INSERT WITH CHECK (user_belongs_to_school(auth.uid(), school_id));
CREATE POLICY "School members can update grades" ON public.grades FOR UPDATE USING (user_belongs_to_school(auth.uid(), school_id));
CREATE POLICY "School members can delete grades" ON public.grades FOR DELETE USING (user_belongs_to_school(auth.uid(), school_id));
CREATE POLICY "Platform admins can view all grades" ON public.grades FOR SELECT USING (is_platform_admin(auth.uid()));
