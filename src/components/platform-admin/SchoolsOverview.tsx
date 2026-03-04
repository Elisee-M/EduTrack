import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Badge } from "@/components/ui/badge";
import { School, Users, BookOpen, Trash2, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface Props {
  schools: SchoolRow[];
  loading: boolean;
  stats: { schools: number; students: number; staff: number };
  onRefresh: () => void;
}

const SchoolsOverview = ({ schools, loading, stats, onRefresh }: Props) => {
  const { toast } = useToast();
  const [selectedSchool, setSelectedSchool] = useState<SchoolRow | null>(null);
  const [schoolDetails, setSchoolDetails] = useState<{
    students: any[];
    staff: any[];
    classes: any[];
  } | null>(null);

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
      onRefresh();
    }
  };

  const handleToggleStatus = async (school: SchoolRow) => {
    const newStatus = school.status === "active" ? "suspended" : "active";
    const { error } = await supabase.from("schools").update({ status: newStatus } as any).eq("id", school.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `School ${newStatus}` });
      onRefresh();
    }
  };

  if (selectedSchool && schoolDetails) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => { setSelectedSchool(null); setSchoolDetails(null); }}>
            ← Back
          </Button>
          <h2 className="text-xl font-bold">{selectedSchool.name}</h2>
          <Badge variant={selectedSchool.status === "active" ? "default" : "destructive"}>
            {selectedSchool.status}
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Students</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{selectedSchool.studentCount}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Staff</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{selectedSchool.staffCount}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Classes</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{schoolDetails.classes.length}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Staff Members</CardTitle></CardHeader>
          <CardContent>
            {schoolDetails.staff.length === 0 ? <p className="text-sm text-muted-foreground">No staff members.</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead></TableRow></TableHeader>
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

        <Card>
          <CardHeader><CardTitle className="text-base">Classes</CardTitle></CardHeader>
          <CardContent>
            {schoolDetails.classes.length === 0 ? <p className="text-sm text-muted-foreground">No classes.</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Level</TableHead><TableHead>Trade</TableHead></TableRow></TableHeader>
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

        <Card>
          <CardHeader><CardTitle className="text-base">Students (up to 50)</CardTitle></CardHeader>
          <CardContent>
            {schoolDetails.students.length === 0 ? <p className="text-sm text-muted-foreground">No students.</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Reg No.</TableHead><TableHead>Gender</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : schools.length === 0 ? <p className="text-sm text-muted-foreground">No schools registered yet.</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
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
                    <TableCell>
                      <Badge variant={s.status === "active" ? "default" : "destructive"} className="text-xs">
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{s.location || "—"}</TableCell>
                    <TableCell className="text-center">{s.studentCount}</TableCell>
                    <TableCell className="text-center">{s.staffCount}</TableCell>
                    <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => viewSchoolDetails(s)} title="View details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(s)} title={s.status === "active" ? "Suspend" : "Activate"}>
                          {s.status === "active" ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
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
                              <AlertDialogDescription>This will permanently delete this school and all its data.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSchool(s.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
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
    </div>
  );
};

export default SchoolsOverview;
