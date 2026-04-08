import { useState } from "react";
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
  onVote: (commentId: number, voteType: "UP" | "DOWN") => void;
  onTogglePin: (commentId: number, pinned: boolean) => void;
}

const CommentTree = ({
  comment,
  depth,
  activeReplyTargetId,
  canReply,
  onReply,
  onCancelReply,
  onSubmitReply,
  onVote,
  onTogglePin,
}: CommentTreeProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const canReplyOnThisLevel = canReply && depth < 3;

  return (
    <div
      className={`rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm ${depth > 0 ? "ml-6" : ""}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="shrink-0 rounded-3xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
            {depth + 1}
          </div>
          <div className="min-w-0">
            <p className="text-slate-900">{comment.content}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1">
                {comment.replyCount} trả lời
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1">
                {comment.upvotes} 👍 • {comment.downvotes} 👎
              </span>
              {comment.pinned && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                  Đã ghim
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => onVote(comment.id, "UP")}
            className={`rounded-full border px-3 py-1 text-slate-700 transition ${
              comment.userVote === "UP"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50"
            }`}
          >
            👍 {comment.upvotes}
          </button>
          <button
            type="button"
            onClick={() => onVote(comment.id, "DOWN")}
            className={`rounded-full border px-3 py-1 text-slate-700 transition ${
              comment.userVote === "DOWN"
                ? "border-rose-500 bg-rose-50 text-rose-700"
                : "border-slate-200 bg-slate-50 hover:border-rose-300 hover:bg-rose-50"
            }`}
          >
            👎 {comment.downvotes}
          </button>
          <button
            type="button"
            onClick={() => onTogglePin(comment.id, !comment.pinned)}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 transition hover:border-amber-300 hover:bg-amber-50"
          >
            {comment.pinned ? "Bỏ ghim" : "Ghim"}
          </button>
          {comment.replies.length > 0 && (
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 transition hover:bg-slate-100"
            >
              {isCollapsed ? "Mở rộng" : "Thu gọn"}
            </button>
          )}
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

      {!isCollapsed && comment.replies.length > 0 && (
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
              onVote={onVote}
              onTogglePin={onTogglePin}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentTree;
