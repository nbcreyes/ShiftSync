import { useState, useEffect } from "react";
import { ClipboardList, Check, X } from "lucide-react";
import {
  getPendingRequests,
  approveRequest,
  rejectRequest,
} from "../../api/manualLog";
import { formatDate, formatTime } from "../../utils/formatTime";
import toast from "react-hot-toast";
import Select from "../shared/Select";

const STATUS_STYLES = {
  pending:
    "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
  approved:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
  rejected: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
};

const ManualLogRequests = ({ onRequestReviewed }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [reviewModal, setReviewModal] = useState(null); // { request, action: 'approve'|'reject' }
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getPendingRequests({ status: statusFilter });
      setRequests(res.data);
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleReview = async () => {
    if (!reviewModal) return;
    setSubmitting(true);
    try {
      if (reviewModal.action === "approve") {
        await approveRequest(reviewModal.request._id, adminNote);
        toast.success("Request approved — time log created");
      } else {
        await rejectRequest(reviewModal.request._id, adminNote);
        toast.success("Request rejected");
      }
      setReviewModal(null);
      setAdminNote("");
      fetchRequests();
      if (onRequestReviewed) onRequestReviewed();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <>
      <div className="card shadow-soft overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
              <ClipboardList size={15} className="text-brand-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Manual Log Requests
              </h3>
              {statusFilter === "pending" && pendingCount > 0 && (
                <p className="text-xs text-amber-500 font-medium mt-0.5">
                  {pendingCount} pending review
                </p>
              )}
            </div>
          </div>

          {/* Status filter */}
          <Select
            options={[
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
            ]}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            className="w-36"
          />
        </div>

        {/* List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <ClipboardList
                size={24}
                className="mx-auto text-slate-300 dark:text-slate-600 mb-2"
              />
              <p className="text-sm text-slate-400">
                No {statusFilter} requests
              </p>
            </div>
          ) : (
            requests.map((r) => (
              <div
                key={r._id}
                className="px-5 py-4 flex items-start justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {r.userId?.name}
                    </span>
                    {r.userId?.department && (
                      <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                        {r.userId.department}
                      </span>
                    )}
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[r.status]}`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {formatDate(r.date)}
                    </span>
                    {" · "}
                    {formatTime(r.timeIn)} — {formatTime(r.timeOut)}
                  </p>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    "{r.reason}"
                  </p>
                  {r.adminNote && (
                    <p className="text-xs text-slate-400 mt-1 italic">
                      Admin note: "{r.adminNote}"
                    </p>
                  )}
                </div>

                {r.status === "pending" && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setReviewModal({ request: r, action: "approve" });
                        setAdminNote("");
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                      title="Approve"
                    >
                      <Check size={15} />
                    </button>
                    <button
                      onClick={() => {
                        setReviewModal({ request: r, action: "reject" });
                        setAdminNote("");
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                      title="Reject"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Review modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 shadow-card animate-slide-up">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              {reviewModal.action === "approve" ? "Approve" : "Reject"} Request
            </h3>
            <p className="text-xs text-slate-400 mb-1">
              {reviewModal.request.userId?.name} ·{" "}
              {formatDate(reviewModal.request.date)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {formatTime(reviewModal.request.timeIn)} —{" "}
              {formatTime(reviewModal.request.timeOut)}
            </p>

            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Note{" "}
              <span className="normal-case font-normal text-slate-400">
                (optional)
              </span>
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={3}
              placeholder={
                reviewModal.action === "approve"
                  ? "Add an optional note..."
                  : "Explain why this is being rejected..."
              }
              className="input-base resize-none w-full mb-4"
            />

            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setReviewModal(null);
                  setAdminNote("");
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={submitting}
                className={`flex-1 text-white text-sm font-medium rounded-xl py-2.5 transition-all active:scale-95 disabled:opacity-50 ${
                  reviewModal.action === "approve"
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {submitting
                  ? "Processing..."
                  : reviewModal.action === "approve"
                    ? "Approve & Create Log"
                    : "Reject Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ManualLogRequests;
