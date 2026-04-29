import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Lock, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import MainLayout from "../components/MainLayout";
import { fetchPublicExams, type ExamSummary } from "../api/examClient";
import {
  fetchExamRatingSummaries,
  type ExamRatingSummary,
} from "../api/examRatingClient";
import ExamRatingStars from "../components/ExamRatingStars";

type SortMode = "rating-desc" | "newest-desc";

type PublicExamRow = ExamSummary & {
  rating: ExamRatingSummary | null;
};

type TagStat = {
  name: string;
  count: number;
};

const normalizeForSearch = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

const normalizeTags = (raw: string): string[] => {
  const deduplicated = new Set(
    raw
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  );
  return Array.from(deduplicated);
};

const PublicExams: React.FC = () => {
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("rating-desc");
  const [keywordInput, setKeywordInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [ratingsByExamId, setRatingsByExamId] = useState<
    Record<number, ExamRatingSummary>
  >({});

  const loadPublicExams = async () => {
    try {
      setIsLoading(true);
      const data = await fetchPublicExams();

      setExams(data);

      if (data.length > 0) {
        try {
          const ratingSummaries = await fetchExamRatingSummaries(
            data.map((exam) => exam.id),
          );
          const nextRatings = ratingSummaries.reduce<
            Record<number, ExamRatingSummary>
          >((accumulator, summary) => {
            accumulator[summary.examId] = summary;
            return accumulator;
          }, {});
          setRatingsByExamId(nextRatings);
        } catch (error) {
          console.error(error);
          setRatingsByExamId({});
        }
      } else {
        setRatingsByExamId({});
      }
    } catch {
      toast.error("Không tải được dữ liệu kho đề.");
      setExams([]);
      setRatingsByExamId({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedKeyword = keywordInput.trim();
    const normalizedTags = normalizeTags(tagsInput);
    setSearchKeyword(normalizedKeyword);
    setSearchTags(normalizedTags);
  };

  const handleResetFilters = () => {
    setKeywordInput("");
    setTagsInput("");
    setSearchKeyword("");
    setSearchTags([]);
  };

  const handleQuickTagToggle = (tagName: string) => {
    setSearchTags((current) => {
      const normalizedCurrent = current.map(normalizeForSearch);
      const normalizedTag = normalizeForSearch(tagName);
      let next: string[];

      if (normalizedCurrent.includes(normalizedTag)) {
        next = current.filter((tag) => normalizeForSearch(tag) !== normalizedTag);
      } else {
        next = [...current, tagName];
      }

      setTagsInput(next.join(", "));
      return next;
    });
  };

  useEffect(() => {
    void loadPublicExams();
  }, []);

  const allTags = useMemo<TagStat[]>(() => {
    const counter = new Map<string, TagStat>();
    exams.forEach((exam) => {
      exam.tags.forEach((tag) => {
        const normalized = normalizeForSearch(tag.name);
        const existing = counter.get(normalized);
        if (existing) {
          existing.count += 1;
          return;
        }
        counter.set(normalized, { name: tag.name, count: 1 });
      });
    });

    return Array.from(counter.values()).sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }
      return left.name.localeCompare(right.name, "vi");
    });
  }, [exams]);

  const visibleExams = useMemo<PublicExamRow[]>(() => {
    const normalizedKeyword = normalizeForSearch(searchKeyword);
    const normalizedFilterTags = searchTags.map(normalizeForSearch);

    const rows = exams.map((exam) => ({
      ...exam,
      rating: ratingsByExamId[exam.id] ?? null,
    })).filter((exam) => {
      const searchableText = normalizeForSearch(
        [exam.title, exam.description ?? "", ...exam.tags.map((tag) => tag.name)].join(" "),
      );

      const matchesKeyword =
        !normalizedKeyword || searchableText.includes(normalizedKeyword);

      const matchesTags =
        normalizedFilterTags.length === 0 ||
        normalizedFilterTags.every((filterTag) =>
          exam.tags.some((tag) => normalizeForSearch(tag.name).includes(filterTag)),
        );

      return matchesKeyword && matchesTags;
    });

    const sorted = [...rows].sort((left, right) => {
      if (sortMode === "newest-desc") {
        return (
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime()
        );
      }

      const leftRating = left.rating?.averageRating ?? 0;
      const rightRating = right.rating?.averageRating ?? 0;
      if (rightRating !== leftRating) {
        return rightRating - leftRating;
      }

      return (
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
    });

    return sorted;
  }, [exams, ratingsByExamId, sortMode, searchKeyword, searchTags]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Kho đề thi công khai
          </h1>
          <p className="text-slate-500 mt-1">
            Người dùng có thể tìm kiếm và xem các đề đã được công khai bởi contributor/admin.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <form
              onSubmit={handleSearchSubmit}
              className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]"
            >
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={keywordInput}
                  onChange={(event) => setKeywordInput(event.target.value)}
                  placeholder="Tìm theo từ khóa (ví dụ: toán 12)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <input
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                placeholder="Lọc tags, ngăn cách dấu phẩy (toán, hình học)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Tìm kiếm
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                Xóa lọc
              </button>
            </form>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tags phổ biến:
              </span>
              {allTags.map((tag) => {
                const isSelected = searchTags
                  .map(normalizeForSearch)
                  .includes(normalizeForSearch(tag.name));

                return (
                  <button
                    key={tag.name}
                    type="button"
                    onClick={() => handleQuickTagToggle(tag.name)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                      isSelected
                        ? "border border-blue-200 bg-blue-50 text-blue-700"
                        : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    #{tag.name} ({tag.count})
                  </button>
                );
              })}
            </div>

            {(searchKeyword || searchTags.length > 0) && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Bộ lọc đang áp dụng:
                </span>
                {searchKeyword && (
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    Từ khóa: {searchKeyword}
                  </span>
                )}
                {searchTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-slate-900">Danh sách đề</h2>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  Sắp xếp
                  <select
                    value={sortMode}
                    onChange={(event) =>
                      setSortMode(event.target.value as SortMode)
                    }
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="rating-desc">Rating cao nhất</option>
                    <option value="newest-desc">Mới nhất</option>
                  </select>
                </label>
                <span className="text-sm font-semibold text-slate-500">
                  {visibleExams.length} đề thi
                </span>
              </div>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {isLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
                      <div className="mt-3 h-3 w-5/6 animate-pulse rounded bg-slate-100" />
                      <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                      <div className="mt-4 h-7 w-24 animate-pulse rounded bg-slate-200" />
                    </div>
                  ))}
                </div>
              )}
              {!isLoading && visibleExams.length === 0 && (
                <p className="rounded-xl bg-slate-50 p-4 text-slate-500">
                  Hiện chưa có đề thi công khai.
                </p>
              )}

              {!isLoading &&
                visibleExams.map((exam) => (
                  <article
                    key={exam.id}
                    className="w-full rounded-2xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900">{exam.title}</h3>
                      {exam.premium ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                          <Crown className="h-3.5 w-3.5" /> Premium
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                          Miễn phí
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 mt-1">
                      {exam.description || "Không có mô tả"}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      {exam.totalQuestions} câu hỏi • {exam.durationMinutes}{" "}
                      phút • Điểm đỗ {exam.passingScore}
                    </p>
                    {exam.premium && (
                      <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                        <Lock className="h-3.5 w-3.5" />
                        Người dùng miễn phí chỉ xem thử {exam.teaserQuestionCount} câu đầu.
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <ExamRatingStars
                        value={exam.rating?.averageRating ?? 0}
                        size="sm"
                        showValue
                        valueLabel={
                          exam.rating
                            ? `${exam.rating.averageRating.toFixed(1)}/5`
                            : "Chưa có đánh giá"
                        }
                        countLabel={
                          exam.rating
                            ? `(${exam.rating.ratingCount} lượt)`
                            : "(0 lượt)"
                        }
                      />
                    </div>
                    {exam.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {exam.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                          >
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3">
                      <Link
                        to={`/dashboard/exams/${exam.id}`}
                        className="inline-flex rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        Xem đề
                      </Link>
                    </div>
                  </article>
                ))}
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default PublicExams;
