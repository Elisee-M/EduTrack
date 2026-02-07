import { Link } from "react-router-dom";
import { GraduationCap, Users, Shield, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Users, title: "Student Management", desc: "Register, track, and manage all students with detailed profiles." },
  { icon: Shield, title: "Multi-School Isolation", desc: "Each school's data is completely separated and secure." },
  { icon: BarChart3, title: "Dashboard Analytics", desc: "Quick overview of students, classes, and discipline records." },
  { icon: GraduationCap, title: "Academic Tracking", desc: "Manage classes, trades, academic years, and more." },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-foreground">SchoolManager</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Create and manage your school digitally
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            A professional, multi-tenant school management system. Register students, track discipline, manage classes — all in one place.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/signup">Create a School</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Login</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-card py-16">
        <div className="container">
          <h2 className="mb-10 text-center text-2xl font-semibold text-foreground">
            Everything you need to run your school
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-lg border bg-background p-6">
                <f.icon className="mb-3 h-8 w-8 text-primary" />
                <h3 className="mb-1 font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} SchoolManager. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
