export type TaskType = 'exam' | 'homework';

export interface ExtractedImageData {
  date: string;
  subject: string;
  topics: string[];
}

export interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  base64?: string;
  previewUrl?: string;
}

export interface TopicItem {
  id: string;
  title: string;
  subtopics: string[];
  estimatedMinutes: number;
  difficulty: 'ง่าย' | 'ปานกลาง' | 'ยาก' | string;
  technique: string;
  completed?: boolean;
}

export interface ScheduleBlock {
  id: string;
  timeSlot: string;
  title: string;
  type: 'study' | 'break' | 'review';
  wellnessTip?: string;
  completed?: boolean;
}

export interface DailyScheduleDay {
  dayNumber: number;
  dateLabel: string;
  focusGoal: string;
  totalMinutes: number;
  blocks: ScheduleBlock[];
}

export interface PlanItem {
  id: string;
  type: TaskType;
  subjectName: string;
  category: string;
  title: string;
  detectedDate: string;
  daysRemaining: number;
  summary: string;
  keyHighlights: string[];
  recommendedPrepDays: number;
  suggestedDailyHours?: number;
  initialFiles: UploadedFile[];
  detailedFiles: UploadedFile[];
  topics: TopicItem[];
  dailySchedule: DailyScheduleDay[];
  wellnessAdvice: string;
  cognitiveLoadScore?: string;
  createdAt: string;
}

export interface UserPreferences {
  darkMode: boolean;
  highContrast: boolean;
  voiceStyle: 'friend' | 'mentor' | 'formal';
  voiceEnabled: boolean;
  soundEnabled: boolean;
  userName: string;
  userRole: string;
  avatarUrl: string;
  interests?: string[];
}

export const INITIAL_USER_PREFERENCES: UserPreferences = {
  darkMode: false,
  highContrast: false,
  voiceStyle: 'friend',
  voiceEnabled: true,
  soundEnabled: true,
  userName: 'พิมพ์ชนก',
  userRole: 'นิสิตปี 3',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCt87xn9kzinKH9ugaubEqxih89vDX6s96VVfvvLxvkUdyJwCu5jXBFdklJ3kUORH56jxjJTojxZD5BwliVKBDfdWUSFAfEKYBLDDZAWVWy_sZOdV1UY2w8li7NtJgZE_cGwA6XTJqzOnCejZTqlw3uzwYyY57D5O-TwU3_6xmNANHYKSiHPq3ibvuT6wTDWQHAtSIHG8uDUWdjO2U6d8MNqlksmZyt6zXpAsHNzL8Pj4SgKXasiZSlwA',
  interests: ['เตรียมสอบ IELTS / TOEFL', 'คนทำงานพัฒนาทักษะ (Upskill)'],
};

// Clean slate for fresh users: Initial empty array []
export const INITIAL_SEED_PLANS: PlanItem[] = [];

