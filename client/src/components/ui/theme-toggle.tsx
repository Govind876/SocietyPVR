import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

interface ThemeToggleProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ 
  variant = "ghost", 
  size = "icon", 
  showLabel = false,
  className = ""
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={`transition-all duration-200 hover:scale-105 ${className}`}
      data-testid="button-theme-toggle"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      aria-pressed={theme === "dark"}
    >
      {theme === "light" ? (
        <>
          <Moon className="h-4 w-4" />
          {showLabel && <span className="ml-2">Dark</span>}
        </>
      ) : (
        <>
          <Sun className="h-4 w-4" />
          {showLabel && <span className="ml-2">Light</span>}
        </>
      )}
    </Button>
  );
}