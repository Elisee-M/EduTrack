
-- Function to auto-accept pending invitations when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_invitation_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
BEGIN
  -- Find pending invitations for this email
  FOR inv IN
    SELECT * FROM public.school_invitations
    WHERE email = NEW.email AND status = 'pending'
  LOOP
    -- Create user_role
    INSERT INTO public.user_roles (user_id, school_id, role)
    VALUES (NEW.id, inv.school_id, inv.role)
    ON CONFLICT DO NOTHING;
    
    -- Mark invitation as accepted
    UPDATE public.school_invitations
    SET status = 'accepted'
    WHERE id = inv.id;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger after user is created
CREATE TRIGGER on_user_created_check_invitations
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invitation_on_signup();
