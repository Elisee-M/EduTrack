import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Students = () => {
  const { school } = useSchool();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!school) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("students")
        .select("*, classes(name), trades(name)")
        .eq("school_id", school.id)
        .order("created_at", { ascending: false });
      setStudents(data ?? []);
      setLoading(false);
    };
    fetch();
  }, [school]);

  if (!school) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Students</h1>
        <Button asChild>
          <Link to="/dashboard/students/register"><UserPlus className="mr-2 h-4 w-4" />Register Student</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">Loading...</div>
          ) : students.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No students registered yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Reg. No</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Trade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.full_name}</TableCell>
                    <TableCell>{s.registration_number}</TableCell>
                    <TableCell>{(s.classes as any)?.name ?? "—"}</TableCell>
                    <TableCell>{(s.trades as any)?.name ?? "—"}</TableCell>
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

export default Students;
