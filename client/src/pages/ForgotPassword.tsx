import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowLeft, KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const sendResetOtp = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset code");
      }

      setStep("otp");
      setResendTimer(60);
      toast({
        title: "Reset Code Sent",
        description: `A 6-digit code has been sent to ${email}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not send reset code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the complete 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid code");
      }

      setStep("reset");
      toast({
        title: "Code Verified",
        description: "You can now set a new password.",
      });
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Invalid or expired code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async () => {
    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords match.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      toast({
        title: "Password Reset Successful",
        description: "You can now login with your new password.",
      });
      setLocation("/login");
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: error instanceof Error ? error.message : "Could not reset password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendTimer > 0) return;
    await sendResetOtp();
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
          onClick={() => step === "email" ? setLocation("/login") : setStep("email")}
          className="mb-4 flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{step === "email" ? "Back to Login" : "Back"}</span>
        </button>

        <Card className="border-purple-500/20 bg-black/40 backdrop-blur-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <KeyRound className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-white">
              {step === "email" && "Forgot Password"}
              {step === "otp" && "Verify Code"}
              {step === "reset" && "Set New Password"}
            </CardTitle>
            <CardDescription className="text-gray-400 text-sm">
              {step === "email" && "Enter your email to receive a reset code"}
              {step === "otp" && `Enter the code sent to ${email}`}
              {step === "reset" && "Create a new secure password"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === "email" && (
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/10 border-purple-500/30 text-white placeholder:text-gray-500"
                    data-testid="input-email"
                  />
                </div>

                <Button
                  onClick={sendResetOtp}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                  disabled={isLoading || !email}
                  data-testid="button-send-code"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Code"}
                </Button>
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
                  onClick={verifyOtp}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                  disabled={isLoading || otp.length !== 6}
                  data-testid="button-verify"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Code"}
                </Button>

                <p className="text-center text-sm text-gray-400">
                  Didn't receive code?{" "}
                  <button
                    onClick={resendOtp}
                    disabled={resendTimer > 0}
                    className={`font-medium ${resendTimer > 0 ? "text-gray-500" : "text-purple-400 hover:text-purple-300"}`}
                    data-testid="button-resend"
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend"}
                  </button>
                </p>
              </div>
            )}

            {step === "reset" && (
              <div className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/10 border-purple-500/30 text-white placeholder:text-gray-500"
                    data-testid="input-new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-white/10 border-purple-500/30 text-white placeholder:text-gray-500"
                    data-testid="input-confirm-password"
                  />
                </div>

                <Button
                  onClick={resetPassword}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                  disabled={isLoading || !newPassword || !confirmPassword}
                  data-testid="button-reset"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
