import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";

import DashboardLayout from "@/components/dashboard/Layout";
import {
  listAccounts,
  setAccountRole,
  getRoleLabel,
  useAuth,
  type AuthRole,
  type ManagedAccount,
} from "@/lib/auth";

const ROLE_OPTIONS: AuthRole[] = ["loan_officer", "analyst", "admin"];

function UserManagement() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<ManagedAccount[]>(() => listAccounts());
  const [savedEmail, setSavedEmail] = useState<string>("");

  function changeRole(email: string, role: AuthRole) {
    if (setAccountRole(email, role)) {
      setAccounts(listAccounts());
      setSavedEmail(email);
      window.setTimeout(() => setSavedEmail(""), 1500);
    }
  }

  const counts = useMemo(() => {
    return accounts.reduce<Record<string, number>>((acc, a) => {
      acc[a.role] = (acc[a.role] || 0) + 1;
      return acc;
    }, {});
  }, [accounts]);

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">User Management</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Grant or change roles. New signups start as Loan Officers; only admins can elevate them.
          </p>
        </div>
        <div className="hidden gap-2 sm:flex">
          {ROLE_OPTIONS.map((r) => (
            <span key={r} className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
              {getRoleLabel(r)}: {counts[r] || 0}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-150 table-auto text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-6 py-3 font-medium">User</th>
              <th className="px-6 py-3 font-medium">Organization</th>
              <th className="px-6 py-3 font-medium">Role</th>
              <th className="px-6 py-3 font-medium">Change role</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => {
              const isSelf = user?.email === a.email;
              return (
                <tr key={a.email} className="border-b border-border/60 last:border-0">
                  <td className="px-6 py-3">
                    <div className="font-medium text-foreground">
                      {a.name}
                      {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                      {a.isDemo && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">demo</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{a.email}</div>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{a.organization}</td>
                  <td className="px-6 py-3">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      {getRoleLabel(a.role)}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={a.role}
                        disabled={isSelf}
                        onChange={(e) => changeRole(a.email, e.target.value as AuthRole)}
                        className="rounded-lg border border-border bg-card px-2 py-1.5 text-sm text-foreground outline-none transition focus:border-primary disabled:opacity-50"
                        title={isSelf ? "You cannot change your own role" : undefined}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {getRoleLabel(r)}
                          </option>
                        ))}
                      </select>
                      {savedEmail === a.email && (
                        <span className="text-xs font-medium text-emerald-600">Saved</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h2 className="text-lg font-semibold text-foreground">Settings</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Manage users and roles for your organization.
      </p>
      <UserManagement />
    </div>
  );
}

export const Route = createFileRoute("/dashboard/settings")({
  component: () => <DashboardLayout>{<SettingsPage />}</DashboardLayout>,
});
