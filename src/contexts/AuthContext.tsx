import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);
  const lastSessionRef = useRef<string | null>(null);

  const updateSession = useCallback((newSession: Session | null) => {
    const newToken = newSession?.access_token ?? null;
    // Only update state if the session actually changed to prevent re-render loops
    if (newToken !== lastSessionRef.current) {
      lastSessionRef.current = newToken;
      setSession(newSession);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Set up the auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!initialized.current) return;
      // On SIGNED_OUT, always clear; otherwise only update if token changed
      if (event === "SIGNED_OUT") {
        lastSessionRef.current = null;
        setSession(null);
        setLoading(false);
      } else {
        updateSession(newSession);
      }
    });

    // Then fetch the initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      initialized.current = true;
      lastSessionRef.current = initialSession?.access_token ?? null;
      setSession(initialSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [updateSession]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