// Realistic demo plans for testing in Demo Mode
export const DEMO_PLANS: PlanItem[] = [
  {
    id: 'demo-plan-1',
    type: 'exam',
    subjectName: 'การเตรียมตัวสอบ IELTS Academic & Vocab',
    category: 'ภาษาต่างประเทศ',
    title: 'เจาะลึก Writing Task 2 และ Spaced Repetition คำศัพท์',
    detectedDate: '2026-12-15',
    daysRemaining: 45,
    summary: 'แผนทบทวนไวยากรณ์เชิงวิชาการ เทคนิคการเขียน และคำศัพท์ Oxford 3000 ด้วยเทคนิค Pomodoro และการพักสายตา 20-20-20',
    keyHighlights: ['เน้น Coherence & Cohesion ใน Task 2', 'ทบทวน Vocab วันละ 30 คำ', 'ทดลองทำแบบฝึกหัดเสมือนจริง'],
    recommendedPrepDays: 45,
    suggestedDailyHours: 2.5,
    initialFiles: [],
    detailedFiles: [],
    topics: [
      { id: 'dt-1', title: 'Task 2 Essay Structures & Opinion Essays', subtopics: ['Thesis Statements', 'Body Paragraph Cohesion'], estimatedMinutes: 60, difficulty: 'ปานกลาง', technique: 'Feynman Technique', completed: true },
      { id: 'dt-2', title: 'Oxford Academic 3000 Core Words', subtopics: ['Prefixes and Suffixes', 'Context Clues'], estimatedMinutes: 45, difficulty: 'ง่าย', technique: 'Spaced Flashcards', completed: true },
      { id: 'dt-3', title: 'Complex Sentence Structures & Transitions', subtopics: ['Subordination', 'Punctuation Rules'], estimatedMinutes: 50, difficulty: 'ยาก', technique: 'Active Recall', completed: false },
    ],
    dailySchedule: [
      {
        dayNumber: 1,
        dateLabel: 'วันนี้ (Day 1)',
        focusGoal: 'วางโครงสร้าง Essay และท่องศัพท์วิชาการ',
        totalMinutes: 105,
        blocks: [
          { id: 'db-1', timeSlot: '19:00 - 19:45', title: 'โฟกัสทบทวน Task 2 Essay Structures', type: 'study', wellnessTip: 'ดื่มน้ำ 1 แก้วก่อนเริ่มอ่าน', completed: true },
          { id: 'db-2', timeSlot: '19:45 - 20:00', title: 'พักสายตาตามกฎ 20-20-20 & ยืดเหยียด', type: 'break', wellnessTip: 'มองวัตถุไกล 20 ฟุตเป็นเวลา 20 วินาที', completed: true },
          { id: 'db-3', timeSlot: '20:00 - 20:45', title: 'ฝึกทำโจทย์ & ตรวจสอบการใช้คำเชื่อมสากล', type: 'study', wellnessTip: 'จดบันทึกคำศัพท์ที่ใช้ผิดลงสมุดโน้ต', completed: false },
        ],
      },
    ],
    wellnessAdvice: 'รักษาสมาธิอย่างเป็นระบบ อย่าอ่านติดต่อกันเกิน 50 นาทีโดยไม่พักสายตา',
    cognitiveLoadScore: 'สมดุล (Optimal)',
    createdAt: '2026-11-01',
  },
];

// ================= GAMIFIED RPG SYSTEM TYPES =================
export type QuestActionType =
  | 'upload_plan'
  | 'create_milestone'
  | 'start_timer'
  | 'share_note'
  | 'complete_block'
  | 'review_flashcard';

export interface QuestItem {
  id: string;
  title: string;
  xpReward: number;
  staminaReward: number;
  completed: boolean;
  category: 'focus' | 'review' | 'wellness';
  actionType: QuestActionType;
  actionTarget: string; // 'wizard' | 'schedule' | 'community' | 'dashboard' | 'summary'
  hint?: string;
}

