import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import CommentTree from "../components/CommentTree";
import { voteComment, pinComment } from "../api/commentClient";
import type { CommentNode } from "../api/commentClient";

// ── Mock localStorage for user_role check ─────────────────────────────────────
const getItemMock = vi.fn();
Object.defineProperty(globalThis, "localStorage", {
  value: { getItem: getItemMock, setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
  writable: true,
});

// ── Mock API functions ────────────────────────────────────────────────────────
vi.mock("../api/commentClient", () => ({
  voteComment: vi.fn(),
  pinComment: vi.fn(),
}));

// ── Fixture helpers ───────────────────────────────────────────────────────────
const baseComment: CommentNode = {
  id: 1,
  userId: 10,
  authorName: "Teacher One",
  parentId: null,
  replyToUserId: null,
  content: "This is the root comment content",
  createdAt: "2026-04-09T10:00:00.000Z",
  replies: [],
  upvotes: 5,
  downvotes: 2,
  pinned: false,
  replyCount: 0,
  userVote: "NONE",
};

const replyComment: CommentNode = {
  id: 2,
  userId: 22,
  authorName: "Student Two",
  parentId: 1,
  replyToUserId: 10,
  replyToAuthorName: "Teacher One",
  content: "This is a reply comment",
  createdAt: "2026-04-09T10:01:00.000Z",
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
      userId: 11,
      parentId: 10,
      replyToUserId: 10,
      content: "Level 1 reply",
      createdAt: "2026-04-09T10:02:00.000Z",
      replies: [
        {
          id: 12,
          userId: 12,
          parentId: 11,
          replyToUserId: 11,
          content: "Level 2 reply",
          createdAt: "2026-04-09T10:03:00.000Z",
          replies: [
            {
              id: 13,
              userId: 13,
              parentId: 12,
              replyToUserId: 12,
              content: "Level 3 reply",
              createdAt: "2026-04-09T10:04:00.000Z",
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
  onReply: vi.fn(),
  onCancelReply: vi.fn(),
  onSubmitReply: vi.fn(),
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
      // Reply is always available; backend handles max-depth clamping.
      expect(screen.getAllByRole("button", { name: "Trả lời" })).toHaveLength(4);
    });

    it("renders author and reply mention metadata", () => {
      render(<CommentTree comment={replyComment} depth={1} {...defaultProps} />);

      expect(screen.getByText("Student Two")).toBeInTheDocument();
      expect(screen.getByText("@Teacher One")).toBeInTheDocument();
    });

    it("shows replyCount badge when replyCount > 0", () => {
      render(<CommentTree comment={commentWithReplies} depth={0} {...defaultProps} />);

      expect(screen.getByText("1 reply")).toBeInTheDocument();
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
      let resolveVote: ((value: CommentNode) => void) | undefined;
      vi.mocked(voteComment).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveVote = resolve;
          }),
      );

      render(<CommentTree comment={baseComment} depth={0} {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: /upvote/i }));

      // Immediately after click (before Promise resolves), local state should update
      await waitFor(() => {
        const upvoteBtn = screen.getByRole("button", { name: /upvote/i });
        expect(upvoteBtn.querySelector("span")).toHaveTextContent("6");
      });

      resolveVote?.({
        ...baseComment,
        upvotes: 6,
        userVote: "UP",
      });

      await waitFor(() => {
        expect(voteComment).toHaveBeenCalledTimes(1);
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
      let resolvePin: ((value: CommentNode) => void) | undefined;
      vi.mocked(pinComment).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePin = resolve;
          }),
      );

      render(<CommentTree comment={baseComment} depth={0} {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: /ghim/i }));

      await waitFor(() => {
        expect(screen.getByText("Bỏ ghim")).toBeInTheDocument();
      });

      resolvePin?.({ ...baseComment, pinned: true });

      await waitFor(() => {
        expect(pinComment).toHaveBeenCalledTimes(1);
      });
    });

    it("shows loading disabled state on pin button during pin action", async () => {
      getItemMock.mockReturnValue("ADMIN");
      let resolvePin: ((value: CommentNode) => void) | undefined;
      vi.mocked(pinComment).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePin = resolve;
          }),
      );

      render(<CommentTree comment={baseComment} depth={0} {...defaultProps} />);

      const pinBtn = screen.getByRole("button", { name: /ghim/i });
      fireEvent.click(pinBtn);

      // Immediately after click, button should be disabled
      expect(pinBtn).toBeDisabled();

      resolvePin?.({ ...baseComment, pinned: true });

      await waitFor(() => {
        expect(pinBtn).not.toBeDisabled();
      });
    });
  });

  // ── Reply actions ──────────────────────────────────────────────────────────

  describe("Reply actions", () => {
    it("calls onReply when Trả lời button is clicked", () => {
      render(<CommentTree comment={baseComment} depth={0} {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: /^Trả lời$/ }));

      expect(defaultProps.onReply).toHaveBeenCalledWith(1);
    });

    it("shows reply form when activeReplyTargetId matches comment id", () => {
      render(
        <CommentTree
          comment={baseComment}
          depth={0}
          {...defaultProps}
          activeReplyTargetId={1}
        />,
      );

      expect(screen.getByText("Đang trả lời @Teacher One")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Viết phản hồi cho Teacher One...")).toBeInTheDocument();
    });

    it("calls onSubmitReply with content and parent id", () => {
      render(
        <CommentTree
          comment={baseComment}
          depth={0}
          {...defaultProps}
          activeReplyTargetId={1}
        />,
      );

      const textarea = screen.getByRole("textbox");
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
          {...defaultProps}
          activeReplyTargetId={1}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Hủy" }));

      expect(defaultProps.onCancelReply).toHaveBeenCalled();
    });

    it("still shows Reply button for deep comments", () => {
      render(<CommentTree comment={deeplyNestedComment} depth={2} {...defaultProps} />);

      expect(screen.getAllByRole("button", { name: /^Trả lời$/ }).length).toBeGreaterThan(0);
    });
  });
});
