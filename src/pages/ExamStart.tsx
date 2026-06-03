import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import MainLayout from "../components/MainLayout";
import PremiumUpsellModal from "../components/PremiumUpsellModal";
import CommentForm from "../components/CommentForm";
import CommentTree from "../components/CommentTree";
import ExamRatingStars from "../components/ExamRatingStars";
import type { CommentNode } from "../api/commentClient";
import { createComment, fetchCommentsByExam } from "../api/commentClient";
import { resolveCommentSubmitErrorMessage } from "../api/commentHelpers";
import { fetchCurrentUserProfile, type UserProfile } from "../api/axiosClient";
import {
  fetchMyAttemptHistory,
  fetchPublicExamDetail,
  isAttemptResultAccessibleStatus,
  type AttemptSummary,
  type ExamSummary,
} from "../api/examClient";
import {
  fetchExamRatingSummary,
  type ExamRatingSummary,
} from "../api/examRatingClient";

const ExamStart: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const examId = Number(params.examId || 0);

  const [exam, setExam] = useState<ExamSummary | null>(null);
  const [examAttempts, setExamAttempts] = useState<AttemptSummary[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [ratingSummary, setRatingSummary] = useState<ExamRatingSummary | null>(
    null,
  );
  const [isLoadingRating, setIsLoadingRating] = useState(false);
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null);
  const userId = profile?.id ?? null;

  const loadComments = useCallback(async (examIdNumber: number) => {
    setIsLoadingComments(true);
    try {
      const data = await fetchCommentsByExam(examIdNumber);
      setComments(data);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được bình luận. Kiểm tra backend và CORS.");
    } finally {
      setIsLoadingComments(false);
    }
  }, []);

  const loadRating = useCallback(async (examIdNumber: number) => {
    setIsLoadingRating(true);
    try {
      const data = await fetchExamRatingSummary(examIdNumber);
      setRatingSummary(data);
    } catch (error) {
      console.error(error);
      setRatingSummary(null);
    } finally {
      setIsLoadingRating(false);
    }
  }, []);

  const handleCommentSubmit = async (
    content: string,
    parentId: number | null = null,
  ) => {
    if (!userId) {
      toast.error("Không xác định được người dùng hiện tại.");
      return;
    }

    const payload = {
      userId,
      targetId: examId,
      parentId,
      content,
    };

    try {
      await createComment(payload);
      toast.success("Gửi bình luận thành công");
      setReplyTargetId(null);
      await loadComments(examId);
    } catch (error) {
      console.error(error);
      const errorMessage = resolveCommentSubmitErrorMessage(error);
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    if (!examId || Number.isNaN(examId)) {
      toast.error("Exam ID không hợp lệ.");
      navigate("/dashboard/exams");
      return;
    }

    const load = async () => {
      try {
        setIsLoading(true);
        const [detail, attempts, profileData] = await Promise.all([
          fetchPublicExamDetail(examId),
          fetchMyAttemptHistory(),
          fetchCurrentUserProfile(),
        ]);

        setExam(detail);
        setProfile(profileData);
        setExamAttempts(
          attempts.filter((attempt) => attempt.examId === examId),
        );
        void loadComments(examId);
        void loadRating(examId);
      } catch {
        toast.error("Không thể tải thông tin đề thi.");
        navigate("/dashboard/exams");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [examId, navigate, loadComments, loadRating]);

  const stats = useMemo(() => {
    const totalAttempts = examAttempts.length;
    const bestPercent = examAttempts.reduce((best, current) => {
      const scorePercent = current.scorePercent ?? 0;
      return scorePercent > best ? scorePercent : best;
    }, 0);
    const latestSubmittedAt =
      examAttempts
        .map((attempt) => attempt.submittedAt)
        .filter((value): value is string => Boolean(value))
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ||
      null;

    return {
      totalAttempts,
      bestPercent,
      latestSubmittedAt,
    };
  }, [examAttempts]);

  const hasSubmittedAttempt = useMemo(
    () =>
      examAttempts.some((attempt) =>
        isAttemptResultAccessibleStatus(attempt.status),
      ),
    [examAttempts],
  );

  const isPremiumLocked = useMemo(() => {
    if (!exam?.premium) return false;
    return !profile?.premium;
  }, [exam?.premium, profile?.premium]);

  const openUpgrade = () => {
    navigate("/dashboard/subscription-payments");
  };

  if (isLoading) {
    return (
      <MainLayout>
        <p className="text-slate-500">Đang tải thông tin đề thi...</p>
      </MainLayout>
    );
  }

  if (!exam) {
    return (
      <MainLayout>
        <p className="text-slate-500">Không tìm thấy đề thi.</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold tracking-widest text-blue-600 uppercase">
            Exam Intro
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            {exam.title}
          </h1>
          <p className="mt-2 text-slate-600">
            {exam.description || "Không có mô tả cho đề thi này."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {exam.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
              >
                #{tag.name}
              </span>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500">Số câu hỏi</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {exam.totalQuestions}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500">Thời gian làm bài</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {exam.durationMinutes} phút
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500">Điểm đạt</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {exam.passingScore}
              </p>
            </div>
          </div>

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
              <div className="flex flex-wrap items-center gap-2">
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
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-amber-200 bg-white/70 p-4 text-sm text-amber-900">
              Đánh giá sao sẽ được mở ở trang kết quả sau khi bạn nộp bài.
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs text-slate-500">Số lần đã nộp đề này</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {stats.totalAttempts}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs text-slate-500">Điểm tốt nhất</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {stats.bestPercent.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs text-slate-500">Lần nộp gần nhất</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {stats.latestSubmittedAt
                ? new Date(stats.latestSubmittedAt).toLocaleString("vi-VN")
                : "Chưa có"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Nội dung câu hỏi sẽ chỉ hiển thị sau khi bấm Bắt đầu làm bài.
        </div>

        {exam.premium && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Đây là đề Premium</p>
            <p className="mt-1">
              {isPremiumLocked
                ? `Tài khoản hiện tại chưa có Premium. Bạn có thể xem thử ${exam.teaserQuestionCount} câu đầu ở trang làm bài.`
                : "Bạn đang có quyền Premium và có thể mở toàn bộ đề thi."}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/exams/${exam.id}/attempt`)}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {isPremiumLocked ? "Xem thử đề Premium" : "Bắt đầu làm bài"}
          </button>
          {isPremiumLocked && (
            <button
              type="button"
              onClick={() => setShowPremiumModal(true)}
              className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100"
            >
              Nâng cấp Premium
            </button>
          )}
          <Link
            to="/dashboard/exams"
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Quay lại kho đề
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                Bình luận
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Bình luận cho đề thi này
              </h2>
            </div>
            <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700">
              {comments.length} bình luận gốc
            </div>
          </div>

          {!hasSubmittedAttempt && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Bạn chỉ có thể bình luận sau khi nộp bài.
            </div>
          )}

          {hasSubmittedAttempt && (
            <div className="mt-6 rounded-3xl bg-slate-50 p-5 border border-slate-200">
              <CommentForm
                submitLabel="Gửi comment"
                onSubmit={(content) => handleCommentSubmit(content, null)}
              />
            </div>
          )}

          <div className="mt-6 space-y-4">
            {isLoadingComments ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                Đang tải bình luận...
              </div>
            ) : comments.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                Chưa có bình luận cho đề thi này.
              </div>
            ) : (
              comments.map((comment) => (
                <CommentTree
                  key={comment.id}
                  comment={comment}
                  depth={0}
                  activeReplyTargetId={replyTargetId}
                  canReply={hasSubmittedAttempt}
                  onReply={(commentId) => setReplyTargetId(commentId)}
                  onCancelReply={() => setReplyTargetId(null)}
                  onSubmitReply={(content, parentId) =>
                    handleCommentSubmit(content, parentId)
                  }
                />
              ))
            )}
          </div>
        </div>
      </div>

      <PremiumUpsellModal
        open={showPremiumModal}
        title="Nội dung này chỉ dành cho Premium"
        description="Bạn cần nâng cấp để mở toàn bộ câu hỏi và gửi bài thi cho đề này."
        teaserQuestionCount={exam.teaserQuestionCount}
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={openUpgrade}
      />
    </MainLayout>
  );
};

export default ExamStart;
