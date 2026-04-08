import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import CommentTree from "../components/CommentTree";
import { voteComment, pinComment } from "../api/commentClient";
import type { CommentNode, VotePayload, PinPayload } from "../api/commentClient";

// ── Mock localStorage for user_role check ─────────────────────────────────────
const getItemMock = vi.fn();
Object.defineProperty(globalThis, "localStorage", {
  value: { getItem: getItemMock, setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
  writable: true,
});

// ── Mock API functions ────────────────────────────────────────────────────────
vi.mock("../api/commentClient", () => ({
  voteComment: vi.fn<(id: number, p: VotePayload) => Promise<CommentNode>>(),
  pinComment: vi.fn<(id: number, p: PinPayload) => Promise<CommentNode>>(),
}));

// ── Fixture helpers ───────────────────────────────────────────────────────────
const baseComment: CommentNode = {
  id: 1,
  content: "This is the root comment content",
  replies: [],
  upvotes: 5,
  downvotes: 2,
  pinned: false,
  replyCount: 0,
  userVote: "NONE",
};

const replyComment: CommentNode = {
  id: 2,
  content: "This is a reply comment",
  replies: [],
  upvotes: 1,
  downvotes: 0,
  pinned: false,
  replyCount: 0,
  userVote: "NONE",
};

const commentWithReplies: CommentNode = {
  ...baseComment,
  replies: [
    { ...replyComment, replies: [] },
  ],
  replyCount: 1,
};

const deeplyNestedComment: CommentNode = {
  ...baseComment,
  id: 10,
  content: "Top-level",
  replies: [
    {
      id: 11,
      content: "Level 1 reply",
      replies: [
        {
          id: 12,
          content: "Level 2 reply",
          replies: [
            {
              id: 13,
              content: "Level 3 reply",
              replies: [],
              upvotes: 0,
              downvotes: 0,
              pinned: false,
              replyCount: 0,
              userVote: "NONE",
            },
          ],
          upvotes: 0,
          downvotes: 0,
          pinned: false,
          replyCount: 1,
          userVote: "NONE",
        },
      ],
      upvotes: 0,
      downvotes: 0,
      pinned: false,
      replyCount: 1,
      userVote: "NONE",
    },
  ],
  replyCount: 1,
};

const defaultProps = {
  activeReplyTargetId: null as number | null,
  canReply: true,
  onReply: vi.fn<(id: number) => void>(),
  onCancelReply: vi.fn(),
  onSubmitReply: vi.fn<(content: string, parentId: number) => void>(),
};

// ── Test Suite ────────────────────────────────────────────────────────────────
describe("CommentTree component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getItemMock.mockReturnValue(null); // non-privileged by default
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  describe("Rendering", () => {
    it("renders comment with content, upvotes, and downvotes", () => {
      render(<CommentTree comment={baseComment} depth={0} {...defaultProps} />);

      expect(screen.getByText("This is the root comment content")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument(); // upvotes
      expect(screen.getByText("2")).toBeInTheDocument(); // downvotes
    });

    it("renders nested replies correctly (recursive tree)", () => {
      render(
        <CommentTree comment={commentWithReplies} depth={0} {...defaultProps} />,
      );

      expect(screen.getByText("This is the root comment content")).toBeInTheDocument();
      expect(screen.getByText("This is a reply comment")).toBeInTheDocument();
    });

    it("renders deeply nested replies up to 3 levels", () => {
      render(
        <CommentTree comment={deeplyNestedComment} depth={0} {...defaultProps} />,
      );

      expect(screen.getByText("Top-level")).toBeInTheDocument();
      expect(screen.getByText("Level 1 reply")).toBeInTheDocument();
      expect(screen.getByText("Level 2 reply")).toBeInTheDocument();
      expect(screen.getByText("Level 3 reply")).toBeInTheDocument();
      // At depth 3 (max), Reply button should NOT appear for the deepest comment
      expect(screen.queryByText("Reply")).toBeNull();
    });

    it("shows replyCount badge when replyCount > 0", () => {
      render(<CommentTree comment={commentWithReplies} depth={0} {...defaultProps} />);

      expect(screen.getByText("1 replies")).toBeInTheDocument();
    });

    it("does not show replyCount badge when replyCount is 0", () => {
      render(<CommentTree comment={baseComment} depth={0} {...defaultProps} />);

      expect(screen.queryByText(/replies/)).not.toBeInTheDocument();
    });

    it("shows pinned indicator for pinned comments", () => {
      const pinnedComment: CommentNode = { ...baseComment, pinned: true, replyCount: 0 };
      render(<CommentTree comment={pinnedComment} depth={0} {...defaultProps} />);

      expect(screen.getByText("Đã ghim")).toBeInTheDocument();
    });

    it("shows userVote highlight state for upvote", () => {
      const upvotedComment: CommentNode = { ...baseComment, userVote: "UP" };
      render(<CommentTree comment={upvotedComment} depth={0} {...defaultProps} />);

      // The upvote button should have the active class — check via aria-label
      const upvoteBtn = screen.getByRole("button", { name: /upvote/i });
      expect(upvoteBtn).toHaveClass("bg-blue-100");
    });

    it("shows userVote highlight state for downvote", () => {
      const downvotedComment: CommentNode = { ...baseComment, userVote: "DOWN" };
      render(<CommentTree comment={downvotedComment} depth={0} {...defaultProps} />);

      const downvoteBtn = screen.getByRole("button", { name: /downvote/i });
      expect(downvoteBtn).toHaveClass("bg-red-100");
    });
  });

  // ── Vote actions ────────────────────────────────────────────────────────────

  describe("Vote actions", () => {
    it("calls voteComment when upvote button is clicked", async () => {
      vi.mocked(voteComment).mockResolvedValue({
        ...baseComment,
        upvotes: 6,
        userVote: "UP",
      });

      render(<CommentTree comment={baseComment} depth={0} {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: /upvote/i }));

      await waitFor(() => {
        expect(voteComment).toHaveBeenCalledWith(1, { voteType: "UP" });
      });
    });

    it("calls voteComment when downvote button is clicked", async () => {
      vi.mocked(voteComment).mockResolvedValue({
        ...baseComment,
        downvotes: 3,
        userVote: "DOWN",
      });

      render(<CommentTree comment={baseComment} depth={0} {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: /downvote/i }));

      await waitFor(() => {
        expect(voteComment).toHaveBeenCalledWith(1, { voteType: "DOWN" });
      });
    });

    it("toggles upvote off when already upvoted (calls with NONE)", async () => {
      const upvotedComment: CommentNode = { ...baseComment, userVote: "UP" };
      vi.mocked(voteComment).mockResolvedValue({
        ...upvotedComment,
        upvotes: 4,
        userVote: "NONE",
      });

      render(<CommentTree comment={upvotedComment} depth={0} {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: /upvote/i }));

      await waitFor(() => {
        expect(voteComment).toHaveBeenCalledWith(1, { voteType: "NONE" });
      });
    });

    it("calls onVoteComplete callback when vote succeeds", async () => {
      const onVoteComplete = vi.fn();
      vi.mocked(voteComment).mockResolvedValue({
        ...baseComment,
        upvotes: 6,
        userVote: "UP",
      });

      render(
        <CommentTree
          comment={baseComment}
          depth={0}
          {...defaultProps}
          onVoteComplete={onVoteComplete}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: /upvote/i }));

      await waitFor(() => {
        expect(onVoteComplete).toHaveBeenCalled();
      });
    });

    it("optimistically updates local state immediately on upvote", async () => {
      // Simulate a slow network response so we can catch the optimistic update
      vi.mocked(voteComment).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          ...baseComment,
          upvotes: 6,
          userVote: "UP",
        }), 100)),
      );

      render(<CommentTree comment={baseComment} depth={0} {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: /upvote/i }));

      // Immediately after click (before Promise resolves), local state should update
      await waitFor(() => {
        const upvoteBtn = screen.getByRole("button", { name: /upvote/i });
        expect(upvoteBtn.querySelector("span")).toHaveTextContent("6");
      });
    });

    it("rolls back local state when vote API fails", async () => {
      vi.mocked(voteComment).mockRejectedValue(new Error("Network error"));

      render(<CommentTree comment={baseComment} depth={0} {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: /upvote/i }));

      await waitFor(() => {
        // After failure, the local state should rollback to original
        const upvoteBtn = screen.getByRole("button", { name: /upvote/i });
        expect(upvoteBtn.querySelector("span")).toHaveTextContent("5");
      });
    });
  });

  // ── Pin actions ─────────────────────────────────────────────────────────────

  describe("Pin actions", () => {
    it("shows pin button only for ADMIN or TEACHER users", () => {
      getItemMock.mockReturnValue("ADMIN");

      render(<CommentTree comment={baseComment} depth={0} {...defaultProps} />);

      expect(screen.getByRole("button", { name: /ghim/i })).toBeInTheDocument();
    });

    it("does NOT show pin button for regular users", () => {
      getItemMock.mockReturnValue("USER");
      render(<CommentTree comment={baseComment} depth={0} {...defaultProps} />);

      expect(screen.queryByRole("button", { name: /ghim/i })).not.toBeInTheDocument();
    });

    it("calls pinComment when pin button is clicked", async () => {
      getItemMock.mockReturnValue("ADMIN");
      vi.mocked(pinComment).mockResolvedValue({ ...baseComment, pinned: true });

      render(<CommentTree comment={baseComment} depth={0} {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: /ghim/i }));

      await waitFor(() => {
        expect(pinComment).toHaveBeenCalledWith(1, { pinned: true });
      });
    });

    it("calls onPinComplete callback when pin succeeds", async () => {
      getItemMock.mockReturnValue("ADMIN");
      const onPinComplete = vi.fn();
      vi.mocked(pinComment).mockResolvedValue({ ...baseComment, pinned: true });

      render(
        <CommentTree
          comment={baseComment}
          depth={0}
          {...defaultProps}
          onPinComplete={onPinComplete}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: /ghim/i }));

      await waitFor(() => {
        expect(onPinComplete).toHaveBeenCalled();
      });
    });

    it("optimistically updates pin state immediately", async () => {
      getItemMock.mockReturnValue("ADMIN");
      vi.mocked(pinComment).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          ...baseComment,
          pinned: true,
        }), 100)),
      );

      render(<CommentTree comment={baseComment} depth={0} {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: /ghim/i }));

      await waitFor(() => {
        expect(screen.getByText("Bỏ ghim")).toBeInTheDocument();
      });
    });

    it("shows loading disabled state on pin button during pin action", async () => {
      getItemMock.mockReturnValue("ADMIN");
      vi.mocked(pinComment).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          ...baseComment,
          pinned: true,
        }), 200)),
      );

      render(<CommentTree comment={baseComment} depth={0} {...defaultProps} />);

      const pinBtn = screen.getByRole("button", { name: /ghim/i });
      fireEvent.click(pinBtn);

      // Immediately after click, button should be disabled
      expect(pinBtn).toBeDisabled();
    });
  });

  // ── Reply actions ──────────────────────────────────────────────────────────

  describe("Reply actions", () => {
    it("calls onReply when Reply button is clicked", () => {
      render(<CommentTree comment={baseComment} depth={0} {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: /^Reply$/ }));

      expect(defaultProps.onReply).toHaveBeenCalledWith(1);
    });

    it("shows reply form when activeReplyTargetId matches comment id", () => {
      render(
        <CommentTree
          comment={baseComment}
          depth={0}
          activeReplyTargetId={1}
          {...defaultProps}
        />,
      );

      expect(screen.getByPlaceholderText("Nhập nội dung comment...")).toBeInTheDocument();
    });

    it("calls onSubmitReply with content and parent id", () => {
      render(
        <CommentTree
          comment={baseComment}
          depth={0}
          activeReplyTargetId={1}
          {...defaultProps}
        />,
      );

      const textarea = screen.getByPlaceholderText("Nhập nội dung comment...");
      fireEvent.change(textarea, { target: { value: "My reply content" } });
      fireEvent.click(screen.getByRole("button", { name: "Gửi reply" }));

      expect(defaultProps.onSubmitReply).toHaveBeenCalledWith(
        "My reply content",
        1,
      );
    });

    it("calls onCancelReply when Cancel button is clicked", () => {
      render(
        <CommentTree
          comment={baseComment}
          depth={0}
          activeReplyTargetId={1}
          {...defaultProps}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Hủy" }));

      expect(defaultProps.onCancelReply).toHaveBeenCalled();
    });

    it("does NOT show Reply button when depth >= 3", () => {
      render(<CommentTree comment={deeplyNestedComment} depth={3} {...defaultProps} />);

      expect(screen.queryByRole("button", { name: /^Reply$/ })).not.toBeInTheDocument();
      expect(screen.getByText("Đã đạt tối đa tầng")).toBeInTheDocument();
    });
  });
});
