import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import CommentForm from "../components/CommentForm";

describe("CommentForm component", () => {
  const defaultProps = {
    submitLabel: "Gửi bình luận",
    onSubmit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  describe("Rendering", () => {
    it("renders form with content textarea and submit button", () => {
      render(<CommentForm {...defaultProps} />);

      expect(
        screen.getByPlaceholderText("Nhập nội dung comment..."),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Gửi bình luận" }),
      ).toBeInTheDocument();
    });

    it("renders cancel button when onCancel is provided", () => {
      const onCancel = vi.fn();
      render(<CommentForm {...defaultProps} onCancel={onCancel} />);

      expect(screen.getByRole("button", { name: "Hủy" })).toBeInTheDocument();
    });

    it("does NOT render cancel button when onCancel is not provided", () => {
      render(<CommentForm {...defaultProps} />);

      expect(screen.queryByRole("button", { name: "Hủy" })).not.toBeInTheDocument();
    });

    it("uses custom submitLabel when provided", () => {
      render(<CommentForm submitLabel="Gửi reply" onSubmit={vi.fn()} />);

      expect(screen.getByRole("button", { name: "Gửi reply" })).toBeInTheDocument();
    });

    it("autoFocus textarea when autoFocus prop is true", () => {
      render(<CommentForm {...defaultProps} autoFocus />);

      const textarea = screen.getByPlaceholderText("Nhập nội dung comment...");
      expect(document.activeElement).toBe(textarea);
    });
  });

  // ── Validation ────────────────────────────────────────────────────────────

  describe("Validation", () => {
    it("does not submit when content is empty (trim prevents whitespace-only)", () => {
      const onSubmit = vi.fn();
      render(<CommentForm {...defaultProps} onSubmit={onSubmit} />);

      fireEvent.click(screen.getByRole("button", { name: "Gửi bình luận" }));

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("does not submit when content is whitespace only", () => {
      const onSubmit = vi.fn();
      render(<CommentForm {...defaultProps} onSubmit={onSubmit} />);

      const textarea = screen.getByPlaceholderText("Nhập nội dung comment...");
      fireEvent.change(textarea, { target: { value: "   \n\t  " } });

      fireEvent.click(screen.getByRole("button", { name: "Gửi bình luận" }));

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("submits when content has visible text", () => {
      const onSubmit = vi.fn();
      render(<CommentForm {...defaultProps} onSubmit={onSubmit} />);

      const textarea = screen.getByPlaceholderText("Nhập nội dung comment...");
      fireEvent.change(textarea, { target: { value: "Valid comment text" } });

      fireEvent.click(screen.getByRole("button", { name: "Gửi bình luận" }));

      expect(onSubmit).toHaveBeenCalledWith("Valid comment text");
    });

    it("trims content before submitting", () => {
      const onSubmit = vi.fn();
      render(<CommentForm {...defaultProps} onSubmit={onSubmit} />);

      const textarea = screen.getByPlaceholderText("Nhập nội dung comment...");
      fireEvent.change(textarea, { target: { value: "  Trim me  " } });

      fireEvent.click(screen.getByRole("button", { name: "Gửi bình luận" }));

      expect(onSubmit).toHaveBeenCalledWith("Trim me");
    });
  });

  // ── Form submission ────────────────────────────────────────────────────────

  describe("Form submission", () => {
    it("calls onSubmit with correct payload", () => {
      const onSubmit = vi.fn();
      render(<CommentForm {...defaultProps} onSubmit={onSubmit} />);

      const textarea = screen.getByPlaceholderText("Nhập nội dung comment...");
      fireEvent.change(textarea, { target: { value: "Hello world" } });
      fireEvent.click(screen.getByRole("button", { name: "Gửi bình luận" }));

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith("Hello world");
    });

    it("resets form after successful submission", () => {
      const onSubmit = vi.fn();
      render(<CommentForm {...defaultProps} onSubmit={onSubmit} />);

      const textarea = screen.getByPlaceholderText("Nhập nội dung comment...");
      fireEvent.change(textarea, { target: { value: "Hello world" } });
      fireEvent.click(screen.getByRole("button", { name: "Gửi bình luận" }));

      expect((textarea as HTMLTextAreaElement).value).toBe("");
    });

    it("calls onCancel when cancel button is clicked", () => {
      const onCancel = vi.fn();
      render(<CommentForm {...defaultProps} onCancel={onCancel} />);

      fireEvent.click(screen.getByRole("button", { name: "Hủy" }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("does NOT call onSubmit when cancel is clicked", () => {
      const onSubmit = vi.fn();
      render(<CommentForm {...defaultProps} onCancel={vi.fn()} onSubmit={onSubmit} />);

      const textarea = screen.getByPlaceholderText("Nhập nội dung comment...");
      fireEvent.change(textarea, { target: { value: "Some text" } });

      fireEvent.click(screen.getByRole("button", { name: "Hủy" }));

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("handles form submission when button is clicked", () => {
      const onSubmit = vi.fn();
      render(<CommentForm {...defaultProps} onSubmit={onSubmit} />);

      const textarea = screen.getByPlaceholderText("Nhập nội dung comment...");
      fireEvent.change(textarea, { target: { value: "Typed via submit" } });
      fireEvent.click(screen.getByRole("button", { name: "Gửi bình luận" }));

      expect(onSubmit).toHaveBeenCalledWith("Typed via submit");
    });
  });

  // ── Interaction states ─────────────────────────────────────────────────────

  describe("Interaction states", () => {
    it("updates textarea value on change", () => {
      render(<CommentForm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText("Nhập nội dung comment...");
      fireEvent.change(textarea, { target: { value: "New value" } });

      expect((textarea as HTMLTextAreaElement).value).toBe("New value");
    });

    it("handles multi-line content correctly", () => {
      const onSubmit = vi.fn();
      render(<CommentForm {...defaultProps} onSubmit={onSubmit} />);

      const textarea = screen.getByPlaceholderText("Nhập nội dung comment...");
      const multiLine = "Line one\nLine two\nLine three";
      fireEvent.change(textarea, { target: { value: multiLine } });

      fireEvent.click(screen.getByRole("button", { name: "Gửi bình luận" }));

      expect(onSubmit).toHaveBeenCalledWith(multiLine);
    });
  });
});
