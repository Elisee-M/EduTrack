import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

const getLetterGrade = (marks: number): { grade: string; color: string } => {
  if (marks >= 90) return { grade: "A+", color: "text-green-600" };
  if (marks >= 80) return { grade: "A", color: "text-green-600" };
  if (marks >= 70) return { grade: "B", color: "text-blue-600" };
  if (marks >= 60) return { grade: "C", color: "text-yellow-600" };
  if (marks >= 50) return { grade: "D", color: "text-orange-600" };
  return { grade: "F", color: "text-destructive" };
};

const GradeEntry = () => {
  const { school } = useSchool();
  const { user } = useAuth();
  const { toast } = useToast();

  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [existingGrades, setExistingGrades] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!school) return;
    Promise.all([
      supabase.from("classes").select("id, name, level").eq("school_id", school.id).order("name"),
      supabase.from("subjects").select("id, name, abbreviation").eq("school_id", school.id).order("name"),
    ]).then(([c, s]) => {
      setClasses(c.data ?? []);
      setSubjects(s.data ?? []);
    });
    // Default academic year
    const now = new Date();
    setAcademicYear(`${now.getFullYear()}-${now.getFullYear() + 1}`);
  }, [school]);

  const loadStudentsAndGrades = async () => {
    if (!school || !selectedClassId || !selectedSubjectId || !selectedTerm || !academicYear) return;
    setLoading(true);

    const [studRes, gradeRes] = await Promise.all([
      supabase.from("students").select("id, full_name, registration_number")
        .eq("school_id", school.id).eq("class_id", selectedClassId).eq("is_deleted", false).order("full_name"),
      supabase.from("grades").select("*")
        .eq("school_id", school.id).eq("subject_id", selectedSubjectId)
        .eq("term", parseInt(selectedTerm)).eq("academic_year", academicYear),
    ]);

    const studentList = studRes.data ?? [];
    setStudents(studentList);

    const gradeMap: Record<string, any> = {};
    const marksMap: Record<string, string> = {};
    (gradeRes.data ?? []).forEach((g: any) => {
      gradeMap[g.student_id] = g;
      marksMap[g.student_id] = String(g.marks);
    });
    setExistingGrades(gradeMap);
    setMarks(marksMap);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedClassId && selectedSubjectId && selectedTerm && academicYear) {
      loadStudentsAndGrades();
    }
  }, [selectedClassId, selectedSubjectId, selectedTerm, academicYear]);

  const handleSave = async () => {
    if (!school || !user) return;
    setSaving(true);

    const upserts: any[] = [];
    for (const student of students) {
      const val = marks[student.id];
      if (val === undefined || val === "") continue;
      const numVal = parseFloat(val);
      if (isNaN(numVal) || numVal < 0 || numVal > 100) continue;

      const existing = existingGrades[student.id];
      if (existing) {
        upserts.push({ id: existing.id, school_id: school.id, student_id: student.id, subject_id: selectedSubjectId, term: parseInt(selectedTerm), academic_year: academicYear, marks: numVal, recorded_by: user.id });
      } else {
        upserts.push({ school_id: school.id, student_id: student.id, subject_id: selectedSubjectId, term: parseInt(selectedTerm), academic_year: academicYear, marks: numVal, recorded_by: user.id });
      }
    }

    if (upserts.length === 0) {
      toast({ title: "No marks to save" });
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("grades").upsert(upserts, { onConflict: "student_id,subject_id,term,academic_year" });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Saved ${upserts.length} grade(s)` });
      loadStudentsAndGrades();
    }
    setSaving(false);
  };

  const filtersReady = selectedClassId && selectedSubjectId && selectedTerm && academicYear;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Grade Entry</h1>
        <p className="text-sm text-muted-foreground">Enter marks per class and subject</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Select Class & Subject</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label>Class *</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Subject *</Label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Term *</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Term 1</SelectItem>
                  <SelectItem value="2">Term 2</SelectItem>
                  <SelectItem value="3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Academic Year *</Label>
              <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="e.g. 2025-2026" />
            </div>
          </div>
        </CardContent>
      </Card>

      {filtersReady && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Students ({students.length})</CardTitle>
            <Button onClick={handleSave} disabled={saving || students.length === 0}>
              <Save className="h-4 w-4 mr-1" />{saving ? "Saving..." : "Save All"}
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : students.length === 0 ? (
              <p className="text-sm text-muted-foreground">No students in this class.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Reg No.</TableHead>
                    <TableHead className="w-28">Marks (0-100)</TableHead>
                    <TableHead className="w-20">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s, i) => {
                    const val = marks[s.id] ?? "";
                    const numVal = parseFloat(val);
                    const gradeInfo = !isNaN(numVal) && numVal >= 0 && numVal <= 100 ? getLetterGrade(numVal) : null;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{s.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{s.registration_number}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={val}
                            onChange={(e) => setMarks((p) => ({ ...p, [s.id]: e.target.value }))}
                            className="w-24 h-8"
                          />
                        </TableCell>
                        <TableCell>
                          {gradeInfo ? (
                            <Badge variant="outline" className={gradeInfo.color}>{gradeInfo.grade}</Badge>
                          ) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GradeEntry;