export const DAILY_QUEST_POOL: QuestItem[] = [
  {
    id: 'quest-pool-upload',
    title: 'อัปโหลดเอกสารหรือสรุปบทเรียนวิชาแรกเข้าสู่ระบบ',
    xpReward: 100,
    staminaReward: 25,
    completed: false,
    category: 'focus',
    actionType: 'upload_plan',
    actionTarget: 'wizard',
    hint: 'ไปที่หน้าสร้างแผน เพื่ออัปโหลดเอกสารหรือสรุปวิชาของคุณ',
  },
  {
    id: 'quest-pool-milestone',
    title: 'สร้างเป้าหมายวันสอบหรือกำหนดการส่งงาน',
    xpReward: 80,
    staminaReward: 20,
    completed: false,
    category: 'review',
    actionType: 'create_milestone',
    actionTarget: 'dashboard',
    hint: 'เพิ่มเป้าหมายหรือวันสอบสำคัญในแผนที่เป้าหมาย',
  },
  {
    id: 'quest-pool-timer',
    title: 'ทดลองเริ่มจับเวลาโฟกัสและพักสายตาตามกฎ 20-20-20',
    xpReward: 120,
    staminaReward: 35,
    completed: false,
    category: 'wellness',
    actionType: 'start_timer',
    actionTarget: 'schedule',
    hint: 'เริ่มจับเวลาโฟกัสในหน้าตัวจับเวลาและตารางอ่านหนังสือ',
  },
  {
    id: 'quest-pool-share',
    title: 'แชร์สรุปบทเรียนหรือเทคนิคจำสู่ชุมชน',
    xpReward: 100,
    staminaReward: 20,
    completed: false,
    category: 'review',
    actionType: 'share_note',
    actionTarget: 'community',
    hint: 'แบ่งปันเทคนิคการอ่านหรือสรุปย่อในหน้าแชร์ความรู้',
  },
  {
    id: 'quest-pool-block',
    title: 'พิชิตช่วงอ่านหนังสือตามตาราง 1 บล็อกเวลา',
    xpReward: 90,
    staminaReward: 25,
    completed: false,
    category: 'focus',
    actionType: 'complete_block',
    actionTarget: 'schedule',
    hint: 'ทำเครื่องหมายสำเร็จในบล็อกเวลาอ่านหนังสือของวันนี้',
  },
  {
    id: 'quest-pool-review',
    title: 'ทบทวนคำศัพท์หรือหัวข้อย่อยและทำเครื่องหมายสำเร็จ',
    xpReward: 80,
    staminaReward: 15,
    completed: false,
    category: 'review',
    actionType: 'review_flashcard',
    actionTarget: 'summary',
    hint: 'เข้าไปเช็กหัวข้อย่อยที่ทบทวนแล้วในหน้าสรุปเนื้อหา',
  },
];

export interface RpgAttributes {
  discipline: number;
  speed: number;
  retention: number;
  consistency: number;
}

export interface RpgProfile {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  title: string;
  staminaPercent: number;
  streakDays: number;
  attributes: RpgAttributes;
  quests: QuestItem[];
  unlockedRelics: string[];
  totalFocusMinutes: number;
}

export const INITIAL_RPG_PROFILE: RpgProfile = {
  level: 1,
  currentXp: 0,
  nextLevelXp: 200,
  title: 'Novice Scholar • ผู้เริ่มต้นการเรียนรู้',
  staminaPercent: 100,
  streakDays: 0,
  attributes: {
    discipline: 50,
    speed: 50,
    retention: 50,
    consistency: 50,
  },
  quests: [
    {
      id: 'quest-start-1',
      title: 'อัปโหลดเอกสารหรือสรุปบทเรียนวิชาแรกเข้าสู่ระบบ',
      xpReward: 100,
      staminaReward: 25,
      completed: false,
      category: 'focus',
      actionType: 'upload_plan',
      actionTarget: 'wizard',
      hint: 'อัปโหลดเอกสารในหน้าสร้างแผน',
    },
    {
      id: 'quest-start-2',
      title: 'สร้างเป้าหมายวันสอบหรือกำหนดการส่งงาน',
      xpReward: 80,
      staminaReward: 20,
      completed: false,
      category: 'review',
      actionType: 'create_milestone',
      actionTarget: 'dashboard',
      hint: 'เพิ่มเป้าหมายหรือวันสอบในแผนที่เป้าหมาย',
    },
    {
      id: 'quest-start-3',
      title: 'ทดลองเริ่มจับเวลาโฟกัสและพักสายตาตามกฎ 20-20-20',
      xpReward: 120,
      staminaReward: 35,
      completed: false,
      category: 'wellness',
      actionType: 'start_timer',
      actionTarget: 'schedule',
      hint: 'เริ่มจับเวลาในหน้าตัวจับเวลา',
    },
  ],
  unlockedRelics: ['Hourglass of Focus'],
  totalFocusMinutes: 0,
};

