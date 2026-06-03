import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Flag } from "lucide-react";
import toast from "react-hot-toast";
import MainLayout from "../components/MainLayout";
import CommentForm from "../components/CommentForm";
import CommentTree from "../components/CommentTree";
import ReportModal from "../components/ReportModal";
import ExamRatingStars from "../components/ExamRatingStars";
import { fetchAttemptResult, type AttemptResult } from "../api/examClient";
import {
  createComment,
  fetchCommentsByExam,
  type CommentNode,
} from "../api/commentClient";
import { resolveCommentSubmitErrorMessage } from "../api/commentHelpers";
import {
  fetchExamRatingSummary,
  submitExamRating,
  type ExamRatingSummary,
} from "../api/examRatingClient";
import { fetchCurrentUserProfile } from "../api/axiosClient";
import { formatAttemptStatus } from "../utils/statusLabels";

const ExamResult: React.FC = () => {
  const params = useParams();
  const attemptId = Number(params.attemptId || 0);

  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null);
  const [reportModalQuestion, setReportModalQuestion] =
    useState<AttemptResult["questionResults"][number] | null>(null);
  const [reportedQuestionIds, setReportedQuestionIds] = useState<Set<number>>(
    new Set(),
  );
  const [ratingSummary, setRatingSummary] = useState<ExamRatingSummary | null>(
    null,
  );
  const [isLoadingRating, setIsLoadingRating] = useState(false);
  const [isSavingRating, setIsSavingRating] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const loadComments = useCallback(async () => {
    if (!result?.examId) return;

    try {
      const data = await fetchCommentsByExam(result.examId);
      setComments(data);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được bình luận.");
    }
  }, [result?.examId]);

  const loadRating = useCallback(async () => {
    if (!result?.examId) return;

    try {
      setIsLoadingRating(true);
      const summary = await fetchExamRatingSummary(result.examId);
      setRatingSummary(summary);
      setSelectedRating(summary.userRating ?? 0);
    } catch (error) {
      console.error(error);
      setRatingSummary(null);
    } finally {
      setIsLoadingRating(false);
    }
  }, [result?.examId]);

  const handleRatingSubmit = async () => {
    if (!result?.examId) {
      return;
    }

    if (selectedRating < 1 || selectedRating > 5) {
      toast.error("Vui lòng chọn từ 1 đến 5 sao.");
      return;
    }

    try {
      setIsSavingRating(true);
      const updated = await submitExamRating({
        examId: result.examId,
        rating: selectedRating,
      });
      setRatingSummary(updated);
      setSelectedRating(updated.userRating ?? selectedRating);
      toast.success("Đã lưu đánh giá đề thi");
    } catch (error) {
      console.error(error);
      toast.error("Không thể lưu đánh giá.");
    } finally {
      setIsSavingRating(false);
    }
  };

  const handleCommentSubmit = async (
    content: string,
    parentId: number | null = null,
  ) => {
    if (!result?.examId) return;
    if (!currentUserId) {
      toast.error("Không xác định được người dùng hiện tại.");
      return;
    }

    const payload = {
      userId: currentUserId,
      targetId: result.examId,
      parentId,
      content,
    };

    try {
      await createComment(payload);
      toast.success("Gửi bình luận thành công");
      setReplyTargetId(null);
      await loadComments();
    } catch (error) {
      console.error(error);
      const errorMessage = resolveCommentSubmitErrorMessage(error);
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    if (!attemptId || Number.isNaN(attemptId)) {
      toast.error("Attempt ID không hợp lệ.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const [attemptResult, profileResult] = await Promise.allSettled([
          fetchAttemptResult(attemptId),
          fetchCurrentUserProfile(),
        ]);

        if (attemptResult.status === "rejected") {
          throw attemptResult.reason;
        }

        setResult(attemptResult.value);
        if (profileResult.status === "fulfilled") {
          setCurrentUserId(profileResult.value.id);
        } else {
          setCurrentUserId(null);
        }
      } catch {
        toast.error("Không tải được kết quả bài thi.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [attemptId]);

  useEffect(() => {
    if (result) {
      void loadComments();
      void loadRating();
    }
  }, [result, loadComments, loadRating]);

  if (loading) {
    return (
      <MainLayout>
        <p className="text-slate-500">Đang tải kết quả...</p>
      </MainLayout>
    );
  }

  if (!result) {
    return (
      <MainLayout>
        <p className="text-slate-500">Không có dữ liệu kết quả.</p>
      </MainLayout>
    );
  }

  const isEssayResult = (question: AttemptResult["questionResults"][number]) => {
    return question.questionType === "ESSAY";
  };

  return (
    <MainLayout>
      <div className="space-y-5">
        <header className="rounded-2xl border border-slate-200 bg-white p-5">
          <h1 className="text-2xl font-bold text-slate-900">
            Kết quả: {result.examTitle}
          </h1>
          <p className="mt-2 text-slate-600">
            Điểm:{" "}
            <span className="font-semibold">
              {result.scoreRaw}/{result.scoreMax}
            </span>{" "}
            ({result.scorePercent}%)
          </p>
          <p
            className={`mt-1 font-semibold ${result.passed ? "text-emerald-700" : "text-rose-700"}`}
          >
            {result.passed ? "Đạt" : "Chưa đạt"} (mốc đỗ: {result.passingScore})
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Trạng thái: {formatAttemptStatus(result.status)}
          </p>
          <Link
            to="/dashboard/exams"
            className="inline-block mt-3 text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            ← Quay lại kho đề
          </Link>

          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Đánh giá đề thi
                </p>
                <p className="text-sm text-amber-800">
                  {isLoadingRating
                    ? "Đang tải đánh giá..."
                    : ratingSummary
                      ? `${ratingSummary.ratingCount} lượt đánh giá`
                      : "Chưa có đánh giá"}
                </p>
              </div>
              <ExamRatingStars
                value={ratingSummary?.averageRating ?? 0}
                size="md"
                showValue
                valueLabel={
                  ratingSummary
                    ? `${ratingSummary.averageRating.toFixed(1)}/5`
                    : "0.0/5"
                }
                countLabel={
                  ratingSummary
                    ? `(${ratingSummary.ratingCount} lượt)`
                    : "(0 lượt)"
                }
              />
            </div>

            <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Chấm điểm đề thi sau khi làm xong
                </p>
                <p className="text-sm text-slate-600">
                  Bạn đã nộp bài, hãy chấm sao theo trải nghiệm thực tế của đề.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:items-end">
                <ExamRatingStars
                  value={selectedRating}
                  size="lg"
                  onChange={setSelectedRating}
                  disabled={isSavingRating}
                  showValue
                  valueLabel={
                    selectedRating > 0 ? `${selectedRating}/5` : "Chọn sao"
                  }
                />
                <button
                  type="button"
                  onClick={() => void handleRatingSubmit()}
                  disabled={isSavingRating}
                  className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
                >
                  {isSavingRating ? "Đang lưu..." : "Lưu đánh giá"}
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className="space-y-3">
          {result.questionResults.map((question, idx) => {
            const essay = isEssayResult(question);
            const essayAnswer = question.essayAnswer ?? question.textAnswer;
            const scoreValue = question.score ?? question.earnedScore;
            return (
            <article
              key={question.questionId}
              className={`rounded-xl border p-4 ${
                essay
                  ? "border-slate-200 bg-white"
                  : question.correct
                  ? "border-emerald-200 bg-emerald-50/30"
                  : "border-rose-200 bg-rose-50/30"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="font-semibold text-slate-900">
                  Câu {idx + 1}: {question.content}
                </h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {essay ? "Tự luận" : "Trắc nghiệm"}
                </span>
              </div>

              {essay ? (
                <div className="mt-2 space-y-2 text-sm text-slate-700">
                  {question.answerStatus === "PENDING_REVIEW" ? (
                    <p className="font-semibold text-amber-700">
                      Đang chờ contributor chấm bài
                    </p>
                  ) : (
                    <p>
                      Điểm:{" "}
                      <span className="font-semibold">
                        {scoreValue}/{question.maxScore}
                      </span>
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-sm mt-2 text-slate-700">
                    Điểm: {question.earnedScore}/{question.maxScore} •{" "}
                    <span
                      className={`font-bold ${question.correct ? "text-emerald-700" : "text-rose-700"}`}
                    >
                      {question.correct ? "Đúng" : "Sai"}
                    </span>
                  </p>
                  <p
                    className={`text-xs mt-1 ${question.correct ? "text-emerald-700" : "text-rose-700"}`}
                  >
                    Đáp án chọn:{" "}
                    {(question.selectedOptionIds ?? []).length > 0
                      ? (question.selectedOptionIds ?? [])
                          .map(
                            (optionId) =>
                              (question.options ?? []).find(
                                (option) => option.id === optionId,
                              )?.content || `#${optionId}`,
                          )
                          .join(", ")
                      : "Bỏ trống"}
                  </p>
                  <p className="text-xs mt-1 text-emerald-700">
                    Đáp án đúng:{" "}
                    {(question.correctOptionIds ?? [])
                      .map(
                        (optionId) =>
                          (question.options ?? []).find((option) => option.id === optionId)
                            ?.content || `#${optionId}`,
                      )
                      .join(", ")}
                  </p>
                </>
              )}

              {essayAnswer?.trim() ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white/80 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Câu trả lời tự luận
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                    {essayAnswer}
                  </p>
                </div>
              ) : null}

              {(question.teacherFeedback ?? question.feedback)?.trim() &&
              (!essay || question.answerStatus === "MANUALLY_GRADED") ? (
                <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">
                    Feedback chấm bài
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-cyan-900">
                    {question.teacherFeedback ?? question.feedback}
                  </p>
                </div>
              ) : null}

              {reportedQuestionIds.has(question.questionId) ? (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  <Flag className="h-3.5 w-3.5" />
                  Đã báo lỗi
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setReportModalQuestion(question)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-rose-600"
                >
                  <Flag className="h-3.5 w-3.5" />
                  Báo lỗi câu hỏi này
                </button>
              )}
            </article>
          );
          })}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Bình luận
          </h2>
          <CommentForm
            submitLabel="Gửi bình luận"
            onSubmit={(content) => handleCommentSubmit(content, null)}
          />
          <div className="mt-6 space-y-4">
            {comments.length === 0 ? (
              <p className="text-slate-500">Chưa có bình luận.</p>
            ) : (
              comments.map((comment) => (
                <CommentTree
                  key={comment.id}
                  comment={comment}
                  depth={0}
                  activeReplyTargetId={replyTargetId}
                  canReply={true}
                  onReply={(commentId) => setReplyTargetId(commentId)}
                  onCancelReply={() => setReplyTargetId(null)}
                  onSubmitReply={(content, parentId) =>
                    handleCommentSubmit(content, parentId)
                  }
                />
              ))
            )}
          </div>
        </section>
      </div>

      {reportModalQuestion && (
        <ReportModal
          questionId={reportModalQuestion.questionId}
          attemptId={result.attemptId}
          questionContent={reportModalQuestion.content}
          onClose={() => setReportModalQuestion(null)}
          onSuccess={() => {
            setReportedQuestionIds((previous) => {
              const next = new Set(previous);
              next.add(reportModalQuestion.questionId);
              return next;
            });
          }}
        />
      )}
    </MainLayout>
  );
};

export default ExamResult;
