import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

const LEVELS = ["S1", "S2", "S3", "S4", "S5", "S6", "L3", "L4", "L5"];

const ClassesAndTrades = () => {
  const { school, userRole } = useSchool();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [newClassLevel, setNewClassLevel] = useState("");
  const [newClassTradeId, setNewClassTradeId] = useState("");
  const [newTradeFull, setNewTradeFull] = useState("");
  const [newTradeAbbr, setNewTradeAbbr] = useState("");
  const canEdit = userRole?.role === "super_admin" || userRole?.role === "admin";

  const fetchData = async () => {
    if (!school) return;
    const [c, t] = await Promise.all([
      supabase.from("classes").select("*, trades(name, abbreviation)").eq("school_id", school.id).order("name"),
      supabase.from("trades").select("*").eq("school_id", school.id).order("name"),
    ]);
    setClasses(c.data ?? []);
    setTrades(t.data ?? []);
  };

  useEffect(() => { fetchData(); }, [school]);

  const addClass = async () => {
    if (!school || !newClassLevel || !newClassTradeId) {
      toast({ title: "Please select both level and trade", variant: "destructive" });
      return;
    }
    const trade = trades.find((t) => t.id === newClassTradeId);
    const className = `${newClassLevel} ${trade?.abbreviation || trade?.name || ""}`.trim();

    const { error } = await supabase.from("classes").insert({
      school_id: school.id,
      name: className,
      level: newClassLevel,
      trade_id: newClassTradeId,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setNewClassLevel(""); setNewClassTradeId(""); fetchData(); }
  };

  const addTrade = async () => {
    if (!school || !newTradeFull.trim() || !newTradeAbbr.trim()) {
      toast({ title: "Please enter both trade name and abbreviation", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("trades").insert({
      school_id: school.id,
      name: newTradeFull.trim(),
      abbreviation: newTradeAbbr.trim().toUpperCase(),
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setNewTradeFull(""); setNewTradeAbbr(""); fetchData(); }
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
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Classes & Trades</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trades card first — trades must exist before creating classes */}
        <Card>
          <CardHeader><CardTitle className="text-base">Trades</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {canEdit && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input value={newTradeFull} onChange={(e) => setNewTradeFull(e.target.value)} placeholder="Full trade name (e.g. Computer System and Architecture)" />
                </div>
                <div className="flex gap-2">
                  <Input value={newTradeAbbr} onChange={(e) => setNewTradeAbbr(e.target.value)} placeholder="Abbreviation (e.g. CSA)" />
                  <Button size="sm" onClick={addTrade}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
            {trades.length === 0 ? (
              <p className="text-sm text-muted-foreground">No trades yet. Add trades first to create classes.</p>
            ) : (
              <div className="space-y-1">
                {trades.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <span>{t.name} <span className="text-muted-foreground">({t.abbreviation || "–"})</span></span>
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

        {/* Classes card */}
        <Card>
          <CardHeader><CardTitle className="text-base">Classes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {canEdit && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Level</Label>
                    <Select value={newClassLevel} onValueChange={setNewClassLevel}>
                      <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                      <SelectContent>
                        {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Trade</Label>
                    <Select value={newClassTradeId} onValueChange={setNewClassTradeId}>
                      <SelectTrigger><SelectValue placeholder="Select trade" /></SelectTrigger>
                      <SelectContent>
                        {trades.map((t) => <SelectItem key={t.id} value={t.id}>{t.abbreviation || t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button size="sm" onClick={addClass} className="w-full"><Plus className="h-4 w-4 mr-1" /> Add Class</Button>
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
      </div>
    </div>
  );
};

export default ClassesAndTrades;
