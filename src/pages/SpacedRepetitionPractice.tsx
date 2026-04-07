import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft, TimerReset } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { fetchAttemptResult, fetchAttemptView, type ExamDetail } from '../api/examClient';
import { fetchExamWrongDecks, submitReviewAnswer, type Sm2DeckQuestion } from '../api/studyClient';

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const detail = error.response?.data as { message?: string; detail?: string } | undefined;
  return detail?.message || detail?.detail || fallback;
};

const parseOptionIds = (raw: string | null): number[] => {
  if (!raw || !raw.trim()) return [];
  const matches = raw.match(/\d+/g);
  if (!matches) return [];

  return [...new Set(matches
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value)))];
};

const formatTopicTags = (topicTagIds: string | null, tags: ExamDetail['tags'] = []): string => {
  if (!topicTagIds || !topicTagIds.trim()) return 'Chưa gắn tag';

  const tagNameById = new Map(tags.map((tag) => [tag.id, tag.name.trim()]));
  const tagNames = [...new Set(topicTagIds
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value))
    .map((id) => tagNameById.get(id))
    .filter((name): name is string => Boolean(name && name.trim()))
    .map((name) => name.trim()))];

  if (tagNames.length === 0) return 'Chưa gắn tag';
  return tagNames.map((name) => `#${name}`).join(' ');
};

const isSameOptionSet = (left: number[], right: number[]) => {
  if (left.length !== right.length) return false;
  const a = [...left].sort((x, y) => x - y);
  const b = [...right].sort((x, y) => x - y);
  return a.every((value, idx) => value === b[idx]);
};

const resolveCorrectOptionIds = (
  question: Sm2DeckQuestion,
  fullQuestion?: ExamDetail['questions'][number],
  fromAttemptResult: number[] = [],
): number[] => {
  const fromDeck = parseOptionIds(question.correctOptionIds);
  if (fromDeck.length > 0) {
    return fromDeck;
  }

  if (fromAttemptResult.length > 0) {
    return [...new Set(fromAttemptResult
      .filter((value) => Number.isFinite(value))
      .map((value) => Number(value)))];
  }

  if (!fullQuestion?.options?.length) {
    return [];
  }

  return fullQuestion.options
    .filter((option) => Boolean(option.isCorrect) && Number.isFinite(option.id))
    .map((option) => Number(option.id));
};

