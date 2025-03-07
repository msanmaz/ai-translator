
import React, { useState } from "react";
import { User, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import CustomButton from "@/components/ui/CustomButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";



const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();


  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    console.log(`Toggling theme from ${theme} to ${newTheme}`);
    setTheme(newTheme);
  };

  return (
    <header className="fixed top-0 inset-x-0 h-16 border-b border-border/40 bg-background/80 backdrop-blur-sm z-50 flex items-center px-4 sm:px-6">
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-translator-accent text-white flex items-center justify-center">
            AI
          </div>
          <h1 className="text-lg font-semibold tracking-tight">AI Translator</h1>
        </div>

        <div className="flex items-center space-x-2">
          {isAuthenticated && (
            <>
              <CustomButton
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label={theme === "light" ? "Dark mode" : "Light mode"}
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </CustomButton>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-8 w-8 rounded-full bg-translator-muted flex items-center justify-center hover:bg-translator-accent/10 transition-colors ml-2">
                    <User className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>{user?.name || "User"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs text-muted-foreground">
                    {user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
