import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil } from "lucide-react";

const Subjects = () => {
  const { school } = useSchool();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchSubjects = async () => {
    if (!school) return;
    setLoading(true);
    const { data } = await supabase
      .from("subjects")
      .select("*")
      .eq("school_id", school.id)
      .order("name");
    setSubjects(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchSubjects(); }, [school]);

  const handleSave = async () => {
    if (!school || !name.trim()) return;
    setSaving(true);

    if (editingId) {
      const { error } = await supabase.from("subjects").update({ name: name.trim(), abbreviation: abbreviation.trim() || null }).eq("id", editingId);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Subject updated" }); setEditingId(null); }
    } else {
      const { error } = await supabase.from("subjects").insert({ school_id: school.id, name: name.trim(), abbreviation: abbreviation.trim() || null });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Subject added" });
    }

    setName("");
    setAbbreviation("");
    setSaving(false);
    fetchSubjects();
  };

  const handleEdit = (s: any) => {
    setEditingId(s.id);
    setName(s.name);
    setAbbreviation(s.abbreviation || "");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Subject deleted" }); fetchSubjects(); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subjects</h1>
        <p className="text-sm text-muted-foreground">Manage subjects for your school</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{editingId ? "Edit Subject" : "Add Subject"}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mathematics" />
            </div>
            <div className="w-full sm:w-40 space-y-1">
              <Label>Abbreviation</Label>
              <Input value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} placeholder="e.g. MATH" />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleSave} disabled={saving || !name.trim()}>
                <Plus className="h-4 w-4 mr-1" />{editingId ? "Update" : "Add"}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={() => { setEditingId(null); setName(""); setAbbreviation(""); }}>Cancel</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">All Subjects ({subjects.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subjects added yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Abbreviation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.abbreviation || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(s)}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {s.name}?</AlertDialogTitle>
                              <AlertDialogDescription>This will also delete all grades for this subject.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(s.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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

export default Subjects;
