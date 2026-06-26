import * as React from "react";

export type AuthRole = "loan_officer" | "analyst" | "admin";

export type AuthUser = {
  name: string;
  email: string;
  role: AuthRole;
  organization: string;
};

const AUTH_STORAGE_KEY = "kilimolens_auth_user";

const DEMO_USERS: Record<string, { name: string; role: AuthRole; organization: string; password: string }> = {
  "asha@kilimolens.test": {
    name: "Asha Mwangi",
    role: "loan_officer",
    organization: "Kilimo SACCO",
    password: "password",
  },
  "eliot@kilimolens.test": {
    name: "Eliot Njoroge",
    role: "analyst",
    organization: "Kilimo Analytics",
    password: "password",
  },
  "admin@kilimolens.test": {
    name: "Admin User",
    role: "admin",
    organization: "KilimoLens",
    password: "admin",
  },
};

type AuthContextValue = {
  user: AuthUser | undefined;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | undefined>(undefined);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const savedUser = JSON.parse(raw) as AuthUser;
        setUser(savedUser);
      }
    } catch (error) {
      console.warn("Failed to load auth state", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const candidate = DEMO_USERS[normalizedEmail];
    if (!candidate || candidate.password !== password) {
      return false;
    }

    const authUser: AuthUser = {
      name: candidate.name,
      email: normalizedEmail,
      role: candidate.role,
      organization: candidate.organization,
    };

    try {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      setUser(authUser);
      return true;
    } catch (error) {
      console.warn("Failed to persist auth state", error);
      return false;
    }
  }, []);

  const logout = React.useCallback(() => {
    try {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to clear auth state", error);
    }
    setUser(undefined);
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
    }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function getRoleLabel(role: AuthRole) {
  switch (role) {
    case "loan_officer":
      return "Loan Officer";
    case "analyst":
      return "Analyst";
    case "admin":
      return "Administrator";
    default:
      return "User";
  }
}
