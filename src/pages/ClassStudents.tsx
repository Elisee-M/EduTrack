import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ClassStudents = () => {
  const { classId } = useParams();
  const { school } = useSchool();
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!school || !classId) return;
    const fetch = async () => {
      const [studentsRes, classRes] = await Promise.all([
        supabase.from("students").select("*, trades(name)").eq("school_id", school.id).eq("class_id", classId).order("full_name"),
        supabase.from("classes").select("name").eq("id", classId).maybeSingle(),
      ]);
      setStudents(studentsRes.data ?? []);
      setClassName(classRes.data?.name ?? "");
      setLoading(false);
    };
    fetch();
  }, [school, classId]);

  if (!school) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{className || "Class"} Students</h1>
        </div>
        <Button asChild>
          <Link to="/dashboard/students/register"><UserPlus className="mr-2 h-4 w-4" />Register Student</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">Loading...</div>
          ) : students.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No students in this class yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Reg. No</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.full_name}</TableCell>
                    <TableCell>{s.registration_number}</TableCell>
                    <TableCell>{s.gender ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "Active" ? "default" : "secondary"}>{s.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/dashboard/students/${s.id}`}>View</Link>
                      </Button>
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

export default ClassStudents;
