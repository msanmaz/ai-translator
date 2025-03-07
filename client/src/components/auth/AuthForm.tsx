import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import CustomButton from "@/components/ui/CustomButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, UserPlus } from "lucide-react";
import AnimatedTransition from "@/components/shared/AnimatedTransition";

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const { login, signup, isAuthenticating, error,clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset form error
    setFormError(null);
    
    // Form validation
    if (!email.trim()) {
      setFormError("Email is required");
      return;
    }
    
    if (!password.trim()) {
      setFormError("Password is required");
      return;
    }
    
    if (!isLogin && !name.trim()) {
      setFormError("Name is required");
      return;
    }
    
    try {
      let success = false;
      
      if (isLogin) {
        console.log("Submitting login form...");
        success = await login(email, password);
      } else {
        console.log("Submitting signup form...");
        success = await signup(email, password, name);
      }
      
      console.log("Authentication result:", success ? "Success" : "Failed");
      
      // No need to handle success case - the AuthContext will update isAuthenticated
      // which will trigger the UI transition in the parent component
    } catch (err) {
      console.error("Auth form submission error:", err);
      setFormError("An unexpected error occurred. Please try again.");
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setEmail("");
    setPassword("");
    setName("");
    setFormError(null);
  };

  // Display either API error or form error
  const displayError = error || formError;

  const clearErrors = () => {
    if(error && formError){
      setFormError(null)
      clearError()
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass-panel rounded-xl overflow-hidden p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="h-12 w-12 bg-translator-accent text-white rounded-full mx-auto flex items-center justify-center mb-4">
            <span className="text-xl font-bold">AI</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isLogin ? "Welcome back" : "Create an account"}
          </h2>
          <p className="text-muted-foreground mt-2">
            {isLogin
              ? "Sign in to continue to AI Translator"
              : "Sign up to start translating"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatedTransition show={!isLogin} direction="up">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(()=> e.target.value)}
                disabled={isAuthenticating}
                required={!isLogin}
                className="input-base"
              />
            </div>
          </AnimatedTransition>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                const value = e.target.value;
                if (displayError) {
                  clearErrors()
                }
                setEmail(value);
              }}      
              disabled={isAuthenticating}
              required
              className="input-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isAuthenticating}
              required
              className="input-base"
            />
          </div>

          {displayError && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {displayError}
            </div>
          )}

          <CustomButton
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isAuthenticating}
            disabled={isAuthenticating}
            leftIcon={isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          >
            {isLogin ? "Sign In" : "Sign Up"}
          </CustomButton>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={toggleForm}
              className="ml-1 text-translator-accent hover:underline focus-ring"
              disabled={isAuthenticating}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;