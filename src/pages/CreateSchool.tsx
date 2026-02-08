import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool } from "@/contexts/SchoolContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CreateSchool = () => {
  const { user } = useAuth();
  const { school, refreshSchool } = useSchool();
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

  // If user already has a school, go to dashboard
  if (school) return <Navigate to="/dashboard" replace />;

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { data: newSchool, error } = await supabase
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
      .insert({ user_id: user.id, school_id: newSchool.id, role: "super_admin" });

    if (roleError) {
      toast({ title: "Error assigning role", description: roleError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({ title: "School created!", description: `${form.name} is ready to use.` });
    
    // Refresh school context then navigate
    await refreshSchool();
    navigate("/dashboard");
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create Your School</CardTitle>
          <CardDescription>Fill in the details below to set up your school. Fields marked * are required.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>School Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  placeholder="e.g. Sunrise Academy"
                />
              </div>
              <div className="space-y-2">
                <Label>School Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => handleChange("code", e.target.value)}
                  required
                  placeholder="e.g. SRA-2026"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder="e.g. Kampala, Uganda"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="e.g. +256 700 000 000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>School Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="e.g. info@sunriseacademy.com"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Academic Year Start</Label>
                <Input
                  type="date"
                  value={form.academic_year_start}
                  onChange={(e) => handleChange("academic_year_start", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Academic Year End</Label>
                <Input
                  type="date"
                  value={form.academic_year_end}
                  onChange={(e) => handleChange("academic_year_end", e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Creating School..." : "Create School"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateSchool;
