import { useState } from "react";
import {
  Shield,
  ShieldOff,
  UserX,
  ToggleLeft,
  ToggleRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { updateRole, deactivateUser, deleteUser } from "../../api/admin";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MemberTable = ({
  members,
  scheduleMap = {},
  onUpdate,
  onSetSchedule,
}) => {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(null);

  const handleRoleToggle = async (member) => {
    const newRole = member.role === "admin" ? "employee" : "admin";
    setLoading(member._id + "role");
    try {
      await updateRole(member._id, newRole);
      toast.success(`${member.name} is now ${newRole}`);
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    } finally {
      setLoading(null);
    }
  };

  const handleDeactivate = async (member) => {
    setLoading(member._id + "deactivate");
    try {
      await deactivateUser(member._id);
      toast.success(
        `${member.name} ${member.isActive ? "deactivated" : "activated"}`
      );
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (member) => {
    if (!confirm(`Delete ${member.name}? Their logs will be preserved.`))
      return;
    setLoading(member._id + "delete");
    try {
      await deleteUser(member._id);
      toast.success(`${member.name} deleted`);
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    } finally {
      setLoading(null);
    }
  };

  const tdStyle = { verticalAlign: "middle" };

  return (
    <div className="card shadow-soft overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          Members
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700/60">
              {[
                "Member",
                "Role",
                "Department",
                "Status",
                "Shift Schedule",
                user?.role === "owner" ? "Actions" : "",
              ]
                .filter(Boolean)
                .map((h) => (
                  <th
                    key={h}
                    className={`px-5 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ${
                      h === "Actions" ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {members.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-sm text-slate-400"
                >
                  No members found
                </td>
              </tr>
            )}
            {members.map((member) => {
              const schedule = scheduleMap[member._id];
              return (
                <tr
                  key={member._id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  {/* Member */}
                  <td className="px-5 py-4" style={tdStyle}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {member.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {member.name}
                        </p>
                        <p className="text-xs text-slate-400">{member.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-5 py-4" style={tdStyle}>
                    <span className="capitalize text-sm text-slate-600 dark:text-slate-300 font-medium">
                      {member.role}
                    </span>
                  </td>

                  {/* Department */}
                  <td
                    className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400"
                    style={tdStyle}
                  >
                    {member.department || "—"}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4" style={tdStyle}>
                    <span
                      className={`text-xs font-semibold ${
                        member.isActive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-500"
                      }`}
                    >
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Shift Schedule */}
                  <td className="px-5 py-4" style={tdStyle}>
                    {schedule ? (
                      <button
                        onClick={() => onSetSchedule(member)}
                        className="group flex items-center gap-2"
                      >
                        <CheckCircle2
                          size={12}
                          className="text-emerald-500 shrink-0"
                        />
                        <div className="text-left">
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-brand-500 transition-colors">
                            {schedule.startTime} — {schedule.endTime}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {DAY_LABELS.filter((_, i) =>
                              schedule.workDays.includes(i)
                            ).join(" · ")}
                          </p>
                        </div>
                      </button>
                    ) : (
                      <button
                        onClick={() => onSetSchedule(member)}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-500 transition-colors"
                      >
                        <Clock size={12} />
                        Set schedule
                      </button>
                    )}
                  </td>

                  {/* Actions */}
                  {user?.role === "owner" && (
                    <td className="px-5 py-4" style={tdStyle}>
                      {member.role !== "owner" && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleRoleToggle(member)}
                            disabled={loading === member._id + "role"}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                            title={
                              member.role === "admin"
                                ? "Demote to employee"
                                : "Promote to admin"
                            }
                          >
                            {member.role === "admin" ? (
                              <ShieldOff size={14} />
                            ) : (
                              <Shield size={14} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeactivate(member)}
                            disabled={loading === member._id + "deactivate"}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                            title={member.isActive ? "Deactivate" : "Activate"}
                          >
                            {member.isActive ? (
                              <ToggleRight size={14} />
                            ) : (
                              <ToggleLeft size={14} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(member)}
                            disabled={loading === member._id + "delete"}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete"
                          >
                            <UserX size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemberTable;