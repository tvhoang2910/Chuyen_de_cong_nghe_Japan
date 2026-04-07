import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft, TimerReset } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { fetchAttemptView, type ExamDetail } from '../api/examClient';
import { fetchExamWrongDecks, submitReviewAnswer, type Sm2DeckQuestion } from '../api/studyClient';

const parseOptionIds = (raw: string | null): number[] => {
  if (!raw || !raw.trim()) return [];
  return raw
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value));
};

const formatTopicTags = (topicTagIds: string | null): string => {
  if (!topicTagIds || !topicTagIds.trim()) return 'Chua co tag';
  return topicTagIds
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
    .map((tag) => `#${tag}`)
    .join(' ');
};

const isSameOptionSet = (left: number[], right: number[]) => {
  if (left.length !== right.length) return false;
  const a = [...left].sort((x, y) => x - y);
  const b = [...right].sort((x, y) => x - y);
  return a.every((value, idx) => value === b[idx]);
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
  const [deckTitle, setDeckTitle] = useState('Luyen tap SM-2');

  const [selectedByQuestionId, setSelectedByQuestionId] = useState<Record<number, number[]>>({});
  const [answerChangeCountByQuestionId, setAnswerChangeCountByQuestionId] = useState<Record<number, number>>({});
  const [reviewStartedAt, setReviewStartedAt] = useState<Record<number, number>>({});
  const [submittingItemId, setSubmittingItemId] = useState<number | null>(null);

  const loadPageData = useCallback(async (silent = false) => {
    if (!Number.isFinite(parsedExamId) || parsedExamId <= 0) {
      toast.error('ID de khong hop le.');
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
        toast.error('Deck nay khong con trong danh sach on tap.');
        navigate('/dashboard/spaced-repetition', { replace: true });
        return;
      }

      setDeckTitle(`${matchDeck.examTitle} - cac cau sai`);
      setQuestions(matchDeck.questions);
      setExamDetail(detail);

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
      if (axios.isAxiosError(error)) {
        const detailMessage = (error.response?.data as { message?: string } | undefined)?.message;
        toast.error(detailMessage || 'Khong the tai trang luyen tap.');
      } else {
        toast.error('Khong the tai trang luyen tap.');
      }
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
    const selected = selectedByQuestionId[question.itemId] ?? [];
    if (selected.length === 0) {
      toast.error('Ban can chon dap an truoc khi kiem tra.');
      return;
    }

    const correctOptionIds = parseOptionIds(question.correctOptionIds);
    if (correctOptionIds.length === 0) {
      toast.error('Khong co dap an chuan cho cau nay. Hay lam lai de moi de cap nhat du lieu.');
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
          ? `Chinh xac! Da cap nhat SM-2 cho cau ${question.itemId} (q=${result.quality}).`
          : `Chua dung. Da cap nhat SM-2 cho cau ${question.itemId} (q=${result.quality}).`,
      );
      await loadPageData(true);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const detailMessage = (error.response?.data as { message?: string } | undefined)?.message;
        toast.error(detailMessage || 'Khong the luu ket qua on tap.');
      } else {
        toast.error('Khong the luu ket qua on tap.');
      }
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
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">Trang luyen tap</p>
              <h1 className="mt-2 text-2xl font-bold">{deckTitle}</h1>
              <p className="mt-1 text-emerald-100">Trang nay chi hien thi cau hoi de luyen tap, khong con giao dien thu gon.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/spaced-repetition')}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lai danh sach deck
            </button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider text-emerald-100">Tong cau trong deck</p>
              <p className="mt-1 text-2xl font-bold">{questions.length}</p>
            </div>
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider text-emerald-100">Ti le co lich su on</p>
              <p className="mt-1 text-2xl font-bold">{completionRate}%</p>
            </div>
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider text-emerald-100">Trang thai</p>
              <p className="mt-1 text-2xl font-bold">{isReloading ? 'Dang tai...' : 'San sang'}</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          {isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-500">Dang tai cau hoi luyen tap...</div>
          ) : questions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">Deck nay hien tai khong con cau sai can luyen.</div>
          ) : (
            questions.map((question) => {
              const fullQuestion = examDetail?.questions.find((q) => q.id === question.itemId);
              const selected = selectedByQuestionId[question.itemId]?.[0];

              return (
                <article key={question.itemId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Cau hoi #{question.itemId}</h2>
                      <p className="mt-1 text-sm text-slate-700">{fullQuestion?.content || `Noi dung cau #${question.itemId}`}</p>
                      <p className="text-sm text-slate-500">{formatTopicTags(question.topicTagIds)}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      <TimerReset className="h-3.5 w-3.5" />
                      {new Date(question.nextReviewAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-4">
                    <p>Lan lap: <span className="font-semibold text-slate-900">{question.repetition}</span></p>
                    <p>Khoang cach: <span className="font-semibold text-slate-900">{question.intervalDays} ngay</span></p>
                    <p>EF: <span className="font-semibold text-slate-900">{question.easinessFactor.toFixed(2)}</span></p>
                    <p>Lan dung: <span className="font-semibold text-slate-900">{question.correctReviews}/{question.totalReviews}</span></p>
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
                      Khong tai duoc danh sach dap an cho cau nay. Ban co the lam lai de de dong bo du lieu.
                    </p>
                  )}

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => void handleSubmitPracticeQuestion(question)}
                      disabled={submittingItemId === question.itemId}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                    >
                      {submittingItemId === question.itemId ? 'Dang kiem tra...' : 'Kiem tra cau nay'}
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
