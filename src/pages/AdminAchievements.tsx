import React, { useEffect, useMemo, useState } from 'react';
import { Edit3, PlusCircle, Save, ShieldCheck, Trophy, UserPlus, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import AdminLayout from '../components/AdminLayout';
import {
  assignAdminGamificationAchievementToUser,
  createAdminGamificationAchievement,
  deleteAdminGamificationAchievement,
  fetchAdminGamificationAchievements,
  updateAdminGamificationAchievement,
  type AchievementDefinition,
} from '../api/studyClient';

type FormState = {
  name: string;
  description: string;
  icon: string;
  groupName: string;
  points: number;
  active: boolean;
  ruleFamily: 'CUMULATIVE' | 'STREAK' | 'QUALITY' | 'COMPOUND';
  ruleType: string;
  ruleThreshold: string;
  ruleThresholdSecondary: string;
  compoundLogic: 'AND' | 'OR';
  compoundClause1Type: string;
  compoundClause1Threshold: string;
  compoundClause1ThresholdSecondary: string;
  compoundClause2Type: string;
  compoundClause2Threshold: string;
  compoundClause2ThresholdSecondary: string;
};

const defaultForm: FormState = {
  name: '',
  description: '',
  icon: 'BADGE',
  groupName: 'Tích lũy',
  points: 100,
  active: true,
  ruleFamily: 'CUMULATIVE',
  ruleType: 'CUMULATIVE_EXAM_ATTEMPTS',
  ruleThreshold: '',
  ruleThresholdSecondary: '',
  compoundLogic: 'AND',
  compoundClause1Type: 'CUMULATIVE_EXAM_ATTEMPTS',
  compoundClause1Threshold: '',
  compoundClause1ThresholdSecondary: '',
  compoundClause2Type: 'STREAK_DAYS',
  compoundClause2Threshold: '',
  compoundClause2ThresholdSecondary: '',
};

const RULE_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'CUMULATIVE_EXAM_ATTEMPTS', label: 'Tổng số bài thi đã hoàn thành' },
  { value: 'CUMULATIVE_STUDY_MINUTES', label: 'Tổng phút học trong ngày' },
  { value: 'STREAK_DAYS', label: 'Số ngày streak liên tiếp' },
  { value: 'QUALITY_MIN_SCORE_ATTEMPTS', label: 'Số lần đạt điểm từ ngưỡng trở lên' },
  { value: 'COMPOUND_RULE', label: 'Kết hợp nhiều điều kiện (AND/OR)' },
];

const CUMULATIVE_RULES = RULE_TYPE_OPTIONS.filter((item) =>
  ['CUMULATIVE_EXAM_ATTEMPTS', 'CUMULATIVE_STUDY_MINUTES', 'DISTINCT_EXAMS'].includes(item.value),
);

const STREAK_RULES = RULE_TYPE_OPTIONS.filter((item) => ['STREAK_DAYS'].includes(item.value));

const QUALITY_RULES = RULE_TYPE_OPTIONS.filter((item) =>
  ['QUALITY_MIN_SCORE_ATTEMPTS', 'HIGH_SCORE_ATTEMPTS'].includes(item.value),
);

const ATOMIC_RULES_FOR_COMPOUND = RULE_TYPE_OPTIONS.filter((item) => item.value !== 'COMPOUND_RULE');

type GroupedAchievement = {
  key: string;
  title: string;
  description: string;
  items: AchievementDefinition[];
};

const SEEDED_NAME_OVERRIDES: Record<string, string> = {
  CUMULATIVE_EXAM_ATTEMPTS_3: 'Khởi động thi cử',
  CUMULATIVE_EXAM_ATTEMPTS_10: 'Bền bỉ luyện tập',
  CUMULATIVE_STUDY_MINUTES_60: 'Nạp năng lượng',
  CUMULATIVE_STUDY_MINUTES_180: 'Cỗ máy học tập',
  STREAK_DAYS_5: 'Giữ nhịp học',
  STREAK_DAYS_14: 'Kỷ luật thép',
  QUALITY_MIN_SCORE_85_X1: 'Đánh dấu xuất sắc',
  QUALITY_MIN_SCORE_90_X3: 'Phong độ cao',
  COMPOUND_AND_STUDY_SCORE: 'Toàn tâm toàn lực',
  COMPOUND_OR_STREAK_QUALITY: 'Bùng nổ năng lực',
};

