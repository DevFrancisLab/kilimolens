import * as React from "react";

export type AuthRole = "loan_officer" | "analyst" | "admin";

export type AuthUser = {
  name: string;
  email: string;
  role: AuthRole;
  organization: string;
};

const AUTH_STORAGE_KEY = "kilimolens_auth_user";
const USERS_STORAGE_KEY = "kilimolens_users";

type StoredAccount = { name: string; role: AuthRole; organization: string; password: string };

// Pre-provisioned demo accounts (always available for sign-in).
const DEMO_USERS: Record<string, StoredAccount> = {
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

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role: AuthRole;
  organization: string;
};

export type RegisterResult = { ok: true } | { ok: false; error: string };

type AuthContextValue = {
  user: AuthUser | undefined;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (input: RegisterInput) => Promise<RegisterResult>;
  logout: () => void;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

// ── localStorage-backed account store (demo only; no real backend auth) ──────
function readAccounts(): Record<string, StoredAccount> {
  // Demo users are the seed; registered users (incl. admin role changes) layer on top.
  return { ...DEMO_USERS, ...readRegistered() };
}

function readRegistered(): Record<string, StoredAccount> {
  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, StoredAccount>) : {};
  } catch {
    return {};
  }
}

function writeAccount(email: string, account: StoredAccount) {
  const registered = readRegistered();
  registered[email] = account;
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(registered));
}

export type ManagedAccount = {
  email: string;
  name: string;
  role: AuthRole;
  organization: string;
  isDemo: boolean;
};

/** List every account (seed + registered) for the admin user-management panel. */
export function listAccounts(): ManagedAccount[] {
  const merged = { ...DEMO_USERS, ...readRegistered() };
  return Object.entries(merged)
    .map(([email, a]) => ({
      email,
      name: a.name,
      role: a.role,
      organization: a.organization,
      isDemo: email in DEMO_USERS,
    }))
    .sort((x, y) => x.name.localeCompare(y.name));
}

/** Admin-only: change a user's role. Persists to the registered-users store
 *  (seeding from the demo account first if the target is a demo user). */
export function setAccountRole(email: string, role: AuthRole): boolean {
  const normalized = email.trim().toLowerCase();
  const merged = { ...DEMO_USERS, ...readRegistered() };
  const account = merged[normalized];
  if (!account) return false;
  writeAccount(normalized, { ...account, role });
  return true;
}

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

  const persistSession = React.useCallback((authUser: AuthUser) => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const login = React.useCallback(
    async (email: string, password: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      const candidate = readAccounts()[normalizedEmail];
      if (!candidate || candidate.password !== password) {
        return false;
      }
      try {
        persistSession({
          name: candidate.name,
          email: normalizedEmail,
          role: candidate.role,
          organization: candidate.organization,
        });
        return true;
      } catch (error) {
        console.warn("Failed to persist auth state", error);
        return false;
      }
    },
    [persistSession],
  );

  const register = React.useCallback(
    async (input: RegisterInput): Promise<RegisterResult> => {
      const normalizedEmail = input.email.trim().toLowerCase();
      if (!input.name.trim()) return { ok: false, error: "Please enter your name." };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail))
        return { ok: false, error: "Please enter a valid email address." };
      if (input.password.length < 6)
        return { ok: false, error: "Password must be at least 6 characters." };
      if (readAccounts()[normalizedEmail])
        return { ok: false, error: "An account with this email already exists." };

      try {
        const account: StoredAccount = {
          name: input.name.trim(),
          role: input.role,
          organization: input.organization.trim() || "Independent",
          password: input.password,
        };
        writeAccount(normalizedEmail, account);
        persistSession({
          name: account.name,
          email: normalizedEmail,
          role: account.role,
          organization: account.organization,
        });
        return { ok: true };
      } catch (error) {
        console.warn("Failed to register", error);
        return { ok: false, error: "Could not create the account. Please try again." };
      }
    },
    [persistSession],
  );

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
      register,
      logout,
    }),
    [user, loading, login, register, logout],
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
