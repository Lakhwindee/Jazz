import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  TrendingUp, 
  Wallet, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Instagram,
  Star,
  Zap,
  Shield,
  BarChart3,
  Gift,
  Building2,
  Target,
  Megaphone,
  BadgeCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import mingreeLogo from "@assets/generated_images/mingree_mg_circular_logo.png";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Discover Campaigns",
      description: "Browse hundreds of brand campaigns matching your niche and audience size"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Tier-Based Earnings",
      description: "Higher followers unlock premium campaigns with better payouts"
    },
    {
      icon: <Wallet className="h-6 w-6" />,
      title: "Easy Withdrawals",
      description: "Get paid directly to your bank account with secure payments"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Track Performance",
      description: "Monitor your campaign progress and earnings in real-time"
    }
  ];

  const howItWorks = [
    { step: 1, title: "Sign Up", description: "Create your free account and link your Instagram" },
    { step: 2, title: "Browse Campaigns", description: "Find campaigns that match your style and tier" },
    { step: 3, title: "Reserve & Create", description: "Reserve a spot and create amazing content" },
    { step: 4, title: "Get Paid", description: "Submit your work and receive payment" }
  ];

  const brandFeatures = [
    {
      icon: <Target className="h-6 w-6" />,
      title: "Targeted Reach",
      description: "Access creators across 20 tiers based on follower count and niche"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Verified Creators",
      description: "Work with Instagram-verified creators with real, engaged audiences"
    },
    {
      icon: <Megaphone className="h-6 w-6" />,
      title: "Campaign Management",
      description: "Create, manage and track all your campaigns from one dashboard"
    },
    {
      icon: <BadgeCheck className="h-6 w-6" />,
      title: "Quality Assurance",
      description: "Review and approve content before releasing payments"
    }
  ];

  const stats = [
    { value: "10K+", label: "Active Creators" },
    { value: "500+", label: "Brand Partners" },
    { value: "₹50L+", label: "Paid to Creators" },
    { value: "20", label: "Tier Levels" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src={mingreeLogo} alt="Mingree" className="h-8 w-8 rounded-lg object-cover" />
              <span className="text-xl font-bold text-white">Mingree</span>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                className="text-gray-300 hover:text-white"
                onClick={() => setLocation("/login")}
                data-testid="nav-login"
              >
                Log In
              </Button>
              <Button 
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                onClick={() => setLocation("/signup")}
                data-testid="nav-signup"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 mb-6">
              <Star className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-purple-200">India's Leading Creator Platform</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Turn Your Instagram Into
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                A Money Machine
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              Connect with top brands, create amazing content, and earn real money. 
              Join thousands of creators who are already monetizing their Instagram presence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg px-8 py-6"
                onClick={() => setLocation("/signup")}
                data-testid="hero-signup"
              >
                Start Earning Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-purple-500/50 text-purple-300 hover:bg-purple-500/10 text-lg px-8 py-6"
                onClick={() => setLocation("/login")}
                data-testid="hero-login"
              >
                I Have an Account
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-gray-400 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Our platform provides all the tools and opportunities you need to grow your creator career
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Start earning in just 4 simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative text-center"
              >
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-purple-500/50 to-transparent" />
                )}
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* For Brands Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 mb-6">
              <Building2 className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-blue-200">For Brands & Sponsors</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Reach Millions of <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Engaged Audiences</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Partner with authentic Instagram creators to amplify your brand message and drive real results
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {brandFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/50 transition-colors"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-lg px-8 py-6"
              onClick={() => setLocation("/sponsor/login")}
              data-testid="brand-signup"
            >
              Start Your Campaign
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-gray-500 text-sm mt-4">
              Already have an account? <button onClick={() => setLocation("/sponsor/login")} className="text-blue-400 hover:underline">Log in as Sponsor</button>
            </p>
          </div>
        </div>
      </section>

      {/* Tier Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Grow Your Tier,<br />
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Unlock Better Campaigns
                </span>
              </h2>
              <p className="text-gray-400 mb-8">
                Our 20-tier system rewards your growth. As your followers increase, 
                you unlock access to premium campaigns with higher payouts.
              </p>
              <div className="space-y-4">
                {[
                  { icon: <Zap />, text: "Tier 1 starts at just 5,000 followers" },
                  { icon: <Shield />, text: "Higher tiers access all lower-tier campaigns" },
                  { icon: <Gift />, text: "Top tiers earn up to ₹25,000 per campaign" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                      {item.icon}
                    </div>
                    <span className="text-gray-300">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { tier: "Tier 1", followers: "5K+", pay: "₹50" },
                { tier: "Tier 5", followers: "30K+", pay: "₹400" },
                { tier: "Tier 10", followers: "200K+", pay: "₹2,000" },
                { tier: "Tier 20", followers: "5M+", pay: "₹25,000" }
              ].map((item, index) => (
                <motion.div
                  key={item.tier}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30"
                >
                  <div className="text-purple-300 text-sm font-medium">{item.tier}</div>
                  <div className="text-white font-bold text-lg">{item.followers}</div>
                  <div className="text-gray-400 text-sm">Earn up to {item.pay}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="p-12 rounded-3xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Start Earning?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Join thousands of creators who are already monetizing their Instagram. 
              It's free to sign up and takes less than 2 minutes.
            </p>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg px-12 py-6"
              onClick={() => setLocation("/signup")}
              data-testid="cta-signup"
            >
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Instagram className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Mingree</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 Mingree. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
