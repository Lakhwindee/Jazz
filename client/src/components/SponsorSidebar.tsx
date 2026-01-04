import { Home, LayoutList, PlusCircle, Settings, Building2, LogOut, Wallet } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { NotificationDropdown } from "./NotificationDropdown";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import mingreeLogo from "@assets/Gemini_Generated_Image_79ha8h79ha8h79ha_1767510042588.png";

export function SponsorSidebar() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: sponsor } = useQuery({
    queryKey: ["currentSponsor"],
    queryFn: api.getCurrentSponsor,
  });

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      queryClient.clear();
      setLocation("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const links = [
    { href: "/sponsor", label: "Dashboard", icon: Home },
    { href: "/sponsor/campaigns", label: "My Listings", icon: LayoutList },
    { href: "/sponsor/create-campaign", label: "Create Campaign", icon: PlusCircle },
    { href: "/sponsor/wallet", label: "Wallet", icon: Wallet },
    { href: "/sponsor/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background/80 px-4 backdrop-blur-md md:hidden">
        {links.slice(0, 4).map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <div className={cn("flex flex-col items-center gap-1 cursor-pointer", isActive ? "text-primary" : "text-muted-foreground")}>
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{link.label}</span>
              </div>
            </Link>
          );
        })}
        <div 
          className="flex flex-col items-center gap-1 cursor-pointer text-red-500"
          onClick={handleLogout}
          data-testid="button-mobile-logout"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[10px] font-medium">Logout</span>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden h-screen w-64 flex-col border-r bg-sidebar px-4 py-6 md:flex">
        <div className="mb-8 flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <img src={mingreeLogo} alt="Mingree" className="h-8 w-8 rounded-lg object-cover" />
            <span className="text-xl font-bold tracking-tight">Mingree</span>
          </div>
          {sponsor && <NotificationDropdown userId={sponsor.id} />}
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-sidebar-accent cursor-pointer",
                    isActive ? "bg-sidebar-accent text-primary shadow-sm" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-4 dark:from-indigo-950/50 dark:to-purple-950/50">
            <p className="text-xs font-medium text-indigo-900 dark:text-indigo-100">Account Type</p>
            <div className="mt-1">
              <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">Brand Partner</span>
            </div>
          </div>

          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}
