import React, { useState, useEffect, useRef } from 'react';
import { PlanItem, UserPreferences, QuestActionType } from '../types';
import { soundHelper } from '../utils/soundHelper';

interface ScheduleTimerViewProps {
  plans: PlanItem[];
  selectedPlanId?: string;
  preferences: UserPreferences;
  onToggleBlockCompletion: (planId: string, dayNumber: number, blockId: string) => void;
  onAwardXpAndStamina?: (xp: number, staminaDelta: number) => void;
  onUpdatePreferences?: (prefs: Partial<UserPreferences>) => void;
  onTriggerQuestAction?: (action: QuestActionType) => void;
}

export const ScheduleTimerView: React.FC<ScheduleTimerViewProps> = ({
  plans,
  selectedPlanId,
  preferences,
  onToggleBlockCompletion,
  onAwardXpAndStamina,
  onUpdatePreferences,
  onTriggerQuestAction,
}) => {
  const [activePlanId, setActivePlanId] = useState<string>(
    selectedPlanId || (plans.length > 0 ? plans[0].id : '')
  );

  const activePlan = plans.find((p) => p.id === activePlanId) || plans[0];

  // Timer States
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const [durationMinutes, setDurationMinutes] = useState<number>(45); // default 45 min cognitive block
  const [timeLeft, setTimeLeft] = useState<number>(45 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [showEyeBreakModal, setShowEyeBreakModal] = useState<boolean>(false);

  // AI Tutor Companion States
  const [aiSpeaking, setAiSpeaking] = useState<boolean>(false);
  const [tipIndex, setTipIndex] = useState<number>(0);

  const focusTips = [
    'สมองมนุษย์โฟกัสได้ดีสุด 45 นาที จดโน้ตสั้นๆ ควบคู่ไปด้วยจะช่วยให้จำแม่นขึ้น 2 เท่า!',
    'ช่วงเวลาโฟกัสเข้มข้น หายใจเข้าลึกๆ ค่อยๆ ลุยทีละหัวข้อ ไม่ต้องกังวลเรื่องเวลา',
    'สมองกำลังซึมซับข้อมูลอย่างมีประสิทธิภาพสูงสุด ปิดการแจ้งเตือนมือถือแล้วลุยต่อเลย!',
    'สมาธิที่มีคุณภาพ 45 นาที ให้ผลลัพธ์มากกว่าการนั่งอ่านแบบลอยๆ 3 ชั่วโมง',
    'หากรู้สึกติดขัดข้อไหน ให้ทำเครื่องหมายไว้ก่อน แล้วค่อยย้อนกลับมาทบทวนหลังจบรอบ',
  ];

  const breakTips = [
    'ยอดเยี่ยมมาก! ได้เวลาพักสายตามองออกไปไกล 20 ฟุต 20 วินาทีตามหลัก 20-20-20',
    'จิบน้ำเปล่าสักแก้ว ยืดเหยียดคอบ่าไหล่ ให้เลือดไหลเวียนไปเลี้ยงสมองอย่างเต็มที่',
    'เวลาพักสายตา 15 นาทีนี้คือช่วงเวลาที่สมองแปลงความจำระยะสั้นเป็นระยะยาว ชิลๆ ได้เลย',
    'พักหน้าจอและสายตาจากแสงสีฟ้าสักครู่ ฟังเพลงสบายๆ หรือเดินเปลี่ยนบรรยากาศ',
  ];

  const currentTipList = timerMode === 'focus' ? focusTips : breakTips;
  const currentTip = currentTipList[tipIndex % currentTipList.length];

  const handleNextTip = () => {
    soundHelper.playChime('click', preferences.soundEnabled);
    setTipIndex((prev) => (prev + 1) % currentTipList.length);
  };

  const handleSpeakAiReminder = () => {
    if (!preferences.voiceEnabled && onUpdatePreferences) {
      onUpdatePreferences({ voiceEnabled: true });
    }
    setAiSpeaking(true);
    soundHelper.playChime('click', preferences.soundEnabled);
    soundHelper.speakThaiReminder(
      timerMode === 'break' ? 'break' : 'focus',
      preferences.voiceStyle,
      true
    );
    setTimeout(() => {
      setAiSpeaking(false);
    }, 4500);
  };

  const toggleVoicePreference = () => {
    if (onUpdatePreferences) {
      onUpdatePreferences({ voiceEnabled: !preferences.voiceEnabled });
      soundHelper.playChime('click', preferences.soundEnabled);
    }
  };

  const timerRef = useRef<any>(null);

  // Switch timer presets
  const handleSetPreset = (focusMin: number, breakMin: number) => {
    setIsRunning(false);
    if (timerMode === 'focus') {
      setDurationMinutes(focusMin);
      setTimeLeft(focusMin * 60);
    } else {
      setDurationMinutes(breakMin);
      setTimeLeft(breakMin * 60);
    }
    soundHelper.playChime('click');
  };

  // Timer Tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timerMode]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    if (timerMode === 'focus') {
      soundHelper.playChime('break', preferences.soundEnabled);
      soundHelper.speakThaiReminder('break', preferences.voiceStyle, preferences.voiceEnabled ?? true);
      setCompletedSessions((prev) => prev + 1);
      setShowEyeBreakModal(true);
      // Auto-award RPG XP
      if (onAwardXpAndStamina) {
        onAwardXpAndStamina(200, -10);
      }
      // Auto switch to break mode
      setTimerMode('break');
      setDurationMinutes(15);
      setTimeLeft(15 * 60);
    } else {
      soundHelper.playChime('complete', preferences.soundEnabled);
      soundHelper.speakThaiReminder('focus', preferences.voiceStyle, preferences.voiceEnabled ?? true);
      // Auto-award RPG XP and restore stamina
      if (onAwardXpAndStamina) {
        onAwardXpAndStamina(100, 30);
      }
      setTimerMode('focus');
      setDurationMinutes(45);
      setTimeLeft(45 * 60);
    }
  };

  const handleTogglePlay = () => {
    const nextState = !isRunning;
    setIsRunning(nextState);
    if (nextState) {
      soundHelper.playChime('start', preferences.soundEnabled);
      soundHelper.speakThaiReminder('focus', preferences.voiceStyle, preferences.voiceEnabled ?? true);
      if (onTriggerQuestAction) {
        onTriggerQuestAction('start_timer');
      }
    } else {
      soundHelper.playChime('click', preferences.soundEnabled);
    }
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setTimeLeft(durationMinutes * 60);
    soundHelper.playChime('click', preferences.soundEnabled);
  };

  // Format time mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressRatio = durationMinutes > 0 ? (timeLeft / (durationMinutes * 60)) : 0;

  if (plans.length === 0) {
    return (
      <div className="w-full py-16 text-center flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant">schedule</span>
        <h2 className="font-headline-md text-lg font-bold text-on-surface">ยังไม่มีตารางเวลาในระบบ</h2>
        <p className="text-xs text-on-surface-variant">
          โปรดสร้างแผนโดยการเพิ่มหัวข้อสอบหรือหัวข้อการบ้านในแท็บ &quot;อัปโหลด &amp; วิเคราะห์&quot; ก่อน
        </p>
      </div>
    );
  }

  return (
    <div className="w-full py-6 flex flex-col gap-6 animate-fadeIn">
      {/* Eye Rest / Wellness Break Modal */}
      {showEyeBreakModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest max-w-md w-full p-6 md:p-8 rounded-3xl border border-subtle shadow-xl flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-fixed text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[36px]">visibility</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-headline-md text-lg md:text-xl font-bold text-on-surface">
                ถึงเวลาพักสายตาและฟื้นฟูสมอง!
              </h3>
              <p className="font-body-md text-xs md:text-sm text-on-surface-variant">
                คุณอ่านหนังสือ/ทำงานอย่างมีสมาธิครบกำหนดแล้ว ตามกฎ 20-20-20 สุขภาพสายตาของคุณสำคัญที่สุด
              </p>
            </div>

            <div className="w-full p-4 rounded-2xl bg-surface-container-low border border-subtle flex flex-col gap-2 text-left text-xs text-on-surface">
              <div className="flex items-center gap-2">
                <span className="text-primary font-bold">🌿</span>
                <span>มองออกไปที่วัตถุหรือต้นไม้ไกล 20 ฟุต (6 เมตร) นิ่งๆ 20 วินาที</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-secondary font-bold">💧</span>
                <span>จิบน้ำเปล่า 1 แก้วเต็ม เพื่อให้สมองไม่ขาดน้ำ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-tertiary-container font-bold">🧘</span>
                <span>หมุนหัวไหล่ คลายกล้ามเนื้อคอบ่า 5-10 ครั้ง</span>
              </div>
            </div>

            <button
              onClick={() => setShowEyeBreakModal(false)}
              className="w-full py-3 rounded-full bg-primary text-white font-label-md text-xs md:text-sm font-semibold cursor-pointer shadow-md hover:bg-primary/90 transition-all"
            >
              รับทราบ เริ่มช่วงเวลาพัก 15 นาที
            </button>
          </div>
        </div>
      )}

      {/* Top Banner & Plan Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-subtle shadow-xs">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-secondary">
            <span className="material-symbols-outlined text-[20px]">timer</span>
            <span className="font-label-lg font-bold text-sm">ตารางเวลา &amp; ตัวจับเวลาอัจฉริยะ</span>
          </div>
          <h1 className="font-headline-md text-xl md:text-2xl font-bold text-on-surface">
            จัดสรรเวลาตามหลักสุขภาวะ (Cognitive Balance)
          </h1>
          <p className="font-body-sm text-xs text-on-surface-variant">
            ฝึกสมาธิด้วยตัวจับเวลาแบบแบ่งช่วง และทำเครื่องหมายช่วงเวลาที่เสร็จแล้ว
          </p>
        </div>

        {/* Plan Switcher Dropdown */}
        <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-xl border border-subtle">
          <span className="text-xs text-on-surface-variant font-medium">วิชาที่เลือก:</span>
          <select
            value={activePlanId}
            onChange={(e) => setActivePlanId(e.target.value)}
            className="bg-transparent text-xs font-semibold text-on-surface focus:outline-none cursor-pointer"
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.type === 'exam' ? '📝 สอบ: ' : '📚 การบ้าน: '}
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Pomodoro Focus Timer + Daily Schedule Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Built-in Pomodoro Study Timer */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div
            className={`p-6 rounded-3xl border transition-all duration-500 flex flex-col items-center text-center gap-5 ${
              isRunning && timerMode === 'focus'
                ? 'bg-surface-container-lowest border-purple-500/50 shadow-2xl shadow-purple-900/20 ring-4 ring-purple-500/20'
                : isRunning && timerMode === 'break'
                ? 'bg-surface-container-lowest border-emerald-500/50 shadow-2xl shadow-emerald-900/20 ring-4 ring-emerald-500/20'
                : 'bg-surface-container-lowest border-subtle shadow-sm'
            }`}
          >
            {/* Mode Switcher */}
            <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-full border border-subtle w-full max-w-xs">
              <button
                onClick={() => {
                  setTimerMode('focus');
                  setIsRunning(false);
                  setTimeLeft(45 * 60);
                  setDurationMinutes(45);
                  soundHelper.playChime('click');
                }}
                className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  timerMode === 'focus'
                    ? 'bg-purple-600 dark:bg-purple-500 text-white shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                ช่วงโฟกัส (45m)
              </button>
              <button
                onClick={() => {
                  setTimerMode('break');
                  setIsRunning(false);
                  setTimeLeft(15 * 60);
                  setDurationMinutes(15);
                  soundHelper.playChime('click');
                }}
                className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  timerMode === 'break'
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                พักฟื้นสายตา (15m)
              </button>
            </div>

            {/* Circular Timer Visual Display */}
            <div className="relative w-52 h-52 md:w-60 md:h-60 rounded-full flex flex-col items-center justify-center p-4">
              {/* Outer Ring & Smooth Animated SVG Progress Bar */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 240 240">
                <circle
                  cx="120"
                  cy="120"
                  r="100"
                  className="stroke-surface-container-low fill-none"
                  strokeWidth="10"
                />
                <circle
                  cx="120"
                  cy="120"
                  r="100"
                  className={`fill-none transition-all duration-1000 ease-linear ${
                    timerMode === 'focus'
                      ? 'stroke-purple-600 dark:stroke-indigo-400'
                      : 'stroke-emerald-500 dark:stroke-emerald-400'
                  }`}
                  strokeWidth="10"
                  strokeDasharray="628.318"
                  strokeDashoffset={628.318 * (1 - progressRatio)}
                  strokeLinecap="round"
                />
              </svg>

              <span className="font-code-badge text-3xl md:text-4xl font-bold tracking-tight text-on-surface">
                {formatTime(timeLeft)}
              </span>

              <span className="text-xs text-on-surface-variant font-medium mt-1">
                {timerMode === 'focus' ? '🎯 กำลังโฟกัสเนื้อหา' : '🌿 พักสายตาและผ่อนคลาย'}
              </span>

              {/* Status Indicator */}
              <div className="flex items-center gap-1.5 mt-2 bg-surface-container-low px-2.5 py-0.5 rounded-full text-[11px] text-on-surface-variant">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isRunning ? 'bg-primary-container animate-pulse' : 'bg-on-surface-variant/40'
                  }`}
                />
                <span>{isRunning ? 'กำลังจับเวลา' : 'หยุดชั่วคราว'}</span>
              </div>
            </div>

            {/* Play/Pause & Reset Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleResetTimer}
                className="w-12 h-12 rounded-full bg-surface-container-low text-on-surface hover:bg-surface-container border border-subtle flex items-center justify-center transition-colors cursor-pointer"
                title="รีเซ็ตตัวจับเวลา"
              >
                <span className="material-symbols-outlined text-[20px]">refresh</span>
              </button>

              <button
                onClick={handleTogglePlay}
                className={`px-8 py-3.5 rounded-full font-label-lg text-sm md:text-base font-extrabold shadow-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
                  timerMode === 'focus'
                    ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-purple-950/20 border-2 border-purple-400/40 ring-4 ring-purple-500/20'
                    : 'bg-gradient-to-r from-[#005237] via-[#006c49] to-[#047857] hover:from-[#003e29] hover:to-[#065f46] dark:from-[#10b981] dark:via-[#34d399] dark:to-[#6ffbbe] text-white dark:text-slate-950 shadow-emerald-950/20 border-2 border-emerald-400/50 dark:border-white ring-4 ring-emerald-500/20'
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {isRunning ? 'pause' : 'play_arrow'}
                </span>
                <span>{isRunning ? 'พักการจับเวลา' : 'เริ่มจับเวลา'}</span>
              </button>

              <button
                onClick={() => {
                  soundHelper.playChime('break', preferences.soundEnabled);
                  soundHelper.speakThaiReminder('break', preferences.voiceStyle, preferences.voiceEnabled ?? true);
                }}
                className="w-12 h-12 rounded-full bg-surface-container-low text-primary hover:bg-surface-container border border-subtle flex items-center justify-center transition-colors cursor-pointer"
                title="ทดสอบฟังเสียงเตือนใจ"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {(preferences.voiceEnabled ?? true) ? 'volume_up' : 'volume_off'}
                </span>
              </button>
            </div>

            {/* Presets Quick Buttons */}
            <div className="flex items-center justify-center gap-2 pt-1 border-t border-subtle w-full text-xs">
              <span className="text-on-surface-variant">พรีเซ็ต:</span>
              <button
                onClick={() => handleSetPreset(25, 5)}
                className="px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-code-badge border border-subtle cursor-pointer"
              >
                25 / 5m
              </button>
              <button
                onClick={() => handleSetPreset(45, 15)}
                className="px-2.5 py-1 rounded-lg bg-primary-fixed text-primary font-code-badge font-bold border border-primary/30 cursor-pointer"
              >
                45 / 15m (แนะนำ)
              </button>
              <button
                onClick={() => handleSetPreset(60, 15)}
                className="px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-code-badge border border-subtle cursor-pointer"
              >
                60 / 15m
              </button>
            </div>

            {/* Completed Sessions Counter */}
            <div className="flex items-center justify-between w-full p-3 rounded-xl bg-surface-container-low text-xs text-on-surface border border-subtle">
              <span>ช่วงเวลาโฟกัสที่เสร็จสิ้นวันนี้:</span>
              <span className="font-code-badge font-bold text-primary">
                {completedSessions} ช่วง (~{(completedSessions * 45) / 60} ชม.)
              </span>
            </div>
          </div>

          {/* AI Study Companion Card (Embedded directly in Focus/Study view - Zero Screen Clutter) */}
          <div className="bg-surface-container-lowest p-5 rounded-3xl border border-subtle shadow-sm flex flex-col gap-3.5 relative overflow-hidden">
            {/* Background gradient decorative glow */}
            <div
              className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-all duration-700 ${
                aiSpeaking
                  ? 'bg-purple-500/25 dark:bg-purple-500/35 scale-125'
                  : 'bg-primary/10'
              }`}
            />

            {/* Header */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    aiSpeaking
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30 scale-105'
                      : 'bg-primary-fixed text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {aiSpeaking ? 'graphic_eq' : 'smart_toy'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-headline-sm text-sm font-bold text-on-surface">
                      AI Study Companion
                    </span>
                    <span className="relative flex h-2 w-2">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          isRunning ? 'bg-emerald-400' : 'bg-purple-400'
                        }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 ${
                          isRunning ? 'bg-emerald-500' : 'bg-purple-500'
                        }`}
                      />
                    </span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant font-code-badge flex items-center gap-1">
                    {timerMode === 'focus' ? '🎯 โหมดโฟกัส' : '🌿 โหมดพักสายตา'}
                    <span>•</span>
                    <span>
                      {preferences.voiceStyle === 'friend'
                        ? 'โค้ชไอโกะ (เพื่อนสนิท)'
                        : preferences.voiceStyle === 'mentor'
                        ? 'อาจารย์ที่ปรึกษา'
                        : 'ทางการ'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Voice Audio Toggle */}
              {onUpdatePreferences && (
                <button
                  onClick={toggleVoicePreference}
                  className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition-all cursor-pointer ${
                    preferences.voiceEnabled
                      ? 'bg-primary-fixed/30 border-primary/30 text-primary'
                      : 'bg-surface-container-low border-subtle text-on-surface-variant hover:text-on-surface'
                  }`}
                  title={preferences.voiceEnabled ? 'ปิดเสียงพูด AI' : 'เปิดเสียงพูด AI'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {preferences.voiceEnabled ? 'volume_up' : 'volume_off'}
                  </span>
                </button>
              )}
            </div>

            {/* Message Bubble */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-subtle text-xs text-on-surface leading-relaxed relative z-10 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                  format_quote
                </span>
                <p className="flex-1 font-medium">{currentTip}</p>
              </div>

              {/* Audio Waves Visualizer when speaking */}
              {aiSpeaking && (
                <div className="flex items-center gap-1.5 pt-1 pl-6">
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold font-code-badge">
                    กำลังพูดให้กำลังใจ...
                  </span>
                  <div className="flex items-center gap-0.5 h-3">
                    <span className="w-1 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1 h-3.5 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1 h-2 bg-purple-500 rounded-full animate-bounce" />
                    <span className="w-1 h-3 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.2s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-subtle/70 relative z-10">
              <button
                onClick={handleNextTip}
                className="px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-medium border border-subtle flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>เปลี่ยนคำแนะนำ</span>
              </button>

              <button
                onClick={handleSpeakAiReminder}
                disabled={aiSpeaking}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                  aiSpeaking
                    ? 'bg-purple-600 text-white opacity-85'
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {aiSpeaking ? 'graphic_eq' : 'record_voice_over'}
                </span>
                <span>{aiSpeaking ? 'กำลังพูด...' : 'ฟังเสียงแนะนำ'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Interactive Daily Schedule */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-subtle shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-base md:text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">calendar_today</span>
                ตารางเวลาแบ่งเรียน/การบ้านต่อวัน
              </span>
              <span className="text-xs text-on-surface-variant font-code-badge">
                {activePlan.dailySchedule.length} วัน • ติ๊กเมื่อทำเสร็จ
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {activePlan.dailySchedule.map((day) => (
                <div
                  key={day.dayNumber}
                  className="p-4 rounded-2xl bg-surface-container-low border border-subtle flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between border-b border-subtle pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-white font-code-badge text-xs flex items-center justify-center font-bold">
                        {day.dayNumber}
                      </span>
                      <span className="font-label-md text-xs md:text-sm font-bold text-on-surface">
                        {day.dateLabel}
                      </span>
                    </div>
                    <span className="text-xs text-on-surface-variant font-code-badge">
                      เป้าหมาย: <strong className="text-primary">{day.focusGoal}</strong>
                    </span>
                  </div>

                  {/* Day Blocks */}
                  <div className="flex flex-col gap-2">
                    {day.blocks.map((block) => (
                      <div
                        key={block.id}
                        onClick={() => {
                          onToggleBlockCompletion(activePlan.id, day.dayNumber, block.id);
                          if (!block.completed) {
                            soundHelper.playChime('complete', preferences.soundEnabled);
                            soundHelper.speakThaiReminder('topic_done', preferences.voiceStyle, preferences.voiceEnabled ?? true);
                            if (onAwardXpAndStamina) {
                              onAwardXpAndStamina(50, 0);
                            }
                            if (onTriggerQuestAction) {
                              onTriggerQuestAction('complete_block');
                            }
                          } else {
                            soundHelper.playChime('click', preferences.soundEnabled);
                          }
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 text-xs ${
                          block.completed
                            ? 'bg-primary-fixed/15 border-primary/40 opacity-75'
                            : block.type === 'break'
                            ? 'bg-tertiary-container/10 border-tertiary-container/30 hover:border-tertiary-container'
                            : 'bg-surface-container-lowest border-subtle hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-all ${
                              block.completed
                                ? 'bg-primary border-primary text-white'
                                : 'border-subtle bg-surface-container-lowest'
                            }`}
                          >
                            {block.completed && <span className="text-[10px] font-bold">✓</span>}
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-code-badge font-bold text-primary text-xs">
                                {block.timeSlot}
                              </span>
                              <span
                                className={`font-semibold ${
                                  block.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'
                                }`}
                              >
                                {block.title}
                              </span>
                            </div>

                            {block.wellnessTip && (
                              <span className="text-[11px] text-tertiary-container font-medium flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-[13px]">eco</span>
                                {block.wellnessTip}
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`font-code-badge text-[10px] px-2 py-0.5 rounded-full shrink-0 font-bold ${
                            block.type === 'break'
                              ? 'bg-amber-300 dark:bg-amber-400 text-slate-950 dark:text-slate-950 border border-amber-400/60'
                              : block.type === 'review'
                              ? 'bg-secondary-fixed text-secondary border border-secondary/30'
                              : 'bg-primary-fixed text-on-primary-fixed border border-primary/30'
                          }`}
                        >
                          {block.type === 'break' ? 'พักสายตา' : block.type === 'review' ? 'ทบทวน' : 'อ่าน/ทำ'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
