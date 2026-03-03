import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, ArrowLeft, Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const Students = () => {
  const { school, userRole } = useSchool();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const isAdmin = userRole?.role === "super_admin" || userRole?.role === "admin";

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

  const handleExport = async () => {
    if (!school) return;
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from("students")
        .select("full_name, registration_number, gender, status, responsibility, academic_year, date_of_birth, admission_date, parent_name, parent_phone, guardian_name, guardian_phone, home_location, classes(name), trades(name)")
        .eq("school_id", school.id)
        .eq("is_deleted", false)
        .order("full_name");

      if (error) throw error;

      const headers = ["Name", "Reg. No", "Gender", "Status", "Responsibility", "Academic Year", "Date of Birth", "Admission Date", "Parent Name", "Parent Phone", "Guardian Name", "Guardian Phone", "Home Location", "Class", "Trade"];

      const rows = (data ?? []).map((s: any) => [
        s.full_name,
        s.registration_number,
        s.gender ?? "",
        s.status,
        s.responsibility ?? "",
        s.academic_year ?? "",
        s.date_of_birth ?? "",
        s.admission_date ?? "",
        s.parent_name ?? "",
        s.parent_phone ?? "",
        s.guardian_name ?? "",
        s.guardian_phone ?? "",
        s.home_location ?? "",
        s.classes?.name ?? "",
        s.trades?.name ?? "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map((cell: string) => `"${cell.replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${school.name.replace(/\s+/g, "_")}_Students_Report.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({ title: "Report downloaded", description: `${rows.length} students exported.` });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  if (!school) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Students</h1>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={handleExport} disabled={exporting || students.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              {exporting ? "Exporting..." : "Download Report"}
            </Button>
          )}
          <Button asChild>
            <Link to="/dashboard/students/register"><UserPlus className="mr-2 h-4 w-4" />Register Student</Link>
          </Button>
        </div>
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
                  <TableHead>Responsibility</TableHead>
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
                      {s.responsibility ? (
                        <Badge className="bg-green-600 text-white hover:bg-green-700 text-xs">{s.responsibility}</Badge>
                      ) : "—"}
                    </TableCell>
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
