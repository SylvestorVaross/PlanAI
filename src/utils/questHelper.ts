import { QuestItem, QuestActionType, RpgProfile, DAILY_QUEST_POOL } from '../types';

export const STORAGE_KEY_QUEST_DATE = 'planai_daily_quest_date_v1';

/**
 * Calculates remaining hours, minutes, and seconds until the next local midnight (00:00:00)
 */
export function getTimeUntilMidnight(): {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
} {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // Next 00:00:00 local time

  const diffMs = Math.max(0, midnight.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return { hours, minutes, seconds, formatted };
}

/**
 * Returns today's local date string in YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generates 3 balanced daily quests for a given date string using a deterministic pseudo-random seed
 */
export function generateQuestsForDate(dateStr: string): QuestItem[] {
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) {
    seed = (seed * 31 + dateStr.charCodeAt(i)) & 0xffffffff;
  }
  const pseudoRandom = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 4294967296;
  };

  const pool = [...DAILY_QUEST_POOL];
  // Fisher-Yates shuffle with deterministic seed
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(pseudoRandom() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Pick top 3 quests ensuring clean uncompleted state
  return pool.slice(0, 3).map((q, idx) => ({
    ...q,
    id: `quest-${dateStr}-${idx + 1}`,
    completed: false,
  }));
}

/**
 * Checks if the quests need refreshing for today, and returns today's quests
 */
export function getOrRefreshDailyQuests(existingQuests?: QuestItem[]): {
  quests: QuestItem[];
  refreshed: boolean;
} {
  const today = getTodayDateString();
  let storedDate = '';
  try {
    storedDate = localStorage.getItem(STORAGE_KEY_QUEST_DATE) || '';
  } catch {
    // ignore
  }

  // Check if existing quests are valid and have actionType
  const hasValidActionTypes =
    Array.isArray(existingQuests) &&
    existingQuests.length > 0 &&
    existingQuests.every((q) => q && q.actionType);

  if (storedDate === today && hasValidActionTypes) {
    return { quests: existingQuests!, refreshed: false };
  }

  // Need new quests for today!
  const newQuests = generateQuestsForDate(today);
  try {
    localStorage.setItem(STORAGE_KEY_QUEST_DATE, today);
  } catch {
    // ignore
  }

  return { quests: newQuests, refreshed: true };
}

/**
 * Verifies and triggers quest completion for a real user action.
 * If an incomplete quest matching actionType is found, updates the profile with XP, Stamina, and checks level-up.
 */
export function verifyAndTriggerQuest(
  rpgProfile: RpgProfile,
  actionType: QuestActionType
): {
  updatedProfile: RpgProfile;
  completedQuest: QuestItem | null;
} {
  if (!rpgProfile || !Array.isArray(rpgProfile.quests)) {
    return { updatedProfile: rpgProfile, completedQuest: null };
  }

  const questIndex = rpgProfile.quests.findIndex(
    (q) => q.actionType === actionType && !q.completed
  );

  if (questIndex === -1) {
    return { updatedProfile: rpgProfile, completedQuest: null };
  }

  const targetQuest = rpgProfile.quests[questIndex];
  const updatedQuest: QuestItem = {
    ...targetQuest,
    completed: true,
  };

  const updatedQuests = [...rpgProfile.quests];
  updatedQuests[questIndex] = updatedQuest;

  // Calculate XP & Level Up
  let newXp = rpgProfile.currentXp + targetQuest.xpReward;
  let newLevel = rpgProfile.level;
  let newNextXp = rpgProfile.nextLevelXp;

  if (newXp >= newNextXp) {
    newLevel += 1;
    newXp = newXp - newNextXp;
    newNextXp = Math.round(newNextXp * 1.25);
  }

  const updatedProfile: RpgProfile = {
    ...rpgProfile,
    level: newLevel,
    currentXp: newXp,
    nextLevelXp: newNextXp,
    staminaPercent: Math.min(100, Math.max(0, rpgProfile.staminaPercent + targetQuest.staminaReward)),
    quests: updatedQuests,
  };

  return {
    updatedProfile,
    completedQuest: updatedQuest,
  };
}
