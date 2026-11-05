import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { PlanItem, UserPreferences, RpgProfile, MilestoneRoadmap, QuestItem } from '../types';
import { soundHelper } from '../utils/soundHelper';
import { getTimeUntilMidnight } from '../utils/questHelper';

interface DashboardViewProps {
  plans: PlanItem[];
  rawPlanCount?: number;
  isDemoMode?: boolean;
  onToggleDemoMode?: (enable?: boolean) => void;
  preferences: UserPreferences;
  rpgProfile: RpgProfile;
  onUpdateRpgProfile: (profile: RpgProfile) => void;
  milestones: MilestoneRoadmap[];
  onOpenWizard: (type?: 'exam' | 'homework') => void;
  onSelectPlan: (planId: string, view: 'summary' | 'schedule') => void;
  onDeletePlan: (planId: string) => void;
  onClearAllPlans?: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenProfileModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  plans,
  rawPlanCount,
  isDemoMode = false,
  onToggleDemoMode,
  preferences,
  rpgProfile,
  onUpdateRpgProfile,
  milestones,
  onOpenWizard,
  onSelectPlan,
  onDeletePlan,
  onClearAllPlans,
  onNavigateTab,
  onOpenProfileModal,
}) => {
  const [xpFloater, setXpFloater] = useState<{ amount: number; id: number } | null>(null);

  const isNewUser = (rawPlanCount ?? plans.length) === 0 && !isDemoMode;

  // Extract scheduled blocks for today from active plans
  const todayBlocks = plans.flatMap((p) => {
    const today = p.dailySchedule?.find((d) => d.dayNumber === 1);
    return today
      ? today.blocks.map((b) => ({
          ...b,
          subjectName: p.subjectName,
          planId: p.id,
        }))
      : [];
  });

  const examCount = plans.filter((p) => p.type === 'exam').length;
  const hwCount = plans.filter((p) => p.type === 'homework').length;

  const totalTopics = plans.reduce((acc, p) => acc + (p.topics ? p.topics.length : 0), 0);
  const completedTopics = plans.reduce(
    (acc, p) => acc + (p.topics ? p.topics.filter((t) => t.completed).length : 0),
    0
  );
  const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const xpRatio = Math.min(100, Math.round((rpgProfile.currentXp / rpgProfile.nextLevelXp) * 100));

  // Real-time countdown timer to midnight (00:00:00)
  const [countdown, setCountdown] = useState<string>(() => getTimeUntilMidnight().formatted);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilMidnight().formatted);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleQuestClick = (quest: QuestItem) => {
    soundHelper.playChime('click', preferences.soundEnabled);
    if (quest.completed) {
      return;
    }

    // Direct user to the target action/feature to perform the real task
    if (quest.actionTarget) {
      if (quest.actionTarget === 'wizard') {
        onOpenWizard('exam');
      } else if (quest.actionTarget === 'dashboard') {
        const milestoneSection = document.getElementById('milestone-section');
        if (milestoneSection) {
          milestoneSection.scrollIntoView({ behavior: 'smooth' });
        } else if (onNavigateTab) {
          onNavigateTab('dashboard');
        }
      } else if (onNavigateTab) {
        onNavigateTab(quest.actionTarget);
      }
    }
  };

  return (
    <div className="w-full py-6 flex flex-col gap-6 animate-fadeIn">
      {/* Demo Mode Alert Banner */}
      {isDemoMode && (
        <div className="p-4 px-5 rounded-2xl bg-[#FFFBEB] dark:bg-[#231e13] border border-amber-300/80 dark:border-amber-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-xs text-amber-950 dark:text-amber-100 font-semibold">
            <span className="material-symbols-outlined text-[20px] text-amber-800 dark:text-amber-400 shrink-0">
              visibility
            </span>
            <span className="leading-relaxed">
              คุณกำลังดูหน้าจอใน <strong className="text-amber-950 dark:text-amber-200 font-black">โหมดข้อมูลตัวอย่าง (Demo Mode)</strong> — แสดงตัวอย่าง Roadmap และตารางเวลาจำลองเพื่อให้เห็นภาพรวมของระบบ
            </span>
          </div>
          {onToggleDemoMode && (
            <button
              type="button"
              onClick={() => onToggleDemoMode(false)}
              className="px-4 py-2 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 font-black text-xs transition-all cursor-pointer shrink-0 shadow-xs active:scale-95 flex items-center gap-1.5 border border-amber-300"
            >
              <span className="material-symbols-outlined text-[16px] text-amber-950">close</span>
              <span className="text-amber-950 font-black">ปิดโหมดตัวอย่าง (สลับเป็นข้อมูลจริง)</span>
            </button>
          )}
        </div>
      )}

      {/* RPG Hero Character Sheet & Motivational Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-surface-container-low border border-subtle p-6 md:p-8 shadow-sm">
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 -right-16 w-52 h-52 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 z-10 relative">
          {/* User Profile Avatar with Level Badge */}
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4.5">
            <button
              type="button"
              onClick={() => onOpenProfileModal && onOpenProfileModal()}
              className="relative group cursor-pointer text-left shrink-0"
              title="คลิกเพื่อแก้ไขรูปโปรไฟล์"
            >
              <img
                alt={preferences.userName}
                src={preferences.avatarUrl}
                className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 aspect-square rounded-2xl object-cover ring-4 ring-primary/25 shadow-md group-hover:ring-primary/60 transition-all shrink-0"
              />
              <span className="absolute -bottom-1 -right-1 sm:-bottom-1.5 sm:-right-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-lg shadow-sm border border-white/60">
                LV.{rpgProfile.level}
              </span>
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] sm:text-[11px] font-bold">
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">photo_camera</span>
                <span>เปลี่ยนรูป</span>
              </div>
            </button>

            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="font-headline-lg text-lg sm:text-xl md:text-2xl font-black text-on-surface">
                  {preferences.userName}
                </span>
                <span className="font-code-badge bg-primary-fixed text-on-primary-fixed px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold shrink-0">
                  {rpgProfile.title}
                </span>
                <span className="text-[11px] sm:text-xs text-on-surface-variant font-medium bg-surface-container px-2.5 py-0.5 rounded-full border border-subtle shrink-0">
                  {preferences.userRole}
                </span>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFBEB] dark:bg-[#231e13] border border-amber-300/80 dark:border-amber-700/60 text-amber-950 dark:text-amber-200 font-extrabold text-[11px] sm:text-xs shrink-0 shadow-2xs">
                  <span>🔥</span>
                  <span>{rpgProfile.streakDays} วันติด</span>
                </div>
                {onOpenProfileModal && (
                  <button
                    type="button"
                    onClick={onOpenProfileModal}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-primary border border-subtle transition-all cursor-pointer font-bold active:scale-95 shrink-0"
                    title="แก้ไขชื่อและรูปโปรไฟล์"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    <span>แก้ไขโปรไฟล์</span>
                  </button>
                )}
                {onToggleDemoMode && (
                  <button
                    type="button"
                    onClick={() => onToggleDemoMode()}
                    className={`flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full font-extrabold transition-all border cursor-pointer active:scale-95 shrink-0 shadow-xs ${
                      isDemoMode
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300 shadow-xs'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200/90'
                    }`}
                    title="สลับโหมดดูข้อมูลตัวอย่าง / ข้อมูลจริง"
                  >
                    <span className="material-symbols-outlined text-[15px] text-amber-900">
                      {isDemoMode ? 'visibility' : 'visibility_off'}
                    </span>
                    <span className="text-amber-950 font-extrabold">{isDemoMode ? 'Demo ON' : 'โหมดตัวอย่าง'}</span>
                  </button>
                )}
              </div>
              {preferences.interests && preferences.interests.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  {preferences.interests.map((interest) => (
                    <span
                      key={interest}
                      className="text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary dark:text-emerald-300 border border-primary/20"
                    >
                      #{interest}
                    </span>
                  ))}
                </div>
              )}
              <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant max-w-xl">
                สะสมพลังสมาธิ พิชิตเควสต์ประจำวัน และเตรียมพร้อมสู่วันสอบด้วย AI ที่คอยแนะนำสมดุลชีวิต
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={() => onOpenWizard('exam')}
              className="flex-1 lg:flex-initial px-5 py-3 rounded-full bg-primary hover:bg-primary/90 text-white font-label-md text-xs md:text-sm font-bold shadow-md shadow-primary/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">assignment</span>
              <span>+ เพิ่มวิชาสอบ</span>
            </button>
            <button
              onClick={() => onOpenWizard('homework')}
              className="flex-1 lg:flex-initial px-5 py-3 rounded-full bg-secondary hover:bg-secondary/90 text-white font-label-md text-xs md:text-sm font-bold shadow-md shadow-secondary/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">menu_book</span>
              <span>+ เพิ่มวิชาการบ้าน</span>
            </button>
          </div>
        </div>

        {/* RPG Stat Bars: XP Progress & Cognitive Stamina (Mental Mana) */}
        <div className="mt-6 pt-5 border-t border-subtle grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* XP Progress Bar */}
          <div className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-surface-container-low/70 border border-subtle relative">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-on-surface flex items-center gap-1.5">
                <span className="text-amber-500">⚡</span>
                <span>ค่าประสบการณ์ (XP Progression)</span>
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {rpgProfile.currentXp} / {rpgProfile.nextLevelXp} XP ({xpRatio}%)
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden p-0.5 border border-subtle">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 transition-all duration-700 ease-out shadow-xs"
                style={{ width: `${xpRatio}%` }}
              />
            </div>
            {xpFloater && (
              <span className="absolute -top-3 right-4 font-bold text-xs text-amber-500 animate-bounce">
                +{xpFloater.amount} XP!
              </span>
            )}
          </div>

          {/* Cognitive Stamina Battery */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low/70 border border-subtle">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">battery_charging_full</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-bold text-on-surface">พลังสมาธิ (Cognitive Stamina)</span>
                <span className="text-[11px] text-on-surface-variant">ฟื้นฟูอัตโนมัติเมื่อพักสายตาตามกฎ 20-20-20</span>
              </div>
            </div>
            <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
              {rpgProfile.staminaPercent}%
            </span>
          </div>
        </div>

        {/* Daily Quests List */}
        <div className="mt-4 pt-3 flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
                <span>เควสต์ประจำวัน (Daily Quests)</span>
              </span>

              {/* Countdown badge directly next to Daily Quests header with soft cream background */}
              <div
                title="ระบบจะสุ่มภารกิจใหม่ทุกเที่ยงคืน"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFBEB] dark:bg-[#231e13] border border-amber-300/80 dark:border-amber-700/60 text-[11px] font-mono text-amber-950 dark:text-amber-200 font-extrabold shadow-2xs"
              >
                <span className="material-symbols-outlined text-[15px] text-amber-800 dark:text-amber-400 animate-pulse">timer</span>
                <span>รีเซ็ตใน {countdown}</span>
              </div>
            </div>

            <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>ทำภารกิจจริงเพื่อปลดล็อก (คลิกการ์ดเพื่อไปยังภารกิจ)</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {rpgProfile.quests.map((quest) => (
              <button
                key={quest.id}
                type="button"
                onClick={() => handleQuestClick(quest)}
                title={quest.completed ? 'ทำภารกิจนี้สำเร็จแล้ว' : (quest.hint || 'คลิกเพื่อไปยังหน้าทำภารกิจนี้')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 text-xs group ${
                  quest.completed
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-on-surface cursor-default'
                    : 'bg-surface-container-lowest border-subtle hover:border-primary/60 hover:bg-surface-container-low/60 text-on-surface cursor-pointer hover:shadow-xs hover:scale-[1.01]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center border shrink-0 transition-all ${
                    quest.completed
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-subtle bg-surface-container-low group-hover:border-primary/50 text-on-surface-variant'
                  }`}
                >
                  {quest.completed ? (
                    <span className="text-[11px] font-black">✓</span>
                  ) : (
                    <span className="material-symbols-outlined text-[13px] opacity-40 group-hover:opacity-100 group-hover:text-primary transition-opacity">
                      arrow_forward
                    </span>
                  )}
                </div>
                <div className="flex flex-col leading-snug flex-1">
                  <span className={`font-semibold text-xs ${quest.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                    {quest.title}
                  </span>
                  
                  <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-subtle/50 text-[10px]">
                    <span className="text-primary font-bold">
                      +{quest.xpReward} XP • +{quest.staminaReward}% พลัง
                    </span>
                    {quest.completed ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                        <span>สำเร็จแล้ว</span>
                      </span>
                    ) : (
                      <span className="text-on-surface-variant group-hover:text-primary transition-colors flex items-center gap-0.5 font-medium">
                        <span>ไปทำภารกิจ</span>
                        <span className="text-[11px]">→</span>
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Welcome Onboarding Card & Direct Upload CTA for New Users (Placed below Profile) */}
      {isNewUser && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-surface-container-lowest to-surface-container-low border-2 border-primary/25 p-5 sm:p-6 md:p-8 shadow-md">
          <div className="absolute -top-12 -right-12 w-56 h-56 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col gap-3 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <span className="material-symbols-outlined text-[16px]">school</span>
                  <span>ยินดีต้อนรับสู่ AI Study Planner</span>
                </span>
                <span className="text-xs text-on-surface-variant font-medium bg-surface-container px-2.5 py-1 rounded-full border border-subtle">
                  เริ่มต้นใช้งานง่ายๆ ใน 3 ขั้นตอน
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-on-surface leading-tight">
                อัปโหลดเอกสารหรือสรุปบทเรียน เพื่อให้ AI สร้าง Roadmap และตารางอ่านหนังสืออัตโนมัติ
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                ระบบยังไม่มีข้อมูลวิชาของคุณ — เพียงอัปโหลดภาพถ่ายเอกสาร สารบัญ หรือชีทสรุป ระบบ AI จะคำนวณกราฟความจำ Ebbinghaus จัดบล็อกเวลาอ่าน และแทรกช่วงพักสายตา 20-20-20 ให้อย่างลงตัว
              </p>

              {/* 3 Quick Visual Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-container-lowest/80 border border-subtle">
                  <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0">1</span>
                  <span className="font-semibold text-on-surface">อัปโหลดภาพ/เอกสาร</span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-container-lowest/80 border border-subtle">
                  <span className="w-6 h-6 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs shrink-0">2</span>
                  <span className="font-semibold text-on-surface">AI จัด Roadmap ทบทวน</span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-container-lowest/80 border border-subtle">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-300/80 dark:border-amber-500/30 text-amber-950 dark:text-amber-300 flex items-center justify-center font-black text-xs shrink-0">3</span>
                  <span className="font-semibold text-on-surface">เริ่มอ่าน &amp; พักสายตา</span>
                </div>
              </div>
            </div>

            {/* Prominent CTA Actions */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto shrink-0">
              <button
                type="button"
                onClick={() => onOpenWizard('exam')}
                className="px-6 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-md shadow-primary/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">upload_file</span>
                <span>อัปโหลดเอกสาร / เริ่มสร้างแผน</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenWizard('homework')}
                className="px-5 py-2.5 rounded-2xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs transition-all flex items-center justify-center gap-2 border border-subtle cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
                <span>เพิ่มหัวข้อการบ้าน / โครงงาน</span>
              </button>

              {onToggleDemoMode && (
                <button
                  type="button"
                  onClick={() => onToggleDemoMode(true)}
                  className="px-5 py-3 rounded-2xl bg-amber-100/95 hover:bg-amber-200/95 text-amber-950 font-extrabold text-xs transition-all flex items-center justify-center gap-2 border border-amber-300/90 shadow-sm shadow-amber-200/40 cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px] text-amber-900">visibility</span>
                  <span className="text-amber-950 font-extrabold tracking-wide">ทดลองเปิดดูข้อมูลตัวอย่าง (Demo)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bento Grid: Long-Term Milestone Roadmaps & AI Dynamic Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 Cols): Long-Term Milestone Roadmaps */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div id="milestone-section" className="bg-surface-container-lowest p-6 rounded-3xl border border-subtle shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[22px]">flag_circle</span>
                <h3 className="font-headline-sm text-base md:text-lg font-bold text-on-surface">
                  เป้าหมายระยะยาว &amp; Spaced Repetition Roadmap
                </h3>
              </div>
              <span className="font-code-badge text-[11px] text-primary bg-primary-fixed/40 px-2.5 py-0.5 rounded-full font-bold">
                Ebbinghaus Model
              </span>
            </div>

            {milestones.length === 0 ? (
              <div className="p-8 text-center bg-surface-container-low/40 rounded-2xl border border-dashed border-subtle flex flex-col items-center justify-center gap-3.5 py-10">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[26px]">flag_circle</span>
                </div>
                <div className="flex flex-col gap-1 max-w-sm">
                  <h4 className="font-bold text-sm text-on-surface">ยังไม่มี Roadmap เป้าหมายในระบบ</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    เมื่อคุณอัปโหลดวิชาหรือเอกสารการเรียน AI จะคำนวณกราฟความจำ Ebbinghaus และสร้างกำหนดเวลาทบทวน (Spaced Repetition) ให้อัตโนมัติ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenWizard('exam')}
                  className="mt-1 px-4 py-2 rounded-full bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">upload_file</span>
                  <span>อัปโหลดวิชาแรกเพื่อสร้าง Roadmap</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-surface-container-low/70 border border-subtle flex flex-col gap-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-on-surface">{m.targetTitle}</span>
                        <span className="text-xs text-on-surface-variant mt-0.5">
                          เป้าหมาย: <strong className="text-primary">{m.examOrGoalDate}</strong> (เหลืออีก {m.daysLeft} วัน)
                        </span>
                      </div>
                      <span className="font-code-badge text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-extrabold shrink-0 border border-emerald-500/25">
                        ความจำคงอยู่ {m.retentionScore}%
                      </span>
                    </div>

                    {/* Progress Line */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-on-surface-variant font-medium">
                          เนื้อหาที่เชี่ยวชาญแล้ว: {m.masteredItems} / {m.totalItems} หน่วย
                        </span>
                        <span className="font-bold text-primary">{m.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden border border-subtle">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                          style={{ width: `${m.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Next Spaced Repetition Topic */}
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-lowest border border-subtle text-xs text-on-surface">
                      <span className="material-symbols-outlined text-amber-800 dark:text-amber-400 text-[16px] shrink-0">
                        schedule_send
                      </span>
                      <span className="truncate">
                        ควรอ่านทบทวนวันพรุ่งนี้: <strong>{m.nextReviewTopic}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right (5 Cols): AI Smart Calendar Preview with Wellness Breaks */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-subtle shadow-xs flex flex-col gap-4 justify-between h-full">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-secondary">
                  <span className="material-symbols-outlined text-[22px]">calendar_clock</span>
                  <h3 className="font-headline-sm text-base md:text-lg font-bold text-on-surface">
                    ตารางเวลาวันนี้ (AI Scheduled)
                  </h3>
                </div>
                <span className="font-code-badge text-xs text-secondary font-bold">
                  Auto-Buffer
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                AI จัดสรรช่วงอ่านและแทรกเวลาพักสายตาให้อัตโนมัติ เพื่อรักษาโฟกัสสูงสุด
              </p>

              {/* Dynamic AI Scheduled Time Blocks for Today or Empty State */}
              {todayBlocks.length === 0 ? (
                <div className="p-6 text-center bg-surface-container-low/40 rounded-2xl border border-dashed border-subtle flex flex-col items-center justify-center gap-3 my-2">
                  <div className="w-11 h-11 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">event_busy</span>
                  </div>
                  <div className="flex flex-col gap-1 max-w-xs">
                    <h4 className="font-bold text-xs sm:text-sm text-on-surface">ยังไม่มีตารางเวลาสำหรับวันนี้</h4>
                    <p className="text-[11px] sm:text-xs text-on-surface-variant leading-relaxed">
                      AI จะจัดสรรบล็อกเวลาอ่าน 45 นาที และแทรกเวลาพักสายตา 15 นาทีตามกฎ 20-20-20 ให้อัตโนมัติเมื่อเพิ่มวิชา
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenWizard('exam')}
                    className="mt-0.5 px-3.5 py-1.5 rounded-full bg-secondary hover:bg-secondary/90 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[15px]">add_circle</span>
                    <span>สร้างตารางอ่านหนังสือ</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 mt-1">
                  {todayBlocks.slice(0, 4).map((block) => {
                    const isBreak = block.type === 'break';
                    return (
                      <div
                        key={block.id}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                          isBreak
                            ? 'bg-amber-50/95 dark:bg-amber-400 text-amber-950 dark:text-slate-950 font-bold border-amber-200/90 dark:border-amber-400/60 shadow-2xs'
                            : 'bg-surface-container-low border-subtle text-on-surface'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`font-mono font-bold shrink-0 ${
                              isBreak ? 'text-amber-900 dark:text-slate-950' : 'text-primary'
                            }`}
                          >
                            {block.timeSlot}
                          </span>
                          {isBreak ? (
                            <span className="material-symbols-outlined text-[16px] text-amber-800 dark:text-slate-950 shrink-0">
                              visibility
                            </span>
                          ) : null}
                          <span className={`truncate ${isBreak ? 'text-amber-950 dark:text-slate-950 font-bold' : 'font-semibold'}`}>
                            {block.title}
                            {block.subjectName && (
                              <span className="text-[10px] font-normal opacity-80 ml-1.5">
                                ({block.subjectName})
                              </span>
                            )}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-bold ${
                            isBreak
                              ? 'bg-amber-200/90 dark:bg-slate-950 text-amber-950 dark:text-white border border-amber-300/80 dark:border-transparent'
                              : 'bg-primary-fixed text-primary'
                          }`}
                        >
                          {isBreak ? '15 นาที' : '45 นาที'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('schedule')}
              className="w-full py-2.5 mt-2 rounded-full bg-surface-container-low hover:bg-surface-container text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-subtle"
            >
              <span className="material-symbols-outlined text-[16px]">menu_book</span>
              <span>เครื่องมือสรุปบทเรียน &amp; เอกสาร AI</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Plans List */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">auto_stories</span>
            <h2 className="font-headline-md text-lg md:text-xl font-bold text-on-surface">
              วิชาและกำหนดการที่อยู่ในระบบ ({plans.length})
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-on-surface-variant hidden md:inline">
              คลิกเพื่อดูสรุปผล AI หรือเปิดตารางเวลาตัวจับเวลา
            </span>
            {plans.length > 0 && onClearAllPlans && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('คุณต้องการล้างข้อมูลแผนการเรียนทั้งหมดใช่หรือไม่?')) {
                    onClearAllPlans();
                    soundHelper.playChime('click');
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-error/15 text-on-surface-variant hover:text-error text-xs font-semibold transition-colors flex items-center gap-1.5 border border-subtle cursor-pointer"
                title="ล้างข้อมูลทั้งหมดเพื่อสลับเป็นผู้ใช้ใหม่"
              >
                <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                <span>ล้างข้อมูลทั้งหมด</span>
              </button>
            )}
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="p-8 md:p-12 text-center bg-surface-container-lowest rounded-3xl border border-subtle flex flex-col items-center gap-5 shadow-xs transition-all">
            <div className="w-20 h-20 rounded-3xl bg-primary-fixed/30 text-primary flex items-center justify-center shadow-xs ring-4 ring-primary/10">
              <BookOpen className="w-10 h-10 text-primary stroke-[1.75]" />
            </div>
            <div className="flex flex-col gap-2 max-w-lg">
              <h3 className="font-headline-sm text-lg md:text-xl font-bold text-on-surface">
                ยังไม่มีวิชาหรือการบ้านในระบบ
              </h3>
              <p className="font-body-md text-xs md:text-sm text-on-surface-variant leading-relaxed">
                กดปุ่ม <strong className="text-primary font-semibold">&quot;+ เพิ่มหัวข้อสอบ&quot;</strong> หรือ <strong className="text-secondary font-semibold">&quot;+ เพิ่มหัวข้อการบ้าน&quot;</strong> เพื่อเริ่มสร้างแผนการเรียนของคุณ
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => onOpenWizard('exam')}
                className="px-6 py-3 rounded-full bg-primary hover:bg-primary/90 text-white font-label-md text-xs md:text-sm font-semibold shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">assignment</span>
                <span>+ เพิ่มหัวข้อสอบ</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenWizard('homework')}
                className="px-6 py-3 rounded-full bg-secondary hover:bg-secondary/90 text-white font-label-md text-xs md:text-sm font-semibold shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
                <span>+ เพิ่มหัวข้อการบ้าน</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => {
              const isExam = plan.type === 'exam';
              const completedCount = plan.topics.filter((t) => t.completed).length;
              const subPercent = plan.topics.length > 0 ? Math.round((completedCount / plan.topics.length) * 100) : 0;

              return (
                <div
                  key={plan.id}
                  className="p-6 rounded-2xl bg-surface-container-lowest border border-subtle hover:border-primary/50 transition-all shadow-xs flex flex-col justify-between gap-4 group"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full font-code-badge text-xs font-bold flex items-center gap-1 ${
                            isExam
                              ? 'bg-primary-fixed text-on-primary-fixed'
                              : 'bg-secondary-fixed text-secondary'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {isExam ? 'assignment' : 'menu_book'}
                          </span>
                          {isExam ? 'หัวข้อสอบ' : 'หัวข้อการบ้าน'}
                        </span>
                        <span className="text-xs text-on-surface-variant bg-surface-container-low px-2.5 py-1 rounded-full border border-subtle">
                          {plan.category}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`คุณต้องการลบ "${plan.title}" ใช่หรือไม่?`)) {
                            onDeletePlan(plan.id);
                          }
                        }}
                        className="text-on-surface-variant hover:text-error p-1 rounded-lg transition-colors cursor-pointer"
                        title="ลบแผนนี้"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>

                    <div className="flex flex-col gap-1">
                      <h3 className="font-headline-sm text-base md:text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                        {plan.title}
                      </h3>
                      <span className="font-label-sm text-xs text-on-surface-variant">
                        วิชา: <strong className="text-on-surface">{plan.subjectName}</strong>
                      </span>
                    </div>

                    {/* Detected Date Box */}
                    <div className="p-3 rounded-xl bg-surface-container-low border border-subtle flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-on-surface">
                        <span className="material-symbols-outlined text-primary text-[18px]">
                          {isExam ? 'event_note' : 'alarm'}
                        </span>
                        <span>{plan.detectedDate}</span>
                      </div>
                      <span className="font-code-badge text-xs font-bold text-primary bg-primary-fixed/40 px-2 py-0.5 rounded-full">
                        อีก {plan.daysRemaining} วัน
                      </span>
                    </div>

                    {/* Scope Preview */}
                    <p className="font-body-sm text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                      {plan.summary}
                    </p>

                    {/* Progress Bar */}
                    <div className="flex flex-col gap-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs text-on-surface-variant">
                        <span>ความคืบหน้าหัวข้อ</span>
                        <span className="font-code-badge font-bold text-on-surface">
                          {completedCount}/{plan.topics.length} หัวข้อ ({subPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isExam ? 'bg-primary' : 'bg-secondary'
                          }`}
                          style={{ width: `${subPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-subtle">
                    <button
                      onClick={() => onSelectPlan(plan.id, 'summary')}
                      className="flex-1 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-subtle cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">subject</span>
                      ดูสรุปผล AI
                    </button>
                    <button
                      onClick={() => onSelectPlan(plan.id, 'schedule')}
                      className={`flex-1 py-2 rounded-xl text-white font-label-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                        isExam ? 'bg-primary hover:bg-primary/90' : 'bg-secondary hover:bg-secondary/90'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">menu_book</span>
                      สรุปบทเรียน AI
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
