import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut } from "lucide-react";

interface Props {
  onSignOut: () => void;
}

const PlatformAdminHeader = ({ onSignOut }: Props) => (
  <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
    <div className="flex items-center gap-2">
      <GraduationCap className="h-5 w-5 text-primary" />
      <span className="font-bold">Platform Admin</span>
    </div>
    <Button variant="ghost" size="sm" onClick={onSignOut}>
      <LogOut className="mr-2 h-4 w-4" /> Sign out
    </Button>
  </header>
);

export default PlatformAdminHeader;
