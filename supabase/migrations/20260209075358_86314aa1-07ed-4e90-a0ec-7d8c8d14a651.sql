
-- Add abbreviation column to trades
ALTER TABLE public.trades ADD COLUMN abbreviation text;

-- Add level column to classes
ALTER TABLE public.classes ADD COLUMN level text;

-- Add trade_id to classes (a class is associated with a trade)
ALTER TABLE public.classes ADD COLUMN trade_id uuid REFERENCES public.trades(id);

-- Create a function to auto-generate student registration numbers
CREATE OR REPLACE FUNCTION public.generate_registration_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num integer;
  school_code text;
  reg_number text;
BEGIN
  -- Get the school code
  SELECT code INTO school_code FROM public.schools WHERE id = NEW.school_id;
  
  -- Count existing students in this school + 1
  SELECT COALESCE(MAX(
    CASE 
      WHEN registration_number ~ '[0-9]+$' 
      THEN CAST(substring(registration_number from '[0-9]+$') AS integer)
      ELSE 0
    END
  ), 0) + 1
  INTO next_num
  FROM public.students
  WHERE school_id = NEW.school_id;
  
  -- Generate: SCHOOLCODE-0001
  reg_number := school_code || '-' || LPAD(next_num::text, 4, '0');
  
  NEW.registration_number := reg_number;
  RETURN NEW;
END;
$$;

-- Create trigger for auto-generating registration numbers
CREATE TRIGGER auto_generate_registration_number
  BEFORE INSERT ON public.students
  FOR EACH ROW
  WHEN (NEW.registration_number IS NULL OR NEW.registration_number = '')
  EXECUTE FUNCTION public.generate_registration_number();
