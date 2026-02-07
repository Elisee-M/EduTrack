import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const RegisterStudent = () => {
  const { school } = useSchool();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [form, setForm] = useState({
    full_name: "", registration_number: "", class_id: "", trade_id: "",
    academic_year: "", date_of_birth: "", gender: "", parent_name: "",
    parent_phone: "", guardian_name: "", guardian_phone: "", home_location: "",
    admission_date: "", status: "Active",
  });

  useEffect(() => {
    if (!school) return;
    Promise.all([
      supabase.from("classes").select("*").eq("school_id", school.id),
      supabase.from("trades").select("*").eq("school_id", school.id),
    ]).then(([c, t]) => {
      setClasses(c.data ?? []);
      setTrades(t.data ?? []);
    });
  }, [school]);

  const handleChange = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    setLoading(true);

    const { error } = await supabase.from("students").insert({
      school_id: school.id,
      full_name: form.full_name,
      registration_number: form.registration_number,
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
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Student registered successfully" });
      navigate("/dashboard/students");
    }
    setLoading(false);
  };

  if (!school) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Register Student</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={form.full_name} onChange={(e) => handleChange("full_name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Registration Number *</Label>
                <Input value={form.registration_number} onChange={(e) => handleChange("registration_number", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={form.class_id} onValueChange={(v) => handleChange("class_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trade</Label>
                <Select value={form.trade_id} onValueChange={(v) => handleChange("trade_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select trade" /></SelectTrigger>
                  <SelectContent>
                    {trades.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input value={form.academic_year} onChange={(e) => handleChange("academic_year", e.target.value)} placeholder="e.g. 2025-2026" />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={form.date_of_birth} onChange={(e) => handleChange("date_of_birth", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => handleChange("gender", v)}>
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
                <Label>Parent/Guardian Name</Label>
                <Input value={form.parent_name} onChange={(e) => handleChange("parent_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Parent Phone</Label>
                <Input value={form.parent_phone} onChange={(e) => handleChange("parent_phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Guardian Name</Label>
                <Input value={form.guardian_name} onChange={(e) => handleChange("guardian_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Guardian Phone</Label>
                <Input value={form.guardian_phone} onChange={(e) => handleChange("guardian_phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Home Location</Label>
                <Input value={form.home_location} onChange={(e) => handleChange("home_location", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Admission Date</Label>
                <Input type="date" value={form.admission_date} onChange={(e) => handleChange("admission_date", e.target.value)} />
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Registering..." : "Register Student"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterStudent;
