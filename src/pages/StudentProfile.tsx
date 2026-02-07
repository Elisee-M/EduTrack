import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const StudentProfile = () => {
  const { id } = useParams();
  const { school } = useSchool();
  const [student, setStudent] = useState<any>(null);
  const [discipline, setDiscipline] = useState<any[]>([]);

  useEffect(() => {
    if (!school || !id) return;
    const fetch = async () => {
      const { data: s } = await supabase
        .from("students")
        .select("*, classes(name), trades(name)")
        .eq("id", id)
        .eq("school_id", school.id)
        .maybeSingle();
      setStudent(s);

      const { data: d } = await supabase
        .from("discipline_records")
        .select("*")
        .eq("student_id", id)
        .eq("school_id", school.id)
        .order("mistake_date", { ascending: false });
      setDiscipline(d ?? []);
    };
    fetch();
  }, [id, school]);

  if (!student) return <div className="p-6 text-muted-foreground">Loading...</div>;

  const info = [
    ["Registration No.", student.registration_number],
    ["Class", (student.classes as any)?.name ?? "—"],
    ["Trade", (student.trades as any)?.name ?? "—"],
    ["Academic Year", student.academic_year ?? "—"],
    ["Date of Birth", student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : "—"],
    ["Gender", student.gender ?? "—"],
    ["Admission Date", student.admission_date ? new Date(student.admission_date).toLocaleDateString() : "—"],
    ["Home Location", student.home_location ?? "—"],
  ];

  const parentInfo = [
    ["Parent/Guardian", student.parent_name ?? "—"],
    ["Parent Phone", student.parent_phone ?? "—"],
    ["Guardian Name", student.guardian_name ?? "—"],
    ["Guardian Phone", student.guardian_phone ?? "—"],
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{student.full_name}</h1>
        <Badge variant={student.status === "Active" ? "default" : "secondary"}>{student.status}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {info.map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Parent / Guardian Details</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {parentInfo.map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Discipline Records</CardTitle></CardHeader>
        <CardContent>
          {discipline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No discipline records.</p>
          ) : (
            <div className="space-y-3">
              {discipline.map((d) => (
                <div key={d.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{d.category}</p>
                      <p className="text-xs text-muted-foreground">{d.description}</p>
                      {d.action_taken && <p className="mt-1 text-xs text-muted-foreground">Action: {d.action_taken}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(d.mistake_date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentProfile;
