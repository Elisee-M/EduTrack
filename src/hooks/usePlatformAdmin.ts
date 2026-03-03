import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const usePlatformAdmin = () => {
  const { user } = useAuth();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (!user) {
        setIsPlatformAdmin(false);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("platform_admins")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      setIsPlatformAdmin(!!data);
      setLoading(false);
    };
    check();
  }, [user?.id]);

  return { isPlatformAdmin, loading };
};
