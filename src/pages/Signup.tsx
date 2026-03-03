import { useState, useEffect } from "react";
import { Link, useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { GraduationCap, Mail, ArrowLeft, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Step = "form" | "otp" | "invited-setup";

const Signup = () => {
  const { user, loading: authLoading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [otpCode, setOtpCode] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const invited = searchParams.get("invited") === "true";
    if (invited) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && invited)) {
          if (session?.user) {
            setEmail(session.user.email || "");
            setStep("invited-setup");
          }
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [searchParams]);

  // Invited user completing profile
  if (step === "invited-setup" && user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>You've been invited to join a school. Please fill in your details to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                const { error: updateError } = await supabase.auth.updateUser({
                  password,
                  data: { full_name: fullName },
                });
                if (updateError) {
                  toast({ title: "Error", description: updateError.message, variant: "destructive" });
                  setLoading(false);
                  return;
                }
                await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id);
                toast({ title: "Profile complete!", description: "Welcome to your school." });
                navigate("/dashboard");
                setLoading(false);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +255 700 000 000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Set Password *</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a strong password" required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !fullName.trim() || !password}>
                {loading ? "Setting up..." : "Complete Setup & Continue"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (user && step !== "invited-setup") return <Navigate to="/create-school" replace />;

  // Step 2: OTP verification
  if (step === "otp") {
    const handleVerifyOtp = async () => {
      if (otpCode.length !== 6) return;
      setLoading(true);
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "signup",
      });
      if (error) {
        toast({ title: "Verification failed", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      toast({ title: "Email verified!", description: "Your account is ready. Let's set up your school." });
      navigate("/create-school");
      setLoading(false);
    };

    const handleResend = async () => {
      setLoading(true);
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) {
        toast({ title: "Resend failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Code resent", description: "Check your email for a new verification code." });
      }
      setLoading(false);
    };

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Verify your email</CardTitle>
            <CardDescription>
              We sent a 6-digit verification code to <span className="font-medium text-foreground">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button onClick={handleVerifyOtp} className="w-full" disabled={loading || otpCode.length !== 6}>
              {loading ? "Verifying..." : "Verify & Continue"}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => { setStep("form"); setOtpCode(""); }}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-primary hover:underline"
              >
                Resend code
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 1: Signup form
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // If auto-confirm is on, user is directly signed in
    if (data.session) {
      toast({ title: "Account created!", description: "Let's set up your school." });
      navigate("/create-school");
    } else {
      // Email confirmation required — show OTP step
      toast({ title: "Code sent!", description: "Check your email for the verification code." });
      setStep("otp");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Sign up to create and manage your school</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Sign up"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
