import { useState, useEffect } from "react";
import { getUsers, getWorkspace, updateWorkspace } from "../../api/admin";
import { getAllSchedules } from "../../api/shift";
import useSessionStore from "../../store/sessionStore";
import Sidebar from "../../components/shared/Sidebar";
import Navbar from "../../components/shared/Navbar";
import MemberTable from "../../components/admin/MemberTable";
import ShiftScheduleModal from "../../components/admin/ShiftScheduleModal";
import toast from "react-hot-toast";
import Select from "../../components/shared/Select";

// Common IANA timezones for the dropdown
const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Manila",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Pacific/Auckland",
  "Pacific/Honolulu",
];

const MemberManagement = () => {
  const { setTimezone } = useSessionStore();
  const [members, setMembers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [workspace, setWorkspace] = useState({
    companyName: "",
    timezone: "UTC",
  });
  const [editForm, setEditForm] = useState({
    companyName: "",
    timezone: "UTC",
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shiftModalUser, setShiftModalUser] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [membersRes, schedulesRes, workspaceRes] = await Promise.all([
        getUsers(),
        getAllSchedules(),
        getWorkspace(),
      ]);
      setMembers(membersRes.data);
      setSchedules(schedulesRes.data);
      setWorkspace(workspaceRes.data);
      setEditForm(workspaceRes.data);

      // Sync workspace timezone into session store
      if (workspaceRes.data.timezone) {
        setTimezone(workspaceRes.data.timezone);
      }
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSave = async () => {
    if (!editForm.companyName.trim()) {
      toast.error("Company name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await updateWorkspace({
        companyName: editForm.companyName,
        timezone: editForm.timezone,
      });
      setWorkspace(res.data);
      setTimezone(res.data.timezone);
      toast.success("Workspace settings updated");
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const scheduleMap = schedules.reduce((acc, s) => {
    const uid = s.userId?._id || s.userId;
    acc[uid] = s;
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title="Members" />
        <div className="p-6 space-y-5 max-w-5xl mx-auto animate-fade-in">
          {/* Workspace settings */}
          <div className="card shadow-soft p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Workspace Settings
              </h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="btn-secondary text-xs"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary text-xs"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setEditForm(workspace);
                    }}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              {/* Company name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Company Name
                </label>
                <input
                  type="text"
                  value={editForm.companyName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, companyName: e.target.value })
                  }
                  disabled={!editing}
                  placeholder="Enter company name"
                  className="input-base w-full disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Workspace Timezone
                </label>
                {editing ? (
                  <Select
                    options={TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
                    value={editForm.timezone}
                    onChange={(val) =>
                      setEditForm({ ...editForm, timezone: val })
                    }
                    className="w-full"
                  />
                ) : (
                  <input
                    type="text"
                    value={workspace.timezone}
                    disabled
                    className="input-base w-full opacity-50 cursor-not-allowed"
                  />
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="card shadow-soft p-5 space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 bg-slate-100 dark:bg-slate-700/50 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <MemberTable
              members={members}
              scheduleMap={scheduleMap}
              onUpdate={fetchAll}
              onSetSchedule={(member) => setShiftModalUser(member)}
            />
          )}
        </div>
      </main>

      {shiftModalUser && (
        <ShiftScheduleModal
          user={shiftModalUser}
          onClose={() => setShiftModalUser(null)}
          onSaved={fetchAll}
        />
      )}
    </div>
  );
};

export default MemberManagement;
