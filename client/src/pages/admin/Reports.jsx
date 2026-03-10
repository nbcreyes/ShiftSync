import { useState } from "react";
import {
  BarChart3,
  Users,
  Download,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Activity,
} from "lucide-react";
import {
  getSummaryReport,
  getDepartmentReport,
  exportCSV,
} from "../../api/admin";
import useSessionStore from "../../store/sessionStore";
import Sidebar from "../../components/shared/Sidebar";
import Navbar from "../../components/shared/Navbar";
import DatePicker from "../../components/shared/DatePicker";
import Select from "../../components/shared/Select";
import api from "../../api/axios";
import toast from "react-hot-toast";

const PRESET_RANGES = [
  { label: "This Week", value: "this-week" },
  { label: "Last Week", value: "last-week" },
  { label: "This Month", value: "this-month" },
  { label: "Last Month", value: "last-month" },
  { label: "Custom", value: "custom" },
];

const getPresetRange = (preset) => {
  const now = new Date();
  const toISO = (d) => d.toISOString().split("T")[0];

  if (preset === "this-week") {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { startDate: toISO(monday), endDate: toISO(sunday) };
  }
  if (preset === "last-week") {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff - 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { startDate: toISO(monday), endDate: toISO(sunday) };
  }
  if (preset === "this-month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate: toISO(start), endDate: toISO(end) };
  }
  if (preset === "last-month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { startDate: toISO(start), endDate: toISO(end) };
  }
  return { startDate: "", endDate: "" };
};

const StatCard = ({ icon: Icon, label, value, color = "brand" }) => {
  const colors = {
    brand: "bg-brand-50 dark:bg-brand-900/30 text-brand-500",
    emerald: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500",
    amber: "bg-amber-50 dark:bg-amber-900/30 text-amber-500",
    red: "bg-red-50 dark:bg-red-900/30 text-red-500",
  };
  return (
    <div className="card shadow-soft p-5 flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}
      >
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          {label}
        </p>
        <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
          {value}
        </p>
      </div>
    </div>
  );
};

