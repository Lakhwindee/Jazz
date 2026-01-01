import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, UserPlus, ArrowLeft, Building2, Globe, Send, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES } from "@shared/countries";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type UserRole = "creator" | "sponsor";
type SignupStep = "details" | "otp" | "password";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<SignupStep>("details");
  const [role, setRole] = useState<UserRole>("creator");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("IN");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const sendOtp = async () => {
    if (!email || !name) {
      toast({
        title: "Missing Information",
        description: "Please enter your name and email first.",
        variant: "destructive",
      });
      return;
    }

    if (role === "sponsor" && companyName.trim().length < 2) {
      toast({
        title: "Company Name Required",
        description: "Please enter your company/brand name.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setOtpSent(true);
      setStep("otp");
      setResendTimer(60);
      toast({
        title: "OTP Sent!",
        description: `A 6-digit code has been sent to ${email}`,
      });
    } catch (error) {
      toast({
        title: "Failed to Send OTP",
        description: error instanceof Error ? error.message : "Could not send verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid OTP");
      }

      setOtpVerified(true);
      setStep("password");
      toast({
        title: "Email Verified!",
        description: "Now set your password to complete signup.",
      });
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Invalid or expired OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpVerified) {
      toast({
        title: "Email Not Verified",
        description: "Please verify your email first.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const payload: Record<string, string> = { name, email, password, role, country };
      if (role === "sponsor") {
        payload.companyName = companyName;
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      toast({
        title: "Account Created!",
        description: role === "creator" 
          ? "Welcome to InstaCreator Hub. You can now start browsing campaigns."
          : "Welcome to InstaCreator Hub. You can now create campaigns for creators.",
      });

      if (role === "sponsor") {
        setLocation("/sponsor");
      } else {
        setLocation("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Signup Failed",
        description: error instanceof Error ? error.message : "Could not create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <button
          onClick={() => step === "details" ? setLocation("/") : setStep("details")}
          className="mb-4 flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{step === "details" ? "Back to Home" : "Back"}</span>
        </button>
        <Card className="border-purple-500/20 bg-black/40 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              {step === "otp" ? <Mail className="h-6 w-6 text-white" /> :
               step === "password" ? <Lock className="h-6 w-6 text-white" /> :
               <UserPlus className="h-6 w-6 text-white" />}
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              {step === "details" && "Create Account"}
              {step === "otp" && "Verify Email"}
              {step === "password" && "Set Password"}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {step === "details" && "Join InstaCreator Hub and start earning from brand campaigns"}
              {step === "otp" && `Enter the 6-digit code sent to ${email}`}
              {step === "password" && "Create a strong password to secure your account"}
            </CardDescription>
            
            <div className="flex justify-center gap-2 mt-4">
              <div className={`h-2 w-16 rounded-full ${step === "details" ? "bg-purple-500" : "bg-gray-600"}`} />
              <div className={`h-2 w-16 rounded-full ${step === "otp" ? "bg-purple-500" : step === "password" ? "bg-green-500" : "bg-gray-600"}`} />
              <div className={`h-2 w-16 rounded-full ${step === "password" ? "bg-purple-500" : "bg-gray-600"}`} />
            </div>
          </CardHeader>
          <CardContent>
            {step === "details" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-200">I am a</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("creator")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                        role === "creator"
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 border-transparent text-white"
                          : "bg-white/5 border-purple-500/30 text-gray-300 hover:bg-white/10"
                      }`}
                      data-testid="button-role-creator"
                    >
                      <User className="h-4 w-4" />
                      <span className="font-medium">Creator</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("sponsor")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                        role === "sponsor"
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 border-transparent text-white"
                          : "bg-white/5 border-purple-500/30 text-gray-300 hover:bg-white/10"
                      }`}
                      data-testid="button-role-sponsor"
                    >
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium">Brand/Sponsor</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-200">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 bg-white/10 border-purple-500/30 text-white placeholder:text-gray-500"
                      required
                      data-testid="input-name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-200">Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="bg-white/10 border-purple-500/30 text-white" data-testid="select-country">
                      <Globe className="h-4 w-4 mr-2 text-gray-400" />
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.flag} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {role === "sponsor" && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="companyName" className="text-gray-200">Company/Brand Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="companyName"
                        type="text"
                        placeholder="Your company or brand name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="pl-10 bg-white/10 border-purple-500/30 text-white placeholder:text-gray-500"
                        required={role === "sponsor"}
                        data-testid="input-company-name"
                      />
                    </div>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-200">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white/10 border-purple-500/30 text-white placeholder:text-gray-500"
                      required
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={sendOtp}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  disabled={isLoading || !name || !email}
                  data-testid="button-send-otp"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Verification Code
                    </>
                  )}
                </Button>
              </div>
            )}

            {step === "otp" && (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <InputOTP 
                    maxLength={6} 
                    value={otp} 
                    onChange={setOtp}
                    data-testid="input-otp"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="bg-white/10 border-purple-500/30 text-white text-xl" />
                      <InputOTPSlot index={1} className="bg-white/10 border-purple-500/30 text-white text-xl" />
                      <InputOTPSlot index={2} className="bg-white/10 border-purple-500/30 text-white text-xl" />
                      <InputOTPSlot index={3} className="bg-white/10 border-purple-500/30 text-white text-xl" />
                      <InputOTPSlot index={4} className="bg-white/10 border-purple-500/30 text-white text-xl" />
                      <InputOTPSlot index={5} className="bg-white/10 border-purple-500/30 text-white text-xl" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  type="button"
                  onClick={verifyOtp}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  disabled={isLoading || otp.length !== 6}
                  data-testid="button-verify-otp"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify Code
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-gray-400 text-sm">
                    Didn't receive the code?{" "}
                    {resendTimer > 0 ? (
                      <span className="text-purple-400">Resend in {resendTimer}s</span>
                    ) : (
                      <button
                        onClick={sendOtp}
                        disabled={isLoading}
                        className="text-purple-400 hover:text-purple-300 font-medium"
                        data-testid="button-resend-otp"
                      >
                        Resend OTP
                      </button>
                    )}
                  </p>
                </div>
              </div>
            )}

            {step === "password" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-green-300 text-sm">Email verified: {email}</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-200">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-white/10 border-purple-500/30 text-white placeholder:text-gray-500"
                      required
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-200">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 bg-white/10 border-purple-500/30 text-white placeholder:text-gray-500"
                      required
                      data-testid="input-confirm-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      data-testid="button-toggle-confirm-password"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  disabled={isLoading}
                  data-testid="button-signup"
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Already have an account?{" "}
                <button
                  onClick={() => setLocation("/login")}
                  className="text-purple-400 hover:text-purple-300 font-medium"
                  data-testid="link-login"
                >
                  Sign in
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
