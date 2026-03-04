import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
  const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${(v ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const DataExport = () => {
  const { toast } = useToast();
  const [exporting, setExporting] = useState<string | null>(null);

  const exportSchools = async () => {
    setExporting("schools");
    const { data } = await supabase.from("schools").select("*");
    if (data) {
      downloadCSV("schools.csv", ["Name", "Code", "Location", "Email", "Phone", "Status", "Created"], data.map((s: any) => [s.name, s.code, s.location, s.email, s.phone, s.status, s.created_at]));
      toast({ title: "Schools exported" });
    }
    setExporting(null);
  };

  const exportStudents = async () => {
    setExporting("students");
    const { data } = await supabase.from("students").select("*, classes(name), trades(name), schools(name)").eq("is_deleted", false);
    if (data) {
      downloadCSV("students.csv",
        ["Name", "Reg No.", "Gender", "Status", "School", "Class", "Trade", "Parent", "Parent Phone", "Created"],
        data.map((s: any) => [s.full_name, s.registration_number, s.gender, s.status, (s.schools as any)?.name, (s.classes as any)?.name, (s.trades as any)?.name, s.parent_name, s.parent_phone, s.created_at])
      );
      toast({ title: "Students exported" });
    }
    setExporting(null);
  };

  const exportStaff = async () => {
    setExporting("staff");
    const { data } = await supabase.from("user_roles").select("role, profiles(full_name, email), schools(name)");
    if (data) {
      downloadCSV("staff.csv",
        ["Name", "Email", "Role", "School"],
        data.map((r: any) => [(r.profiles as any)?.full_name, (r.profiles as any)?.email, r.role, (r.schools as any)?.name])
      );
      toast({ title: "Staff exported" });
    }
    setExporting(null);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader><CardTitle className="text-base">Schools</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Export all schools with details.</p>
          <Button onClick={exportSchools} disabled={exporting === "schools"} className="w-full">
            <Download className="mr-2 h-4 w-4" /> {exporting === "schools" ? "Exporting..." : "Export CSV"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Students</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Export all students across schools.</p>
          <Button onClick={exportStudents} disabled={exporting === "students"} className="w-full">
            <Download className="mr-2 h-4 w-4" /> {exporting === "students" ? "Exporting..." : "Export CSV"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Staff</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Export all staff members and roles.</p>
          <Button onClick={exportStaff} disabled={exporting === "staff"} className="w-full">
            <Download className="mr-2 h-4 w-4" /> {exporting === "staff" ? "Exporting..." : "Export CSV"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataExport;
