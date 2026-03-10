import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useState, useCallback } from "react";
import useAuth from "./hooks/useAuth";
import useAuthStore from "./store/authStore";
import useSessionTimeout from "./hooks/useSessionTimeout";
import SessionTimeoutModal from "./components/shared/SessionTimeoutModal";
import { logout } from "./api/auth";
import usePendingStore from "./store/pendingStore";
import toast from "react-hot-toast";

import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import InviteAccept from "./pages/auth/InviteAccept";
import ChangePassword from "./pages/auth/ChangePassword";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

import Dashboard from "./pages/dashboard/Dashboard";
import History from "./pages/dashboard/History";
import Profile from "./pages/dashboard/Profile";
import Flags from "./pages/dashboard/Flags";
import Leave from "./pages/dashboard/Leave";

import AdminPanel from "./pages/admin/AdminPanel";
import TeamTimesheets from "./pages/admin/TeamTimesheets";
import InviteManagement from "./pages/admin/InviteManagement";
import MemberManagement from "./pages/admin/MemberManagement";
import Reports from "./pages/admin/Reports";
import LeaveManagement from "./pages/admin/LeaveManagement";
import AuditLog from "./pages/admin/AuditLog";
import MemberDetail from "./pages/admin/MemberDetail";
import Announcements from "./pages/admin/Announcements";

import SuperuserDashboard from "./pages/superuser/SuperuserDashboard";
import WorkspaceDetail from "./pages/superuser/WorkspaceDetail";

import ProtectedRoute from "./components/shared/ProtectedRoute";

// ─── Session timeout wrapper (only mounted when logged in) ────────────────────
const SessionGuard = () => {
  const { clearAuth } = useAuthStore();
  const { clearPending } = usePendingStore();
  const [warn, setWarn] = useState(null); // null | number (secondsRemaining)
  const [staying, setStaying] = useState(false);

  const handleWarn = useCallback((secs) => {
    setWarn(secs);
  }, []);

  const handleExpired = useCallback(() => {
    setWarn(null);
    clearAuth();
    clearPending();
    toast.error("Your session has expired. Please log in again.");
  }, [clearAuth, clearPending]);

  const handleStay = useCallback(async () => {
    setStaying(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
        { method: "POST", credentials: "include" },
      );
      if (!res.ok) throw new Error("Refresh failed");
      const { accessToken } = await res.json();
      useAuthStore.getState().setAccessToken(accessToken);
      setWarn(null);
      toast.success("Session extended");
    } catch {
      clearAuth();
      clearPending();
      toast.error("Could not extend session. Please log in again.");
    } finally {
      setStaying(false);
    }
  }, [clearAuth, clearPending]);

  const handleLogOut = useCallback(async () => {
    setWarn(null);
    try {
      await logout();
    } catch {
      /* proceed */
    }
    clearAuth();
    clearPending();
    toast.success("Logged out");
  }, [clearAuth, clearPending]);

  useSessionTimeout({ onWarn: handleWarn, onExpired: handleExpired });

  if (!warn) return null;

  return (
    <SessionTimeoutModal
      secondsRemaining={warn}
      onStayLoggedIn={handleStay}
      onLogOut={handleLogOut}
      staying={staying}
    />
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────
const App = () => {
  const { isLoading } = useAuth();
  const user = useAuthStore((s) => s.user);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: "12px", fontSize: "13px", fontWeight: 500 },
        }}
      />

      {/* Session timeout warning — only active when logged in */}
      {user && <SessionGuard />}

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/invite" element={<InviteAccept />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["employee", "admin", "owner"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/history"
          element={
            <ProtectedRoute allowedRoles={["employee", "admin", "owner"]}>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/flags"
          element={
            <ProtectedRoute allowedRoles={["employee", "admin", "owner"]}>
              <Flags />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/leave"
          element={
            <ProtectedRoute allowedRoles={["employee", "admin", "owner"]}>
              <Leave />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["employee", "admin", "owner"]}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/timesheets"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <TeamTimesheets />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/invites"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <InviteManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/members"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <MemberManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/members/:id"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <MemberDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/leave"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <LeaveManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <AuditLog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/announcements"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <Announcements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superuser"
          element={
            <ProtectedRoute allowedRoles={["superuser"]}>
              <SuperuserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superuser/workspaces/:id"
          element={
            <ProtectedRoute allowedRoles={["superuser"]}>
              <WorkspaceDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            user ? (
              <Navigate
                to={
                  user.role === "superuser"
                    ? "/superuser"
                    : user.role === "employee"
                      ? "/dashboard"
                      : "/admin"
                }
                replace
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;