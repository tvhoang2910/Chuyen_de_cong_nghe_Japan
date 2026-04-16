import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Brain, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { fetchExamWrongDecks, type Sm2ExamDecksResponse } from '../api/studyClient';

const getDeckKey = (examId: number, latestAttemptId: number) => `${examId}-${latestAttemptId}`;

const SpacedRepetition: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deckData, setDeckData] = useState<Sm2ExamDecksResponse | null>(null);

  const loadDecks = useCallback(async (silent = false) => {
    if (silent) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await fetchExamWrongDecks();
      setDeckData(data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data as { message?: string; detail?: string } | undefined;
        toast.error(detail?.message || detail?.detail || 'Không thể tải danh sách ôn tập SM-2.');
      } else {
        toast.error('Không thể tải danh sách ôn tập SM-2.');
      }
      setDeckData(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDecks(false);
  }, [loadDecks]);

  const decks = useMemo(() => deckData?.decks ?? [], [deckData]);
  const dueCount = deckData?.totalWrongQuestions ?? 0;

  const completionRate = useMemo(() => {
    const questions = decks.flatMap((deck) => deck.questions);
    if (questions.length === 0) return 0;
    const studied = questions.filter((q) => q.totalReviews > 0).length;
    return Math.round((studied / questions.length) * 100);
  }, [decks]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-blue-600 to-cyan-600 p-6 text-white shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                <Brain className="h-4 w-4" />
                Học tập SM-2
              </div>
              <h1 className="mt-3 text-2xl font-bold">Ôn tập thông minh từ study_service</h1>
              <p className="mt-1 text-blue-100">Deck theo đề thi, bấm nút Luyện tập để mở trang câu hỏi riêng cho mỗi đề.</p>
            </div>
            <button
              type="button"
              onClick={() => void loadDecks(true)}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider text-blue-100">Câu đến hạn</p>
              <p className="mt-1 text-2xl font-bold">{dueCount}</p>
            </div>
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider text-blue-100">Số đề cần ôn</p>
              <p className="mt-1 text-2xl font-bold">{deckData?.deckCount ?? 0}</p>
            </div>
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider text-blue-100">Tỉ lệ có lịch sử ôn</p>
              <p className="mt-1 text-2xl font-bold">{completionRate}%</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-500">Đang tải danh sách ôn tập...</div>
          ) : decks.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
              <h2 className="mt-3 text-lg font-bold text-slate-900">Không có câu nào cần ôn tập</h2>
              <p className="mt-1 text-slate-500">Bạn có thể làm thêm đề mới để hệ thống tiếp tục tạo deck ôn tập.</p>
            </div>
          ) : (
            decks.map((deck) => {
              const key = getDeckKey(deck.examId, deck.latestAttemptId);

              return (
                <article key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{deck.examTitle} - các câu sai</h3>
                      <p className="text-sm text-slate-500">
                        Lần thi thứ {deck.attemptNumber ?? '?'} • {new Date(deck.latestSubmittedAt).toLocaleString('vi-VN')} • {deck.wrongQuestionCount} câu sai
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigate(`/dashboard/spaced-repetition/${deck.examId}/practice?attemptId=${deck.latestAttemptId}`);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Luyện tập
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

export default SpacedRepetition;
