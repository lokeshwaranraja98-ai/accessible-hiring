"use client";

import { useAccessibility } from "@/contexts/AccessibilityContext";
import { Button } from "./ui/button";
import { Moon, Sun, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Accessibility } from "lucide-react";

export function AccessibilityControls() {
  const { theme, setTheme, increaseFontSize, decreaseFontSize, resetFontSize } = useAccessibility();

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Adjust font size">
            <Accessibility className="h-[1.2rem] w-[1.2rem]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Font Size</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={increaseFontSize} className="gap-2">
            <ZoomIn className="h-4 w-4" />
            <span>Increase</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={decreaseFontSize} className="gap-2">
            <ZoomOut className="h-4 w-4" />
            <span>Decrease</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={resetFontSize} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            <span>Reset</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
