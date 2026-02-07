import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ClassesAndTrades = () => {
  const { school, userRole } = useSchool();
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [newClass, setNewClass] = useState("");
  const [newTrade, setNewTrade] = useState("");
  const canEdit = userRole?.role === "super_admin" || userRole?.role === "admin";

  const fetchData = async () => {
    if (!school) return;
    const [c, t] = await Promise.all([
      supabase.from("classes").select("*").eq("school_id", school.id).order("name"),
      supabase.from("trades").select("*").eq("school_id", school.id).order("name"),
    ]);
    setClasses(c.data ?? []);
    setTrades(t.data ?? []);
  };

  useEffect(() => { fetchData(); }, [school]);

  const addClass = async () => {
    if (!school || !newClass.trim()) return;
    const { error } = await supabase.from("classes").insert({ school_id: school.id, name: newClass.trim() });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setNewClass(""); fetchData(); }
  };

  const addTrade = async () => {
    if (!school || !newTrade.trim()) return;
    const { error } = await supabase.from("trades").insert({ school_id: school.id, name: newTrade.trim() });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setNewTrade(""); fetchData(); }
  };

  const deleteClass = async (id: string) => {
    await supabase.from("classes").delete().eq("id", id);
    fetchData();
  };

  const deleteTrade = async (id: string) => {
    await supabase.from("trades").delete().eq("id", id);
    fetchData();
  };

  if (!school) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Classes & Trades</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Classes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {canEdit && (
              <div className="flex gap-2">
                <Input value={newClass} onChange={(e) => setNewClass(e.target.value)} placeholder="New class name" onKeyDown={(e) => e.key === "Enter" && addClass()} />
                <Button size="sm" onClick={addClass}><Plus className="h-4 w-4" /></Button>
              </div>
            )}
            {classes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No classes yet.</p>
            ) : (
              <div className="space-y-1">
                {classes.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    {c.name}
                    {canEdit && (
                      <button onClick={() => deleteClass(c.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Trades</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {canEdit && (
              <div className="flex gap-2">
                <Input value={newTrade} onChange={(e) => setNewTrade(e.target.value)} placeholder="New trade name" onKeyDown={(e) => e.key === "Enter" && addTrade()} />
                <Button size="sm" onClick={addTrade}><Plus className="h-4 w-4" /></Button>
              </div>
            )}
            {trades.length === 0 ? (
              <p className="text-sm text-muted-foreground">No trades yet.</p>
            ) : (
              <div className="space-y-1">
                {trades.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    {t.name}
                    {canEdit && (
                      <button onClick={() => deleteTrade(t.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClassesAndTrades;
