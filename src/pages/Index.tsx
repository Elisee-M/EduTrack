import { Link } from "react-router-dom";
import { GraduationCap, Users, Shield, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/education-hero.png";

const features = [
  { icon: Users, title: "Student Management", desc: "Register, track, and manage all students with detailed profiles.", color: "text-primary" },
  { icon: Shield, title: "Multi-School Isolation", desc: "Each school's data is completely separated and secure.", color: "text-secondary" },
  { icon: BarChart3, title: "Dashboard Analytics", desc: "Quick overview of students, classes, and discipline records.", color: "text-accent" },
  { icon: GraduationCap, title: "Academic Tracking", desc: "Manage classes, trades, academic years, and more.", color: "text-primary" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
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
      <section className="container py-16 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Create and manage your school{" "}
              <span className="text-primary">digitally</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-lg">
              A professional, multi-tenant school management system. Register students, track discipline, manage classes — all in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link to="/signup">Create a School</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Login</Link>
              </Button>
            </div>
          </div>
          <div className="flex justify-center">
            <img
              src={heroImage}
              alt="Students studying together with books, globe and laptop"
              className="w-full max-w-md lg:max-w-lg"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/40 py-16">
        <div className="container">
          <h2 className="mb-10 text-center text-2xl font-semibold text-foreground">
            Everything you need to run your school
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                <f.icon className={`mb-3 h-8 w-8 ${f.color}`} />
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