const GROUP_NAME_OVERRIDES: Record<string, string> = {
  'Tich luy': 'Tích lũy',
  Chuoi: 'Chuỗi',
  'Chat luong': 'Chất lượng',
  'Ket hop': 'Kết hợp',
};

const resolveRuleFamilyByRuleType = (ruleType?: string | null): FormState['ruleFamily'] => {
  if (ruleType === 'COMPOUND_RULE') {
    return 'COMPOUND';
  }
  if (ruleType === 'STREAK_DAYS') {
    return 'STREAK';
  }
  if (ruleType === 'QUALITY_MIN_SCORE_ATTEMPTS' || ruleType === 'HIGH_SCORE_ATTEMPTS') {
    return 'QUALITY';
  }
  return 'CUMULATIVE';
};

const resolveGroupNameByRuleFamily = (ruleFamily: FormState['ruleFamily']): string => {
  switch (ruleFamily) {
    case 'STREAK':
      return 'Chuỗi';
    case 'QUALITY':
      return 'Chất lượng';
    case 'COMPOUND':
      return 'Kết hợp';
    case 'CUMULATIVE':
    default:
      return 'Tích lũy';
  }
};

const getRuleSummary = (item: AchievementDefinition): string => {
  const threshold = item.ruleThreshold;
  const secondary = item.ruleThresholdSecondary;

  switch (item.ruleType) {
    case 'CUMULATIVE_EXAM_ATTEMPTS':
      return threshold ? `Hoàn thành từ ${threshold} bài thi` : 'Hoàn thành bài thi';
    case 'CUMULATIVE_STUDY_MINUTES':
      return threshold ? `Học từ ${threshold} phút mỗi ngày` : 'Tích lũy thời gian học';
    case 'STREAK_DAYS':
      return threshold ? `Duy trì streak ${threshold} ngày` : 'Duy trì streak học tập';
    case 'QUALITY_MIN_SCORE_ATTEMPTS':
      if (threshold !== null && threshold !== undefined && secondary !== null && secondary !== undefined) {
        return `Đạt từ ${threshold}% ít nhất ${secondary} lần`;
      }
      return 'Đạt ngưỡng điểm chất lượng';
    case 'DISTINCT_EXAMS':
      return threshold ? `Hoàn thành ${threshold} đề khác nhau` : 'Hoàn thành nhiều đề khác nhau';
    case 'COMPOUND_RULE': {
      if (!item.ruleConfigJson) {
        return 'Kết hợp nhiều điều kiện';
      }
      try {
        const parsed = JSON.parse(item.ruleConfigJson) as { logic?: 'AND' | 'OR' };
        const logicText = parsed.logic === 'OR' ? 'một trong các điều kiện' : 'đồng thời các điều kiện';
        return `Điều kiện kết hợp: ${logicText}`;
      } catch {
        return 'Kết hợp nhiều điều kiện';
      }
    }
    default:
      return item.ruleType ? `Rule: ${item.ruleType}` : 'Chưa cấu hình rule';
  }
};

