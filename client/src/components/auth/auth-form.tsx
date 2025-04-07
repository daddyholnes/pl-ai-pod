import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth, AuthService } from "@/context/auth-context";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { LogIn } from "lucide-react";
import { useLocation } from "wouter";

export default function AuthForm() {
  const [username, setUsername] = useState("");
  const { login, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log("User is already authenticated, redirecting to home");
      navigate("/");
    }
  }, [isAuthenticated, navigate]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with username:", username);
    if (username.trim()) {
      try {
        const userData = {
          name: username,
          email: `${username.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        };
        console.log("Logging in with user data:", userData);
        
        // Save user data in both context and directly in service
        login(userData);
        AuthService.setUser(userData);
        
        console.log("Login function called, redirecting to home");
        setTimeout(() => {
          // Use window.location for a hard refresh to ensure state is properly reloaded
          window.location.href = "/";
        }, 100);
      } catch (error) {
        console.error("Login error:", error);
      }
    }
  };
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-background min-h-screen">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 h-16 w-16 rounded bg-primary grid place-items-center">
              <span className="text-white text-2xl font-bold">G</span>
            </div>
            <h1 className="text-2xl font-bold">Welcome to GenKit AI Studio</h1>
            <p className="text-muted-foreground mt-2">
              Sign in to start your AI conversation
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={!username.trim()}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Continue as Guest
            </Button>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                try {
                  const userData = {
                    name: "Google User",
                    email: "googleuser@example.com",
                  };
                  // Save the user both via context and directly via service
                  login(userData);
                  AuthService.setUser(userData);
                  console.log("Google login clicked, redirecting to home");
                  // Use a simple timeout to ensure everything is saved before redirecting
                  setTimeout(() => {
                    window.location.href = "/";
                  }, 100);
                } catch (error) {
                  console.error("Google login error:", error);
                }
              }}
            >
              <FaGoogle className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                try {
                  const userData = {
                    name: "GitHub User",
                    email: "githubuser@example.com",
                  };
                  // Save the user both via context and directly via service
                  login(userData);
                  AuthService.setUser(userData);
                  console.log("GitHub login clicked, redirecting to home");
                  // Use a simple timeout to ensure everything is saved before redirecting
                  setTimeout(() => {
                    window.location.href = "/";
                  }, 100);
                } catch (error) {
                  console.error("GitHub login error:", error);
                }
              }}
            >
              <FaGithub className="mr-2 h-4 w-4" />
              GitHub
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