export const DEMO_RPG_PROFILE: RpgProfile = {
  level: 14,
  currentXp: 2450,
  nextLevelXp: 3000,
  title: 'Chronomancer • นักจัดสรรเวลา',
  staminaPercent: 88,
  streakDays: 12,
  attributes: {
    discipline: 94,
    speed: 82,
    retention: 88,
    consistency: 91,
  },
  quests: [
    {
      id: 'quest-demo-1',
      title: 'พิชิตช่วงโฟกัส 45 นาทีครบ 2 บล็อกเวลา',
      xpReward: 150,
      staminaReward: 20,
      completed: false,
      category: 'focus',
      actionType: 'complete_block',
      actionTarget: 'schedule',
      hint: 'ทำเครื่องหมายสำเร็จในบล็อกเวลาอ่านหนังสือ',
    },
    {
      id: 'quest-demo-2',
      title: 'พักสายตา 15 นาทีตามกฎ 20-20-20',
      xpReward: 80,
      staminaReward: 35,
      completed: true,
      category: 'wellness',
      actionType: 'start_timer',
      actionTarget: 'schedule',
      hint: 'พักสายตา 20-20-20 ในหน้าตัวจับเวลา',
    },
    {
      id: 'quest-demo-3',
      title: 'ทบทวนคำศัพท์/หัวข้อย่อยและทำเครื่องหมายสำเร็จ',
      xpReward: 100,
      staminaReward: 15,
      completed: false,
      category: 'review',
      actionType: 'review_flashcard',
      actionTarget: 'summary',
      hint: 'ทบทวนหัวข้อย่อยในหน้าสรุปบทเรียน',
    },
  ],
  unlockedRelics: ['Hourglass of Focus', 'Feather of Clarity', 'Shield of Consistency'],
  totalFocusMinutes: 480,
};

// ================= LONG-TERM MILESTONE ROADMAP TYPES =================
export interface MilestoneRoadmap {
  id: string;
  targetTitle: string;
  category: string;
  examOrGoalDate: string;
  daysLeft: number;
  progressPercent: number;
  retentionScore: number; // Spaced Repetition %
  masteredItems: number;
  totalItems: number;
  nextReviewTopic: string;
}

// Initial empty milestones for real fresh users
export const INITIAL_MILESTONES: MilestoneRoadmap[] = [];

// Sample milestones for Demo Mode
export const DEMO_MILESTONES: MilestoneRoadmap[] = [
  {
    id: 'milestone-1',
    targetTitle: 'เตรียมตัวสอบชิงทุนศึกษาต่อต่างประเทศ (IELTS & Statement)',
    category: 'ทุนการศึกษา & ภาษา',
    examOrGoalDate: '15 ธันวาคม',
    daysLeft: 45,
    progressPercent: 68,
    retentionScore: 84,
    masteredItems: 42,
    totalItems: 60,
    nextReviewTopic: 'Academic Writing Task 2 & สรุปคำเชื่อมสากล',
  },
  {
    id: 'milestone-2',
    targetTitle: 'คลังคำศัพท์และไวยากรณ์ขั้นสูง (Oxford Academic 3000)',
    category: 'คำศัพท์ & ความจำ',
    examOrGoalDate: 'ต่อเนื่องประจำสัปดาห์',
    daysLeft: 18,
    progressPercent: 74,
    retentionScore: 91,
    masteredItems: 1220,
    totalItems: 1500,
    nextReviewTopic: 'Spaced Repetition: กลุ่มคำศัพท์ Research Methodology',
  },
];

// ================= COMMUNITY STUDY SHARE TYPES =================
export interface StudySharePost {
  id: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  subject: string;
  title: string;
  contentSnippet: string;
  tags: string[];
  technique: string;
  brainFuel: {
    mindblown: number;
    coffee: number;
    insight: number;
    userReacted?: 'mindblown' | 'coffee' | 'insight';
  };
  keyPoints: string[];
  createdAt: string;
}

