import React, { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import MainLayout from "../components/MainLayout";
import CommentForm from "../components/CommentForm";
import CommentTree from "../components/CommentTree";
import { fetchAttemptResult, type AttemptResult } from "../api/examClient";
import {
  createComment,
  fetchCommentsByExam,
  pinComment,
  type CommentNode,
  voteComment,
} from "../api/commentClient";

const ExamResult: React.FC = () => {
  const params = useParams();
  const attemptId = Number(params.attemptId || 0);

  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [userId] = useState(1); // Default user ID, adjust as needed
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null);

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

  const handleCommentSubmit = async (
    content: string,
    parentId: number | null = null,
  ) => {
    if (!result?.examId) return;
    const payload = {
      userId,
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
      toast.error("Gửi bình luận thất bại.");
    }
  };

  const handleVote = async (commentId: number, voteType: "UP" | "DOWN") => {
    try {
      await voteComment(commentId, voteType);
      await loadComments();
    } catch (error) {
      console.error(error);
      toast.error("Không thể cập nhật lượt thích.");
    }
  };

  const handleTogglePin = async (commentId: number, pinned: boolean) => {
    try {
      await pinComment(commentId, pinned);
      await loadComments();
    } catch (error) {
      console.error(error);
      toast.error("Không thể cập nhật trạng thái ghim.");
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
        const data = await fetchAttemptResult(attemptId);
        setResult(data);
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
    }
  }, [result, loadComments]);

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
            Trạng thái: {result.status}
          </p>
          <Link
            to="/dashboard/exams"
            className="inline-block mt-3 text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            ← Quay lại kho đề
          </Link>
        </header>

        <section className="space-y-3">
          {result.questionResults.map((question, idx) => (
            <article
              key={question.questionId}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <h2 className="font-semibold text-slate-900">
                Câu {idx + 1}: {question.content}
              </h2>
              <p className="text-sm mt-2 text-slate-600">
                Điểm: {question.earnedScore}/{question.maxScore} •{" "}
                {question.correct ? "Đúng" : "Sai"}
              </p>
              <p className="text-xs mt-1 text-slate-500">
                Đáp án chọn:{" "}
                {question.selectedOptionIds.length > 0
                  ? question.selectedOptionIds
                      .map(
                        (optionId) =>
                          question.options.find(
                            (option) => option.id === optionId,
                          )?.content || `#${optionId}`,
                      )
                      .join(", ")
                  : "Bỏ trống"}
              </p>
              <p className="text-xs mt-1 text-slate-500">
                Đáp án đúng:{" "}
                {question.correctOptionIds
                  .map(
                    (optionId) =>
                      question.options.find((option) => option.id === optionId)
                        ?.content || `#${optionId}`,
                  )
                  .join(", ")}
              </p>
            </article>
          ))}
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
                  canReply
                  onReply={(commentId) => setReplyTargetId(commentId)}
                  onCancelReply={() => setReplyTargetId(null)}
                  onSubmitReply={(content, parentId) =>
                    handleCommentSubmit(content, parentId)
                  }
                  onVote={handleVote}
                  onTogglePin={handleTogglePin}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default ExamResult;
