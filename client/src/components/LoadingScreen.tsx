import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({ message = "Loading...", fullScreen = true }: LoadingScreenProps) {
  const containerClass = fullScreen 
    ? "min-h-screen flex items-center justify-center bg-background"
    : "flex items-center justify-center py-12";

  return (
    <div className={containerClass}>
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClass = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }[size];

  return <Loader2 className={`${sizeClass} animate-spin text-primary`} />;
}

export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
