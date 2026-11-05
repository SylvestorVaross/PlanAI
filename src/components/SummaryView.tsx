import React, { useState } from 'react';
import { PlanItem, TaskType, UserPreferences, QuestActionType } from '../types';
import { soundHelper } from '../utils/soundHelper';

interface SummaryViewProps {
  plans: PlanItem[];
  selectedPlanId?: string;
  preferences: UserPreferences;
  onSelectPlanId: (id: string) => void;
  onToggleTopicCompletion: (planId: string, topicId: string) => void;
  onGoToSchedule: (planId: string) => void;
  onTriggerQuestAction?: (action: QuestActionType) => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  plans,
  selectedPlanId,
  preferences,
  onSelectPlanId,
  onToggleTopicCompletion,
  onGoToSchedule,
  onTriggerQuestAction,
}) => {
  const [filterType, setFilterType] = useState<'all' | TaskType>('all');

  const filteredPlans = plans.filter((p) => {
    if (filterType === 'all') return true;
    return p.type === filterType;
  });

  const activePlan =
    plans.find((p) => p.id === selectedPlanId) ||
    (filteredPlans.length > 0 ? filteredPlans[0] : plans[0]);

  const handleToggle = (planId: string, topicId: string) => {
    onToggleTopicCompletion(planId, topicId);
    const targetTopic = activePlan?.topics.find((t) => t.id === topicId);
    const willBeCompleted = !targetTopic?.completed;
    if (willBeCompleted) {
      soundHelper.playChime('complete', preferences.soundEnabled);
      soundHelper.speakThaiReminder('topic_done', preferences.voiceStyle, preferences.voiceEnabled ?? true);
      if (onTriggerQuestAction) {
        onTriggerQuestAction('review_flashcard');
      }
    } else {
      soundHelper.playChime('click', preferences.soundEnabled);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (plans.length === 0) {
    return (
      <div className="w-full py-16 text-center flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant">subject</span>
        <h2 className="font-headline-md text-lg font-bold text-on-surface">ยังไม่มีข้อมูลสรุปผล AI</h2>
        <p className="text-xs text-on-surface-variant">
          โปรดสร้างแผนโดยการเพิ่มหัวข้อสอบหรือหัวข้อการบ้านในแท็บ &quot;อัปโหลด &amp; วิเคราะห์&quot; ก่อน
        </p>
      </div>
    );
  }

  return (
    <div className="w-full py-6 flex flex-col gap-6 animate-fadeIn">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-subtle shadow-xs">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            <span className="font-label-lg font-bold text-sm">คลังสรุปผลอัจฉริยะ (Smart Digest Hub)</span>
          </div>
          <h1 className="font-headline-md text-xl md:text-2xl font-bold text-on-surface">
            สรุปขอบเขตเนื้อหา &amp; ตรวจสอบความพร้อม
          </h1>
          <p className="font-body-sm text-xs text-on-surface-variant">
            คลิกทำเครื่องหมายหัวข้อที่คุณอ่านจบแล้ว เพื่อติดตามสถิติความจำและความพร้อม
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-full border border-subtle self-start sm:self-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-surface-container-high text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            ทั้งหมด ({plans.length})
          </button>
          <button
            onClick={() => setFilterType('exam')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'exam'
                ? 'bg-primary text-white shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            สอบ ({plans.filter((p) => p.type === 'exam').length})
          </button>
          <button
            onClick={() => setFilterType('homework')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'homework'
                ? 'bg-secondary text-white shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            การบ้าน ({plans.filter((p) => p.type === 'homework').length})
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 Cols): Subject List Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <span className="font-label-md text-xs font-bold text-on-surface-variant px-1">
            เลือกวิชาเพื่อดูสรุป ({filteredPlans.length} วิชา)
          </span>

          <div className="flex flex-col gap-2.5">
            {filteredPlans.map((plan) => {
              const isSelected = activePlan?.id === plan.id;
              const isExam = plan.type === 'exam';
              const completedCount = plan.topics.filter((t) => t.completed).length;

              return (
                <div
                  key={plan.id}
                  onClick={() => onSelectPlanId(plan.id)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-surface-container-lowest border-primary shadow-sm ring-2 ring-primary/20'
                      : 'bg-surface-container-lowest border-subtle hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-code-badge px-2.5 py-0.5 rounded-full font-bold ${
                        isExam ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-secondary-fixed text-secondary'
                      }`}
                    >
                      {isExam ? 'หัวข้อสอบ' : 'การบ้าน'}
                    </span>
                    <span className="text-[11px] text-on-surface-variant font-code-badge">
                      {plan.detectedDate.split(' เวลา')[0]}
                    </span>
                  </div>

                  <span className="font-label-md text-xs md:text-sm font-bold text-on-surface line-clamp-1">
                    {plan.title}
                  </span>

                  <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1 border-t border-subtle">
                    <span>ความคืบหน้า</span>
                    <span className="font-code-badge font-bold text-primary">
                      {completedCount}/{plan.topics.length} หัวข้อ
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (8 Cols): Detailed Digest for Active Plan */}
        {activePlan && (
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Active Plan Card Header */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-subtle shadow-xs flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-code-badge text-xs font-bold ${
                        activePlan.type === 'exam'
                          ? 'bg-primary-fixed text-on-primary-fixed'
                          : 'bg-secondary-fixed text-secondary'
                      }`}
                    >
                      {activePlan.type === 'exam' ? 'หัวข้อสอบ' : 'การบ้าน'}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">
                      {activePlan.category}
                    </span>
                  </div>
                  <h2 className="font-headline-md text-lg md:text-xl font-bold text-on-surface">
                    {activePlan.title}
                  </h2>
                  <span className="text-xs text-on-surface-variant">
                    วิชา: <strong className="text-on-surface">{activePlan.subjectName}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="p-2 rounded-xl bg-surface-container-low text-on-surface-variant hover:text-on-surface border border-subtle cursor-pointer"
                    title="พิมพ์สรุปหรือบันทึกเป็น PDF"
                  >
                    <span className="material-symbols-outlined text-[18px]">print</span>
                  </button>
                  <button
                    onClick={() => onGoToSchedule(activePlan.id)}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">menu_book</span>
                    สรุปบทเรียน AI
                  </button>
                </div>
              </div>

              {/* Detected Schedule Highlight */}
              <div className="p-4 rounded-xl bg-primary-fixed/20 border border-primary/30 flex items-center justify-between text-xs md:text-sm">
                <div className="flex items-center gap-2 text-on-surface">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    {activePlan.type === 'exam' ? 'event_available' : 'timer'}
                  </span>
                  <span>
                    {activePlan.type === 'exam' ? 'วันและเวลาสอบ:' : 'กำหนดส่งงาน:'}{' '}
                    <strong className="text-primary font-bold">{activePlan.detectedDate}</strong>
                  </span>
                </div>
                <span className="font-code-badge text-xs font-bold text-primary bg-primary-fixed/60 px-2.5 py-1 rounded-full">
                  อีก {activePlan.daysRemaining} วัน
                </span>
              </div>

              {/* Summary Description */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  สรุปภาพรวมขอบเขตโดย AI:
                </span>
                <p className="font-body-md text-xs md:text-sm text-on-surface leading-relaxed p-3.5 rounded-xl bg-surface-container-low border border-subtle">
                  {activePlan.summary}
                </p>
              </div>

              {/* Key Highlights */}
              {activePlan.keyHighlights && activePlan.keyHighlights.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    จุดเน้นสำคัญ &amp; ข้อควรรู้:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {activePlan.keyHighlights.map((hl, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-surface-container-low border border-subtle text-xs text-on-surface flex items-start gap-2"
                      >
                        <span className="text-primary font-bold shrink-0 mt-0.5">✓</span>
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Topic Breakdown Checklist */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-subtle shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">checklist_rtl</span>
                  เช็กลิสต์หัวข้อย่อยและเทคนิคจำ ({activePlan.topics.length} หัวข้อ)
                </span>
                <span className="text-xs text-on-surface-variant font-code-badge">
                  ติ๊กหัวข้อที่อ่านจบแล้ว
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {activePlan.topics.map((topic) => (
                  <div
                    key={topic.id}
                    onClick={() => handleToggle(activePlan.id, topic.id)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-2.5 ${
                      topic.completed
                        ? 'bg-primary-fixed/15 border-primary/40'
                        : 'bg-surface-container-low border-subtle hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            topic.completed
                              ? 'bg-primary border-primary text-white'
                              : 'border-subtle bg-surface-container-lowest'
                          }`}
                        >
                          {topic.completed && <span className="text-xs font-bold">✓</span>}
                        </div>
                        <span
                          className={`font-label-md text-xs md:text-sm font-bold ${
                            topic.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'
                          }`}
                        >
                          {topic.title}
                        </span>
                      </div>

                      <span
                        className={`font-code-badge text-[11px] px-2 py-0.5 rounded-full shrink-0 font-medium ${
                          topic.difficulty === 'ยาก'
                            ? 'bg-error/15 text-error'
                            : topic.difficulty === 'ปานกลาง'
                            ? 'bg-tertiary-container/20 text-tertiary-container'
                            : 'bg-primary-fixed text-primary'
                        }`}
                      >
                        {topic.difficulty} • {topic.estimatedMinutes} นาที
                      </span>
                    </div>

                    {/* Subtopics Checklist */}
                    <div className="flex flex-wrap gap-1.5 pl-7">
                      {topic.subtopics.map((sub, sIdx) => (
                        <span
                          key={sIdx}
                          className="font-code-badge text-[11px] bg-surface-container-lowest px-2 py-0.5 rounded-md text-on-surface-variant border border-subtle"
                        >
                          • {sub}
                        </span>
                      ))}
                    </div>

                    {/* Recommended Technique Tip */}
                    <div className="ml-7 flex items-center gap-1.5 text-[11px] text-secondary font-medium">
                      <span className="material-symbols-outlined text-[13px]">psychology</span>
                      <span>เทคนิคการเรียน: {topic.technique}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cognitive Balance & Wellness Note */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-subtle flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-[22px] shrink-0 mt-0.5">
                nature_people
              </span>
              <div className="flex flex-col gap-0.5 text-xs text-on-surface-variant">
                <span className="font-bold text-on-surface">คำแนะนำเพื่อสุขภาวะและสายตา:</span>
                <p className="leading-relaxed">{activePlan.wellnessAdvice}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
