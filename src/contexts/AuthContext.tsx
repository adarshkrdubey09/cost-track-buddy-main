import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {jwtDecode} from "jwt-decode";

interface JwtPayload {
  exp: number; // expiration in seconds
}

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("access_token"));
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  const clearIntervalRef = () => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch("https://ai.rosmerta.dev/expense/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      setToken(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("userfirstname");
      localStorage.removeItem("userlastname");
      localStorage.removeItem("userloginname");

      clearTimer();
      clearIntervalRef();
      window.location.href = "/login";
    }
  };

  // ✅ Auto logout when JWT expires
  useEffect(() => {
    if (!token) return;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const expiresAt = decoded.exp * 1000;
      const timeout = expiresAt - Date.now();

      clearTimer();

      if (timeout > 0) {
        logoutTimerRef.current = setTimeout(logout, timeout);
      } else {
        logout();
      }
    } catch (err) {
      console.error("Invalid token:", err);
      logout();
    }

    return clearTimer;
  }, [token]);

useEffect(() => {
  const checkToken = async () => {
    try {
      const currentToken = localStorage.getItem("access_token");
      if (!currentToken) return;

      const res = await fetch("https://ai.rosmerta.dev/expense/api/auth/check", {
        method: "HEAD", // 
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      console.log("Checking token...");

      if (res.status !== 200) {
        // Use your logout function
        logout();
      }
    } catch (err) {
      console.error("Token check failed:", err);
      logout();
    }
  };

  // Run immediately and then every 5 seconds
  checkToken();
  const interval = setInterval(checkToken, 5000);

  return () => clearInterval(interval); // cleanup on unmount
}, []); // empty dependency array ensures this effect runs once and keeps interval running


  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
