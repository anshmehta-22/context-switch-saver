import { createContext, useContext, useEffect, useState } from "react";
import * as api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = not logged in

  useEffect(() => {
    api
      .getMe()
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null));
  }, []);

  const login = async (email, password) => {
    const data = await api.loginUser({ email, password });
    setUser(data?.user ?? null);
    return data;
  };

  const register = async (email, password) => {
    const data = await api.registerUser({ email, password });
    setUser(data?.user ?? null);
    return data;
  };

  const logout = async () => {
    await api.logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