const AttendanceBadge = ({ rate }) => {
  if (rate === null) return <span className="text-xs text-slate-400">—</span>;
  const color =
    rate >= 90
      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
      : rate >= 70
        ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
        : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${color}`}>
      {rate}%
    </span>
  );
};

// ─── Flag Trends Chart (pure CSS/div bars) ────────────────────────────────────
const FlagTrendsChart = ({ weeks, users, selectedUserId }) => {
  const filtered = selectedUserId
    ? users.filter((u) => u._id === selectedUserId)
    : users;

  if (weeks.length === 0 || filtered.length === 0) {
    return (
      <div className="py-14 flex flex-col items-center gap-2 text-center">
        <Activity size={22} className="text-slate-300 dark:text-slate-600" />
        <p className="text-sm text-slate-400">No flag data for this period</p>
      </div>
    );
  }

  // Compute per-week totals across selected users
  const weekData = weeks.map((week) => {
    let late = 0,
      absent = 0;
    filtered.forEach((u) => {
      const w = u.weeks[week] || { late: 0, absent: 0 };
      late += w.late;
      absent += w.absent;
    });
    return { week, late, absent, total: late + absent };
  });

  const maxTotal = Math.max(...weekData.map((w) => w.total), 1);

  // Per-user breakdown table
  const userRows = filtered
    .map((u) => {
      const totalLate = weeks.reduce(
        (sum, w) => sum + (u.weeks[w]?.late || 0),
        0,
      );
      const totalAbsent = weeks.reduce(
        (sum, w) => sum + (u.weeks[w]?.absent || 0),
        0,
      );
      return { ...u, totalLate, totalAbsent };
    })
    .sort(
      (a, b) => b.totalLate + b.totalAbsent - (a.totalLate + a.totalAbsent),
    );

  return (
    <div className="space-y-6">
      {/* Bar chart */}
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
          Weekly Flag Totals{" "}
          {selectedUserId ? `— ${filtered[0]?.name}` : "— All Employees"}
        </p>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-amber-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Late
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Absent
            </span>
          </div>
        </div>

        <div
          className="flex items-end gap-3 overflow-x-auto pb-2"
          style={{ height: "140px", alignItems: "flex-end" }}
        >
          {weekData.map(({ week, late, absent, total }) => {
            const BAR_MAX_PX = 96;
            const totalPx =
              total > 0
                ? Math.max(Math.round((total / maxTotal) * BAR_MAX_PX), 4)
                : 0;
            const latePx = total > 0 ? Math.round((late / total) * totalPx) : 0;
            const absentPx = totalPx - latePx;
            return (
              <div
                key={week}
                className="flex flex-col items-center gap-1 shrink-0"
                style={{ width: "60px" }}
              >
                {/* Count label above bar */}
                <span
                  className="text-[10px] font-semibold text-slate-500 dark:text-slate-400"
                  style={{ height: "14px" }}
                >
                  {total > 0 ? total : ""}
                </span>
                {/* Stacked bar */}
                <div
                  className="w-8 rounded-t-md overflow-hidden"
                  style={{
                    height: `${totalPx}px`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      height: `${absentPx}px`,
                      backgroundColor: "rgb(248 113 113)",
                    }}
                  />
                  <div
                    style={{
                      height: `${latePx}px`,
                      backgroundColor: "rgb(251 191 36)",
                    }}
                  />
                </div>
                {/* Week label */}
                <span className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-tight whitespace-nowrap">
                  {week}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-user breakdown */}
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          Employee Breakdown
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700/60">
                <th className="py-2 px-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Employee
                </th>
                <th className="py-2 px-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Dept
                </th>
                {weeks.map((w) => (
                  <th
                    key={w}
                    className="py-2 px-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap"
                  >
                    {w}
                  </th>
                ))}
                <th className="py-2 px-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Late
                </th>
                <th className="py-2 px-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Absent
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {userRows.map((u) => (
                <tr
                  key={u._id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/20"
                >
                  <td
                    className="py-2.5 px-3"
                    style={{ verticalAlign: "middle" }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                        {u.name}
                      </span>
                    </div>
                  </td>
                  <td
                    className="py-2.5 px-3 text-xs text-slate-400"
                    style={{ verticalAlign: "middle" }}
                  >
                    {u.department || "—"}
                  </td>
                  {weeks.map((w) => {
                    const cell = u.weeks[w] || { late: 0, absent: 0 };
                    const hasFlag = cell.late > 0 || cell.absent > 0;
                    return (
                      <td
                        key={w}
                        className="py-2.5 px-3 text-center"
                        style={{ verticalAlign: "middle" }}
                      >
                        {hasFlag ? (
                          <div className="flex items-center justify-center gap-0.5">
                            {cell.late > 0 && (
                              <span className="text-[10px] font-semibold text-amber-500 bg-amber-50 dark:bg-amber-900/20 rounded px-1">
                                L{cell.late}
                              </span>
                            )}
                            {cell.absent > 0 && (
                              <span className="text-[10px] font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 rounded px-1">
                                A{cell.absent}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-200 dark:text-slate-700">
                            ·
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td
                    className="py-2.5 px-3 text-center"
                    style={{ verticalAlign: "middle" }}
                  >
                    <span
                      className={`text-xs font-semibold ${u.totalLate > 0 ? "text-amber-500" : "text-slate-300 dark:text-slate-600"}`}
                    >
                      {u.totalLate}
                    </span>
                  </td>
                  <td
                    className="py-2.5 px-3 text-center"
                    style={{ verticalAlign: "middle" }}
                  >
                    <span
                      className={`text-xs font-semibold ${u.totalAbsent > 0 ? "text-red-500" : "text-slate-300 dark:text-slate-600"}`}
                    >
                      {u.totalAbsent}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Reports = () => {
  const { timezone } = useSessionStore();
  const [tab, setTab] = useState("employee");
  const [preset, setPreset] = useState("this-month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [summaryData, setSummaryData] = useState([]);
  const [deptData, setDeptData] = useState([]);
  const [flagData, setFlagData] = useState(null); // { weeks, users }
  const [selectedFlagUser, setSelectedFlagUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [exporting, setExporting] = useState(false);

  const getRange = () => {
    if (preset === "custom")
      return { startDate: customStart, endDate: customEnd };
    return getPresetRange(preset);
  };

  const handleGenerate = async () => {
    const { startDate, endDate } = getRange();
    if (!startDate || !endDate) {
      toast.error("Please select a valid date range");
      return;
    }
    if (startDate > endDate) {
      toast.error("Start date must be before end date");
      return;
    }

    setLoading(true);
    try {
      const [summaryRes, deptRes, flagRes] = await Promise.all([
        getSummaryReport({ startDate, endDate }),
        getDepartmentReport({ startDate, endDate }),
        api.get("/api/admin/reports/flags", {
          params: { startDate, endDate, timezone },
        }),
      ]);
      setSummaryData(summaryRes.data);
      setDeptData(deptRes.data);
      setFlagData(flagRes.data);
      setSelectedFlagUser("");
      setHasFetched(true);
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    const { startDate, endDate } = getRange();
    if (!startDate || !endDate) return;
    setExporting(true);
    try {
      const res = await exportCSV({ startDate, endDate });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `shiftsync-report-${startDate}-${endDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const totalPresent = summaryData.reduce((a, r) => a + r.daysPresent, 0);
  const totalAbsent = summaryData.reduce((a, r) => a + r.daysAbsent, 0);
  const totalLate = summaryData.reduce((a, r) => a + r.daysLate, 0);
  const avgAttendance =
    summaryData.length > 0
      ? Math.round(
          summaryData
            .filter((r) => r.attendanceRate !== null)
            .reduce((a, r) => a + r.attendanceRate, 0) /
            summaryData.filter((r) => r.attendanceRate !== null).length,
        )
      : null;

  const flagUserOptions = flagData
    ? [
        { value: "", label: "All Employees" },
        ...flagData.users.map((u) => ({ value: u._id, label: u.name })),
      ]
    : [];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title="Reports" />
        <div className="p-6 space-y-5 max-w-6xl mx-auto animate-fade-in">
          {/* Filters */}
          <div className="card shadow-soft p-5">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-44">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Period
                </label>
                <Select
                  options={PRESET_RANGES}
                  value={preset}
                  onChange={setPreset}
                />
              </div>
              {preset === "custom" && (
                <>
                  <div className="w-44">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                      Start Date
                    </label>
                    <DatePicker
                      value={customStart}
                      onChange={setCustomStart}
                      maxDate={new Date().toISOString().split("T")[0]}
                      placeholder="Start date"
                    />
                  </div>
                  <div className="w-44">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                      End Date
                    </label>
                    <DatePicker
                      value={customEnd}
                      onChange={setCustomEnd}
                      maxDate={new Date().toISOString().split("T")[0]}
                      placeholder="End date"
                    />
                  </div>
                </>
              )}
              <div className="flex gap-2 ml-auto">
                {hasFetched && (
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Download size={14} />
                    {exporting ? "Exporting..." : "Export CSV"}
                  </button>
                )}
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  <BarChart3 size={14} />
                  {loading ? "Generating..." : "Generate"}
                </button>
              </div>
            </div>
          </div>

          {hasFetched && (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={CheckCircle2}
                  label="Total Present"
                  value={totalPresent}
                  color="emerald"
                />
                <StatCard
                  icon={AlertTriangle}
                  label="Total Absent"
                  value={totalAbsent}
                  color="red"
                />
                <StatCard
                  icon={Clock}
                  label="Late Arrivals"
                  value={totalLate}
                  color="amber"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Avg Attendance"
                  value={avgAttendance !== null ? `${avgAttendance}%` : "—"}
                  color="brand"
                />
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
                {[
                  { key: "employee", label: "By Employee", icon: Users },
                  {
                    key: "department",
                    label: "By Department",
                    icon: BarChart3,
                  },
                  { key: "flags", label: "Flag Trends", icon: Activity },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                      tab === key
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-soft"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Employee Table */}
              {tab === "employee" && (
                <div className="card shadow-soft overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Employee Summary
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-700/60">
                          {[
                            "Employee",
                            "Department",
                            "Present",
                            "Absent",
                            "Late",
                            "Avg Hours",
                            "Total Hours",
                            "OT Days",
                            "Attendance",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-5 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-left"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {summaryData.length === 0 ? (
                          <tr>
                            <td
                              colSpan={9}
                              className="px-5 py-12 text-center text-sm text-slate-400"
                            >
                              No data found for this period
                            </td>
                          </tr>
                        ) : (
                          summaryData.map((row) => (
                            <tr
                              key={row.user._id}
                              className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                            >
                              <td
                                className="px-5 py-3.5"
                                style={{ verticalAlign: "middle" }}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {row.user.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                                      {row.user.name}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      {row.user.email}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td
                                className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400"
                                style={{ verticalAlign: "middle" }}
                              >
                                {row.user.department || "—"}
                              </td>
                              <td
                                className="px-5 py-3.5"
                                style={{ verticalAlign: "middle" }}
                              >
                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                  {row.daysPresent}
                                </span>
                              </td>
                              <td
                                className="px-5 py-3.5"
                                style={{ verticalAlign: "middle" }}
                              >
                                <span
                                  className={`text-xs font-semibold ${row.daysAbsent > 0 ? "text-red-500" : "text-slate-400"}`}
                                >
                                  {row.daysAbsent}
                                </span>
                              </td>
                              <td
                                className="px-5 py-3.5"
                                style={{ verticalAlign: "middle" }}
                              >
                                <span
                                  className={`text-xs font-semibold ${row.daysLate > 0 ? "text-amber-500" : "text-slate-400"}`}
                                >
                                  {row.daysLate}
                                </span>
                              </td>
                              <td
                                className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300 font-medium"
                                style={{ verticalAlign: "middle" }}
                              >
                                {row.avgWorkedHours}h
                              </td>
                              <td
                                className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300 font-medium"
                                style={{ verticalAlign: "middle" }}
                              >
                                {row.totalWorkedHours}h
                              </td>
                              <td
                                className="px-5 py-3.5"
                                style={{ verticalAlign: "middle" }}
                              >
                                <span
                                  className={`text-xs font-semibold ${row.overtimeDays > 0 ? "text-red-500" : "text-slate-400"}`}
                                >
                                  {row.overtimeDays}
                                </span>
                              </td>
                              <td
                                className="px-5 py-3.5"
                                style={{ verticalAlign: "middle" }}
                              >
                                <AttendanceBadge rate={row.attendanceRate} />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Department Table */}
              {tab === "department" && (
                <div className="card shadow-soft overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Department Summary
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-700/60">
                          {[
                            "Department",
                            "Members",
                            "Total Logs",
                            "Total Hours",
                            "Avg Hours/Log",
                            "OT Days",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-5 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-left"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {deptData.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-5 py-12 text-center text-sm text-slate-400"
                            >
                              No data found for this period
                            </td>
                          </tr>
                        ) : (
                          deptData.map((row) => (
                            <tr
                              key={row.department}
                              className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                            >
                              <td
                                className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-200 text-sm"
                                style={{ verticalAlign: "middle" }}
                              >
                                {row.department}
                              </td>
                              <td
                                className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400"
                                style={{ verticalAlign: "middle" }}
                              >
                                {row.memberCount}
                              </td>
                              <td
                                className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300 font-medium"
                                style={{ verticalAlign: "middle" }}
                              >
                                {row.totalLogs}
                              </td>
                              <td
                                className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300 font-medium"
                                style={{ verticalAlign: "middle" }}
                              >
                                {row.totalWorkedHours}h
                              </td>
                              <td
                                className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300 font-medium"
                                style={{ verticalAlign: "middle" }}
                              >
                                {row.avgWorkedHoursPerLog}h
                              </td>
                              <td
                                className="px-5 py-3.5"
                                style={{ verticalAlign: "middle" }}
                              >
                                <span
                                  className={`text-xs font-semibold ${row.overtimeDays > 0 ? "text-red-500" : "text-slate-400"}`}
                                >
                                  {row.overtimeDays}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Flag Trends */}
              {tab === "flags" && flagData && (
                <div className="card shadow-soft overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Flag Trends
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Late arrivals and absences by week
                      </p>
                    </div>
                    {flagData.users.length > 0 && (
                      <div className="w-52">
                        <Select
                          options={flagUserOptions}
                          value={selectedFlagUser}
                          onChange={setSelectedFlagUser}
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <FlagTrendsChart
                      weeks={flagData.weeks}
                      users={flagData.users}
                      selectedUserId={selectedFlagUser}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {!hasFetched && !loading && (
            <div className="card shadow-soft py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <BarChart3 size={22} className="text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Select a period and generate your report
              </p>
              <p className="text-xs text-slate-400">
                Employee attendance, hours worked, department breakdowns, and
                flag trends
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Reports;
