import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ChevronRight, ChevronLeft, Sparkles, Home, Wallet, Instagram, Award, Settings, Upload, Users } from "lucide-react";

interface GuideStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  targetSelector?: string;
}

const creatorSteps: GuideStep[] = [
  {
    id: "welcome",
    title: "Welcome to Mingree!",
    description: "Let's take a quick tour to help you get started as a creator. You'll learn how to find campaigns, earn money, and grow your influence.",
    icon: <Sparkles className="h-6 w-6 text-purple-400" />,
  },
  {
    id: "instagram",
    title: "Link Your Instagram",
    description: "Connect your Instagram account to unlock campaign opportunities. Your follower count determines your tier and earning potential.",
    icon: <Instagram className="h-6 w-6 text-pink-400" />,
    targetSelector: "[data-testid='nav-instagram']",
  },
  {
    id: "campaigns",
    title: "Discover Campaigns",
    description: "Browse available campaigns matching your tier. Reserve spots, create content, and submit for approval to earn money.",
    icon: <Home className="h-6 w-6 text-blue-400" />,
    targetSelector: "[data-testid='nav-campaigns']",
  },
  {
    id: "wallet",
    title: "Track Your Earnings",
    description: "View your wallet balance, track earnings from approved campaigns, and request withdrawals directly to your UPI.",
    icon: <Wallet className="h-6 w-6 text-green-400" />,
    targetSelector: "[data-testid='nav-wallet']",
  },
  {
    id: "stars",
    title: "Earn Star Rewards",
    description: "Complete promotional campaigns to earn stars. Collect 5 stars to get a free promo code for subscription discounts!",
    icon: <Award className="h-6 w-6 text-yellow-400" />,
  },
];

const sponsorSteps: GuideStep[] = [
  {
    id: "welcome",
    title: "Welcome to Mingree!",
    description: "Let's take a quick tour to help you get started as a sponsor. You'll learn how to create campaigns and connect with creators.",
    icon: <Sparkles className="h-6 w-6 text-purple-400" />,
  },
  {
    id: "wallet",
    title: "Add Funds to Wallet",
    description: "First, add funds to your wallet. This balance will be used to pay creators when their content is approved.",
    icon: <Wallet className="h-6 w-6 text-green-400" />,
    targetSelector: "[data-testid='nav-wallet']",
  },
  {
    id: "campaigns",
    title: "Create Campaigns",
    description: "Create campaigns targeting specific tiers and countries. Set your budget, describe content requirements, and wait for creators to join.",
    icon: <Upload className="h-6 w-6 text-blue-400" />,
    targetSelector: "[data-testid='nav-campaigns']",
  },
  {
    id: "creators",
    title: "Review Submissions",
    description: "When creators submit content, review and approve it. Payment is automatically sent to approved creators.",
    icon: <Users className="h-6 w-6 text-pink-400" />,
  },
  {
    id: "logo",
    title: "Upload Brand Logo",
    description: "Add your brand logo in settings. It will appear on your campaigns to help creators recognize your brand.",
    icon: <Settings className="h-6 w-6 text-gray-400" />,
    targetSelector: "[data-testid='nav-settings']",
  },
];

interface QuickStartGuideProps {
  userRole: "creator" | "sponsor";
  onComplete: () => void;
}

export function QuickStartGuide({ userRole, onComplete }: QuickStartGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  const steps = userRole === "creator" ? creatorSteps : sponsorSteps;
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  useEffect(() => {
    if (step.targetSelector) {
      const element = document.querySelector(step.targetSelector);
      if (element) {
        element.classList.add("guide-highlight");
        return () => element.classList.remove("guide-highlight");
      }
    }
  }, [currentStep, step.targetSelector]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem(`mingree_guide_completed_${userRole}`, "true");
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible) return null;

  return (
    <>
      <style>{`
        .guide-highlight {
          position: relative;
          z-index: 45;
          animation: guide-pulse 2s ease-in-out infinite;
        }
        @keyframes guide-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(147, 51, 234, 0); }
        }
      `}</style>
      
      <div className="fixed inset-0 bg-black/60 z-40" onClick={handleSkip} />
      
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
        <Card className="bg-gray-900 border-purple-500/50 shadow-xl shadow-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  {step.icon}
                </div>
                <div>
                  <p className="text-xs text-purple-400 font-medium">
                    Step {currentStep + 1} of {steps.length}
                  </p>
                  <h3 className="text-white font-semibold text-lg">{step.title}</h3>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="text-gray-400 hover:text-white -mt-1 -mr-2"
                onClick={handleSkip}
                data-testid="button-skip-guide"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              {step.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 w-6 rounded-full transition-colors ${
                      idx === currentStep
                        ? "bg-purple-500"
                        : idx < currentStep
                        ? "bg-purple-500/50"
                        : "bg-gray-700"
                    }`}
                  />
                ))}
              </div>
              
              <div className="flex gap-2">
                {!isFirstStep && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handlePrev}
                    className="text-gray-400"
                    data-testid="button-prev-step"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="bg-purple-600 hover:bg-purple-700"
                  data-testid="button-next-step"
                >
                  {isLastStep ? "Get Started" : "Next"}
                  {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function useQuickStartGuide(userRole: "creator" | "sponsor" | null) {
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (!userRole || userRole === "admin" as any) {
      setShowGuide(false);
      return;
    }

    const key = `mingree_guide_completed_${userRole}`;
    const hasCompleted = localStorage.getItem(key);
    
    if (!hasCompleted) {
      const timer = setTimeout(() => setShowGuide(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [userRole]);

  const completeGuide = () => setShowGuide(false);
  
  const resetGuide = () => {
    if (userRole) {
      localStorage.removeItem(`mingree_guide_completed_${userRole}`);
      setShowGuide(true);
    }
  };

  return { showGuide, completeGuide, resetGuide };
}
