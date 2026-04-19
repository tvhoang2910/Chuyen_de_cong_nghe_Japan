import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import {
  ALLOWED_UPLOAD_CONTENT_TYPES,
  MAX_UPLOAD_PAGES,
  completeUpload,
  initiateUpload,
  uploadPageToStorage,
  type AllowedUploadContentType,
  type ExamUploadResponse,
} from "../api/examUploadClient";

export interface ExamUploadPayload {
  title: string;
  description?: string;
  files: File[];
  note?: string;
}

export interface PageProgress {
  index: number;
  fileName: string;
  progress: number; // 0..100
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

interface UseExamUploadFlowResult {
  upload: (payload: ExamUploadPayload) => Promise<ExamUploadResponse | null>;
  progress: PageProgress[];
  isUploading: boolean;
  resetProgress: () => void;
}

const isAllowedContentType = (
  value: string,
): value is AllowedUploadContentType => {
  return (ALLOWED_UPLOAD_CONTENT_TYPES as readonly string[]).includes(value);
};

const validateFiles = (files: File[]): string | null => {
  if (files.length === 0) {
    return "Vui lòng chọn ít nhất 1 tệp.";
  }
  if (files.length > MAX_UPLOAD_PAGES) {
    return `Tối đa ${MAX_UPLOAD_PAGES} trang cho mỗi upload.`;
  }
  for (const file of files) {
    if (!isAllowedContentType(file.type)) {
      return `Định dạng không hỗ trợ: ${file.name} (${file.type || "không xác định"}).`;
    }
  }
  const firstType = files[0]!.type;
  for (const file of files) {
    if (file.type !== firstType) {
      return "Tất cả trang phải cùng định dạng (chỉ chọn ảnh hoặc PDF, không lẫn).";
    }
  }
  return null;
};

export const useExamUploadFlow = (): UseExamUploadFlowResult => {
  const [progress, setProgress] = useState<PageProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const resetProgress = useCallback(() => {
    setProgress([]);
  }, []);

  const upload = useCallback(
    async (payload: ExamUploadPayload): Promise<ExamUploadResponse | null> => {
      const { title, description, files, note } = payload;
      const validationError = validateFiles(files);
      if (validationError) {
        toast.error(validationError);
        return null;
      }

      const contentType = files[0]!.type;
      const initialProgress: PageProgress[] = files.map((file, index) => ({
        index,
        fileName: file.name,
        progress: 0,
        status: "pending",
      }));
      setProgress(initialProgress);
      setIsUploading(true);

      try {
        const initiateResponse = await initiateUpload({
          title: title.trim(),
          description: description?.trim() || undefined,
          pageCount: files.length,
          contentType,
        });

        if (initiateResponse.pages.length !== files.length) {
          throw new Error(
            "Số lượng presigned URL không khớp số trang yêu cầu.",
          );
        }

        const sortedPages = [...initiateResponse.pages].sort(
          (a, b) => a.index - b.index,
        );

        await Promise.all(
          sortedPages.map(async (presigned, idx) => {
            const file = files[idx]!;
            setProgress((prev) =>
              prev.map((p) =>
                p.index === idx ? { ...p, status: "uploading" } : p,
              ),
            );
            try {
              await uploadPageToStorage(presigned.url, file);
              setProgress((prev) =>
                prev.map((p) =>
                  p.index === idx
                    ? { ...p, status: "done", progress: 100 }
                    : p,
                ),
              );
            } catch (err) {
              const message =
                err instanceof Error ? err.message : "Lỗi tải tệp lên.";
              setProgress((prev) =>
                prev.map((p) =>
                  p.index === idx
                    ? { ...p, status: "error", error: message }
                    : p,
                ),
              );
              throw err;
            }
          }),
        );

        const completed = await completeUpload(
          initiateResponse.uploadId,
          note,
        );
        toast.success("Tải đề thành công. Đang chờ duyệt.");
        return completed;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Lỗi không xác định khi upload.";
        toast.error(message);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [],
  );

  return { upload, progress, isUploading, resetProgress };
};
