import { Handshake, Home, LayoutDashboard, Settings, Wallet, LayoutList, Users, Crown, LogOut, MoreHorizontal, User } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { NotificationDropdown } from "./NotificationDropdown";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: api.getCurrentUser,
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
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/campaigns", label: "Campaigns", icon: Handshake },
    { href: "/my-campaigns", label: "My Campaigns", icon: LayoutList },
    { href: "/groups", label: "Groups", icon: Users },
    { href: "/earnings", label: "Earnings", icon: Wallet },
    { href: "/subscription", label: "Subscription", icon: Crown },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const mobileLinks = links.slice(0, 4);
  const moreLinks = links.slice(4);

  return (
    <>
      {/* Mobile Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background/80 px-4 backdrop-blur-md md:hidden">
        {mobileLinks.map((link) => {
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
          className="relative flex flex-col items-center gap-1 cursor-pointer text-muted-foreground"
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          data-testid="button-mobile-more"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] font-medium">More</span>
          
          {showMoreMenu && (
            <div className="absolute bottom-16 right-0 w-48 rounded-lg border bg-background p-2 shadow-lg">
              {moreLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location === link.href;
                return (
                  <Link key={link.href} href={link.href}>
                    <div 
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium cursor-pointer",
                        isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                      )}
                      onClick={() => setShowMoreMenu(false)}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </div>
                  </Link>
                );
              })}
              <div 
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-red-500 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20"
                onClick={() => {
                  setShowMoreMenu(false);
                  handleLogout();
                }}
                data-testid="button-mobile-logout"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden h-screen w-64 flex-col border-r bg-sidebar px-4 py-6 md:flex">
        <div className="mb-8 flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-insta-gradient text-white">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">Mingree</span>
          </div>
          {user && <NotificationDropdown userId={user.id} />}
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
          {user && (
            <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-4 dark:from-indigo-950/50 dark:to-purple-950/50">
              <p className="text-xs font-medium text-indigo-900 dark:text-indigo-100">Your Tier</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">Creator</span>
                <span className="text-xs text-indigo-600/80 dark:text-indigo-400/80">{user.tier}</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-indigo-200 dark:bg-indigo-900">
                <div className="h-full bg-insta-gradient" style={{ width: `${Math.min((user.followers / 100000) * 100, 100)}%` }} />
              </div>
              <p className="mt-1 text-[10px] text-indigo-600/70 dark:text-indigo-400/70">
                {user.followers >= 100000 ? 'Top tier reached!' : `${((100000 - user.followers) / 1000).toFixed(0)}k to 100K`}
              </p>
            </div>
          )}

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
