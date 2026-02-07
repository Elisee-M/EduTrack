import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

const SearchStudents = () => {
  const { school } = useSchool();
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [tradeFilter, setTradeFilter] = useState("all");
  const [results, setResults] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);

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

  const handleSearch = async () => {
    if (!school) return;
    let q = supabase.from("students").select("*, classes(name), trades(name)").eq("school_id", school.id);
    if (query.trim()) q = q.or(`full_name.ilike.%${query}%,registration_number.ilike.%${query}%`);
    if (classFilter !== "all") q = q.eq("class_id", classFilter);
    if (tradeFilter !== "all") q = q.eq("trade_id", tradeFilter);
    const { data } = await q.order("full_name").limit(50);
    setResults(data ?? []);
  };

  useEffect(() => { if (school) handleSearch(); }, [school, classFilter, tradeFilter]);

  if (!school) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Search Students</h1>
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-1 gap-2">
          <Input placeholder="Search by name or registration number..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="min-w-[200px]" />
          <Button onClick={handleSearch}><Search className="h-4 w-4" /></Button>
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={tradeFilter} onValueChange={setTradeFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All trades" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trades</SelectItem>
            {trades.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {results.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No students found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Reg. No</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Trade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.full_name}</TableCell>
                    <TableCell>{s.registration_number}</TableCell>
                    <TableCell>{(s.classes as any)?.name ?? "—"}</TableCell>
                    <TableCell>{(s.trades as any)?.name ?? "—"}</TableCell>
                    <TableCell><Badge variant={s.status === "Active" ? "default" : "secondary"}>{s.status}</Badge></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/dashboard/students/${s.id}`}>View</Link>
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

export default SearchStudents;
