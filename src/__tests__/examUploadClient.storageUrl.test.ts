import { describe, expect, it } from "vitest";
import { toBrowserSafeStorageUrl } from "../api/examUploadClient";

describe("toBrowserSafeStorageUrl", () => {
  it("rewrites internal MinIO http URL in secure context", () => {
    const url =
      "http://minio:9000/exam-sources/uploads/2/1/page-1.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=abc";

    expect(toBrowserSafeStorageUrl(url, true)).toBe(
      "/minio/exam-sources/uploads/2/1/page-1.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=abc",
    );
  });

  it("keeps external https URL unchanged in secure context", () => {
    const url =
      "https://cdn.example.com/exam-sources/uploads/2/1/page-1.jpg?token=abc";

    expect(toBrowserSafeStorageUrl(url, true)).toBe(url);
  });

  it("keeps internal MinIO URL unchanged in non-secure context", () => {
    const url =
      "http://minio:9000/exam-sources/uploads/2/1/page-1.jpg?X-Amz-Signature=abc";

    expect(toBrowserSafeStorageUrl(url, false)).toBe(url);
  });
});
