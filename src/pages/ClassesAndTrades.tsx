import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowLeft, UserPlus, Users, ChevronRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
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
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddTrade, setShowAddTrade] = useState(false);
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
      school_id: school.id, name: className, level: newClassLevel, trade_id: newClassTradeId,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setNewClassLevel(""); setNewClassTradeId(""); setShowAddClass(false); fetchData(); }
  };

  const addTrade = async () => {
    if (!school || !newTradeFull.trim() || !newTradeAbbr.trim()) {
      toast({ title: "Please enter both trade name and abbreviation", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("trades").insert({
      school_id: school.id, name: newTradeFull.trim(), abbreviation: newTradeAbbr.trim().toUpperCase(),
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setNewTradeFull(""); setNewTradeAbbr(""); setShowAddTrade(false); fetchData(); }
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

  // Group classes by trade
  const classesByTrade: Record<string, { trade: any; classes: any[] }> = {};
  for (const c of classes) {
    const tradeId = c.trade_id || "none";
    if (!classesByTrade[tradeId]) {
      const tradeName = (c.trades as any)?.abbreviation || (c.trades as any)?.name || "Unassigned";
      const tradeFullName = (c.trades as any)?.name || "Unassigned";
      classesByTrade[tradeId] = { trade: { id: tradeId, abbreviation: tradeName, name: tradeFullName }, classes: [] };
    }
    classesByTrade[tradeId].classes.push(c);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Classes & Trades</h1>
        </div>
        <Button asChild>
          <Link to="/dashboard/students/register"><UserPlus className="mr-2 h-4 w-4" />Register Student</Link>
        </Button>
      </div>

      {/* Trades Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Trades</CardTitle>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => setShowAddTrade(!showAddTrade)}>
              <Plus className="h-4 w-4 mr-1" />{showAddTrade ? "Cancel" : "Add Trade"}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddTrade && canEdit && (
            <div className="space-y-2 rounded-md border p-3 bg-muted/30">
              <Input value={newTradeFull} onChange={(e) => setNewTradeFull(e.target.value)} placeholder="Full trade name (e.g. Computer System and Architecture)" />
              <div className="flex gap-2">
                <Input value={newTradeAbbr} onChange={(e) => setNewTradeAbbr(e.target.value)} placeholder="Abbreviation (e.g. CSA)" />
                <Button size="sm" onClick={addTrade}>Save</Button>
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

      {/* Add Class Section */}
      {canEdit && (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setShowAddClass(!showAddClass)}>
            <Plus className="h-4 w-4 mr-1" />{showAddClass ? "Cancel" : "Add Class"}
          </Button>
        </div>
      )}
      {showAddClass && canEdit && (
        <Card>
          <CardContent className="pt-4 space-y-3">
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
            <Button size="sm" onClick={addClass} className="w-full"><Plus className="h-4 w-4 mr-1" /> Create Class</Button>
          </CardContent>
        </Card>
      )}

      {/* Classes Grouped by Trade */}
      {Object.keys(classesByTrade).length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">No classes yet. Add trades and classes above.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(classesByTrade).map(([tradeId, group]) => (
            <Card key={tradeId} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {group.trade.name}
                  <span className="text-xs text-muted-foreground">({group.trade.abbreviation})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {group.classes.map((c) => (
                  <div key={c.id} className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      className="flex-1 justify-between h-9 px-3 text-sm"
                      onClick={() => navigate(`/dashboard/classes/${c.id}`)}
                    >
                      {c.name}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    {canEdit && (
                      <button onClick={() => deleteClass(c.id)} className="text-muted-foreground hover:text-destructive p-1">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassesAndTrades;
