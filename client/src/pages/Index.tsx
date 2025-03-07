import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { TranslationProvider } from "@/context/TranslationContext";
import AuthForm from "@/components/auth/AuthForm";
import TranslatorPanel from "@/components/translator/TranslatorPanel";
import Header from "@/components/shared/Header";
import AnimatedTransition from "@/components/shared/AnimatedTransition";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/hooks/use-theme";

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showAppContent, setShowAppContent] = useState(false);
  
  // Handle initial authentication check
  useEffect(() => {
    if (!isLoading) {
      setInitialLoadComplete(true);
      
      // Only show app content if the user is authenticated
      if (isAuthenticated) {
        setShowAppContent(true);
      } else {
        setShowAppContent(false);
      }
    }
  }, [isLoading, isAuthenticated]);

  // Show loading spinner only during initial load
  if (!initialLoadComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-translator-accent border-r-transparent animate-spin"></div>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col">
      {isAuthenticated && (
        <Header
        />
      )}
      
      <main className="flex-1 py-8 px-4 sm:px-6 flex items-center justify-center">
        {/* Auth form - only visible when not authenticated */}
        <div className={isAuthenticated ? "hidden" : "block w-full"}>
          <AnimatedTransition 
            show={!isAuthenticated} 
            direction="up"
            className="w-full"
          >
            <AuthForm />
          </AnimatedTransition>
        </div>
        
        {/* App content - only visible after authentication */}
        <div className={isAuthenticated ? "block w-full max-w-3xl mt-16" : "hidden"}>
          <AnimatedTransition 
            show={isAuthenticated && showAppContent} 
            direction="up"
            className="w-full"
          >
            <TranslatorPanel />
          </AnimatedTransition>
        </div>
      </main>
      
      <footer className="py-4 px-6 text-center text-sm text-muted-foreground border-t border-border/40">
        <p>AI Translator © {new Date().getFullYear()} — Designed with precision and simplicity</p>
      </footer>
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <ThemeProvider>
    <AuthProvider>
      <TranslationProvider>
        <AppContent />
        <Toaster position="top-center" />
      </TranslationProvider>
    </AuthProvider>
    </ThemeProvider>

  );
};

export default Index;