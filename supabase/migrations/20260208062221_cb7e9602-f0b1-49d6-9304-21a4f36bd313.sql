DROP POLICY "Users can view their schools" ON public.schools;

CREATE POLICY "Users can view their schools" ON public.schools
  FOR SELECT USING (
    user_belongs_to_school(auth.uid(), id) OR auth.uid() = created_by
  );