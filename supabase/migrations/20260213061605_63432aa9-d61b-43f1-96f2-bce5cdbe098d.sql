
-- Add record_type to discipline_records (positive for awards, negative for discipline issues)
ALTER TABLE public.discipline_records ADD COLUMN record_type text NOT NULL DEFAULT 'negative';

-- Add responsibility column to students
ALTER TABLE public.students ADD COLUMN responsibility text DEFAULT NULL;
