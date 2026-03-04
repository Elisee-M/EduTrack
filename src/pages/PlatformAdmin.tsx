import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { School, Users, Megaphone, FileDown, Activity } from "lucide-react";
import PlatformAdminHeader from "@/components/platform-admin/PlatformAdminHeader";
import SchoolsOverview from "@/components/platform-admin/SchoolsOverview";
import GlobalUsers from "@/components/platform-admin/GlobalUsers";
import Announcements from "@/components/platform-admin/Announcements";
import AuditLogs from "@/components/platform-admin/AuditLogs";
import DataExport from "@/components/platform-admin/DataExport";

interface SchoolRow {
  id: string;
  name: string;
  code: string;
  location: string | null;
  email: string | null;
  status: string;
  created_at: string;
  studentCount?: number;
  staffCount?: number;
}

const PlatformAdmin = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ schools: 0, students: 0, staff: 0 });

  const fetchSchools = async () => {
    setLoading(true);
    const { data: schoolsData } = await supabase.from("schools").select("*").order("created_at", { ascending: false });

    if (schoolsData) {
      const enriched = await Promise.all(
        schoolsData.map(async (s: any) => {
          const [studRes, staffRes] = await Promise.all([
            supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", s.id),
            supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("school_id", s.id),
          ]);
          return { ...s, studentCount: studRes.count ?? 0, staffCount: staffRes.count ?? 0 };
        })
      );
      setSchools(enriched);
      setStats({
        schools: enriched.length,
        students: enriched.reduce((a, s) => a + (s.studentCount ?? 0), 0),
        staff: enriched.reduce((a, s) => a + (s.staffCount ?? 0), 0),
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchSchools(); }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <PlatformAdminHeader onSignOut={handleSignOut} />
      <main className="mx-auto max-w-6xl p-4 lg:p-6">
        <h1 className="text-2xl font-bold mb-6">Platform Administration</h1>
        <Tabs defaultValue="schools" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="schools" className="gap-2"><School className="h-4 w-4" /><span className="hidden sm:inline">Schools</span></TabsTrigger>
            <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" /><span className="hidden sm:inline">Users</span></TabsTrigger>
            <TabsTrigger value="announcements" className="gap-2"><Megaphone className="h-4 w-4" /><span className="hidden sm:inline">Announce</span></TabsTrigger>
            <TabsTrigger value="logs" className="gap-2"><Activity className="h-4 w-4" /><span className="hidden sm:inline">Logs</span></TabsTrigger>
            <TabsTrigger value="export" className="gap-2"><FileDown className="h-4 w-4" /><span className="hidden sm:inline">Export</span></TabsTrigger>
          </TabsList>
          <TabsContent value="schools">
            <SchoolsOverview schools={schools} loading={loading} stats={stats} onRefresh={fetchSchools} />
          </TabsContent>
          <TabsContent value="users"><GlobalUsers /></TabsContent>
          <TabsContent value="announcements"><Announcements /></TabsContent>
          <TabsContent value="logs"><AuditLogs /></TabsContent>
          <TabsContent value="export"><DataExport /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PlatformAdmin;
