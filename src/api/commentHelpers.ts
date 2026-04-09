const DEFAULT_COMMENT_SUBMIT_ERROR_MESSAGE = "Gửi bình luận thất bại.";
const USER_FULL_NAME_STORAGE_KEY = "user_full_name";
const USER_EMAIL_STORAGE_KEY = "user_email";
const ACCESS_TOKEN_STORAGE_KEY = "access_token";

const pickMessage = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const getCurrentUserIdFromAccessToken = (): number | null => {
  try {
    const accessToken = globalThis.localStorage?.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (!accessToken) {
      return null;
    }

    const tokenParts = accessToken.split(".");
    if (tokenParts.length < 2) {
      return null;
    }

    const base64Payload = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (base64Payload.length % 4)) % 4);
    if (typeof globalThis.atob !== "function") {
      return null;
    }

    const decodedPayload = globalThis.atob(base64Payload + padding);
    const payload = JSON.parse(decodedPayload) as { userId?: unknown };
    const rawUserId = payload.userId;

    if (typeof rawUserId === "number") {
      return Number.isInteger(rawUserId) && rawUserId > 0 ? rawUserId : null;
    }

    if (typeof rawUserId === "string" && rawUserId.trim().length > 0) {
      const parsed = Number(rawUserId.trim());
      return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    }
  } catch {
    return null;
  }

  return null;
};

const getCurrentUserDisplayName = (): string | null => {
  const fullName = pickMessage(
    globalThis.localStorage?.getItem(USER_FULL_NAME_STORAGE_KEY),
  );
  if (fullName) {
    return fullName;
  }

  const email = pickMessage(globalThis.localStorage?.getItem(USER_EMAIL_STORAGE_KEY));
  if (!email) {
    return null;
  }

  const localPart = pickMessage(email.split("@")[0]);
  return localPart || email;
};

export const extractApiErrorMessage = (error: unknown): string | null => {
  if (error && typeof error === "object") {
    const responseData = (error as { response?: { data?: unknown } }).response
      ?.data;

    const rawStringData = pickMessage(responseData);
    if (rawStringData) {
      return rawStringData;
    }

    if (responseData && typeof responseData === "object") {
      const payload = responseData as Record<string, unknown>;
      const fieldCandidates = ["error", "message", "detail"];

      for (const field of fieldCandidates) {
        const message = pickMessage(payload[field]);
        if (message) {
          return message;
        }
      }
    }
  }

  if (error instanceof Error) {
    return pickMessage(error.message);
  }

  return null;
};

export const resolveCommentSubmitErrorMessage = (error: unknown): string => {
  const apiMessage = extractApiErrorMessage(error);

  if (apiMessage) {
    const normalized = apiMessage.toLowerCase();
    const isGenericServerError =
      normalized.includes("request failed with status code") ||
      normalized === "network error" ||
      normalized === "server error" ||
      normalized === "internal server error";

    if (!isGenericServerError) {
      return apiMessage;
    }
  }

  return DEFAULT_COMMENT_SUBMIT_ERROR_MESSAGE;
};

export const formatCommentAuthor = (
  displayName?: string | null,
  userId?: number | null,
): string => {
  const sanitizedDisplayName = pickMessage(displayName);
  if (sanitizedDisplayName) {
    return sanitizedDisplayName;
  }

  if (typeof userId === "number") {
    const currentUserId = getCurrentUserIdFromAccessToken();
    if (currentUserId === userId) {
      const currentUserDisplayName = getCurrentUserDisplayName();
      if (currentUserDisplayName) {
        return currentUserDisplayName;
      }
    }
  }

  return "Người dùng";
};

export const formatCommentTime = (createdAt?: string): string => {
  if (!createdAt) {
    return "Vừa xong";
  }

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "Vừa xong";
  }

  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return "Vừa xong";
  }
  if (diff < hour) {
    return `${Math.floor(diff / minute)} phút`;
  }
  if (diff < day) {
    return `${Math.floor(diff / hour)} giờ`;
  }
  if (diff < 7 * day) {
    return `${Math.floor(diff / day)} ngày`;
  }

  return date.toLocaleString("vi-VN");
};