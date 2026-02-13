import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Pencil, Trash2, Award, AlertTriangle } from "lucide-react";

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { school } = useSchool();
  const { toast } = useToast();
  const [student, setStudent] = useState<any>(null);
  const [discipline, setDiscipline] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [classes, setClasses] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchStudent = async () => {
    if (!school || !id) return;
    const { data: s } = await supabase
      .from("students")
      .select("*, classes(name), trades(name)")
      .eq("id", id)
      .eq("school_id", school.id)
      .maybeSingle();
    setStudent(s);
    if (s) setForm(s);

    const { data: d } = await supabase
      .from("discipline_records")
      .select("*")
      .eq("student_id", id)
      .eq("school_id", school.id)
      .order("mistake_date", { ascending: false });
    setDiscipline(d ?? []);
  };

  useEffect(() => {
    if (!school) return;
    fetchStudent();
    Promise.all([
      supabase.from("classes").select("*").eq("school_id", school.id),
      supabase.from("trades").select("*").eq("school_id", school.id),
    ]).then(([c, t]) => {
      setClasses(c.data ?? []);
      setTrades(t.data ?? []);
    });
  }, [id, school]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    const { error } = await supabase.from("students").update({
      full_name: form.full_name,
      class_id: form.class_id || null,
      trade_id: form.trade_id || null,
      academic_year: form.academic_year || null,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      parent_name: form.parent_name || null,
      parent_phone: form.parent_phone || null,
      guardian_name: form.guardian_name || null,
      guardian_phone: form.guardian_phone || null,
      home_location: form.home_location || null,
      admission_date: form.admission_date || null,
      status: form.status,
      responsibility: form.responsibility || null,
    }).eq("id", id);
    setSaving(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Student updated successfully" });
      setEditing(false);
      fetchStudent();
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const { error } = await supabase.from("students").update({ is_deleted: true }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Student deleted" });
      navigate("/dashboard/students");
    }
  };

  const handleChange = (field: string, value: string) => setForm((p: any) => ({ ...p, [field]: value }));

  if (!student) return <div className="p-6 text-muted-foreground">Loading...</div>;

  const responsibilities = ["Head Boy", "Head Girl", "Academic Prefect", "Discipline Prefect", "Sports Captain", "Class Monitor", "Library Prefect", "Health Prefect", "Environment Prefect"];

  const info = [
    ["Registration No.", student.registration_number],
    ["Class", (student.classes as any)?.name ?? "—"],
    ["Trade", (student.trades as any)?.name ?? "—"],
    ["Academic Year", student.academic_year ?? "—"],
    ["Date of Birth", student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : "—"],
    ["Gender", student.gender ?? "—"],
    ["Admission Date", student.admission_date ? new Date(student.admission_date).toLocaleDateString() : "—"],
    ["Responsibility", student.responsibility ?? "—"],
    ["Home Location", student.home_location ?? "—"],
  ];

  const parentInfo = [
    ["Father's Name", student.parent_name ?? "—"],
    ["Father's Phone", student.parent_phone ?? "—"],
    ["Mother's Name", student.guardian_name ?? "—"],
    ["Mother's Phone", student.guardian_phone ?? "—"],
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold">{student.full_name}</h1>
          <Badge variant={student.status === "Active" ? "default" : "secondary"}>{student.status}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
            <Pencil className="h-4 w-4 mr-1" />{editing ? "Cancel" : "Edit"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Student</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {student.full_name}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {editing ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Edit Student</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={form.full_name} onChange={(e) => handleChange("full_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={form.class_id || ""} onValueChange={(v) => handleChange("class_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trade</Label>
                <Select value={form.trade_id || ""} onValueChange={(v) => handleChange("trade_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select trade" /></SelectTrigger>
                  <SelectContent>
                    {trades.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input value={form.academic_year || ""} onChange={(e) => handleChange("academic_year", e.target.value)} placeholder="e.g. 2025-2026" />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={form.date_of_birth || ""} onChange={(e) => handleChange("date_of_birth", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={form.gender || ""} onValueChange={(v) => handleChange("gender", v)}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                    <SelectItem value="Graduated">Graduated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Admission Date</Label>
                <Input type="date" value={form.admission_date || ""} onChange={(e) => handleChange("admission_date", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Responsibility</Label>
                <Select value={form.responsibility || ""} onValueChange={(v) => handleChange("responsibility", v)}>
                  <SelectTrigger><SelectValue placeholder="Select responsibility" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {responsibilities.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <h3 className="text-lg font-semibold pt-4 pb-2">Parent / Guardian Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Father's Name</Label>
                <Input value={form.parent_name || ""} onChange={(e) => handleChange("parent_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Father's Phone</Label>
                <Input value={form.parent_phone || ""} onChange={(e) => handleChange("parent_phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Mother's Name</Label>
                <Input value={form.guardian_name || ""} onChange={(e) => handleChange("guardian_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Mother's Phone</Label>
                <Input value={form.guardian_phone || ""} onChange={(e) => handleChange("guardian_phone", e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Home Location</Label>
                <Input value={form.home_location || ""} onChange={(e) => handleChange("home_location", e.target.value)} />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => { setEditing(false); setForm(student); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
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
      )}

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
                    <div className="flex items-start gap-2">
                      {(d.record_type || "negative") === "positive" ? (
                        <Award className="h-4 w-4 text-primary mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{d.category}</p>
                          <Badge variant={(d.record_type || "negative") === "positive" ? "default" : "destructive"} className="text-xs">
                            {(d.record_type || "negative") === "positive" ? "Award" : "Discipline"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{d.description}</p>
                        {d.action_taken && <p className="mt-1 text-xs text-muted-foreground">Details: {d.action_taken}</p>}
                      </div>
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
