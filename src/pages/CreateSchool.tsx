import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CreateSchool = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    location: "",
    phone: "",
    email: "",
    academic_year_start: "",
    academic_year_end: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { data: school, error } = await supabase
      .from("schools")
      .insert({
        name: form.name,
        code: form.code,
        location: form.location || null,
        phone: form.phone || null,
        email: form.email || null,
        academic_year_start: form.academic_year_start || null,
        academic_year_end: form.academic_year_end || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Assign super_admin role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id: user.id, school_id: school.id, role: "super_admin" });

    if (roleError) {
      toast({ title: "Error assigning role", description: roleError.message, variant: "destructive" });
    } else {
      toast({ title: "School created!", description: `${form.name} is ready to use.` });
      navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Create Your School</CardTitle>
          <CardDescription>Fill in the details to set up your school</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>School Name *</Label>
                <Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>School Code *</Label>
                <Input value={form.code} onChange={(e) => handleChange("code", e.target.value)} required placeholder="Unique code" />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => handleChange("location", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Academic Year Start</Label>
                <Input type="date" value={form.academic_year_start} onChange={(e) => handleChange("academic_year_start", e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Academic Year End</Label>
                <Input type="date" value={form.academic_year_end} onChange={(e) => handleChange("academic_year_end", e.target.value)} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create School"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateSchool;