export const INITIAL_COMMUNITY_POSTS: StudySharePost[] = [
  {
    id: 'post-1',
    authorName: 'ณภัทร ว.',
    authorRole: 'นิสิตแพทย์ ปี 2',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    subject: 'กายวิภาคศาสตร์ (Anatomy)',
    title: 'สรุปเทคนิคจำเส้นประสาทสมอง 12 คู่ด้วย Active Recall & Visual Mnemonics',
    contentSnippet: 'การจำเรียงลำดับเส้นประสาทสมองแบบธรรมดาจะลืมง่ายมาก ลองใช้เทคนิค Feynman เขียนแผนผังเชื่อมโยงกับประสาทสัมผัสจริงในชีวิตประจำวัน...',
    tags: ['#Medical', '#ActiveRecall', '#Feynman'],
    technique: 'Visual Memory Palaces',
    brainFuel: { mindblown: 42, coffee: 28, insight: 56 },
    keyPoints: [
      'เชื่อมโยงเส้นประสาท CN I-XII กับตำแหน่งบนใบหน้าจริง',
      'ทำข้อสอบเก่า 15 นาทีหลังอ่านจบเพื่อล็อกความจำระยะยาว',
      'พักสายตาทุก 40 นาทีเพื่อลดความล้าของสมองส่วนหน้า',
    ],
    createdAt: '10 นาทีที่แล้ว',
  },
  {
    id: 'post-2',
    authorName: 'กวินทร์ ม.',
    authorRole: 'นักศึกษาเศรษฐศาสตร์ ปี 3',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    subject: 'เศรษฐมิติ (Econometrics)',
    title: 'เช็คลิสต์ 4 กฎเหล็กของ OLS Regression ที่ออกสอบบ่อยที่สุด',
    contentSnippet: 'ใครที่กำลังเตรียมสอบกลางภาค ห้ามลืมพิสูจน์ Gauss-Markov Theorem 4 ข้อนี้เด็ดขาด AI ช่วยแจกแจงสูตรและสมมติฐานให้กระชับมาก...',
    tags: ['#Econometrics', '#MathStats', '#Pomodoro'],
    technique: 'Gauss-Markov Drill',
    brainFuel: { mindblown: 19, coffee: 34, insight: 45 },
    keyPoints: [
      'Zero Conditional Mean of Errors',
      'No Perfect Collinearity ในตัวแปรอิสระ',
      'Homoskedasticity & Residual Plot Checks',
    ],
    createdAt: '1 ชั่วโมงที่แล้ว',
  },
  {
    id: 'post-3',
    authorName: 'กุลธิดา ส.',
    authorRole: 'วิศวกรรมคอมพิวเตอร์ ปี 4',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    subject: 'โครงสร้างข้อมูลและขั้นตอนวิธี (DSA)',
    title: 'ทำความเข้าใจ Dynamic Programming (DP) สไตล์คนไม่ชอบจำสูตร',
    contentSnippet: 'เปลี่ยนวิธีคิดจาก Recursion ไปหา Memoization ทีละสเต็ป วาดตาราง State Transition Matrix ให้ออกมาก่อนเริ่มเขียนโค้ด...',
    tags: ['#ComputerScience', '#DynamicProgramming', '#Flashcards'],
    technique: 'State Table Mapping',
    brainFuel: { mindblown: 51, coffee: 63, insight: 77 },
    keyPoints: [
      'ระบุ Base Case ให้ชัดเจนก่อนแตกปัญหาย่อย',
      'ใช้ Memoization Array ลดเวลาจาก O(2^n) เป็น O(n)',
      'ฝึกวาดตาราง Tabulation 3 ข้อต่อวันอย่างสม่ำเสมอ',
    ],
    createdAt: '3 ชั่วโมงที่แล้ว',
  },
];
