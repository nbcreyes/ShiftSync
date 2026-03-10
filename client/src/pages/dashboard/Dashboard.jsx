import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { getToday, getHistory } from "../../api/timelog";
import { getMyRemarks, getRemarkById } from "../../api/remark";
import { getMyManualRequests } from "../../api/manualLog";
import { getMyLeaves } from "../../api/leave";
import { getMyFlags } from "../../api/shift";
import { getWorkspace } from "../../api/admin";
import { getActiveAnnouncements } from "../../api/announcement";
import useSessionStore from "../../store/sessionStore";
import useAuthStore from "../../store/authStore";
import Sidebar from "../../components/shared/Sidebar";
import Navbar from "../../components/shared/Navbar";
import TimeTracker from "../../components/dashboard/TimeTracker";
import WeeklySummary from "../../components/dashboard/WeeklySummary";
import WeeklyChart from "../../components/dashboard/WeeklyChart";
import LogsTable from "../../components/dashboard/LogsTable";
import RemarkBanner from "../../components/dashboard/RemarkBanner";
import RemarkModal from "../../components/dashboard/RemarkModal";
import ManualLogModal from "../../components/dashboard/ManualLogModal";
import UpcomingLeaveWidget from "../../components/dashboard/UpcomingLeaveWidget";
import AttendanceStatsWidget from "../../components/dashboard/AttendanceStatsWidget";
import AnnouncementBanner from "../../components/dashboard/AnnouncementBanner";
import { PageSkeleton } from "../../components/shared/LoadingSkeleton";

const Dashboard = () => {
  const { setTodaySession, setTimezone } = useSessionStore();
  const user = useAuthStore((s) => s.user);
  const [weekLogs, setWeekLogs] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [allMonthLogs, setAllMonthLogs] = useState([]);
  const [remarks, setRemarks] = useState([]);
  const [manualRequests, setManualRequests] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [flags, setFlags] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedRemark, setSelectedRemark] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const getWeekRange = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      startDate: monday.toISOString().split("T")[0],
      endDate: sunday.toISOString().split("T")[0],
    };
  };

  const getMonthRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return {
      startDate: `${year}-${month}-01`,
      endDate: `${year}-${month}-${lastDay}`,
    };
  };

  const fetchAll = async (page = 1) => {
    try {
      if (user?.role === "admin" || user?.role === "owner") {
        try {
          const workspaceRes = await getWorkspace();
          if (workspaceRes?.data?.timezone) setTimezone(workspaceRes.data.timezone);
        } catch { /* fallback */ }
      }

      const { startDate: wStart, endDate: wEnd } = getWeekRange();
      const { startDate: mStart, endDate: mEnd } = getMonthRange();

      const [
        todayRes,
        weekRes,
        historyRes,
        monthRes,
        remarksRes,
        manualRes,
        leavesRes,
        flagsRes,
        announcementsRes,
      ] = await Promise.all([
        getToday(),
        getHistory({ startDate: wStart, endDate: wEnd, limit: 7 }),
        getHistory({ page, limit: 10 }),
        getHistory({ startDate: mStart, endDate: mEnd, limit: 31 }),
        getMyRemarks(),
        getMyManualRequests(),
        getMyLeaves(),
        getMyFlags({ startDate: mStart, endDate: mEnd }),
        getActiveAnnouncements(),
      ]);

      if (todayRes.data) {
        const { log, breaks, openBreak } = todayRes.data;
        setTodaySession(log, breaks, openBreak);
      } else {
        setTodaySession(null, [], null);
      }

      setWeekLogs(weekRes.data.logs || []);
      setHistoryLogs(historyRes.data.logs || []);
      setAllMonthLogs(monthRes.data.logs || []);
      setPagination({
        page: historyRes.data.page,
        pages: historyRes.data.pages,
        total: historyRes.data.total,
      });
      setRemarks(remarksRes.data || []);
      setManualRequests(manualRes.data || []);
      setLeaves(leavesRes.data || []);
      setFlags(flagsRes.data || []);
      setAnnouncements(announcementsRes.data || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll() }, []);

  const handleRemarkClick = async (log) => {
    try {
      const remark = remarks.find(
        (r) => r.logId?._id === log._id || r.logId === log._id,
      );
      if (remark) {
        const res = await getRemarkById(remark._id);
        setSelectedRemark(res.data);
      }
    } catch (err) {
      console.error("Failed to load remark:", err);
    }
  };

  const pendingManual = manualRequests.filter((r) => r.status === "pending");

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <main className="flex-1">
          <Navbar title="Dashboard" />
          <PageSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title="Dashboard" />
        <div className="p-6 space-y-5 max-w-5xl mx-auto animate-fade-in">

          <AnnouncementBanner announcements={announcements} />
          <RemarkBanner remarks={remarks} />

          {/* Pending manual log requests banner */}
          {pendingManual.length > 0 && (
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                  <ClipboardList size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                    {pendingManual.length} manual log request{pendingManual.length > 1 ? "s" : ""} pending
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-500 mt-0.5">
                    Waiting for admin approval
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <TimeTracker onSessionUpdate={() => fetchAll()} />
            <WeeklySummary logs={weekLogs} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <UpcomingLeaveWidget leaves={leaves} timezone={useSessionStore.getState().timezone} />
            <AttendanceStatsWidget logs={allMonthLogs} flags={flags} />
          </div>

          <WeeklyChart logs={weekLogs} />

          <LogsTable
            logs={historyLogs}
            total={pagination.total}
            page={pagination.page}
            pages={pagination.pages}
            onPageChange={(p) => fetchAll(p)}
            onRemarkClick={handleRemarkClick}
          />

          <div className="flex justify-end">
            <button
              onClick={() => setShowManualModal(true)}
              className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
            >
              <ClipboardList size={15} />
              Request Manual Log
            </button>
          </div>
        </div>
      </main>

      {selectedRemark && (
        <RemarkModal
          remark={selectedRemark}
          onClose={() => setSelectedRemark(null)}
          onUpdate={() => { fetchAll(); setSelectedRemark(null) }}
        />
      )}

      {showManualModal && (
        <ManualLogModal
          onClose={() => setShowManualModal(false)}
          onSubmitted={() => fetchAll()}
        />
      )}
    </div>
  );
};

export default Dashboard;