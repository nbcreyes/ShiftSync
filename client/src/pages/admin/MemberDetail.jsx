import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  AlertTriangle,
  Umbrella,
  TrendingUp,
} from "lucide-react";
import { getMemberDetail } from "../../api/admin";
import Sidebar from "../../components/shared/Sidebar";
import Navbar from "../../components/shared/Navbar";
import StatusBadge from "../../components/shared/StatusBadge";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import useSessionStore from "../../store/sessionStore";
import toast from "react-hot-toast";

const StatCard = ({ icon: Icon, label, value, color = "text-brand-500" }) => (
  <div className="card shadow-soft p-4 flex items-center gap-4">
    <div
      className={`w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center ${color}`}
    >
      <Icon size={18} />
    </div>
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-lg font-bold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  </div>
);

const SectionHeader = ({ title }) => (
  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
    {title}
  </h3>
);

const capitalize = (s) => s?.charAt(0).toUpperCase() + s?.slice(1);

const MemberDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { timezone } = useSessionStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("logs");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMemberDetail(id);
        setData(res.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load member");
        navigate("/admin/members");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const formatTime = (date) => {
    if (!date) return "—";
    try {
      return format(toZonedTime(new Date(date), timezone), "hh:mm a");
    } catch {
      return "—";
    }
  };

  const formatDate = (str) => {
    if (!str) return "—";
    try {
      return format(parseISO(str), "MMM d, yyyy");
    } catch {
      return str;
    }
  };

  const tabs = [
    { key: "logs", label: "Time Logs" },
    { key: "flags", label: "Flags" },
    { key: "leave", label: "Leave History" },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Navbar title="Member Detail" />
          <div className="p-6 space-y-4 max-w-5xl mx-auto">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-16 bg-slate-100 dark:bg-slate-700/50 rounded-xl animate-pulse"
              />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!data) return null;

  const { user, logs, leaves, shift, flags, stats } = data;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title="Member Detail" />
        <div className="p-6 space-y-5 max-w-5xl mx-auto animate-fade-in">
          {/* Back */}
          <button
            onClick={() => navigate("/admin/members")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft size={15} />
            Back to Members
          </button>

          {/* Profile card */}
          <div className="card shadow-soft p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {user.name}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      user.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {capitalize(user.role)}
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {user.email}
                </p>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  {user.department && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Dept:{" "}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {user.department}
                      </strong>
                    </span>
                  )}
                  {shift && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Shift:{" "}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {shift.startTime} – {shift.endTime}
                      </strong>
                    </span>
                  )}
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Joined:{" "}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {formatDate(user.createdAt)}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={Clock}
              label="Days Logged"
              value={stats.totalDaysLogged}
            />
            <StatCard
              icon={TrendingUp}
              label="Avg Hours/Day"
              value={`${stats.avgWorkedHours}h`}
              color="text-green-500"
            />
            <StatCard
              icon={AlertTriangle}
              label="Total Flags"
              value={stats.totalFlags}
              color="text-amber-500"
            />
            <StatCard
              icon={Umbrella}
              label="Approved Leaves"
              value={stats.approvedLeaves}
              color="text-blue-500"
            />
          </div>

          {/* Tabs */}
          <div className="card shadow-soft overflow-hidden">
            <div className="flex border-b border-slate-200 dark:border-slate-700/60">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? "text-brand-500 border-b-2 border-brand-500 -mb-px"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {/* Time Logs tab */}
              {activeTab === "logs" && (
                <>
                  <SectionHeader title="Recent Time Logs (last 30)" />
                  {logs.length === 0 ? (
                    <p className="text-sm text-slate-400">No logs found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700/60">
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Date
                            </th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              In
                            </th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Out
                            </th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Break
                            </th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Status
                            </th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              OT
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {logs.map((log) => (
                            <tr
                              key={log._id}
                              className="border-b border-slate-100 dark:border-slate-700/40 hover:bg-slate-50 dark:hover:bg-slate-700/20"
                            >
                              <td
                                className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300"
                                style={{ verticalAlign: "middle" }}
                              >
                                {formatDate(log.date)}
                              </td>
                              <td
                                className="py-2.5 px-3 text-slate-600 dark:text-slate-400"
                                style={{ verticalAlign: "middle" }}
                              >
                                {formatTime(log.timeIn)}
                              </td>
                              <td
                                className="py-2.5 px-3 text-slate-600 dark:text-slate-400"
                                style={{ verticalAlign: "middle" }}
                              >
                                {formatTime(log.timeOut)}
                              </td>
                              <td
                                className="py-2.5 px-3 text-slate-600 dark:text-slate-400"
                                style={{ verticalAlign: "middle" }}
                              >
                                {log.totalBreakMins ?? 0}m
                              </td>
                              <td
                                className="py-2.5 px-3"
                                style={{ verticalAlign: "middle" }}
                              >
                                <StatusBadge status={log.status} />
                              </td>
                              <td
                                className="py-2.5 px-3"
                                style={{ verticalAlign: "middle" }}
                              >
                                {log.overtime ? (
                                  <span className="text-xs font-semibold text-orange-500">
                                    Yes
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400">
                                    —
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* Flags tab */}
              {activeTab === "flags" && (
                <>
                  <SectionHeader title="Attendance Flags" />
                  {flags.length === 0 ? (
                    <p className="text-sm text-slate-400">No flags found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700/60">
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Date
                            </th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Status
                            </th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              In
                            </th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Note
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {flags.map((flag) => (
                            <tr
                              key={flag._id}
                              className="border-b border-slate-100 dark:border-slate-700/40 hover:bg-slate-50 dark:hover:bg-slate-700/20"
                            >
                              <td
                                className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300"
                                style={{ verticalAlign: "middle" }}
                              >
                                {formatDate(flag.date)}
                              </td>
                              <td
                                className="py-2.5 px-3"
                                style={{ verticalAlign: "middle" }}
                              >
                                <StatusBadge status={flag.status} />
                              </td>
                              <td
                                className="py-2.5 px-3 text-slate-600 dark:text-slate-400"
                                style={{ verticalAlign: "middle" }}
                              >
                                {formatTime(flag.timeIn)}
                              </td>
                              <td
                                className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-xs"
                                style={{ verticalAlign: "middle" }}
                              >
                                {flag.adminNote || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* Leave History tab */}
              {activeTab === "leave" && (
                <>
                  <SectionHeader title="Leave History" />
                  {/* Balance summary */}
                  {data.balance && (
                    <div className="flex gap-3 flex-wrap mb-4">
                      {["vacation", "sick", "personal"].map((type) => {
                        const b = data.balance.balances[type];
                        const remaining = b.allowed - b.used;
                        return (
                          <div
                            key={type}
                            className="bg-slate-50 dark:bg-slate-700/40 rounded-xl px-3 py-2 min-w-[100px]"
                          >
                            <p className="text-[10px] font-semibold text-slate-400 uppercase capitalize">
                              {type}
                            </p>
                            {b.allowed === 0 ? (
                              <p className="text-xs text-slate-400 mt-0.5">
                                Not set
                              </p>
                            ) : (
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                                {remaining}
                                <span className="text-xs font-normal text-slate-400">
                                  {" "}
                                  / {b.allowed}d
                                </span>
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {leaves.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      No leave requests found.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700/60">
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Type
                            </th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              From
                            </th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              To
                            </th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Status
                            </th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Reviewed by
                            </th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Note
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaves.map((leave) => (
                            <tr
                              key={leave._id}
                              className="border-b border-slate-100 dark:border-slate-700/40 hover:bg-slate-50 dark:hover:bg-slate-700/20"
                            >
                              <td
                                className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300"
                                style={{ verticalAlign: "middle" }}
                              >
                                {capitalize(leave.type)}
                              </td>
                              <td
                                className="py-2.5 px-3 text-slate-600 dark:text-slate-400"
                                style={{ verticalAlign: "middle" }}
                              >
                                {formatDate(leave.startDate)}
                              </td>
                              <td
                                className="py-2.5 px-3 text-slate-600 dark:text-slate-400"
                                style={{ verticalAlign: "middle" }}
                              >
                                {formatDate(leave.endDate)}
                              </td>
                              <td
                                className="py-2.5 px-3"
                                style={{ verticalAlign: "middle" }}
                              >
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    leave.status === "approved"
                                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                      : leave.status === "rejected"
                                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                  }`}
                                >
                                  {capitalize(leave.status)}
                                </span>
                              </td>
                              <td
                                className="py-2.5 px-3 text-slate-500 dark:text-slate-400"
                                style={{ verticalAlign: "middle" }}
                              >
                                {leave.reviewedBy?.name || "—"}
                              </td>
                              <td
                                className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-xs"
                                style={{ verticalAlign: "middle" }}
                              >
                                {leave.adminNote || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MemberDetail;