const SpacedRepetitionPractice: React.FC = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const [searchParams] = useSearchParams();

  const parsedExamId = Number(examId);
  const expectedAttemptId = Number(searchParams.get('attemptId'));

  const [isLoading, setIsLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [examDetail, setExamDetail] = useState<ExamDetail | null>(null);
  const [questions, setQuestions] = useState<Sm2DeckQuestion[]>([]);
  const [correctOptionIdsByQuestionId, setCorrectOptionIdsByQuestionId] = useState<Record<number, number[]>>({});
  const [deckTitle, setDeckTitle] = useState('Luyện tập SM-2');

  const [selectedByQuestionId, setSelectedByQuestionId] = useState<Record<number, number[]>>({});
  const [answerChangeCountByQuestionId, setAnswerChangeCountByQuestionId] = useState<Record<number, number>>({});
  const [reviewStartedAt, setReviewStartedAt] = useState<Record<number, number>>({});
  const [submittingItemId, setSubmittingItemId] = useState<number | null>(null);

  const loadPageData = useCallback(async (silent = false) => {
    if (!Number.isFinite(parsedExamId) || parsedExamId <= 0) {
      toast.error('ID đề không hợp lệ.');
      navigate('/dashboard/spaced-repetition', { replace: true });
      return;
    }

    if (silent) setIsReloading(true);
    else setIsLoading(true);

    try {
      const [decksData, detail] = await Promise.all([fetchExamWrongDecks(), fetchAttemptView(parsedExamId)]);
      const matchDeck = decksData.decks.find((deck) => {
        if (deck.examId !== parsedExamId) return false;
        if (Number.isFinite(expectedAttemptId) && expectedAttemptId > 0) {
          return deck.latestAttemptId === expectedAttemptId;
        }
        return true;
      });

      if (!matchDeck) {
        toast.error('Deck này không còn trong danh sách ôn tập.');
        navigate('/dashboard/spaced-repetition', { replace: true });
        return;
      }

      const attemptIdForAnswerKey =
        Number.isFinite(expectedAttemptId) && expectedAttemptId > 0
          ? expectedAttemptId
          : matchDeck.latestAttemptId;

      let answerKeyByQuestionId: Record<number, number[]> = {};
      if (Number.isFinite(attemptIdForAnswerKey) && attemptIdForAnswerKey > 0) {
        try {
          const attemptResult = await fetchAttemptResult(attemptIdForAnswerKey);
          answerKeyByQuestionId = attemptResult.questionResults.reduce<Record<number, number[]>>((acc, result) => {
            acc[result.questionId] = Array.isArray(result.correctOptionIds)
              ? result.correctOptionIds
                .filter((value) => Number.isFinite(value))
                .map((value) => Number(value))
              : [];
            return acc;
          }, {});
        } catch {
          answerKeyByQuestionId = {};
        }
      }

      setDeckTitle(`${matchDeck.examTitle} - các câu sai`);
      setQuestions(matchDeck.questions);
      setExamDetail(detail);
      setCorrectOptionIdsByQuestionId(answerKeyByQuestionId);

      const now = Date.now();
      setReviewStartedAt((prev) => {
        const next = { ...prev };
        matchDeck.questions.forEach((question) => {
          if (!next[question.itemId]) {
            next[question.itemId] = now;
          }
        });
        return next;
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tải trang luyện tập.'));
      navigate('/dashboard/spaced-repetition', { replace: true });
    } finally {
      setIsLoading(false);
      setIsReloading(false);
    }
  }, [expectedAttemptId, navigate, parsedExamId]);

  useEffect(() => {
    void loadPageData(false);
  }, [loadPageData]);

  const handleChooseOption = (questionId: number, optionId: number) => {
    setSelectedByQuestionId((prev) => {
      const current = prev[questionId] ?? [];
      if (current.length > 0 && current[0] !== optionId) {
        setAnswerChangeCountByQuestionId((changes) => ({
          ...changes,
          [questionId]: (changes[questionId] ?? 0) + 1,
        }));
      }
      return { ...prev, [questionId]: [optionId] };
    });
  };

  const handleSubmitPracticeQuestion = async (question: Sm2DeckQuestion) => {
    if (!question.dueNow) {
      toast.error(`Câu này chưa đến hạn ôn. Hãy chờ đến ${new Date(question.nextReviewAt).toLocaleString('vi-VN')}.`);
      return;
    }

    const selected = selectedByQuestionId[question.itemId] ?? [];
    if (selected.length === 0) {
      toast.error('Bạn cần chọn đáp án trước khi kiểm tra.');
      return;
    }

    const fullQuestion = examDetail?.questions.find((q) => q.id === question.itemId);
    const correctOptionIds = resolveCorrectOptionIds(
      question,
      fullQuestion,
      correctOptionIdsByQuestionId[question.itemId] ?? [],
    );
    if (correctOptionIds.length === 0) {
      toast.error('Không có đáp án chuẩn cho câu này. Hãy cập nhật dữ liệu đề thi rồi thử lại.');
      return;
    }

    const isCorrect = isSameOptionSet(selected, correctOptionIds);
    const started = reviewStartedAt[question.itemId] ?? Date.now();
    const elapsed = Math.max(0, Date.now() - started);
    const changeCount = answerChangeCountByQuestionId[question.itemId] ?? 0;

    setSubmittingItemId(question.itemId);
    try {
      const result = await submitReviewAnswer(question.itemId, isCorrect, elapsed, changeCount);
      toast.success(
        isCorrect
          ? `Chính xác! Đã cập nhật SM-2 cho câu ${question.itemId} (q=${result.quality}).`
          : `Chưa đúng. Đã cập nhật SM-2 cho câu ${question.itemId} (q=${result.quality}).`,
      );
      await loadPageData(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể lưu kết quả ôn tập.'));
    } finally {
      setSubmittingItemId(null);
    }
  };

  const completionRate = useMemo(() => {
    if (questions.length === 0) return 0;
    const studied = questions.filter((question) => question.totalReviews > 0).length;
    return Math.round((studied / questions.length) * 100);
  }, [questions]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-emerald-600 to-teal-600 p-6 text-white shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">Trang luyện tập</p>
              <h1 className="mt-2 text-2xl font-bold">{deckTitle}</h1>
              <p className="mt-1 text-emerald-100">Trang này chỉ hiển thị câu hỏi để luyện tập, không còn giao diện thu gọn.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/spaced-repetition')}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại danh sách deck
            </button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider text-emerald-100">Tổng câu trong deck</p>
              <p className="mt-1 text-2xl font-bold">{questions.length}</p>
            </div>
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider text-emerald-100">Tỉ lệ có lịch sử ôn</p>
              <p className="mt-1 text-2xl font-bold">{completionRate}%</p>
            </div>
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider text-emerald-100">Trạng thái</p>
              <p className="mt-1 text-2xl font-bold">{isReloading ? 'Đang tải...' : 'Sẵn sàng'}</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          {isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-500">Đang tải câu hỏi luyện tập...</div>
          ) : questions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">Deck này hiện tại không còn câu sai cần luyện.</div>
          ) : (
            questions.map((question) => {
              const fullQuestion = examDetail?.questions.find((q) => q.id === question.itemId);
              const selected = selectedByQuestionId[question.itemId]?.[0];

              return (
                <article key={question.itemId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Câu hỏi #{question.itemId}</h2>
                      <p className="mt-1 text-sm text-slate-700">{fullQuestion?.content || `Nội dung câu #${question.itemId}`}</p>
                      <p className="text-sm text-slate-500">{formatTopicTags(question.topicTagIds, examDetail?.tags ?? [])}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        <TimerReset className="h-3.5 w-3.5" />
                        {new Date(question.nextReviewAt).toLocaleString('vi-VN')}
                      </span>
                      <p className={`mt-1 text-xs font-semibold ${question.dueNow ? 'text-emerald-600' : 'text-amber-700'}`}>
                        {question.dueNow ? 'Đã đến hạn ôn' : 'Chưa đến hạn ôn'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-4">
                    <p>Lần lặp: <span className="font-semibold text-slate-900">{question.repetition}</span></p>
                    <p>Khoảng cách: <span className="font-semibold text-slate-900">{question.intervalDays} ngày</span></p>
                    <p>EF: <span className="font-semibold text-slate-900">{question.easinessFactor.toFixed(2)}</span></p>
                    <p>Lần đúng: <span className="font-semibold text-slate-900">{question.correctReviews}/{question.totalReviews}</span></p>
                  </div>

                  {fullQuestion?.options?.length ? (
                    <div className="mt-4 space-y-2">
                      {fullQuestion.options.map((option, idx) => {
                        const active = selected === option.id;
                        return (
                          <button
                            key={option.id || idx}
                            type="button"
                            onClick={() => option.id && handleChooseOption(question.itemId, option.id)}
                            className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                              active
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                                : 'border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/40'
                            }`}
                          >
                            {idx + 1}. {option.content}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      Không tải được danh sách đáp án cho câu này. Bạn có thể làm lại đề để đồng bộ dữ liệu.
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    {!question.dueNow ? (
                      <p className="text-xs text-amber-700">
                        Chưa đến hạn ôn. Mở lại lúc {new Date(question.nextReviewAt).toLocaleString('vi-VN')}.
                      </p>
                    ) : <span />}
                    <button
                      type="button"
                      onClick={() => void handleSubmitPracticeQuestion(question)}
                      disabled={submittingItemId === question.itemId || !question.dueNow}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                        question.dueNow
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400'
                          : 'cursor-not-allowed bg-slate-300 text-slate-100'
                      }`}
                    >
                      {submittingItemId === question.itemId
                        ? 'Đang kiểm tra...'
                        : question.dueNow
                          ? 'Kiểm tra câu này'
                          : 'Chưa đến hạn ôn'}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </MainLayout>
  );
};

export default SpacedRepetitionPractice;
