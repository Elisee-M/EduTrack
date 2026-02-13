import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, AlertTriangle, UserPlus, Search, Shield } from "lucide-react";

const Dashboard = () => {
  const { school } = useSchool();
  const [stats, setStats] = useState({ students: 0, classes: 0, disciplines: 0 });
  const [recentDiscipline, setRecentDiscipline] = useState<any[]>([]);

  useEffect(() => {
    if (!school) return;
    const fetchStats = async () => {
      const [studentsRes, classesRes, discRes, recentRes] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", school.id),
        supabase.from("classes").select("id", { count: "exact", head: true }).eq("school_id", school.id),
        supabase.from("discipline_records").select("id", { count: "exact", head: true }).eq("school_id", school.id),
        supabase.from("discipline_records").select("*, students(full_name)").eq("school_id", school.id).order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({
        students: studentsRes.count ?? 0,
        classes: classesRes.count ?? 0,
        disciplines: discRes.count ?? 0,
      });
      setRecentDiscipline(recentRes.data ?? []);
    };
    fetchStats();
  }, [school]);

  if (!school) return null;

  const academicYear = school.academic_year_start && school.academic_year_end
    ? `${new Date(school.academic_year_start).getFullYear()} - ${new Date(school.academic_year_end).getFullYear()}`
    : "Not set";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{school.name}</h1>
        <p className="text-sm text-muted-foreground">Academic Year: {academicYear}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.students}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.classes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Discipline Records</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.disciplines}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/dashboard/students/register"><UserPlus className="mr-2 h-4 w-4" />Register Student</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/dashboard/students"><Users className="mr-2 h-4 w-4" />View All Students</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/dashboard/search"><Search className="mr-2 h-4 w-4" />Search Student</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/dashboard/classes"><BookOpen className="mr-2 h-4 w-4" />View Classes</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/dashboard/team"><Shield className="mr-2 h-4 w-4" />Manage Team</Link>
        </Button>
      </div>

      {/* Recent Discipline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Discipline Records</CardTitle>
        </CardHeader>
        <CardContent>
          {recentDiscipline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No discipline records yet.</p>
          ) : (
            <div className="space-y-3">
              {recentDiscipline.map((d) => (
                <div key={d.id} className="flex items-start justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">{(d.students as any)?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{d.category} — {d.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(d.mistake_date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
