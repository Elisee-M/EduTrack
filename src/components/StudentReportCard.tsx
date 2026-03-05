import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const getLetterGrade = (marks: number): { grade: string; color: string } => {
  if (marks >= 90) return { grade: "A+", color: "text-green-600" };
  if (marks >= 80) return { grade: "A", color: "text-green-600" };
  if (marks >= 70) return { grade: "B", color: "text-blue-600" };
  if (marks >= 60) return { grade: "C", color: "text-yellow-600" };
  if (marks >= 50) return { grade: "D", color: "text-orange-600" };
  return { grade: "F", color: "text-destructive" };
};

interface Props {
  studentId: string;
  schoolId: string;
}

const StudentReportCard = ({ studentId, schoolId }: Props) => {
  const [grades, setGrades] = useState<any[]>([]);
  const [academicYear, setAcademicYear] = useState("");
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchYears = async () => {
      const { data } = await supabase
        .from("grades")
        .select("academic_year")
        .eq("student_id", studentId)
        .eq("school_id", schoolId);
      const years = [...new Set((data ?? []).map((g: any) => g.academic_year))].sort().reverse();
      setAvailableYears(years);
      if (years.length > 0) setAcademicYear(years[0]);
      setLoading(false);
    };
    fetchYears();
  }, [studentId, schoolId]);

  useEffect(() => {
    if (!academicYear) return;
    const fetchGrades = async () => {
      const { data } = await supabase
        .from("grades")
        .select("*, subjects(name, abbreviation)")
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .eq("academic_year", academicYear)
        .order("term");
      setGrades(data ?? []);
    };
    fetchGrades();
  }, [academicYear, studentId, schoolId]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading report card...</p>;

  if (availableYears.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No grades recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  // Group by subject, show terms as columns
  const subjectMap: Record<string, { name: string; terms: Record<number, number> }> = {};
  grades.forEach((g: any) => {
    const subjectName = (g.subjects as any)?.name || "Unknown";
    if (!subjectMap[g.subject_id]) {
      subjectMap[g.subject_id] = { name: subjectName, terms: {} };
    }
    subjectMap[g.subject_id].terms[g.term] = g.marks;
  });

  const subjectList = Object.values(subjectMap);
  const overallAvg = grades.length > 0 ? grades.reduce((a, g) => a + Number(g.marks), 0) / grades.length : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Label>Academic Year</Label>
        <Select value={academicYear} onValueChange={setAcademicYear}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {availableYears.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Report Card — {academicYear}</CardTitle>
          <Badge variant="outline" className={getLetterGrade(overallAvg).color}>
            Avg: {overallAvg.toFixed(1)} ({getLetterGrade(overallAvg).grade})
          </Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">Term 1</TableHead>
                <TableHead className="text-center">Term 2</TableHead>
                <TableHead className="text-center">Term 3</TableHead>
                <TableHead className="text-center">Average</TableHead>
                <TableHead className="text-center">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjectList.map((s, i) => {
                const termMarks = [1, 2, 3].map((t) => s.terms[t]);
                const filled = termMarks.filter((m) => m !== undefined) as number[];
                const avg = filled.length > 0 ? filled.reduce((a, b) => a + b, 0) / filled.length : null;
                const gradeInfo = avg !== null ? getLetterGrade(avg) : null;

                return (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    {[1, 2, 3].map((t) => (
                      <TableCell key={t} className="text-center">
                        {s.terms[t] !== undefined ? (
                          <span className={getLetterGrade(s.terms[t]).color}>{s.terms[t]}</span>
                        ) : "—"}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-medium">
                      {avg !== null ? avg.toFixed(1) : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {gradeInfo ? <Badge variant="outline" className={gradeInfo.color}>{gradeInfo.grade}</Badge> : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentReportCard;
