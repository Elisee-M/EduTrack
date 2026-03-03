import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { GraduationCap, LogOut, School, Users, BookOpen, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SchoolRow {
  id: string;
  name: string;
  code: string;
  location: string | null;
  email: string | null;
  created_at: string;
  studentCount?: number;
  staffCount?: number;
}

const PlatformAdmin = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ schools: 0, students: 0, staff: 0 });
  const [selectedSchool, setSelectedSchool] = useState<SchoolRow | null>(null);
  const [schoolDetails, setSchoolDetails] = useState<{
    students: any[];
    staff: any[];
    classes: any[];
  } | null>(null);

  const fetchSchools = async () => {
    setLoading(true);
    const { data: schoolsData } = await supabase.from("schools").select("*").order("created_at", { ascending: false });

    if (schoolsData) {
      // Fetch counts for each school
      const enriched = await Promise.all(
        schoolsData.map(async (s) => {
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

  const viewSchoolDetails = async (school: SchoolRow) => {
    setSelectedSchool(school);
    const [studRes, staffRes, classRes] = await Promise.all([
      supabase.from("students").select("id, full_name, registration_number, status, gender").eq("school_id", school.id).limit(50),
      supabase.from("user_roles").select("id, role, user_id, profiles(full_name, email)").eq("school_id", school.id),
      supabase.from("classes").select("id, name, level, trades(name)").eq("school_id", school.id),
    ]);
    setSchoolDetails({
      students: studRes.data ?? [],
      staff: staffRes.data ?? [],
      classes: classRes.data ?? [],
    });
  };

  const handleDeleteSchool = async (schoolId: string) => {
    const { error } = await supabase.from("schools").delete().eq("id", schoolId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "School deleted" });
      setSelectedSchool(null);
      setSchoolDetails(null);
      fetchSchools();
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  if (selectedSchool && schoolDetails) {
    return (
      <div className="min-h-screen bg-background">
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-bold">Platform Admin</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </header>
        <main className="mx-auto max-w-6xl p-4 lg:p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => { setSelectedSchool(null); setSchoolDetails(null); }}>
              ← Back to all schools
            </Button>
            <h1 className="text-xl font-bold">{selectedSchool.name}</h1>
            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{selectedSchool.code}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Students</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{selectedSchool.studentCount}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Staff</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{selectedSchool.staffCount}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Classes</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{schoolDetails.classes.length}</div></CardContent>
            </Card>
          </div>

          {/* Staff */}
          <Card>
            <CardHeader><CardTitle className="text-base">Staff Members</CardTitle></CardHeader>
            <CardContent>
              {schoolDetails.staff.length === 0 ? (
                <p className="text-sm text-muted-foreground">No staff members.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {schoolDetails.staff.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell>{(s.profiles as any)?.full_name || "—"}</TableCell>
                        <TableCell>{(s.profiles as any)?.email || "—"}</TableCell>
                        <TableCell className="capitalize">{s.role?.replace("_", " ")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Classes */}
          <Card>
            <CardHeader><CardTitle className="text-base">Classes</CardTitle></CardHeader>
            <CardContent>
              {schoolDetails.classes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No classes.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Name</TableHead><TableHead>Level</TableHead><TableHead>Trade</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {schoolDetails.classes.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>{c.level || "—"}</TableCell>
                        <TableCell>{(c.trades as any)?.name || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Students */}
          <Card>
            <CardHeader><CardTitle className="text-base">Students (showing up to 50)</CardTitle></CardHeader>
            <CardContent>
              {schoolDetails.students.length === 0 ? (
                <p className="text-sm text-muted-foreground">No students.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Name</TableHead><TableHead>Reg No.</TableHead><TableHead>Gender</TableHead><TableHead>Status</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {schoolDetails.students.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.full_name}</TableCell>
                        <TableCell>{s.registration_number}</TableCell>
                        <TableCell>{s.gender || "—"}</TableCell>
                        <TableCell>{s.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <span className="font-bold">Platform Admin</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </header>

      <main className="mx-auto max-w-6xl p-4 lg:p-6 space-y-6">
        <h1 className="text-2xl font-bold">All Schools Overview</h1>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Schools</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.schools}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.students}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.staff}</div></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Schools</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : schools.length === 0 ? (
              <p className="text-sm text-muted-foreground">No schools registered yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-center">Students</TableHead>
                    <TableHead className="text-center">Staff</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schools.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.code}</TableCell>
                      <TableCell>{s.location || "—"}</TableCell>
                      <TableCell className="text-center">{s.studentCount}</TableCell>
                      <TableCell className="text-center">{s.staffCount}</TableCell>
                      <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => viewSchoolDetails(s)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {s.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this school and all its data. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteSchool(s.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PlatformAdmin;
