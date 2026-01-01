import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, UserPlus, ArrowLeft, Building2, Send, Loader2, Phone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COUNTRIES = [
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "AE", name: "UAE" },
  { code: "SG", name: "Singapore" },
  { code: "JP", name: "Japan" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "ID", name: "Indonesia" },
  { code: "PH", name: "Philippines" },
  { code: "TH", name: "Thailand" },
  { code: "MY", name: "Malaysia" },
  { code: "ZA", name: "South Africa" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "PK", name: "Pakistan" },
  { code: "BD", name: "Bangladesh" },
  { code: "VN", name: "Vietnam" },
  { code: "EG", name: "Egypt" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "PL", name: "Poland" },
  { code: "RU", name: "Russia" },
  { code: "KR", name: "South Korea" },
  { code: "TW", name: "Taiwan" },
  { code: "HK", name: "Hong Kong" },
  { code: "NZ", name: "New Zealand" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "PE", name: "Peru" },
  { code: "TR", name: "Turkey" },
];

type UserRole = "creator" | "sponsor";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [role, setRole] = useState<UserRole>("creator");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("IN");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const sendOtp = async () => {
    if (!email || !name || !password) {
      toast({
        title: "Missing Information",
        description: "Please fill all fields.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters.",
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

  const verifyAndSignup = async () => {
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
      const verifyResponse = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || "Invalid OTP");
      }

      const signupResponse = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, role, country }),
        credentials: "include",
      });

      const signupData = await signupResponse.json();

      if (!signupResponse.ok) {
        throw new Error(signupData.error || "Signup failed");
      }

      toast({
        title: "Account Created!",
        description: "Welcome to InstaCreator Hub!",
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

  const resendOtp = async () => {
    if (resendTimer > 0) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to resend OTP");
      }

      setResendTimer(60);
      toast({
        title: "OTP Resent!",
        description: `A new code has been sent to ${email}`,
      });
    } catch (error) {
      toast({
        title: "Failed to Resend",
        description: error instanceof Error ? error.message : "Could not resend code",
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
        className="w-full max-w-sm"
      >
        <button
          onClick={() => step === "form" ? setLocation("/") : setStep("form")}
          className="mb-4 flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{step === "form" ? "Back to Home" : "Back"}</span>
        </button>
        
        <Card className="border-purple-500/20 bg-black/40 backdrop-blur-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              {step === "otp" ? <Mail className="h-8 w-8 text-white" /> : <UserPlus className="h-8 w-8 text-white" />}
            </div>
            <CardTitle className="text-xl font-bold text-white">
              {step === "form" ? "InstaCreator Hub" : "Verify Email"}
            </CardTitle>
            <CardDescription className="text-gray-400 text-sm">
              {step === "form" 
                ? "Sign up to find brand campaigns" 
                : `Enter the code sent to ${email}`}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {step === "form" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("creator")}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm transition-all ${
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
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm transition-all ${
                      role === "sponsor"
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 border-transparent text-white"
                        : "bg-white/5 border-purple-500/30 text-gray-300 hover:bg-white/10"
                    }`}
                    data-testid="button-role-sponsor"
                  >
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">Brand</span>
                  </button>
                </div>

                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 bg-white/10 border-purple-500/30 text-white placeholder:text-gray-500"
                    data-testid="input-name"
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/10 border-purple-500/30 text-white placeholder:text-gray-500"
                    data-testid="input-email"
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="tel"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 bg-white/10 border-purple-500/30 text-white placeholder:text-gray-500"
                    data-testid="input-phone"
                  />
                </div>

                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger 
                      className="pl-10 bg-white/10 border-purple-500/30 text-white"
                      data-testid="select-country"
                    >
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 bg-gray-900 border-purple-500/30">
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code} className="text-white hover:bg-purple-500/20">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/10 border-purple-500/30 text-white placeholder:text-gray-500"
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <Button
                  type="button"
                  onClick={sendOtp}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  disabled={isLoading || !name || !email || !password}
                  data-testid="button-signup"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Sign Up"
                  )}
                </Button>

                <p className="text-center text-xs text-gray-400">
                  By signing up, you agree to our Terms of Service
                </p>

                <div className="border-t border-purple-500/20 pt-4 mt-4">
                  <p className="text-center text-gray-400 text-sm">
                    Have an account?{" "}
                    <button
                      onClick={() => setLocation("/login")}
                      className="text-purple-400 hover:text-purple-300 font-medium"
                      data-testid="link-login"
                    >
                      Log in
                    </button>
                  </p>
                </div>
              </div>
            )}

            {step === "otp" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3">
                  <InputOTP 
                    maxLength={6} 
                    value={otp} 
                    onChange={setOtp}
                    data-testid="input-otp"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="bg-white/10 border-purple-500/30 text-white text-lg w-10 h-12" />
                      <InputOTPSlot index={1} className="bg-white/10 border-purple-500/30 text-white text-lg w-10 h-12" />
                      <InputOTPSlot index={2} className="bg-white/10 border-purple-500/30 text-white text-lg w-10 h-12" />
                      <InputOTPSlot index={3} className="bg-white/10 border-purple-500/30 text-white text-lg w-10 h-12" />
                      <InputOTPSlot index={4} className="bg-white/10 border-purple-500/30 text-white text-lg w-10 h-12" />
                      <InputOTPSlot index={5} className="bg-white/10 border-purple-500/30 text-white text-lg w-10 h-12" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  type="button"
                  onClick={verifyAndSignup}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  disabled={isLoading || otp.length !== 6}
                  data-testid="button-verify"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Verify & Create Account"
                  )}
                </Button>

                <p className="text-center text-sm text-gray-400">
                  Didn't receive code?{" "}
                  <button
                    onClick={resendOtp}
                    disabled={resendTimer > 0 || isLoading}
                    className={`font-medium ${resendTimer > 0 ? "text-gray-500" : "text-purple-400 hover:text-purple-300"}`}
                    data-testid="button-resend"
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend"}
                  </button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
