import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    try {

      const res = await fetch("http://localhost:8081/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      console.log("status:", res.status);
      const data = await res.json();
      console.log("response text:", data);
      if (res.ok) {
        setUser(data.user);
        setAccessToken(data.access_token);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: data.error || "Ошибка авторизации" 
        };
      }
    } catch (error) {
      console.error("Ошибка при авторизации:", error);
      return { 
        success: false, 
        error: "Ошибка соединения с сервером" 
      };
    }
  };

  const register = async (email, password) => {
    try {
      const res = await fetch("http://localhost:8081/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: data.error || "Ошибка регистрации" 
        };
      }
    } catch (error) {
      console.error("Ошибка при регистрации:", error);
      return { 
        success: false, 
        error: "Ошибка соединения с сервером" 
      };
    }
  };

  const logout = async () => {
    try {
      await fetch("http://localhost:8081/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  const refresh = async () => {
    try {
      const res = await fetch("http://localhost:8081/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.access_token);
        setUser(data.user);
      } else {
        setUser(null);
        setAccessToken(null);
      }
    } catch (error) {
      console.error("Ошибка при обновлении токена:", error);
      setUser(null);
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);