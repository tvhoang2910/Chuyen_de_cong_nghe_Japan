import type { CommentNode } from "../api/commentClient";
import CommentForm from "./CommentForm";

interface CommentTreeProps {
  comment: CommentNode;
  depth: number;
  activeReplyTargetId: number | null;
  canReply: boolean;
  onReply: (commentId: number) => void;
  onCancelReply: () => void;
  onSubmitReply: (content: string, parentId: number) => void;
}

const CommentTree = ({
  comment,
  depth,
  activeReplyTargetId,
  canReply,
  onReply,
  onCancelReply,
  onSubmitReply,
}: CommentTreeProps) => {
  const canReplyOnThisLevel = canReply && depth < 3;

  return (
    <div
      className={`rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm ${depth > 0 ? "ml-6" : ""}`}
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 rounded-3xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
          {depth + 1}
        </div>
        <div className="min-w-0">
          <p className="text-slate-900">{comment.content}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <span className="rounded-full bg-slate-100 px-3 py-1">
          Tầng {depth + 1}
        </span>
        {canReplyOnThisLevel ? (
          <button
            type="button"
            onClick={() => onReply(comment.id)}
            className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            Reply
          </button>
        ) : depth < 3 ? null : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-400">
            Đã đạt tối đa tầng
          </span>
        )}
      </div>

      {activeReplyTargetId === comment.id && canReplyOnThisLevel && (
        <div className="mt-5 rounded-[1.75rem] bg-slate-50 p-4 border border-slate-200">
          <CommentForm
            submitLabel="Gửi reply"
            onSubmit={(content) => onSubmitReply(content, comment.id)}
            onCancel={onCancelReply}
            autoFocus
          />
        </div>
      )}

      {comment.replies.length > 0 && (
        <div className="mt-5 space-y-4">
          {comment.replies.map((reply) => (
            <CommentTree
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              activeReplyTargetId={activeReplyTargetId}
              canReply={canReply}
              onReply={onReply}
              onCancelReply={onCancelReply}
              onSubmitReply={onSubmitReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentTree;
