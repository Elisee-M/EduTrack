import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SchoolProvider, useSchool } from "@/contexts/SchoolContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CreateSchool from "./pages/CreateSchool";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import RegisterStudent from "./pages/RegisterStudent";
import StudentProfile from "./pages/StudentProfile";
import ClassesAndTrades from "./pages/ClassesAndTrades";
import Discipline from "./pages/Discipline";
import SearchStudents from "./pages/SearchStudents";
import DashboardLayout from "./components/DashboardLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const SchoolRoute = ({ children }: { children: React.ReactNode }) => {
  const { school, loading } = useSchool();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (!school) return <Navigate to="/create-school" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SchoolProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/create-school" element={<ProtectedRoute><CreateSchool /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><SchoolRoute><Dashboard /></SchoolRoute></ProtectedRoute>} />
              <Route path="/dashboard/students" element={<ProtectedRoute><SchoolRoute><Students /></SchoolRoute></ProtectedRoute>} />
              <Route path="/dashboard/students/register" element={<ProtectedRoute><SchoolRoute><RegisterStudent /></SchoolRoute></ProtectedRoute>} />
              <Route path="/dashboard/students/:id" element={<ProtectedRoute><SchoolRoute><StudentProfile /></SchoolRoute></ProtectedRoute>} />
              <Route path="/dashboard/classes" element={<ProtectedRoute><SchoolRoute><ClassesAndTrades /></SchoolRoute></ProtectedRoute>} />
              <Route path="/dashboard/discipline" element={<ProtectedRoute><SchoolRoute><Discipline /></SchoolRoute></ProtectedRoute>} />
              <Route path="/dashboard/search" element={<ProtectedRoute><SchoolRoute><SearchStudents /></SchoolRoute></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SchoolProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
