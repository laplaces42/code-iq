import { createContext, useContext, useState } from "react";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  authStatus: "authenticated" | "unauthenticated" | "loading";
  setAuthStatus: (
    status: "authenticated" | "unauthenticated" | "loading"
  ) => void;
  authError: string | null;
  setAuthError: (error: string | null) => void;
}

interface User {
  id: string;
  githubId: number;
  username: string;
  email: string;
  avatarUrl: string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authStatus, setAuthStatus] = useState<
    "authenticated" | "unauthenticated" | "loading"
  >("loading");
  const [authError, setAuthError] = useState<string | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser, authStatus, setAuthStatus, authError, setAuthError }}>
      {children}
    </UserContext.Provider>
  );
}

function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

export { useUser, UserContext, UserProvider };