const AdminAchievements: React.FC = () => {
  const [items, setItems] = useState<AchievementDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [assignCode, setAssignCode] = useState('');
  const [assignUserId, setAssignUserId] = useState('');

  const selectedAchievement = useMemo(
    () => items.find((item) => item.code === selectedCode) ?? null,
    [items, selectedCode],
  );

  const generatedCode = useMemo(() => {
    if (selectedCode) {
      return selectedCode;
    }

    const sanitize = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const suffix = String(Date.now()).slice(-6);

    if (form.ruleFamily === 'COMPOUND') {
      return `COMPOUND_${sanitize(form.compoundLogic)}_${suffix}`;
    }

    const thresholdPart = form.ruleThreshold.trim() ? `_${sanitize(form.ruleThreshold)}` : '';
    return `${sanitize(form.ruleType || 'RULE')}${thresholdPart}_${suffix}`;
  }, [
    selectedCode,
    form.ruleFamily,
    form.compoundLogic,
    form.ruleType,
    form.ruleThreshold,
  ]);

  const groupedAchievements = useMemo<GroupedAchievement[]>(() => {
    const groups = new Map<string, GroupedAchievement>();

    const resolveGroup = (item: AchievementDefinition): Omit<GroupedAchievement, 'items'> => {
      if (item.ruleType) {
        const ruleTypeLabel =
          RULE_TYPE_OPTIONS.find((option) => option.value === item.ruleType)?.label ?? item.ruleType;
        return {
          key: `rule-type:${item.ruleType}`,
          title: `Rule tham số: ${ruleTypeLabel}`,
          description: 'Điều kiện mở khóa theo ngưỡng cấu hình (threshold).',
        };
      }

      return {
        key: 'invalid-rule',
        title: 'Không hợp lệ (thiếu ruleType)',
        description: 'Các bản ghi này nên được xóa hoặc cập nhật lại.',
      };
    };

    for (const item of items) {
      const groupMeta = resolveGroup(item);
      const existing = groups.get(groupMeta.key);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.set(groupMeta.key, {
          ...groupMeta,
          items: [item],
        });
      }
    }

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        items: [...group.items].sort((a, b) => a.code.localeCompare(b.code)),
      }))
      .sort((a, b) => b.items.length - a.items.length || a.title.localeCompare(b.title));
  }, [items]);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const data = await fetchAdminGamificationAchievements();
      setItems(data);
    } catch {
      toast.error('Không thể tải kho thành tựu admin.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  useEffect(() => {
    if (!selectedAchievement) {
      return;
    }

    const selectedRuleFamily = resolveRuleFamilyByRuleType(selectedAchievement.ruleType);

    setForm({
      name: selectedAchievement.name,
      description: selectedAchievement.description,
      icon: selectedAchievement.icon,
      groupName: resolveGroupNameByRuleFamily(selectedRuleFamily),
      points: selectedAchievement.points,
      active: selectedAchievement.active,
      ruleFamily: selectedRuleFamily,
      ruleType: selectedAchievement.ruleType ?? 'CUMULATIVE_EXAM_ATTEMPTS',
      ruleThreshold:
        selectedAchievement.ruleThreshold !== null && selectedAchievement.ruleThreshold !== undefined
          ? String(selectedAchievement.ruleThreshold)
          : '',
      ruleThresholdSecondary:
        selectedAchievement.ruleThresholdSecondary !== null && selectedAchievement.ruleThresholdSecondary !== undefined
          ? String(selectedAchievement.ruleThresholdSecondary)
          : '',
      compoundLogic: 'AND',
      compoundClause1Type: 'CUMULATIVE_EXAM_ATTEMPTS',
      compoundClause1Threshold: '',
      compoundClause1ThresholdSecondary: '',
      compoundClause2Type: 'STREAK_DAYS',
      compoundClause2Threshold: '',
      compoundClause2ThresholdSecondary: '',
    });

    if (selectedAchievement.ruleType === 'COMPOUND_RULE' && selectedAchievement.ruleConfigJson) {
      try {
        const parsed = JSON.parse(selectedAchievement.ruleConfigJson) as {
          logic?: 'AND' | 'OR';
          clauses?: Array<{ ruleType?: string; threshold?: number; thresholdSecondary?: number }>;
        };
        const clauses = parsed.clauses ?? [];
        const first = clauses[0] ?? {};
        const second = clauses[1] ?? {};
        setForm((prev) => ({
          ...prev,
          compoundLogic: parsed.logic === 'OR' ? 'OR' : 'AND',
          compoundClause1Type: first.ruleType ?? prev.compoundClause1Type,
          compoundClause1Threshold:
            first.threshold !== undefined && first.threshold !== null ? String(first.threshold) : '',
          compoundClause1ThresholdSecondary:
            first.thresholdSecondary !== undefined && first.thresholdSecondary !== null
              ? String(first.thresholdSecondary)
              : '',
          compoundClause2Type: second.ruleType ?? prev.compoundClause2Type,
          compoundClause2Threshold:
            second.threshold !== undefined && second.threshold !== null ? String(second.threshold) : '',
          compoundClause2ThresholdSecondary:
            second.thresholdSecondary !== undefined && second.thresholdSecondary !== null
              ? String(second.thresholdSecondary)
              : '',
        }));
      } catch {
        // keep defaults when existing config cannot be parsed
      }
    }
  }, [selectedAchievement]);

  const resetForm = () => {
    setSelectedCode(null);
    setForm(defaultForm);
  };

  const parseOptionalPositiveInteger = (value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || parsed < 0) {
      return null;
    }
    return parsed;
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.name.trim() || !form.description.trim()) {
      toast.error('Vui lòng nhập đủ tên và mô tả.');
      return;
    }

    const parsedRuleThreshold = parseOptionalPositiveInteger(form.ruleThreshold);
    const parsedRuleThresholdSecondary = parseOptionalPositiveInteger(form.ruleThresholdSecondary);
    const syncedGroupName = resolveGroupNameByRuleFamily(form.ruleFamily);

    let payloadRuleType: string | null = null;
    const payloadAutoUnlockRule: string | null = null;
    let payloadRuleThreshold: number | null = null;
    let payloadRuleThresholdSecondary: number | null = null;
    let payloadRuleConfigJson: string | null = null;

    if (form.ruleFamily === 'COMPOUND') {
      const c1Threshold = parseOptionalPositiveInteger(form.compoundClause1Threshold);
      const c1ThresholdSecondary = parseOptionalPositiveInteger(form.compoundClause1ThresholdSecondary);
      const c2Threshold = parseOptionalPositiveInteger(form.compoundClause2Threshold);
      const c2ThresholdSecondary = parseOptionalPositiveInteger(form.compoundClause2ThresholdSecondary);

      if (!form.compoundClause1Type || !form.compoundClause2Type) {
        toast.error('Rule kết hợp cần chọn đủ 2 điều kiện.');
        return;
      }
      if (c1Threshold === null || c2Threshold === null) {
        toast.error('Rule kết hợp cần ngưỡng số cho cả 2 điều kiện.');
        return;
      }

      payloadRuleType = 'COMPOUND_RULE';
      payloadRuleConfigJson = JSON.stringify({
        logic: form.compoundLogic,
        clauses: [
          {
            ruleType: form.compoundClause1Type,
            threshold: c1Threshold,
            thresholdSecondary: c1ThresholdSecondary,
          },
          {
            ruleType: form.compoundClause2Type,
            threshold: c2Threshold,
            thresholdSecondary: c2ThresholdSecondary,
          },
        ],
      });
    } else {
      payloadRuleType = form.ruleType.trim();
      payloadRuleThreshold = parsedRuleThreshold;
      payloadRuleThresholdSecondary = parsedRuleThresholdSecondary;

      if (!payloadRuleType) {
        toast.error('Vui lòng chọn rule cho thành tựu.');
        return;
      }
      if (payloadRuleThreshold === null || payloadRuleThreshold <= 0) {
        toast.error('Vui lòng nhập ngưỡng hợp lệ (> 0).');
        return;
      }
      if (payloadRuleType === 'QUALITY_MIN_SCORE_ATTEMPTS' || payloadRuleType === 'HIGH_SCORE_ATTEMPTS') {
        if (payloadRuleThreshold < 0 || payloadRuleThreshold > 100) {
          toast.error('Ngưỡng điểm phải trong khoảng 0-100.');
          return;
        }
        if (payloadRuleThresholdSecondary === null || payloadRuleThresholdSecondary <= 0) {
          toast.error('Rule chất lượng cần số lần đạt > 0.');
          return;
        }
      }
    }

    try {
      setIsSaving(true);
      const normalizedCode = generatedCode;
      if (selectedCode) {
        await updateAdminGamificationAchievement(normalizedCode, {
          name: form.name.trim(),
          description: form.description.trim(),
          icon: form.icon.trim() || 'BADGE',
          groupName: syncedGroupName,
          points: Number(form.points),
          active: form.active,
          autoUnlockRule: payloadAutoUnlockRule,
          ruleType: payloadRuleType,
          ruleThreshold: payloadRuleThreshold,
          ruleThresholdSecondary: payloadRuleThresholdSecondary,
          ruleConfigJson: payloadRuleConfigJson,
        });
        toast.success('Đã cập nhật thành tựu.');
      } else {
        await createAdminGamificationAchievement({
          code: normalizedCode,
          name: form.name.trim(),
          description: form.description.trim(),
          icon: form.icon.trim() || 'BADGE',
          groupName: syncedGroupName,
          points: Number(form.points),
          active: form.active,
          autoUnlockRule: payloadAutoUnlockRule,
          ruleType: payloadRuleType,
          ruleThreshold: payloadRuleThreshold,
          ruleThresholdSecondary: payloadRuleThresholdSecondary,
          ruleConfigJson: payloadRuleConfigJson,
        });
        toast.success('Đã tạo thành tựu mới.');
      }

      await loadItems();
      setSelectedCode(normalizedCode);
    } catch {
      toast.error('Không thể lưu thành tựu. Kiểm tra lại dữ liệu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (code: string) => {
    try {
      await deleteAdminGamificationAchievement(code);
      toast.success('Đã xóa thành tựu.');
      await loadItems();
      if (selectedCode === code) {
        resetForm();
      }
    } catch {
      toast.error('Không thể xóa thành tựu.');
    }
  };

  const handleAssign = async (event: React.FormEvent) => {
    event.preventDefault();

    const code = assignCode.trim().toUpperCase();
    const userId = Number(assignUserId);

    if (!code || !Number.isInteger(userId) || userId <= 0) {
      toast.error('Vui lòng chọn mã thành tựu và userId hợp lệ.');
      return;
    }

    try {
      setIsAssigning(true);
      await assignAdminGamificationAchievementToUser(code, userId);
      toast.success(`Đã gán thành tựu ${code} cho user ${userId}.`);
      setAssignUserId('');
      await loadItems();
    } catch {
      toast.error('Không thể gán thành tựu cho user.');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-cyan-900 p-6 text-white shadow-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200">
                <ShieldCheck className="h-4 w-4" />
                Admin Gamification
              </p>
              <h1 className="mt-3 text-3xl font-black">Kho thành tựu</h1>
              <p className="mt-1 text-sm text-cyan-100/90">
                Quản trị thành tựu theo dữ liệu DB: tạo mới, cập nhật, xóa và gán trực tiếp cho user.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-wider text-cyan-200">Tổng thành tựu</p>
              <p className="text-3xl font-extrabold">{items.length}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <Trophy className="h-5 w-5 text-amber-500" />
                Danh sách thành tựu
              </h2>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <PlusCircle className="h-4 w-4" />
                Tạo mới
              </button>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                <p className="rounded-xl bg-slate-100 p-4 text-sm text-slate-500">Đang tải dữ liệu...</p>
              ) : items.length === 0 ? (
                <p className="rounded-xl bg-slate-100 p-4 text-sm text-slate-500">Chưa có thành tựu nào.</p>
              ) : (
                groupedAchievements.map((group) => (
                  <div key={group.key} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
                    <div className="mb-3 rounded-xl bg-white/80 px-3 py-2">
                      <p className="text-sm font-bold text-slate-900">{group.title}</p>
                      <p className="text-xs text-slate-500">
                        {group.description} • {group.items.length} huy hiệu
                      </p>
                    </div>

                    <div className="space-y-3">
                      {group.items.map((item) => {
                        const isSelected = item.code === selectedCode;
                        const displayName = SEEDED_NAME_OVERRIDES[item.code] ?? item.name;
                        const displayGroupName = GROUP_NAME_OVERRIDES[item.groupName] ?? item.groupName;
                        return (
                          <div
                            key={item.code}
                            className={`rounded-2xl border p-4 transition ${
                              isSelected
                                ? 'border-cyan-400 bg-cyan-50/60 shadow-sm'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => setSelectedCode(item.code)}
                                className="w-full text-left"
                              >
                                <p className="font-bold text-slate-900">{displayName}</p>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mã: {item.code}</p>
                                <p className="mt-1 text-sm text-slate-600">{displayGroupName} • {item.points} điểm</p>
                                {item.ruleType && (
                                  <p className="mt-1 text-xs text-slate-500">
                                    Điều kiện mở khóa: <span className="font-medium text-slate-600">{getRuleSummary(item)}</span>
                                  </p>
                                )}
                              </button>
                              <div className="shrink-0 text-right">
                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                    item.active
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-slate-200 text-slate-600'
                                  }`}
                                >
                                  {item.active ? 'Đang bật' : 'Đang tắt'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(item.code)}
                                  className="mt-2 flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Xóa thành tựu
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <form onSubmit={handleSave} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
                <Edit3 className="h-5 w-5 text-indigo-500" />
                {selectedCode ? 'Cập nhật thành tựu' : 'Tạo thành tựu mới'}
              </h2>

              <div className="space-y-3">
                <div className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  Mã thành tựu tạo tự động theo rule: <span className="font-semibold text-slate-800">{generatedCode}</span>
                </div>
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Tên thành tựu"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                />
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Mô tả"
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={form.icon}
                    onChange={(event) => setForm((prev) => ({ ...prev, icon: event.target.value }))}
                    placeholder="Icon"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                  />
                  <input
                    value={form.groupName}
                    readOnly
                    placeholder="Nhóm"
                    className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min={0}
                    value={form.points}
                    onChange={(event) => setForm((prev) => ({ ...prev, points: Number(event.target.value) }))}
                    placeholder="Điểm"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                  />
                  <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
                    />
                    Active
                  </label>
                </div>
                <select
                  value={form.ruleFamily}
                  onChange={(event) =>
                    setForm((prev) => {
                      const nextRuleFamily = event.target.value as FormState['ruleFamily'];
                      return {
                        ...prev,
                        ruleFamily: nextRuleFamily,
                        groupName: resolveGroupNameByRuleFamily(nextRuleFamily),
                      };
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                >
                  <option value="CUMULATIVE">Nhóm Tích lũy</option>
                  <option value="STREAK">Nhóm Chuỗi</option>
                  <option value="QUALITY">Nhóm Chất lượng</option>
                  <option value="COMPOUND">Nhóm Kết hợp</option>
                </select>

                {(form.ruleFamily === 'CUMULATIVE' || form.ruleFamily === 'STREAK' || form.ruleFamily === 'QUALITY') && (
                  <>
                    <select
                      value={form.ruleType}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          ruleType: event.target.value,
                          ruleThresholdSecondary:
                            event.target.value === 'QUALITY_MIN_SCORE_ATTEMPTS' || event.target.value === 'HIGH_SCORE_ATTEMPTS'
                              ? prev.ruleThresholdSecondary
                              : '',
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                    >
                      {(form.ruleFamily === 'CUMULATIVE' ? CUMULATIVE_RULES : form.ruleFamily === 'STREAK' ? STREAK_RULES : QUALITY_RULES).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min={0}
                      value={form.ruleThreshold}
                      onChange={(event) => setForm((prev) => ({ ...prev, ruleThreshold: event.target.value }))}
                      placeholder="Ngưỡng chính"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                    />

                    {(form.ruleType === 'QUALITY_MIN_SCORE_ATTEMPTS' || form.ruleType === 'HIGH_SCORE_ATTEMPTS') && (
                      <input
                        type="number"
                        min={1}
                        value={form.ruleThresholdSecondary}
                        onChange={(event) => setForm((prev) => ({ ...prev, ruleThresholdSecondary: event.target.value }))}
                        placeholder="Số lần đạt điều kiện"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                      />
                    )}
                  </>
                )}

                {form.ruleFamily === 'COMPOUND' && (
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <select
                      value={form.compoundLogic}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, compoundLogic: event.target.value as 'AND' | 'OR' }))
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                    >
                      <option value="AND">AND - Thỏa tất cả điều kiện</option>
                      <option value="OR">OR - Thỏa 1 trong các điều kiện</option>
                    </select>

                    <div className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase text-slate-500">Điều kiện 1</p>
                      <select
                        value={form.compoundClause1Type}
                        onChange={(event) => setForm((prev) => ({ ...prev, compoundClause1Type: event.target.value }))}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                      >
                        {ATOMIC_RULES_FOR_COMPOUND.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={0}
                        value={form.compoundClause1Threshold}
                        onChange={(event) => setForm((prev) => ({ ...prev, compoundClause1Threshold: event.target.value }))}
                        placeholder="Ngưỡng 1"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                      />
                      <input
                        type="number"
                        min={0}
                        value={form.compoundClause1ThresholdSecondary}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, compoundClause1ThresholdSecondary: event.target.value }))
                        }
                        placeholder="Ngưỡng phụ 1 (nếu có)"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase text-slate-500">Điều kiện 2</p>
                      <select
                        value={form.compoundClause2Type}
                        onChange={(event) => setForm((prev) => ({ ...prev, compoundClause2Type: event.target.value }))}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                      >
                        {ATOMIC_RULES_FOR_COMPOUND.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={0}
                        value={form.compoundClause2Threshold}
                        onChange={(event) => setForm((prev) => ({ ...prev, compoundClause2Threshold: event.target.value }))}
                        placeholder="Ngưỡng 2"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                      />
                      <input
                        type="number"
                        min={0}
                        value={form.compoundClause2ThresholdSecondary}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, compoundClause2ThresholdSecondary: event.target.value }))
                        }
                        placeholder="Ngưỡng phụ 2 (nếu có)"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Đang lưu...' : 'Lưu thành tựu'}
              </button>
            </form>

            <form onSubmit={handleAssign} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
                <UserPlus className="h-5 w-5 text-emerald-500" />
                Gán thành tựu cho user
              </h2>

              <div className="space-y-3">
                <select
                  value={assignCode}
                  onChange={(event) => setAssignCode(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                >
                  <option value="">Chọn thành tựu</option>
                  {items.filter((item) => item.active).map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.code} - {item.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min={1}
                  value={assignUserId}
                  onChange={(event) => setAssignUserId(event.target.value)}
                  placeholder="User ID"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={isAssigning}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <UserPlus className="h-4 w-4" />
                {isAssigning ? 'Đang gán...' : 'Gán thành tựu'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminAchievements;
