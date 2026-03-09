import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  CheckCircle2,
  XCircle,
  ClipboardList,
  MessageSquareWarning,
  UserCheck,
  MessageSquare,
} from "lucide-react";
import useNotificationStore from "../../store/notificationStore";
import useAuthStore from "../../store/authStore";

const TYPE_ICON = {
  remark_created: MessageSquareWarning,
  remark_reply: MessageSquare,
  remark_resolved: Check,
  invite_accepted: UserCheck,
  manual_log_requested: ClipboardList,
  manual_log_approved: CheckCircle2,
  manual_log_rejected: XCircle,
};

const TYPE_COLOR = {
  remark_created: "text-amber-500 bg-amber-50 dark:bg-amber-900/30",
  remark_reply: "text-brand-500 bg-brand-50 dark:bg-brand-900/30",
  remark_resolved: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30",
  invite_accepted: "text-violet-500 bg-violet-50 dark:bg-violet-900/30",
  manual_log_requested: "text-blue-500 bg-blue-50 dark:bg-blue-900/30",
  manual_log_approved: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30",
  manual_log_rejected: "text-red-500 bg-red-50 dark:bg-red-900/30",
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// Map notification type + user role to a route
const getRoute = (notification, userRole) => {
  const isAdmin = userRole === "admin" || userRole === "owner";

  switch (notification.type) {
    case "remark_created":
    case "remark_reply":
    case "remark_resolved":
      // Admins go to timesheets, employees go to dashboard
      return isAdmin ? "/admin/timesheets" : "/dashboard";
    case "invite_accepted":
      return "/admin/invites";
    case "manual_log_requested":
      return "/admin/timesheets";
    case "manual_log_approved":
    case "manual_log_rejected":
      return "/dashboard";
    default:
      return null;
  }
};

const NotificationBell = ({ position = "navbar" }) => {
  const user = useAuthStore((s) => s.user);
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNotificationClick = async (n) => {
    // Mark as read first
    if (!n.read) await markAsRead(n._id);

    const route = getRoute(n, user?.role);
    if (route) {
      setOpen(false);
      navigate(route);
    }
  };

  const dropdownClass =
    position === "sidebar"
      ? "fixed bottom-4 left-[264px] w-80"
      : "absolute right-0 top-full mt-2 w-80";

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={`${dropdownClass} bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-card z-50 animate-slide-up overflow-hidden`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-bold text-brand-500">
                  {unreadCount} new
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700/50">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell
                  size={24}
                  className="mx-auto text-slate-300 dark:text-slate-600 mb-2"
                />
                <p className="text-sm text-slate-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICON[n.type] || Bell;
                const colorClass =
                  TYPE_COLOR[n.type] || "text-slate-500 bg-slate-100";
                const isClickable = !!getRoute(n, user?.role);
                return (
                  <div
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                      isClickable ? "cursor-pointer" : "cursor-default"
                    } ${
                      !n.read
                        ? "bg-brand-50/40 dark:bg-brand-900/10 hover:bg-brand-50 dark:hover:bg-brand-900/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-700/30"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${colorClass}`}
                    >
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
