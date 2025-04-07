import React, { useEffect } from "react";
import { Switch, Route, useLocation, Redirect } from "wouter";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import { useAuth, AuthService } from "./context/auth-context";
import AuthForm from "./components/auth/auth-form";

// Protected route component
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType, path: string }) {
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();
  
  useEffect(() => {
    console.log("Protected route check:", { 
      isAuthenticated, 
      user, 
      location,
      storedUser: localStorage.getItem("ai_studio_user")
    });
  }, [isAuthenticated, user, location]);
  
  return (
    <Route
      {...rest}
      component={() => {
        // Get authentication status from both context and direct service
        const isLoggedInContext = isAuthenticated;
        const isLoggedInDirect = AuthService.isAuthenticated();
        const isLoggedIn = isLoggedInContext || isLoggedInDirect;
        
        console.log("Rendering protected route with auth:", {
          isLoggedInContext,
          isLoggedInDirect,
          finalDecision: isLoggedIn
        });
        
        return isLoggedIn ? <Component /> : <Redirect to="/auth" />;
      }}
    />
  );
}

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Home} />
      <Route path="/auth" component={AuthForm} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Set document title
  useEffect(() => {
    document.title = "GenKit AI Studio";
  }, []);

  return <Router />;
}

export default App;
