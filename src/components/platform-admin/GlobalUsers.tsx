import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface UserRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  roles: { role: string; school_name: string }[];
}

const GlobalUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      // Get all profiles
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email");
      // Get all roles with school names
      const { data: roles } = await supabase.from("user_roles").select("user_id, role, schools(name)");

      const roleMap = new Map<string, { role: string; school_name: string }[]>();
      (roles ?? []).forEach((r: any) => {
        const list = roleMap.get(r.user_id) ?? [];
        list.push({ role: r.role, school_name: (r.schools as any)?.name ?? "Unknown" });
        roleMap.set(r.user_id, list);
      });

      const merged: UserRow[] = (profiles ?? []).map((p) => ({
        user_id: p.user_id,
        full_name: p.full_name,
        email: p.email,
        roles: roleMap.get(p.user_id) ?? [],
      }));

      setUsers(merged);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">All Users ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : filtered.length === 0 ? <p className="text-sm text-muted-foreground">No users found.</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles & Schools</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                    <TableCell>{u.email || "—"}</TableCell>
                    <TableCell>
                      {u.roles.length === 0 ? <span className="text-muted-foreground text-sm">No school roles</span> : (
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {r.role.replace("_", " ")} @ {r.school_name}
                            </Badge>
                          ))}
                        </div>
                      )}
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

export default GlobalUsers;
