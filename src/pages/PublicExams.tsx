import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Lock } from "lucide-react";
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

const PublicExams: React.FC = () => {
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("rating-desc");
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
      toast.error("Không tải được danh sách đề thi công khai.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPublicExams();
  }, []);

  const visibleExams = useMemo<PublicExamRow[]>(() => {
    const rows = exams.map((exam) => ({
      ...exam,
      rating: ratingsByExamId[exam.id] ?? null,
    }));

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
  }, [exams, ratingsByExamId, sortMode]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Kho đề thi công khai
          </h1>
          <p className="text-slate-500 mt-1">
            Người dùng có thể xem các đề đã được public bởi contributor/admin.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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
              {isLoading && <p className="text-slate-500">Đang tải...</p>}
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
