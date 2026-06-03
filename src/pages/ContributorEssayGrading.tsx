import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ClipboardCheck, RefreshCcw } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { fetchCurrentUserProfile, type UserProfile } from "../api/axiosClient";
import {
  fetchEssaySubmissionDetail,
  fetchPendingEssaySubmissions,
  gradeEssaySubmission,
  type EssaySubmissionDetail,
  type EssaySubmissionSummary,
} from "../api/essayGradingClient";

const formatDateTime = (value?: string) => {
  if (!value) {
    return "Chưa rõ";
  }

  return new Date(value).toLocaleString("vi-VN");
};

const ContributorEssayGrading: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [submissions, setSubmissions] = useState<EssaySubmissionSummary[]>([]);
  const [selectedSubmission, setSelectedSubmission] =
    useState<EssaySubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scoreInput, setScoreInput] = useState("");
  const [feedback, setFeedback] = useState("");

  const canGradeEssays = profile?.role === "CONTRIBUTOR";
  const maxScore = useMemo(
    () =>
      selectedSubmission?.maxScore ??
      selectedSubmission?.scoreWeight ??
      undefined,
    [selectedSubmission?.maxScore, selectedSubmission?.scoreWeight],
  );

  const loadPendingSubmissions = async () => {
    try {
      setLoading(true);
      const profileData = await fetchCurrentUserProfile();
      setProfile(profileData);

      if (profileData.role !== "CONTRIBUTOR") {
        setSubmissions([]);
        return;
      }

      const pendingData = await fetchPendingEssaySubmissions();
      setSubmissions(pendingData);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được danh sách bài tự luận.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPendingSubmissions();
  }, []);

  const openSubmission = async (submissionId: number) => {
    try {
      setDetailLoading(true);
      const detail = await fetchEssaySubmissionDetail(submissionId);
      setSelectedSubmission(detail);
      setScoreInput(
        typeof detail.score === "number" ? String(detail.score) : "",
      );
      setFeedback(detail.feedback ?? "");
    } catch (error) {
      console.error(error);
      toast.error("Không tải được chi tiết bài tự luận.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubmitGrade = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedSubmission) {
      return;
    }

    const score = Number(scoreInput);
    if (!Number.isFinite(score) || score < 0) {
      toast.error("Điểm phải là số không âm.");
      return;
    }

    if (typeof maxScore === "number" && score > maxScore) {
      toast.error(`Điểm không được vượt quá ${maxScore}.`);
      return;
    }

    try {
      setSubmitting(true);
      await gradeEssaySubmission(selectedSubmission.id, {
        score,
        feedback: feedback.trim(),
      });
      toast.success("Đã lưu điểm tự luận.");
      setSelectedSubmission(null);
      setScoreInput("");
      setFeedback("");
      await loadPendingSubmissions();
    } catch (error) {
      console.error(error);
      toast.error("Không thể lưu điểm tự luận.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-cyan-700">
                <ClipboardCheck className="h-3.5 w-3.5" />
                Essay Grading
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                Chấm tự luận
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Xem các bài đang chờ chấm, đối chiếu đáp án mẫu và gửi điểm
                kèm feedback cho học viên.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadPendingSubmissions()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-cyan-300 hover:text-cyan-700"
            >
              <RefreshCcw className="h-4 w-4" />
              Làm mới
            </button>
          </div>
        </section>

        {!loading && !canGradeEssays ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            Tính năng này chỉ dành cho tài khoản Contributor.
          </section>
        ) : null}

        {canGradeEssays ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">
                  Bài chờ chấm
                </h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {submissions.length}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {loading ? (
                  <p className="text-sm text-slate-500">
                    Đang tải danh sách...
                  </p>
                ) : submissions.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Hiện không có bài tự luận nào đang chờ chấm.
                  </p>
                ) : (
                  submissions.map((submission) => {
                    const active = selectedSubmission?.id === submission.id;
                    return (
                      <button
                        key={submission.id}
                        type="button"
                        onClick={() => void openSubmission(submission.id)}
                        className={`w-full rounded-xl border p-4 text-left transition ${
                          active
                            ? "border-cyan-400 bg-cyan-50"
                            : "border-slate-200 bg-white hover:border-cyan-300 hover:bg-cyan-50/40"
                        }`}
                      >
                        <p className="font-semibold text-slate-900">
                          {submission.studentName}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {submission.examTitle}
                        </p>
                        <p className="mt-2 text-xs font-medium text-slate-500">
                          Nộp lúc {formatDateTime(submission.submittedAt)}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Chi tiết bài làm
              </h2>

              {detailLoading ? (
                <p className="mt-4 text-sm text-slate-500">
                  Đang tải chi tiết...
                </p>
              ) : selectedSubmission ? (
                <form onSubmit={handleSubmitGrade} className="mt-4 space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Câu hỏi
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
                      {selectedSubmission.questionContent ??
                        selectedSubmission.question ??
                        selectedSubmission.questionPreview ??
                        "Không có nội dung câu hỏi."}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Bài làm của học viên
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
                      {selectedSubmission.essayAnswer?.trim() ||
                        "Học viên chưa nhập câu trả lời."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                        Đáp án mẫu
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-emerald-950">
                        {selectedSubmission.sampleAnswer?.trim() ||
                          "Chưa có đáp án mẫu."}
                      </p>
                    </div>
                    <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">
                        Hướng dẫn chấm
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-cyan-950">
                        {selectedSubmission.gradingGuide?.trim() ||
                          "Chưa có hướng dẫn chấm."}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[12rem_1fr]">
                    <div>
                      <label
                        htmlFor="essay-score"
                        className="block text-xs font-bold uppercase tracking-wide text-slate-500"
                      >
                        Điểm {typeof maxScore === "number" ? `/ ${maxScore}` : ""}
                      </label>
                      <input
                        id="essay-score"
                        type="number"
                        min="0"
                        max={maxScore}
                        step="0.25"
                        value={scoreInput}
                        onChange={(event) => setScoreInput(event.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="essay-feedback"
                        className="block text-xs font-bold uppercase tracking-wide text-slate-500"
                      >
                        Feedback
                      </label>
                      <textarea
                        id="essay-feedback"
                        value={feedback}
                        onChange={(event) => setFeedback(event.target.value)}
                        rows={4}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                        placeholder="Nhập nhận xét cho học viên..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-600/20 hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300"
                    >
                      {submitting ? "Đang lưu..." : "Lưu điểm"}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  Chọn một bài trong danh sách để bắt đầu chấm.
                </p>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
};

export default ContributorEssayGrading;
