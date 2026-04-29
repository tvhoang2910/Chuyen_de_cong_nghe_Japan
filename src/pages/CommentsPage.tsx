import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import CommentForm from "../components/CommentForm";
import CommentTree from "../components/CommentTree";
import type { CommentNode } from "../api/commentClient";
import { createComment, fetchCommentsByExam } from "../api/commentClient";
import { resolveCommentSubmitErrorMessage } from "../api/commentHelpers";
import { fetchCurrentUserProfile } from "../api/axiosClient";

const CommentsPage = () => {
  const { examId } = useParams<{ examId: string }>();
  const examIdNumber = examId ? parseInt(examId) : 0;

  const [comments, setComments] = useState<CommentNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  const loadComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchCommentsByExam(examIdNumber);
      setComments(data);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được bình luận. Kiểm tra backend và CORS.");
    } finally {
      setIsLoading(false);
    }
  }, [examIdNumber]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await fetchCurrentUserProfile();
        setUserId(profile.id);
      } catch {
        setUserId(null);
      }
    };

    void loadProfile();
  }, []);

  const handleSubmit = async (content: string, parentId: number | null) => {
    if (!userId) {
      toast.error("Không xác định được người dùng hiện tại.");
      return;
    }

    const payload = {
      userId,
      targetId: examIdNumber,
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

  const topLevelCount = useMemo(() => comments.length, [comments]);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/50 border border-slate-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
              Comment & Reply
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Hệ thống bình luận cho đề thi #{examIdNumber}
            </h2>
          </div>
          <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700">
            {topLevelCount} bình luận gốc
          </div>
        </div>

        <div className="mt-8 grid gap-6">
          <div className="rounded-3xl bg-slate-50 p-5 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">
              Viết comment mới
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Bạn có thể tạo comment gốc hoặc reply với parentId tương ứng.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                User ID (tự nhận diện)
                <input
                  type="number"
                  value={userId ?? ""}
                  readOnly
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                Exam ID
                <input
                  type="number"
                  value={examIdNumber}
                  readOnly
                  className="w-full rounded-3xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-600 shadow-sm"
                />
              </label>
            </div>
            <div className="mt-5">
              <CommentForm
                submitLabel="Gửi comment gốc"
                onSubmit={(content) => handleSubmit(content, null)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/40 border border-slate-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                Danh sách bình luận
              </h3>
              <p className="text-sm text-slate-600">
                Reply sâu vẫn được giữ trong cùng luồng hội thoại.
              </p>
            </div>
            {isLoading && (
              <div className="text-sm text-blue-600">Đang tải...</div>
            )}
          </div>
        </div>

        {comments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
            Chưa có bình luận cho đề thi này.
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentTree
                key={comment.id}
                comment={comment}
                depth={0}
                activeReplyTargetId={replyTargetId}
                canReply={true}
                onReply={(commentId) => setReplyTargetId(commentId)}
                onCancelReply={() => setReplyTargetId(null)}
                onSubmitReply={(content, parentId) =>
                  handleSubmit(content, parentId)
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CommentsPage;
