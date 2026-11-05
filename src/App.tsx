/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { DashboardView } from './components/DashboardView';
import { WizardView } from './components/WizardView';
import { SummaryView } from './components/SummaryView';
import { LessonSummarizerView } from './components/LessonSummarizerView';
import { CommunityFeedView } from './components/CommunityFeedView';
import { AccessibilityModal } from './components/AccessibilityModal';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { EditProfileModal } from './components/EditProfileModal';
import {
  PlanItem,
  UserPreferences,
  INITIAL_USER_PREFERENCES,
  INITIAL_SEED_PLANS,
  TaskType,
  RpgProfile,
  INITIAL_RPG_PROFILE,
  DEMO_RPG_PROFILE,
  MilestoneRoadmap,
  INITIAL_MILESTONES,
  DEMO_MILESTONES,
  DEMO_PLANS,
  StudySharePost,
  INITIAL_COMMUNITY_POSTS,
  QuestActionType,
} from './types';
import { soundHelper } from './utils/soundHelper';
import { getOrRefreshDailyQuests, verifyAndTriggerQuest } from './utils/questHelper';

const STORAGE_KEY_PLANS = 'planai_study_plans_v3';
const STORAGE_KEY_PREFS = 'planai_user_preferences_v2';
const STORAGE_KEY_RPG = 'planai_rpg_state_v2';
const STORAGE_KEY_COMMUNITY = 'planai_community_posts_v1';
const STORAGE_KEY_MILESTONES = 'planai_milestones_v2';
const STORAGE_KEY_DEMO_MODE = 'planai_demo_mode_v1';

