import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool } from "@/contexts/SchoolContext";
import {
  LayoutDashboard, Users, BookOpen, AlertTriangle, Search, LogOut, GraduationCap, ChevronRight, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type AppRole = "super_admin" | "admin" | "teacher" | "viewer";

const allNavItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["super_admin", "admin", "teacher", "viewer"] as AppRole[] },
  { to: "/dashboard/students", icon: Users, label: "Students", roles: ["super_admin", "admin", "teacher"] as AppRole[] },
  { to: "/dashboard/classes", icon: BookOpen, label: "Classes", roles: ["super_admin", "admin", "teacher"] as AppRole[] },
  { to: "/dashboard/discipline", icon: AlertTriangle, label: "Discipline", roles: ["super_admin", "admin", "teacher"] as AppRole[] },
  { to: "/dashboard/search", icon: Search, label: "Search", roles: ["super_admin", "admin", "teacher", "viewer"] as AppRole[] },
  { to: "/dashboard/team", icon: Shield, label: "Team", roles: ["super_admin", "admin"] as AppRole[] },
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { signOut } = useAuth();
  const { school, userRole } = useSchool();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const roleLabel = userRole?.role?.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()) ?? "";
  const currentRole = userRole?.role as AppRole | undefined;
  const navItems = allNavItems.filter((item) => !currentRole || item.roles.includes(currentRole));

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        {/* Sidebar – desktop */}
        <aside className="hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex">
          <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
            <GraduationCap className="h-6 w-6 text-sidebar-primary" />
            <span className="font-bold">SchoolManager</span>
          </div>

          {school && (
            <div className="border-b border-sidebar-border px-4 py-3">
              <p className="text-sm font-semibold">{school.name}</p>
              <p className="text-xs text-sidebar-foreground/60">{roleLabel}</p>
            </div>
          )}

          <nav className="flex-1 space-y-1 px-2 py-3">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-sidebar-border p-2">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex flex-1 flex-col">
          {/* Top bar */}
          <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
            <div className="flex items-center gap-2 lg:hidden">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-bold text-foreground">SchoolManager</span>
            </div>
            <div className="hidden items-center gap-1 text-sm text-muted-foreground lg:flex">
              {school?.name}
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground">{navItems.find((n) => n.to === location.pathname)?.label ?? "Page"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline">{roleLabel}</span>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="lg:hidden">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-auto p-4 pb-20 lg:p-6 lg:pb-6">{children}</main>
        </div>
      </div>

      {/* Bottom nav – mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t bg-card py-2 lg:hidden">
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 rounded-md px-3 py-1 text-xs transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default DashboardLayout;
