import { createContext, useContext, useState, useEffect } from "react";

// Define user type
export type User = {
  name: string;
  email: string;
};

// Auth service that directly manages localStorage operations
export const AuthService = {
  KEY: "ai_studio_user",
  
  getUser: (): User | null => {
    try {
      const savedUser = localStorage.getItem(AuthService.KEY);
      if (!savedUser) return null;
      return JSON.parse(savedUser);
    } catch (error) {
      console.error("Failed to parse saved user:", error);
      localStorage.removeItem(AuthService.KEY);
      return null;
    }
  },
  
  setUser: (user: User): void => {
    localStorage.setItem(AuthService.KEY, JSON.stringify(user));
  },
  
  removeUser: (): void => {
    localStorage.removeItem(AuthService.KEY);
  },
  
  isAuthenticated: (): boolean => {
    return !!AuthService.getUser();
  }
};

// Define auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

// Create auth context with default implementations
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(AuthService.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!user);
  
  const login = (userData: User) => {
    console.log("Auth context login called with:", userData);
    AuthService.setUser(userData);
    setUser(userData);
    setIsAuthenticated(true);
    console.log("User set and saved to localStorage, isAuthenticated set to true");
  };
  
  const logout = () => {
    AuthService.removeUser();
    setUser(null);
    setIsAuthenticated(false);
    console.log("User logged out");
  };
  
  useEffect(() => {
    // Debug whenever state changes
    console.log("Auth state:", { user, isAuthenticated });
  }, [user, isAuthenticated]);
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to access auth context
export const useAuth = () => useContext(AuthContext);
