import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from "recharts";
import { TrendingUp, Award, BarChart3, PieChart as PieIcon } from "lucide-react";

const GRADE_COLORS = {
  "A+": "hsl(142, 76%, 36%)",
  "A": "hsl(142, 71%, 45%)",
  "B+": "hsl(198, 93%, 40%)",
  "B": "hsl(198, 80%, 50%)",
  "C+": "hsl(45, 93%, 47%)",
  "C": "hsl(38, 92%, 50%)",
  "D": "hsl(25, 95%, 53%)",
  "F": "hsl(0, 84%, 60%)",
};

function getLetterGrade(marks: number) {
  if (marks >= 90) return "A+";
  if (marks >= 80) return "A";
  if (marks >= 75) return "B+";
  if (marks >= 70) return "B";
  if (marks >= 65) return "C+";
  if (marks >= 60) return "C";
  if (marks >= 50) return "D";
  return "F";
}

const Analytics = () => {
  const { school } = useSchool();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("1");
  const [grades, setGrades] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch classes
  useEffect(() => {
    if (!school) return;
    supabase.from("classes").select("*").eq("school_id", school.id).then(({ data }) => {
      setClasses(data ?? []);
    });
  }, [school]);

  // Fetch data when class/term changes
  useEffect(() => {
    if (!school || !selectedClassId) return;
    setLoading(true);

    const now = new Date();
    const academicYear = `${now.getFullYear()}-${now.getFullYear() + 1}`;

    Promise.all([
      supabase.from("grades").select("*").eq("school_id", school.id).eq("academic_year", academicYear),
      supabase.from("subjects").select("*").eq("school_id", school.id),
      supabase.from("students").select("*").eq("school_id", school.id).eq("class_id", selectedClassId).eq("is_deleted", false),
    ]).then(([gradesRes, subjectsRes, studentsRes]) => {
      setGrades(gradesRes.data ?? []);
      setSubjects(subjectsRes.data ?? []);
      setStudents(studentsRes.data ?? []);
      setLoading(false);
    });
  }, [school, selectedClassId]);

  const termNum = parseInt(selectedTerm);
  const termGrades = useMemo(() => grades.filter(g => g.term === termNum), [grades, termNum]);
  const classStudentIds = useMemo(() => new Set(students.map(s => s.id)), [students]);
  const classGrades = useMemo(() => termGrades.filter(g => classStudentIds.has(g.student_id)), [termGrades, classStudentIds]);

  // Average marks per subject
  const avgPerSubject = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    classGrades.forEach(g => {
      if (!map[g.subject_id]) map[g.subject_id] = { total: 0, count: 0 };
      map[g.subject_id].total += Number(g.marks);
      map[g.subject_id].count += 1;
    });
    return subjects
      .filter(s => map[s.id])
      .map(s => ({
        name: s.abbreviation || s.name,
        average: Math.round((map[s.id].total / map[s.id].count) * 10) / 10,
      }))
      .sort((a, b) => b.average - a.average);
  }, [classGrades, subjects]);

  // Grade distribution
  const gradeDistribution = useMemo(() => {
    const dist: Record<string, number> = { "A+": 0, A: 0, "B+": 0, B: 0, "C+": 0, C: 0, D: 0, F: 0 };
    classGrades.forEach(g => {
      dist[getLetterGrade(Number(g.marks))]++;
    });
    return Object.entries(dist)
      .filter(([, v]) => v > 0)
      .map(([grade, count]) => ({ grade, count, fill: GRADE_COLORS[grade as keyof typeof GRADE_COLORS] }));
  }, [classGrades]);

  // Top performers
  const topPerformers = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    classGrades.forEach(g => {
      if (!map[g.student_id]) map[g.student_id] = { total: 0, count: 0 };
      map[g.student_id].total += Number(g.marks);
      map[g.student_id].count += 1;
    });
    return Object.entries(map)
      .map(([sid, { total, count }]) => {
        const student = students.find(s => s.id === sid);
        return { name: student?.full_name ?? "Unknown", average: Math.round((total / count) * 10) / 10, subjects: count };
      })
      .sort((a, b) => b.average - a.average)
      .slice(0, 10);
  }, [classGrades, students]);

  // Term-over-term trends (all 3 terms)
  const termTrends = useMemo(() => {
    const classGradesAll = grades.filter(g => classStudentIds.has(g.student_id));
    const subjectMap: Record<string, Record<number, { total: number; count: number }>> = {};
    classGradesAll.forEach(g => {
      const subj = subjects.find(s => s.id === g.subject_id);
      const name = subj?.abbreviation || subj?.name || g.subject_id;
      if (!subjectMap[name]) subjectMap[name] = {};
      if (!subjectMap[name][g.term]) subjectMap[name][g.term] = { total: 0, count: 0 };
      subjectMap[name][g.term].total += Number(g.marks);
      subjectMap[name][g.term].count += 1;
    });

    const terms = [1, 2, 3];
    return terms.map(t => {
      const point: Record<string, any> = { term: `Term ${t}` };
      Object.entries(subjectMap).forEach(([name, termData]) => {
        if (termData[t]) {
          point[name] = Math.round((termData[t].total / termData[t].count) * 10) / 10;
        }
      });
      return point;
    });
  }, [grades, classStudentIds, subjects]);

  const trendSubjects = useMemo(() => {
    const keys = new Set<string>();
    termTrends.forEach(t => Object.keys(t).filter(k => k !== "term").forEach(k => keys.add(k)));
    return Array.from(keys);
  }, [termTrends]);

  const LINE_COLORS = ["hsl(var(--primary))", "hsl(198, 93%, 40%)", "hsl(142, 76%, 36%)", "hsl(45, 93%, 47%)", "hsl(0, 84%, 60%)", "hsl(280, 67%, 50%)", "hsl(25, 95%, 53%)", "hsl(330, 80%, 50%)"];

  const selectedClassName = classes.find(c => c.id === selectedClassId)?.name ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Performance Analytics</h1>
        <p className="text-sm text-muted-foreground">Class performance insights and trends</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedTerm} onValueChange={setSelectedTerm}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Term 1</SelectItem>
            <SelectItem value="2">Term 2</SelectItem>
            <SelectItem value="3">Term 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!selectedClassId && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Select a class to view analytics</CardContent></Card>
      )}

      {selectedClassId && loading && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Loading analytics...</CardContent></Card>
      )}

      {selectedClassId && !loading && classGrades.length === 0 && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No marks data for {selectedClassName} in Term {selectedTerm}</CardContent></Card>
      )}

      {selectedClassId && !loading && classGrades.length > 0 && (
        <>
          {/* Summary stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Class Average</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(classGrades.reduce((s, g) => s + Number(g.marks), 0) / classGrades.length).toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Highest Mark</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.max(...classGrades.map(g => Number(g.marks)))}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Lowest Mark</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground rotate-180" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.min(...classGrades.map(g => Number(g.marks)))}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Students Graded</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{new Set(classGrades.map(g => g.student_id)).size}</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Average marks per subject */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Average Marks per Subject</CardTitle>
                <p className="text-sm text-muted-foreground">Performance across curriculum</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={avgPerSubject} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="avgFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                      formatter={(val: number) => [`${val}%`, "Average"]}
                    />
                    <Area type="monotone" dataKey="average" stroke="hsl(142, 76%, 36%)" strokeWidth={2.5} fill="url(#avgFill)" dot={{ r: 4, fill: "white", stroke: "hsl(142, 76%, 36%)", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Grade distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Grade Distribution</CardTitle>
                <p className="text-sm text-muted-foreground">Marks categorized by letter grade</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={gradeDistribution} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="grade" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                      formatter={(val: number) => [val, "Students"]}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {gradeDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Term-over-term trends */}
          {trendSubjects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Term-over-Term Trends</CardTitle>
                <p className="text-sm text-muted-foreground">Subject averages across terms</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={termTrends} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                    <defs>
                      {trendSubjects.map((subj, i) => (
                        <linearGradient key={subj} id={`trend-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={LINE_COLORS[i % LINE_COLORS.length]} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={LINE_COLORS[i % LINE_COLORS.length]} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="term" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                      formatter={(val: number) => [`${val}%`]}
                    />
                    <Legend />
                    {trendSubjects.map((subj, i) => (
                      <Area
                        key={subj}
                        type="monotone"
                        dataKey={subj}
                        stroke={LINE_COLORS[i % LINE_COLORS.length]}
                        strokeWidth={2.5}
                        fill={`url(#trend-${i})`}
                        dot={{ r: 4, fill: "white", stroke: LINE_COLORS[i % LINE_COLORS.length], strokeWidth: 2 }}
                        connectNulls
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Top performers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Top Performers — {selectedClassName}, Term {selectedTerm}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topPerformers.map((p, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.subjects} subject{p.subjects > 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{p.average}%</span>
                      <Badge variant="outline">{getLetterGrade(p.average)}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Analytics;
