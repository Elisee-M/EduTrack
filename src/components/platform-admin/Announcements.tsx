import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface SchoolOption {
  id: string;
  name: string;
}

const Announcements = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<"all" | "selected">("all");
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: annData }, { data: schoolData }] = await Promise.all([
      supabase.from("announcements").select("*").order("created_at", { ascending: false }),
      supabase.from("schools").select("id, name").eq("status", "active").order("name"),
    ]);
    setAnnouncements(annData ?? []);
    setSchools(schoolData ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleSchool = (id: string) => {
    setSelectedSchoolIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!title.trim() || !message.trim()) return;
    if (targetType === "selected" && selectedSchoolIds.length === 0) {
      toast({ title: "Select at least one school", variant: "destructive" });
      return;
    }

    const payload: any = {
      title: title.trim(),
      message: message.trim(),
      target_type: targetType,
      created_by: user!.id,
      ...(targetType === "selected" ? { target_school_ids: selectedSchoolIds } : { target_school_ids: [] }),
    };

    const { error } = await supabase.from("announcements").insert(payload);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Announcement sent" });
      setTitle("");
      setMessage("");
      setTargetType("all");
      setSelectedSchoolIds([]);
      setOpen(false);
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("announcements").delete().eq("id", id);
    fetchData();
  };

  const getSchoolNames = (ids: string[] | null) => {
    if (!ids || ids.length === 0) return null;
    return ids.map((id) => schools.find((s) => s.id === id)?.name ?? id).join(", ");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Announcement</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Broadcast Announcement</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea placeholder="Message..." value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />

              <div className="space-y-2">
                <label className="text-sm font-medium">Target</label>
                <Select value={targetType} onValueChange={(v) => { setTargetType(v as "all" | "selected"); setSelectedSchoolIds([]); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Schools</SelectItem>
                    <SelectItem value="selected">Selected Schools</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {targetType === "selected" && (
                <div className="space-y-2 max-h-48 overflow-y-auto rounded-md border p-3">
                  {schools.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active schools found.</p>
                  ) : (
                    schools.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 cursor-pointer py-1">
                        <Checkbox
                          checked={selectedSchoolIds.includes(s.id)}
                          onCheckedChange={() => toggleSchool(s.id)}
                        />
                        <span className="text-sm">{s.name}</span>
                      </label>
                    ))
                  )}
                  {selectedSchoolIds.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">{selectedSchoolIds.length} school(s) selected</p>
                  )}
                </div>
              )}

              <Button onClick={handleCreate} className="w-full" disabled={!title.trim() || !message.trim()}>
                {targetType === "all" ? "Send to All Schools" : `Send to ${selectedSchoolIds.length} School(s)`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Announcements</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : announcements.length === 0 ? <p className="text-sm text-muted-foreground">No announcements yet.</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.title}</TableCell>
                    <TableCell className="max-w-xs truncate">{a.message}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {a.target_type === "all" ? "All Schools" : getSchoolNames(a.target_school_ids) || "Selected"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(a.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(a.id)}>
                        <Trash2 className="h-4 w-4" />
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

export default Announcements;
