import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchCommentsByExam,
  createComment,
  voteComment,
  pinComment,
  type CommentNode,
} from "../api/commentClient";

// --- Mock localStorage ---
const getItemMock = vi.fn();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: getItemMock,
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// --- Mock axios ---
const { mockClient } = vi.hoisted(() => ({
  mockClient: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
    },
  },
}));

vi.mock("axios", () => {
  return {
    default: {
      create: vi.fn(() => mockClient),
    },
  };
});

// --- Fixtures ---
const commentNode: CommentNode = {
  id: 1,
  content: "Test comment",
  replies: [],
  upvotes: 5,
  downvotes: 2,
  pinned: false,
  replyCount: 0,
  userVote: "NONE",
};

const commentNodeWithReplies: CommentNode = {
  id: 1,
  content: "Parent comment",
  replies: [
    {
      id: 2,
      content: "Reply comment",
      replies: [],
      upvotes: 1,
      downvotes: 0,
      pinned: false,
      replyCount: 0,
      userVote: "NONE",
    },
  ],
  upvotes: 10,
  downvotes: 3,
  pinned: false,
  replyCount: 1,
  userVote: "UP",
};

// --- Test Suite ---
describe("commentClient API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getItemMock.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchCommentsByExam", () => {
    it("returns CommentNode array with all fields", async () => {
      const mockData: CommentNode[] = [commentNodeWithReplies];
      mockClient.get = vi.fn().mockResolvedValue({ data: mockData });

      const result = await fetchCommentsByExam(42);

      expect(mockClient.get).toHaveBeenCalledWith("/comments/exam/42");
      expect(result).toEqual(mockData);
      expect(result[0]).toMatchObject({
        id: 1,
        content: "Parent comment",
        upvotes: 10,
        downvotes: 3,
        pinned: false,
        userVote: "UP",
        replyCount: 1,
      });
      expect(result[0].replies[0]).toMatchObject({
        id: 2,
        content: "Reply comment",
      });
    });

    it("handles API error gracefully", async () => {
      const error = new Error("Network error");
      mockClient.get = vi.fn().mockRejectedValue(error);

      await expect(fetchCommentsByExam(99)).rejects.toThrow("Network error");
      expect(mockClient.get).toHaveBeenCalledWith("/comments/exam/99");
    });
  });

  describe("createComment", () => {
    it("returns created comment", async () => {
      const payload = {
        userId: 1,
        targetId: 42,
        parentId: null,
        content: "New comment",
      };
      const created: CommentNode = {
        ...commentNode,
        id: 99,
        content: "New comment",
      };
      mockClient.post = vi.fn().mockResolvedValue({ data: created });

      const result = await createComment(payload);

      expect(mockClient.post).toHaveBeenCalledWith("/comments", payload);
      expect(result).toEqual(created);
    });

    it("handles validation errors from the server", async () => {
      const payload = {
        userId: 1,
        targetId: 42,
        parentId: null,
        content: "",
      };
      const serverError = new Error("Validation failed");
      mockClient.post = vi.fn().mockRejectedValue(serverError);

      await expect(createComment(payload)).rejects.toThrow(
        "Validation failed",
      );
    });

    it("sends correct payload when creating a reply", async () => {
      const payload = {
        userId: 3,
        targetId: 42,
        parentId: 1,
        content: "This is a reply",
      };
      const created: CommentNode = {
        ...commentNode,
        id: 100,
        content: "This is a reply",
      };
      mockClient.post = vi.fn().mockResolvedValue({ data: created });

      const result = await createComment(payload);

      expect(mockClient.post).toHaveBeenCalledWith("/comments", payload);
      expect(result.id).toBe(100);
    });
  });

  describe("voteComment", () => {
    it("calls correct endpoint and returns updated comment", async () => {
      const payload = { voteType: "UP" as const };
      const updated: CommentNode = {
        ...commentNode,
        upvotes: 6,
        userVote: "UP",
      };
      mockClient.post = vi.fn().mockResolvedValue({ data: updated });

      const result = await voteComment(1, payload);

      expect(mockClient.post).toHaveBeenCalledWith(
        "/comments/1/vote",
        payload,
      );
      expect(result.upvotes).toBe(6);
      expect(result.userVote).toBe("UP");
    });

    it("handles vote removal (NONE) correctly", async () => {
      const payload = { voteType: "NONE" as const };
      const updated: CommentNode = {
        ...commentNode,
        upvotes: 4,
        userVote: "NONE",
      };
      mockClient.post = vi.fn().mockResolvedValue({ data: updated });

      const result = await voteComment(1, payload);

      expect(mockClient.post).toHaveBeenCalledWith(
        "/comments/1/vote",
        payload,
      );
      expect(result.userVote).toBe("NONE");
    });

    it("throws when vote API fails", async () => {
      mockClient.post = vi
        .fn()
        .mockRejectedValue(new Error("Vote service unavailable"));

      await expect(voteComment(1, { voteType: "UP" })).rejects.toThrow(
        "Vote service unavailable",
      );
    });
  });

  describe("pinComment", () => {
    it("calls correct endpoint with pinned=true and returns updated comment", async () => {
      const payload = { pinned: true };
      const updated: CommentNode = {
        ...commentNode,
        pinned: true,
      };
      mockClient.post = vi.fn().mockResolvedValue({ data: updated });

      const result = await pinComment(1, payload);

      expect(mockClient.post).toHaveBeenCalledWith(
        "/comments/1/pin",
        payload,
      );
      expect(result.pinned).toBe(true);
    });

    it("calls correct endpoint with pinned=false (unpin)", async () => {
      const payload = { pinned: false };
      const updated: CommentNode = {
        ...commentNode,
        pinned: false,
      };
      mockClient.post = vi.fn().mockResolvedValue({ data: updated });

      const result = await pinComment(1, payload);

      expect(mockClient.post).toHaveBeenCalledWith(
        "/comments/1/pin",
        payload,
      );
      expect(result.pinned).toBe(false);
    });

    it("throws when pin API fails", async () => {
      mockClient.post = vi
        .fn()
        .mockRejectedValue(new Error("Pin service unavailable"));

      await expect(
        pinComment(1, { pinned: true }),
      ).rejects.toThrow("Pin service unavailable");
    });
  });
});
