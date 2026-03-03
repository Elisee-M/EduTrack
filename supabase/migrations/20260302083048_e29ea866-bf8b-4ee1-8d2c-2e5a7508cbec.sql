
CREATE OR REPLACE FUNCTION public.soft_delete_student(p_student_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE students SET is_deleted = true, updated_at = now()
  WHERE id = p_student_id
    AND user_belongs_to_school(auth.uid(), school_id);
END;
$$;
