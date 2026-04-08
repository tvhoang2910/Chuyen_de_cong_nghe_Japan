import { useState } from "react";
import { ThumbsUp, ThumbsDown, Pin } from "lucide-react";
import toast from "react-hot-toast";
import type { CommentNode, VoteType } from "../api/commentClient";
import { voteComment, pinComment } from "../api/commentClient";
import CommentForm from "./CommentForm";

interface CommentTreeProps {
  comment: CommentNode;
  depth: number;
  activeReplyTargetId: number | null;
  canReply: boolean;
  onReply: (commentId: number) => void;
  onCancelReply: () => void;
  onSubmitReply: (content: string, parentId: number) => void;
  onVoteComplete?: (updated: CommentNode) => void;
  onPinComplete?: (updated: CommentNode) => void;
}

const isAdminOrTeacher = () => {
  const role = localStorage.getItem("user_role");
  return role === "ADMIN" || role === "TEACHER";
};

const CommentTree = ({
  comment,
  depth,
  activeReplyTargetId,
  canReply,
  onReply,
  onCancelReply,
  onSubmitReply,
  onVoteComplete,
  onPinComplete,
}: CommentTreeProps) => {
  const canReplyOnThisLevel = canReply && depth < 3;
  const isPrivileged = isAdminOrTeacher();

  const [localUpvotes, setLocalUpvotes] = useState(comment.upvotes);
  const [localDownvotes, setLocalDownvotes] = useState(comment.downvotes);
  const [localUserVote, setLocalUserVote] = useState<VoteType>(comment.userVote);
  const [localPinned, setLocalPinned] = useState(comment.pinned);
  const [voting, setVoting] = useState(false);
  const [pinning, setPinning] = useState(false);

  const handleVote = async (newVoteType: VoteType) => {
    if (voting) return;

    // Optimistic update
    const prevUpvotes = localUpvotes;
    const prevDownvotes = localDownvotes;
    const prevUserVote = localUserVote;

    const newUpvotes =
      newVoteType === "UP"
        ? localUserVote === "UP"
          ? localUpvotes - 1
          : localUpvotes + 1
        : localUserVote === "UP"
          ? localUpvotes - 1
          : localUpvotes;
    const newDownvotes =
      newVoteType === "DOWN"
        ? localUserVote === "DOWN"
          ? localDownvotes - 1
          : localDownvotes + 1
        : localUserVote === "DOWN"
          ? localDownvotes - 1
          : localDownvotes;

    setLocalUpvotes(newUpvotes);
    setLocalDownvotes(newDownvotes);
    setLocalUserVote(newVoteType);

    setVoting(true);
    try {
      const updated = await voteComment(comment.id, { voteType: newVoteType });
      setLocalUpvotes(updated.upvotes);
      setLocalDownvotes(updated.downvotes);
      setLocalUserVote(updated.userVote);
      onVoteComplete?.(updated);
    } catch {
      // Rollback on error
      setLocalUpvotes(prevUpvotes);
      setLocalDownvotes(prevDownvotes);
      setLocalUserVote(prevUserVote);
      toast.error("Bỏ phiếu thất bại. Thử lại.");
    } finally {
      setVoting(false);
    }
  };

  const handlePin = async () => {
    if (pinning || !isPrivileged) return;

    const newPinned = !localPinned;
    const prevPinned = localPinned;

    // Optimistic update
    setLocalPinned(newPinned);
    setPinning(true);
    try {
      const updated = await pinComment(comment.id, { pinned: newPinned });
      setLocalPinned(updated.pinned);
      onPinComplete?.(updated);
      toast.success(
        newPinned ? "Đã ghim bình luận" : "Đã bỏ ghim bình luận",
      );
    } catch {
      setLocalPinned(prevPinned);
      toast.error("Thao tác ghim thất bại. Thử lại.");
    } finally {
      setPinning(false);
    }
  };

  const upvoteActive = localUserVote === "UP";
  const downvoteActive = localUserVote === "DOWN";

  return (
    <div
      className={`rounded-[2rem] border bg-white p-5 shadow-sm ${depth > 0 ? "ml-6" : ""} ${localPinned ? "border-amber-300" : "border-slate-200"}`}
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 rounded-3xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
          {depth + 1}
        </div>
        <div className="min-w-0 flex-1">
          {localPinned && (
            <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <Pin className="h-3 w-3" />
              Đã ghim
            </div>
          )}
          <p className="text-slate-900">{comment.content}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <span className="rounded-full bg-slate-100 px-3 py-1">
          Tầng {depth + 1}
        </span>

        {/* Vote buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleVote(upvoteActive ? "NONE" : "UP")}
            disabled={voting}
            aria-label="upvote"
            data-testid="upvote-btn"
            title="Upvote"
            className={`flex items-center gap-1 rounded-full px-2 py-1 transition ${
              upvoteActive
                ? "bg-blue-100 text-blue-700 font-semibold"
                : "bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
            }`}
          >
            <ThumbsUp className="h-4 w-4" />
            <span>{localUpvotes}</span>
          </button>

          <button
            type="button"
            onClick={() => handleVote(downvoteActive ? "NONE" : "DOWN")}
            disabled={voting}
            aria-label="downvote"
            data-testid="downvote-btn"
            title="Downvote"
            className={`flex items-center gap-1 rounded-full px-2 py-1 transition ${
              downvoteActive
                ? "bg-red-100 text-red-700 font-semibold"
                : "bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600"
            }`}
          >
            <ThumbsDown className="h-4 w-4" />
            <span>{localDownvotes}</span>
          </button>
        </div>

        {/* Reply count badge */}
        {comment.replyCount > 0 && (
          <span className="rounded-full bg-slate-100 px-3 py-1">
            {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
          </span>
        )}
        {isPrivileged && (
          <button
            type="button"
            onClick={handlePin}
            disabled={pinning}
            aria-label={localPinned ? "bo ghim" : "ghim"}
            data-testid="pin-btn"
            title="Ghim / Bỏ ghim bình luận"
            className={`flex items-center gap-1 rounded-full px-3 py-1 font-semibold transition ${
              localPinned
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-100 text-slate-500 hover:bg-amber-50 hover:text-amber-600"
            }`}
          >
            <Pin className="h-4 w-4" />
            {localPinned ? "Bỏ ghim" : "Ghim"}
          </button>
        )}

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
              onVoteComplete={onVoteComplete}
              onPinComplete={onPinComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentTree;
