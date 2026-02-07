import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface School {
  id: string;
  name: string;
  code: string;
  location: string | null;
  phone: string | null;
  email: string | null;
  academic_year_start: string | null;
  academic_year_end: string | null;
}

interface UserRole {
  role: "super_admin" | "admin" | "teacher" | "viewer";
  school_id: string;
}

interface SchoolContextType {
  school: School | null;
  userRole: UserRole | null;
  loading: boolean;
  refreshSchool: () => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType>({
  school: null,
  userRole: null,
  loading: true,
  refreshSchool: async () => {},
});

export const useSchool = () => useContext(SchoolContext);

export const SchoolProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSchoolData = async () => {
    if (!user) {
      setSchool(null);
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role, school_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (roleData) {
        setUserRole(roleData as UserRole);
        const { data: schoolData } = await supabase
          .from("schools")
          .select("*")
          .eq("id", roleData.school_id)
          .maybeSingle();
        setSchool(schoolData);
      } else {
        setUserRole(null);
        setSchool(null);
      }
    } catch (error) {
      console.error("Error fetching school data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchoolData();
  }, [user]);

  return (
    <SchoolContext.Provider value={{ school, userRole, loading, refreshSchool: fetchSchoolData }}>
      {children}
    </SchoolContext.Provider>
  );
};
