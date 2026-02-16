-- Allow school members to view profiles of colleagues in the same school
CREATE POLICY "School members can view colleague profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur1
    JOIN public.user_roles ur2 ON ur1.school_id = ur2.school_id
    WHERE ur1.user_id = auth.uid()
    AND ur2.user_id = profiles.user_id
  )
);