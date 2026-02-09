import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const categories = ["Late Coming", "Absenteeism", "Indiscipline", "Uniform Violation", "Property Damage", "Fighting", "Other"];

const Discipline = () => {
  const { school, userRole } = useSchool();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [records, setRecords] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ student_id: "", category: "", description: "", action_taken: "", mistake_date: new Date().toISOString().slice(0, 10) });
  const canEdit = userRole?.role !== "viewer";

  const fetchRecords = async () => {
    if (!school) return;
    const { data } = await supabase
      .from("discipline_records")
      .select("*, students(full_name)")
      .eq("school_id", school.id)
      .order("mistake_date", { ascending: false });
    setRecords(data ?? []);
  };

  useEffect(() => {
    if (!school) return;
    fetchRecords();
    supabase.from("students").select("id, full_name").eq("school_id", school.id).then(({ data }) => setStudents(data ?? []));
  }, [school]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !user) return;
    const { error } = await supabase.from("discipline_records").insert({
      school_id: school.id,
      student_id: form.student_id,
      category: form.category,
      description: form.description || null,
      action_taken: form.action_taken || null,
      mistake_date: form.mistake_date,
      recorded_by: user.id,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      setOpen(false);
      setForm({ student_id: "", category: "", description: "", action_taken: "", mistake_date: new Date().toISOString().slice(0, 10) });
      fetchRecords();
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
          <h1 className="text-2xl font-bold">Discipline Records</h1>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Record</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Discipline Record</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Student *</Label>
                  <Select value={form.student_id} onValueChange={(v) => setForm((p) => ({ ...p, student_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>
                      {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={form.mistake_date} onChange={(e) => setForm((p) => ({ ...p, mistake_date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Action Taken</Label>
                  <Input value={form.action_taken} onChange={(e) => setForm((p) => ({ ...p, action_taken: e.target.value }))} />
                </div>
                <Button type="submit" className="w-full">Save Record</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {records.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No discipline records yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{new Date(r.mistake_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{(r.students as any)?.full_name}</TableCell>
                    <TableCell>{r.category}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{r.description ?? "—"}</TableCell>
                    <TableCell>{r.action_taken ?? "—"}</TableCell>
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

export default Discipline;
