import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, UserPlus, Trash2, Mail, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const roles = [
  { value: "admin", label: "Admin", desc: "Full management access" },
  { value: "teacher", label: "Teacher", desc: "Attendance & discipline" },
  { value: "viewer", label: "Viewer", desc: "Read-only access" },
];

const TeamManagement = () => {
  const { school, userRole } = useSchool();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("teacher");
  const [loading, setLoading] = useState(false);

  const isAdmin = userRole?.role === "super_admin" || userRole?.role === "admin";

  const fetchMembers = async () => {
    if (!school) return;
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("id, role, user_id, created_at")
      .eq("school_id", school.id);

    if (roleData) {
      const userIds = roleData.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", userIds);

      const merged = roleData.map(r => ({
        ...r,
        profile: profiles?.find(p => p.user_id === r.user_id),
      }));
      setMembers(merged);
    }

    const { data: invData } = await supabase
      .from("school_invitations")
      .select("*")
      .eq("school_id", school.id)
      .eq("status", "pending");
    setInvitations(invData ?? []);
  };

  useEffect(() => {
    fetchMembers();
  }, [school]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !email.trim()) return;
    setLoading(true);

    const { data, error } = await supabase.functions.invoke("manage-team", {
      body: { action: "invite", school_id: school.id, email: email.trim().toLowerCase(), role },
    });

    setLoading(false);
    if (error || data?.error) {
      toast({ title: "Error", description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: data?.status === "added" ? "User added to school!" : "Invitation sent!", description: data?.message });
      setOpen(false);
      setEmail("");
      setRole("teacher");
      fetchMembers();
    }
  };

  const handleUpdateRole = async (userRoleId: string, newRole: string) => {
    if (!school) return;
    const { data, error } = await supabase.functions.invoke("manage-team", {
      body: { action: "update_role", school_id: school.id, user_role_id: userRoleId, role: newRole },
    });
    if (error || data?.error) {
      toast({ title: "Error", description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "Role updated" });
      fetchMembers();
    }
  };

  const handleRemove = async (userRoleId: string) => {
    if (!school) return;
    const { data, error } = await supabase.functions.invoke("manage-team", {
      body: { action: "remove", school_id: school.id, user_role_id: userRoleId },
    });
    if (error || data?.error) {
      toast({ title: "Error", description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "Member removed" });
      fetchMembers();
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!school) return;
    const { data, error } = await supabase.functions.invoke("manage-team", {
      body: { action: "cancel_invitation", school_id: school.id, invitation_id: invitationId },
    });
    if (error || data?.error) {
      toast({ title: "Error", description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "Invitation cancelled" });
      fetchMembers();
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin": return "bg-purple-600 text-white";
      case "admin": return "bg-blue-600 text-white";
      case "teacher": return "bg-green-600 text-white";
      default: return "bg-gray-500 text-white";
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
          <h1 className="text-2xl font-bold">Team Management</h1>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="mr-2 h-4 w-4" />Invite Member</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address *</Label>
                  <Input type="email" placeholder="colleague@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label} — {r.desc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="font-medium">How it works:</span>
                  </div>
                  <p>An invitation email will be sent to this address. When they click the link and create their account, they'll automatically be added to your school with the selected role.</p>
                </div>
                <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
                  {loading ? "Sending..." : "Send Invitation Email"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Current Members */}
      <Card>
        <CardHeader><CardTitle className="text-base">Current Members</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                {isAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.profile?.full_name || "—"}</TableCell>
                  <TableCell>{m.profile?.email || "—"}</TableCell>
                  <TableCell>
                    {isAdmin && m.user_id !== user?.id && m.role !== "super_admin" ? (
                      <Select value={m.role} onValueChange={(v) => handleUpdateRole(m.id, v)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={getRoleBadgeColor(m.role)}>{m.role.replace("_", " ")}</Badge>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      {m.user_id !== user?.id && m.role !== "super_admin" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Member</AlertDialogTitle>
                              <AlertDialogDescription>
                                Remove {m.profile?.full_name || m.profile?.email} from the school? They will lose all access.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRemove(m.id)}>Remove</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Pending Invitations</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited</TableHead>
                  {isAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {inv.email}
                    </TableCell>
                    <TableCell><Badge variant="outline">{inv.role}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(inv.created_at).toLocaleDateString()}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="Cancel invitation">
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cancel the invitation to {inv.email}? They will no longer be able to join.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleCancelInvitation(inv.id)}>Cancel Invitation</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeamManagement;