export default function App() {
  // Navigation: 'dashboard' | 'wizard' | 'summary' | 'schedule' | 'community'
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [accessibilityModalOpen, setAccessibilityModalOpen] = useState<boolean>(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState<boolean>(false);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);

  // Demo mode toggle state and interactive demo plans state
  const [demoPlansState, setDemoPlansState] = useState<PlanItem[]>(DEMO_PLANS);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_DEMO_MODE) === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleDemoMode = (enable?: boolean) => {
    setIsDemoMode((prev) => {
      const next = enable !== undefined ? enable : !prev;
      try {
        localStorage.setItem(STORAGE_KEY_DEMO_MODE, String(next));
      } catch (e) {
        console.warn('Failed to save demo mode state:', e);
      }
      soundHelper.playChime('click');
      return next;
    });
  };

  // RPG Profile with LocalStorage & Automatic Daily Quests Refresh
  const [rpgProfile, setRpgProfile] = useState<RpgProfile>(() => {
    let baseProfile = INITIAL_RPG_PROFILE;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RPG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!(parsed.level === 14 && parsed.title === 'Chronomancer • นักจัดสรรเวลา')) {
          baseProfile = parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load RPG profile from storage:', e);
    }

    const { quests } = getOrRefreshDailyQuests(baseProfile.quests);
    return {
      ...baseProfile,
      quests,
    };
  });

  // Check for daily quest rotation if the day changes while app is open
  useEffect(() => {
    const checkDailyRotation = () => {
      setRpgProfile((prev) => {
        const { quests, refreshed } = getOrRefreshDailyQuests(prev.quests);
        if (refreshed) {
          return { ...prev, quests };
        }
        return prev;
      });
    };

    const interval = setInterval(checkDailyRotation, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Central Action-Verified Quest Trigger: Completes quest only on real user actions!
  const handleTriggerQuestAction = (actionType: QuestActionType) => {
    setRpgProfile((prev) => {
      const { updatedProfile, completedQuest } = verifyAndTriggerQuest(prev, actionType);
      if (completedQuest) {
        soundHelper.playChime('complete', preferences.soundEnabled);
        soundHelper.speakThaiReminder('congrats', preferences.voiceStyle, preferences.voiceEnabled);
      }
      return updatedProfile;
    });
  };

  // Save RPG profile to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RPG, JSON.stringify(rpgProfile));
    } catch (e) {
      console.warn('Failed to save RPG profile:', e);
    }
  }, [rpgProfile]);

  // Long-Term Milestones
  const [milestones, setMilestones] = useState<MilestoneRoadmap[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MILESTONES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load milestones:', e);
    }
    return INITIAL_MILESTONES;
  });

  // Community Feed Posts with LocalStorage
  const [communityPosts, setCommunityPosts] = useState<StudySharePost[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMMUNITY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load community posts:', e);
    }
    return INITIAL_COMMUNITY_POSTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COMMUNITY, JSON.stringify(communityPosts));
    } catch (e) {
      console.warn('Failed to save community posts:', e);
    }
  }, [communityPosts]);

  // User preferences with LocalStorage
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load preferences from storage:', e);
    }
    return INITIAL_USER_PREFERENCES;
  });

  // Plans data with LocalStorage (defaults to empty array [] and discards mock seed data)
  const [plans, setPlans] = useState<PlanItem[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        // Clean up legacy mock data key if present
        const legacyV2 = localStorage.getItem('planai_study_plans_v2');
        if (legacyV2 && !localStorage.getItem(STORAGE_KEY_PLANS)) {
          try {
            const parsed = JSON.parse(legacyV2);
            if (Array.isArray(parsed)) {
              const userPlansOnly = parsed.filter(
                (p: any) =>
                  p &&
                  p.id &&
                  !p.id.startsWith('plan-seed') &&
                  p.id !== 'plan-seed-1' &&
                  p.id !== 'plan-seed-2' &&
                  p.subjectName !== 'การตลาดดิจิทัล (Digital Marketing 301)' &&
                  p.subjectName !== 'การพัฒนาเว็บแอปพลิเคชัน (Web Dev 202)'
              );
              localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(userPlansOnly));
              localStorage.removeItem('planai_study_plans_v2');
              return userPlansOnly;
            }
          } catch {
            localStorage.removeItem('planai_study_plans_v2');
          }
        }
      }

      const saved = localStorage.getItem(STORAGE_KEY_PLANS);
      if (saved) {
        const parsed: PlanItem[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (p) =>
              p &&
              p.id &&
              !p.id.startsWith('plan-seed') &&
              p.id !== 'plan-seed-1' &&
              p.id !== 'plan-seed-2' &&
              p.subjectName !== 'การตลาดดิจิทัล (Digital Marketing 301)' &&
              p.subjectName !== 'การพัฒนาเว็บแอปพลิเคชัน (Web Dev 202)'
          );
        }
      }
    } catch (e) {
      console.warn('Failed to load plans from storage:', e);
    }
    return [];
  });

  // Sync dark mode class on mount and changes
  useEffect(() => {
    if (preferences.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences.darkMode]);

  // Persist preferences
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(preferences));
    } catch (e) {
      console.warn('Failed to save preferences:', e);
    }
  }, [preferences]);

  // Persist plans
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(plans));
    } catch (e) {
      console.warn('Failed to save plans:', e);
    }
  }, [plans]);

  // Handle plan creation / update
  const handleSavePlan = (newPlan: PlanItem) => {
    setPlans((prev) => [newPlan, ...prev.filter((p) => p.id !== newPlan.id)]);
    setSelectedPlanId(newPlan.id);
    handleTriggerQuestAction('upload_plan');
  };

  const handleDeletePlan = (planId: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== planId));
    if (selectedPlanId === planId) {
      setSelectedPlanId('');
    }
  };

  const handleClearAllPlans = () => {
    setPlans([]);
    setSelectedPlanId('');
    try {
      localStorage.removeItem(STORAGE_KEY_PLANS);
      localStorage.removeItem('planai_study_plans_v2');
      localStorage.removeItem('planai_study_plans');
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
  };

  const handleToggleTopicCompletion = (planId: string, topicId: string) => {
    let completedNow = false;
    const updater = (prev: PlanItem[]) =>
      prev.map((plan) => {
        if (plan.id !== planId) return plan;
        return {
          ...plan,
          topics: plan.topics.map((t) => {
            if (t.id === topicId) {
              if (!t.completed) completedNow = true;
              return { ...t, completed: !t.completed };
            }
            return t;
          }),
        };
      });

    if (isDemoMode && plans.length === 0) {
      setDemoPlansState(updater);
    } else {
      setPlans(updater);
    }

    if (completedNow) {
      handleTriggerQuestAction('review_flashcard');
    }
  };

  const handleToggleBlockCompletion = (
    planId: string,
    dayNumber: number,
    blockId: string
  ) => {
    let completedNow = false;
    const updater = (prev: PlanItem[]) =>
      prev.map((plan) => {
        if (plan.id !== planId) return plan;
        return {
          ...plan,
          dailySchedule: plan.dailySchedule.map((day) => {
            if (day.dayNumber !== dayNumber) return day;
            return {
              ...day,
              blocks: day.blocks.map((b) => {
                if (b.id === blockId) {
                  if (!b.completed) completedNow = true;
                  return { ...b, completed: !b.completed };
                }
                return b;
              }),
            };
          }),
        };
      });

    if (isDemoMode && plans.length === 0) {
      setDemoPlansState(updater);
    } else {
      setPlans(updater);
    }

    if (completedNow) {
      handleTriggerQuestAction('complete_block');
    }
  };

  const handleAwardXpAndStamina = (xp: number, staminaDelta: number) => {
    setRpgProfile((prev) => {
      let newXp = prev.currentXp + xp;
      let newLevel = prev.level;
      let newNextXp = prev.nextLevelXp;
      if (newXp >= newNextXp) {
        newLevel += 1;
        newXp = newXp - newNextXp;
        newNextXp = Math.round(newNextXp * 1.25);
        soundHelper.playChime('complete', preferences.soundEnabled);
        soundHelper.speakThaiReminder('congrats', preferences.voiceStyle, preferences.voiceEnabled);
      }
      return {
        ...prev,
        level: newLevel,
        currentXp: newXp,
        nextLevelXp: newNextXp,
        staminaPercent: Math.min(100, Math.max(0, prev.staminaPercent + staminaDelta)),
      };
    });
  };

  const handleOpenWizard = (_type?: TaskType) => {
    setCurrentTab('wizard');
  };

  const handleSelectPlan = (planId: string, view: 'summary' | 'schedule') => {
    setSelectedPlanId(planId);
    setCurrentTab(view);
  };

  // Dynamically compute active milestones & plans:
  // If Demo Mode is ON and user has no plans: show DEMO_MILESTONES and DEMO_PLANS
  // If user has real plans: generate real Spaced Repetition roadmap from their actual uploaded subjects
  // If user has no plans and Demo Mode is OFF: clean empty state []
  const activeMilestones: MilestoneRoadmap[] = isDemoMode && plans.length === 0
    ? DEMO_MILESTONES
    : plans.length > 0
    ? plans.map((p) => {
        const totalTopics = p.topics ? p.topics.length : 0;
        const completedTopics = p.topics ? p.topics.filter((t) => t.completed).length : 0;
        const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
        const nextTopic =
          p.topics?.find((t) => !t.completed)?.title ||
          (p.topics && p.topics[0]?.title) ||
          'ทบทวนเนื้อหาสำคัญ';
        return {
          id: `milestone-${p.id}`,
          targetTitle: p.title || p.subjectName,
          category: p.category || (p.type === 'exam' ? 'เป้าหมายการสอบ' : 'การบ้าน/โครงงาน'),
          examOrGoalDate: p.detectedDate || 'ตามกำหนดการ',
          daysLeft: p.daysRemaining || 14,
          progressPercent: progress,
          retentionScore: Math.min(98, 60 + Math.round(progress * 0.38)),
          masteredItems: completedTopics,
          totalItems: Math.max(1, totalTopics),
          nextReviewTopic: nextTopic,
        };
      })
    : [];

  const activePlans = isDemoMode && plans.length === 0 ? demoPlansState : plans;
  const activeRpgProfile = isDemoMode && plans.length === 0 ? DEMO_RPG_PROFILE : rpgProfile;
  const effectiveSelectedPlanId =
    selectedPlanId && activePlans.some((p) => p.id === selectedPlanId)
      ? selectedPlanId
      : activePlans.length > 0
      ? activePlans[0].id
      : '';

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface antialiased transition-colors duration-200">
      {/* App Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        preferences={preferences}
        onUpdatePreferences={(prefs) => setPreferences((prev) => ({ ...prev, ...prefs }))}
        onOpenAccessibilityModal={() => setAccessibilityModalOpen(true)}
        onOpenVoiceModal={() => setVoiceModalOpen(true)}
        onOpenProfileModal={() => setProfileModalOpen(true)}
        level={activeRpgProfile.level}
      />

      {/* Main App Container */}
      <main className="flex-1 w-full pt-20 pb-24 md:pb-8 max-w-[1280px] mx-auto px-4 md:px-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            plans={activePlans}
            rawPlanCount={plans.length}
            isDemoMode={isDemoMode}
            onToggleDemoMode={handleToggleDemoMode}
            preferences={preferences}
            rpgProfile={activeRpgProfile}
            onUpdateRpgProfile={setRpgProfile}
            milestones={activeMilestones}
            onOpenWizard={handleOpenWizard}
            onSelectPlan={handleSelectPlan}
            onDeletePlan={handleDeletePlan}
            onClearAllPlans={handleClearAllPlans}
            onNavigateTab={setCurrentTab}
            onOpenProfileModal={() => setProfileModalOpen(true)}
          />
        )}

        {currentTab === 'wizard' && (
          <WizardView
            preferences={preferences}
            onSavePlan={handleSavePlan}
            onGoToDashboard={() => setCurrentTab('dashboard')}
            onGoToSchedule={(planId) => {
              if (planId) setSelectedPlanId(planId);
              setCurrentTab('schedule');
            }}
          />
        )}

        {currentTab === 'summary' && (
          <SummaryView
            plans={activePlans}
            selectedPlanId={effectiveSelectedPlanId}
            preferences={preferences}
            onSelectPlanId={setSelectedPlanId}
            onToggleTopicCompletion={handleToggleTopicCompletion}
            onGoToSchedule={(planId) => {
              setSelectedPlanId(planId);
              setCurrentTab('schedule');
            }}
            onTriggerQuestAction={handleTriggerQuestAction}
          />
        )}

        {currentTab === 'schedule' && (
          <LessonSummarizerView
            preferences={preferences}
            plans={activePlans}
            onAwardXpAndStamina={handleAwardXpAndStamina}
            onTriggerQuestAction={handleTriggerQuestAction}
            onNavigateToPlan={(planId) => {
              setSelectedPlanId(planId);
              setCurrentTab('summary');
            }}
          />
        )}

        {currentTab === 'community' && (
          <CommunityFeedView
            posts={communityPosts}
            onUpdatePosts={setCommunityPosts}
            preferences={preferences}
            plans={activePlans}
            onAwardXp={(xp) => handleAwardXpAndStamina(xp, 0)}
            onTriggerQuestAction={handleTriggerQuestAction}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation (Thumb Zone Ergonomics) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl border-t border-subtle px-3 py-2 flex items-center justify-around shadow-2xl safe-area-inset-bottom"
      >
        <button
          onClick={() => {
            setCurrentTab('dashboard');
            soundHelper.playChime('click', preferences.soundEnabled);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer ${
            currentTab === 'dashboard' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">home</span>
          <span className="text-[10px]">หน้าแรก</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab('schedule');
            soundHelper.playChime('click', preferences.soundEnabled);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer ${
            currentTab === 'schedule' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">menu_book</span>
          <span className="text-[10px]">สรุปบทเรียน</span>
        </button>

        {/* Center Quick Action button */}
        <button
          onClick={() => {
            setCurrentTab('wizard');
            soundHelper.playChime('click', preferences.soundEnabled);
          }}
          className="flex flex-col items-center -mt-5 cursor-pointer group"
          title="สร้างแพลนใหม่ด้วย AI"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
          </div>
          <span className="text-[10px] font-bold text-primary mt-1">สร้างแพลน</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab('community');
            soundHelper.playChime('click', preferences.soundEnabled);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer ${
            currentTab === 'community' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">forum</span>
          <span className="text-[10px]">คอมมูนิตี้</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab('summary');
            soundHelper.playChime('click', preferences.soundEnabled);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer ${
            currentTab === 'summary' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">subject</span>
          <span className="text-[10px]">สรุปผล</span>
        </button>
      </nav>

      {/* App Footer */}
      <Footer />

      {/* AI Voice Assistant Settings Modal */}
      <VoiceSettingsModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        preferences={preferences}
        onUpdatePreferences={(prefs) => setPreferences((prev) => ({ ...prev, ...prefs }))}
      />

      {/* Accessibility & Eye Health Modal */}
      <AccessibilityModal
        isOpen={accessibilityModalOpen}
        onClose={() => setAccessibilityModalOpen(false)}
        preferences={preferences}
        onUpdatePreferences={(prefs) => setPreferences((prev) => ({ ...prev, ...prefs }))}
      />

      {/* Edit Profile & Avatar Modal */}
      <EditProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        preferences={preferences}
        onSave={(updated) => setPreferences((prev) => ({ ...prev, ...updated }))}
        rpgTitle={rpgProfile.title}
        rpgLevel={rpgProfile.level}
      />
    </div>
  );
}
