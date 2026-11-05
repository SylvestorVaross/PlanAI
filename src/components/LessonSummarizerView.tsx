import React, { useState, useEffect, useRef } from 'react';
import { UserPreferences, QuestActionType, PlanItem } from '../types';
import { soundHelper } from '../utils/soundHelper';

export interface CoreConceptItem {
  heading: string;
  detail: string;
  bulletPoints: string[];
}

export interface KeyTermItem {
  term: string;
  definition: string;
}

export interface QuizQuestionItem {
  question: string;
  answer: string;
  userRevealed?: boolean;
}

export interface KnowledgeLinkItem {
  targetTitle: string;
  targetType: 'plan' | 'summary';
  relationshipType: 'prerequisite' | 'complementary' | 'cross_domain' | 'supporting_evidence';
  connectionSummary: string;
  howItSupports: string;
  studySynergyTip?: string;
  targetPlanId?: string;
}

export interface LessonSummaryData {
  id: string;
  title: string;
  subject: string;
  overview: string;
  coreConcepts: CoreConceptItem[];
  keyTerms: KeyTermItem[];
  studyTips: string[];
  quizQuestions: QuizQuestionItem[];
  relatedLinks?: KnowledgeLinkItem[];
  createdAt: string;
  sourceType: 'file' | 'text' | 'demo';
  fileName?: string;
}

const STORAGE_KEY_SAVED_SUMMARIES = 'planai_saved_lesson_summaries_v1';

const SAMPLE_DEMO_LESSONS: { label: string; subject: string; sampleText: string; title: string }[] = [
  {
    label: 'ชีววิทยา: การสังเคราะห์ด้วยแสง',
    subject: 'ชีววิทยา ม.ปลาย',
    title: 'การสังเคราะห์ด้วยแสงและปฏิกิริยาแสง (Light Reaction & Calvin Cycle)',
    sampleText: `การสังเคราะห์ด้วยแสง (Photosynthesis) เป็นกระบวนการที่สิ่งมีชีวิตที่มีคลอโรฟิลล์เปลี่ยนพลังงานแสงอาทิตย์ให้เป็นพลังงานเคมีในรูปของน้ำตาลกลูโคส โดยแบ่งออกเป็น 2 ขั้นตอนหลัก:
1. ปฏิกิริยาที่ต้องใช้แสง (Light Reaction): เกิดขึ้นที่เยื่อไทลาคอยด์ (Thylakoid Membrane) ภายในคลอโรพลาสต์ คลอโรฟิลล์จะดูดกลืนพลังงานแสงมาแตกตัวโมเลกุลน้ำ (Photolysis) ทำให้เกิดแก๊สออกซิเจน (O2), ATP และ NADPH ซึ่งเป็นสารพลังงานสูง
2. วัฏจักรเคลวิน (Calvin Cycle / Dark Reaction): เกิดขึ้นที่สโตรมา (Stroma) ไม่จำเป็นต้องใช้แสงโดยตรง แต่นำ ATP และ NADPH จากขั้นตอนแรกมารีดิวซ์แก๊สคาร์บอนไดออกไซด์ (CO2) ด้วยเอนไซม์ RuBisCO ให้กลายเป็นน้ำตาลฟอสโฟกลีเซอรัลดีไฮด์ (PGAL หรือ G3P) แล้วนำไปสร้างเป็นกลูโคสต่อไป
ปัจจัยจำกัด (Limiting Factors): ความเข้มแสง, ความเข้มข้นของ CO2 และอุณหภูมิที่เหมาะสม`,
  },
  {
    label: 'ประวัติศาสตร์: การปฏิวัติอุตสาหกรรม',
    subject: 'ประวัติศาสตร์สากล',
    title: 'การปฏิวัติอุตสาหกรรมและการเปลี่ยนแปลงทางเศรษฐกิจสังคม',
    sampleText: `การปฏิวัติอุตสาหกรรม (Industrial Revolution) เริ่มต้นขึ้นในประเทศอังกฤษช่วงกลางศตวรรษที่ 18 (ประมาณ ค.ศ. 1760) โดยเริ่มจากอุตสาหกรรมสิ่งทอและการประดิษฐ์เครื่องจักรไอน้ำของเจมส์ วัตต์ (James Watt)
สาเหตุสำคัญที่อังกฤษเป็นผู้นำ:
- มีทรัพยากรถ่านหินและเหล็กอุดมสมบูรณ์
- มีเสถียรภาพทางการเมือง และมีระบบธนาคารที่เอื้อต่อการลงทุน
- มีอาณานิคมกว้างขวาง เป็นแหล่งวัตถุดิบและตลาดระบายสินค้า
ผลกระทบระดับโลก:
- การเปลี่ยนจากระบบหัตถกรรมในครัวเรือนสู่ระบบโรงงาน (Factory System)
- การเติบโตของเมืองอย่างรวดเร็ว (Urbanization) เกิดชนชั้นกลางและชนชั้นกรรมาชีพ
- การกำเนิดแนวคิดทุนนิยมเสรีของอดัม สมิธ (Adam Smith) และแนวคิดสังคมนิยมของคาร์ล มาร์กซ์ (Karl Marx)`,
  },
  {
    label: 'ฟิสิกส์: กฎการเคลื่อนที่ของนิวตัน',
    subject: 'ฟิสิกส์ ม.ปลาย',
    title: 'กฎการเคลื่อนที่ 3 ข้อของนิวตัน และการประยุกต์ใช้ในชีวิตประจำวัน',
    sampleText: `เซอร์ ไอแซก นิวตัน (Sir Isaac Newton) ได้เสนอกฎการเคลื่อนที่ 3 ข้อที่เป็นรากฐานของกลศาสตร์คลาสสิก:
1. กฎข้อที่ 1 (กฎความเฉื่อย - Law of Inertia): วัตถุจะรักษาสภาพหยุดนิ่งหรือเคลื่อนที่ด้วยความเร็วคงที่ในแนวตรง เว้นแต่จะมีแรงลัพธ์ที่ไม่เป็นศูนย์มากระทำ (ΣF = 0)
2. กฎข้อที่ 2 (กฎความเร่ง - Law of Acceleration): เมื่อมีแรงลัพธ์ที่ไม่เป็นศูนย์มากระทำต่อวัตถุ จะทำให้วัตถุเคลื่อนที่ด้วยความเร่งที่มีทิศเดียวกับแรงลัพธ์ โดยขนาดของความเร่งจะแปรผันตรงกับขนาดของแรงลัพธ์และแปรผกผันกับมวลของวัตถุ (ΣF = ma)
3. กฎข้อที่ 3 (กฎแรงกิริยาและแรงปฏิกิริยา - Action & Reaction): ทุกแรงกิริยาจะมีแรงปฏิกิริยาที่มีขนาดเท่ากัน แต่มีทิศทางตรงกันข้ามเสมอ และกระทำต่อวัตถุคนละก้อน (Action = -Reaction)`,
  },
];

interface LessonSummarizerViewProps {
  preferences: UserPreferences;
  plans?: PlanItem[];
  onAwardXpAndStamina?: (xp: number, staminaDelta: number) => void;
  onTriggerQuestAction?: (action: QuestActionType) => void;
  onNavigateToPlan?: (planId: string) => void;
}

export const LessonSummarizerView: React.FC<LessonSummarizerViewProps> = ({
  preferences,
  plans = [],
  onAwardXpAndStamina,
  onTriggerQuestAction,
  onNavigateToPlan,
}) => {
  // Input modes: 'file' | 'text'
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [inputText, setInputText] = useState<string>('');
  const [subjectName, setSubjectName] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    base64: string;
    mimeType: string;
    size: string;
    previewUrl?: string;
  } | null>(null);

  // States for processing & results
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [summaryResult, setSummaryResult] = useState<LessonSummaryData | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'concepts' | 'terms' | 'quiz'>('overview');
  const [revealedQuizAnswers, setRevealedQuizAnswers] = useState<Record<number, boolean>>({});

  // Saved summaries history
  const [savedList, setSavedList] = useState<LessonSummaryData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED_SUMMARIES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load saved summaries:', e);
    }
    return [];
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save history to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_SUMMARIES, JSON.stringify(savedList));
    } catch (e) {
      console.warn('Failed to save summaries history:', e);
    }
  }, [savedList]);

  // Handle file selection (Images, PDF, text)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('ไฟล์มีขนาดใหญ่เกิน 20MB โปรดเลือกไฟล์ขนาดเล็กลง');
      return;
    }

    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      const isImg = file.type.startsWith('image/');

      setSelectedFile({
        name: file.name,
        base64,
        mimeType: file.type || 'application/octet-stream',
        size: sizeStr,
        previewUrl: isImg ? base64 : undefined,
      });

      if (!subjectName) {
        setSubjectName(file.name.replace(/\.[^/.]+$/, ''));
      }
      soundHelper.playChime('click', preferences.soundEnabled);
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      const isImg = file.type.startsWith('image/');

      setSelectedFile({
        name: file.name,
        base64,
        mimeType: file.type || 'application/octet-stream',
        size: sizeStr,
        previewUrl: isImg ? base64 : undefined,
      });

      if (!subjectName) {
        setSubjectName(file.name.replace(/\.[^/.]+$/, ''));
      }
      soundHelper.playChime('click', preferences.soundEnabled);
    };
    reader.readAsDataURL(file);
  };

  // Load a demo lesson into form and summarize
  const handleLoadDemo = (demo: typeof SAMPLE_DEMO_LESSONS[0]) => {
    setInputMode('text');
    setInputText(demo.sampleText);
    setSubjectName(demo.title);
    setSelectedFile(null);
    soundHelper.playChime('click', preferences.soundEnabled);
  };

  // Submit to AI Summarizer Endpoint
  const handleGenerateSummary = async () => {
    if (inputMode === 'file' && !selectedFile) {
      setErrorMessage('กรุณาเลือกหรือลากไฟล์ภาพ/เอกสารเข้ามาในระบบก่อน');
      return;
    }
    if (inputMode === 'text' && !inputText.trim()) {
      setErrorMessage('กรุณากรอกหรือวางข้อความเนื้อหาบทเรียนที่ต้องการสรุป');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setRevealedQuizAnswers({});
    setIsSaved(false);

    soundHelper.playChime('start', preferences.soundEnabled);

    try {
      const existingContext = {
        plans: plans.map((p) => ({
          id: p.id,
          title: p.title || p.subjectName,
          type: p.type,
          summary: p.summary,
          topics: (p.topics || []).map((t) => t.title),
        })),
        savedSummaries: savedList.slice(0, 6).map((s) => ({
          id: s.id,
          title: s.title,
          subject: s.subject,
          overview: s.overview,
        })),
      };

      const res = await fetch('/api/ai/summarize-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputMode === 'text' ? inputText : '',
          fileBase64: inputMode === 'file' ? selectedFile?.base64 : '',
          mimeType: inputMode === 'file' ? selectedFile?.mimeType : '',
          fileName: subjectName || selectedFile?.name || 'บทเรียน',
          existingContext,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'เกิดข้อผิดพลาดในการประมวลผลสรุปเนื้อหา');
      }

      const data = json.data;
      const newSummary: LessonSummaryData = {
        id: `summary-${Date.now()}`,
        title: data.title || subjectName || 'สรุปบทเรียนสำคัญ',
        subject: data.subject || 'เนื้อหาบทเรียน',
        overview: data.overview || '',
        coreConcepts: data.coreConcepts || [],
        keyTerms: data.keyTerms || [],
        studyTips: data.studyTips || [],
        quizQuestions: data.quizQuestions || [],
        relatedLinks: data.relatedLinks || [],
        createdAt: new Date().toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        sourceType: inputMode === 'file' ? 'file' : 'text',
        fileName: selectedFile?.name,
      };

      setSummaryResult(newSummary);
      setActiveTab('overview');

      // Award Gamified XP & Stamina
      soundHelper.playChime('complete', preferences.soundEnabled);
      soundHelper.speakThaiReminder('congrats', preferences.voiceStyle, preferences.voiceEnabled);

      if (onAwardXpAndStamina) {
        onAwardXpAndStamina(100, 25);
      }
      if (onTriggerQuestAction) {
        onTriggerQuestAction('review_flashcard');
      }
    } catch (err: any) {
      console.error('Summarization failed:', err);
      setErrorMessage(err.message || 'ไม่สามารถสรุปบทเรียนได้ โปรดตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง');
      soundHelper.playChime('click', preferences.soundEnabled);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy full summary to clipboard
  const handleCopySummary = () => {
    if (!summaryResult) return;
    const textToCopy = `📌 ${summaryResult.title} (${summaryResult.subject})
${summaryResult.overview}

💡 หัวข้อสำคัญ:
${summaryResult.coreConcepts.map((c) => `- ${c.heading}: ${c.detail}\n  ${c.bulletPoints.map((b) => `• ${b}`).join('\n  ')}`).join('\n')}

📖 คำศัพท์สำคัญ:
${summaryResult.keyTerms.map((t) => `• ${t.term}: ${t.definition}`).join('\n')}

❓ แนวข้อสอบทบทวน:
${summaryResult.quizQuestions.map((q, i) => `ข้อ ${i + 1}: ${q.question}\nเฉลย: ${q.answer}`).join('\n\n')}${
  summaryResult.relatedLinks && summaryResult.relatedLinks.length > 0
    ? `\n\n🔗 ความเชื่อมโยงกับวิชาที่เคยบันทึกไว้:\n` +
      summaryResult.relatedLinks
        .map(
          (l) =>
            `• [${l.targetTitle}] (${
              l.relationshipType === 'prerequisite'
                ? 'พื้นฐานต่อยอด'
                : l.relationshipType === 'complementary'
                ? 'เสริมความเข้าใจ'
                : l.relationshipType === 'cross_domain'
                ? 'ประยุกต์ข้ามวิชา'
                : 'หลักฐานสนับสนุน'
            }): ${l.connectionSummary}\n  -> สนับสนุนบทเรียนเดิม: ${l.howItSupports}`
        )
        .join('\n')
    : ''
}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    soundHelper.playChime('click', preferences.soundEnabled);
    setTimeout(() => setCopied(false), 2000);
  };

  // Save to history
  const handleSaveToHistory = () => {
    if (!summaryResult) return;
    if (savedList.some((s) => s.id === summaryResult.id)) {
      setIsSaved(true);
      return;
    }
    setSavedList([summaryResult, ...savedList]);
    setIsSaved(true);
    soundHelper.playChime('click', preferences.soundEnabled);
  };

  // Print / Save as PDF
  const handlePrint = () => {
    window.print();
  };

  // Read overview with Thai AI voice
  const handleSpeakOverview = () => {
    if (!summaryResult) return;
    soundHelper.speakThaiReminder(
      'sample',
      preferences.voiceStyle,
      preferences.voiceEnabled ?? true,
      `สรุปภาพรวม ${summaryResult.title} ${summaryResult.overview}`
    );
  };

  return (
    <div className="w-full py-6 flex flex-col gap-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/20 via-surface-container-lowest to-surface-container-low border border-subtle p-6 md:p-8 shadow-sm">
        <div className="absolute -top-16 -right-16 w-52 h-52 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 shrink-0">
              <span className="material-symbols-outlined text-[26px]">auto_stories</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-headline-md text-xl md:text-2xl font-black text-on-surface">
                  AI สรุปบทเรียน &amp; เอกสาร
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high/80 dark:bg-surface-container-high/90 border border-subtle text-[11px] font-bold shrink-0 shadow-2xs">
                  <span className="material-symbols-outlined text-[14px] text-primary">auto_awesome</span>
                  <span className="text-on-surface font-bold">Gemini 3.8 Flash</span>
                </span>
              </div>
              <p className="font-body-sm text-xs md:text-sm text-on-surface-variant mt-0.5">
                อัปโหลดภาพชีทสรุป ไฟล์ PDF หรือวางเนื้อหาบทเรียน เพื่อให้ AI สกัดใจความสำคัญ หัวข้อหลัก คำศัพท์ และแนวข้อสอบให้ทันที
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-[11px] font-bold text-primary bg-primary-fixed/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0">
              <span className="material-symbols-outlined text-[16px]">military_tech</span>
              <span>รับ +100 XP ทุกครั้งที่สรุปบทเรียน</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Input Form on Left (or full when no result) & Result on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upload & Input Area */}
        <div className={`${summaryResult ? 'lg:col-span-5' : 'lg:col-span-12'} flex flex-col gap-4 transition-all duration-300`}>
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-subtle shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <span className="font-headline-sm text-sm md:text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">upload_file</span>
                <span>นำเข้าเนื้อหาบทเรียน</span>
              </span>

              {/* Mode Switcher */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container-low border border-subtle text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setInputMode('file');
                    soundHelper.playChime('click', preferences.soundEnabled);
                  }}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    inputMode === 'file'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  อัปโหลดไฟล์/รูป
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputMode('text');
                    soundHelper.playChime('click', preferences.soundEnabled);
                  }}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    inputMode === 'text'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  พิมพ์/วางข้อความ
                </button>
              </div>
            </div>

            {/* Subject/Topic Name input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                <span>ชื่อวิชา หรือหัวข้อบทเรียน</span>
                <span className="text-[11px] text-on-surface-variant font-normal">ระบุเพื่อจัดหมวดหมู่</span>
              </label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="เช่น การสังเคราะห์ด้วยแสง, ฟิสิกส์กลศาสตร์, สรุปสอบกลางภาค..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-xs md:text-sm border border-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>

            {/* Input Zone: File Dropzone */}
            {inputMode === 'file' ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 group ${
                  selectedFile
                    ? 'border-emerald-500/60 bg-emerald-500/5'
                    : 'border-subtle hover:border-primary/60 bg-surface-container-low/40 hover:bg-surface-container-low'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf,text/plain"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2 w-full">
                    {selectedFile.previewUrl ? (
                      <img
                        src={selectedFile.previewUrl}
                        alt="Preview"
                        className="max-h-40 rounded-xl object-contain shadow-md border border-subtle mb-1"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
                        <span className="material-symbols-outlined text-[32px]">description</span>
                      </div>
                    )}
                    <span className="font-bold text-xs sm:text-sm text-on-surface max-w-[260px] truncate">
                      {selectedFile.name}
                    </span>
                    <span className="text-[11px] text-on-surface-variant font-mono">
                      {selectedFile.size} • พร้อมสรุป
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="mt-1 px-3 py-1 rounded-lg bg-surface-container-high text-xs text-on-surface hover:text-red-500 transition-colors font-medium cursor-pointer"
                    >
                      เปลี่ยนไฟล์
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-[32px]">cloud_upload</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-xs sm:text-sm text-on-surface">
                        คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        รองรับรูปถ่ายชีทสรุป (JPG, PNG), สไลด์เอกสาร, PDF ขนาดไม่เกิน 20MB
                      </span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Input Zone: Text Box */
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                  <span>เนื้อหาบทเรียน หรือข้อความเลคเชอร์</span>
                  <span className="text-[11px] text-on-surface-variant font-mono">{inputText.length} ตัวอักษร</span>
                </label>
                <textarea
                  rows={8}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="วางเนื้อหาบทเรียน ย่อหน้าสำคัญ หรือพิมพ์ข้อความที่ต้องการให้ AI ช่วยสรุปใจความสำคัญที่นี่..."
                  className="w-full p-3.5 rounded-2xl bg-surface-container-low text-on-surface text-xs sm:text-sm border border-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-y leading-relaxed"
                />
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* CTA Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGenerateSummary}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                  <span>AI กำลังวิเคราะห์และสรุปเนื้อหาบทเรียน...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                  <span>ให้ AI สรุปเนื้อหาบทเรียนทันที (+100 XP)</span>
                </>
              )}
            </button>

            {/* Quick Demo Lessons */}
            <div className="flex flex-col gap-2 pt-2 border-t border-subtle">
              <span className="text-[11px] font-bold text-on-surface-variant">
                หรือทดลองกดสรุปบทเรียนตัวอย่าง (Quick Demo):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_DEMO_LESSONS.map((demo) => (
                  <button
                    key={demo.label}
                    type="button"
                    onClick={() => handleLoadDemo(demo)}
                    className="px-2.5 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-[11px] font-medium border border-subtle transition-all cursor-pointer active:scale-95 text-left"
                  >
                    ⚡ {demo.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Saved Summaries Drawer / History List */}
          {savedList.length > 0 && (
            <div className="bg-surface-container-lowest p-5 rounded-3xl border border-subtle shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[18px]">bookmark</span>
                  <span>บทเรียนที่บันทึกไว้ ({savedList.length})</span>
                </span>
                <span className="text-[11px] text-on-surface-variant font-mono">บันทึกล่าสุด</span>
              </div>

              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                {savedList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSummaryResult(item);
                      setActiveTab('overview');
                      soundHelper.playChime('click', preferences.soundEnabled);
                    }}
                    className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container border border-subtle transition-all cursor-pointer flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex flex-col leading-tight min-w-0">
                      <span className="font-bold text-on-surface truncate">{item.title}</span>
                      <span className="text-[10px] text-on-surface-variant mt-0.5">{item.createdAt}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSavedList(savedList.filter((s) => s.id !== item.id));
                      }}
                      className="p-1 rounded-lg text-on-surface-variant hover:text-red-500 cursor-pointer shrink-0"
                      title="ลบบทเรียนนี้"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive AI Summary Result */}
        {summaryResult && (
          <div className="lg:col-span-7 flex flex-col gap-4 animate-fadeIn">
            {/* Result Header & Action Toolbar */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-subtle shadow-xs flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle pb-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-primary font-bold text-[10px]">
                      {summaryResult.subject}
                    </span>
                    <span className="text-[11px] text-on-surface-variant font-mono">
                      สรุปเมื่อ {summaryResult.createdAt}
                    </span>
                  </div>
                  <h2 className="font-headline-md text-base sm:text-lg md:text-xl font-bold text-on-surface mt-1">
                    {summaryResult.title}
                  </h2>
                </div>

                {/* Quick Action Tools */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="p-2 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-bold border border-subtle transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="คัดลอกสรุปทั้งหมด"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copied ? 'check' : 'content_copy'}
                    </span>
                    <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSpeakOverview}
                    className="p-2 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary text-xs font-bold border border-subtle transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="ฟังเสียงอ่านสรุปภาพรวม"
                  >
                    <span className="material-symbols-outlined text-[16px]">volume_up</span>
                    <span>ฟังเสียงอ่าน</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="p-2 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-bold border border-subtle transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="พิมพ์ชีทสรุปเป็น PDF"
                  >
                    <span className="material-symbols-outlined text-[16px]">print</span>
                    <span>พิมพ์ชีท</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveToHistory}
                    className={`p-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                      isSaved
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-surface-container-low hover:bg-surface-container text-on-surface border-subtle'
                    }`}
                    title="บันทึกเก็บไว้ในบทเรียนของฉัน"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isSaved ? 'bookmark_added' : 'bookmark_add'}
                    </span>
                    <span>{isSaved ? 'บันทึกแล้ว' : 'บันทึก'}</span>
                  </button>
                </div>
              </div>

              {/* Result Tabs Navigation */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-subtle">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'overview'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">summarize</span>
                  <span>ใจความสำคัญ &amp; ภาพรวม</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('concepts')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'concepts'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                  <span>ประเด็นหลัก ({summaryResult.coreConcepts.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('terms')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'terms'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">dictionary</span>
                  <span>คำศัพท์/นิยาม ({summaryResult.keyTerms.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('quiz')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'quiz'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">quiz</span>
                  <span>แนวข้อสอบ ({summaryResult.quizQuestions.length})</span>
                </button>
              </div>

              {/* Tab 1: Overview & Study Tips */}
              {activeTab === 'overview' && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-subtle flex flex-col gap-2">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span>บทสรุปใจความสำคัญ (Executive Summary)</span>
                    </span>
                    <p className="text-xs sm:text-sm text-on-surface leading-relaxed whitespace-pre-line">
                      {summaryResult.overview}
                    </p>
                  </div>

                  {/* Study & Memory Tips */}
                  {summaryResult.studyTips.length > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col gap-2">
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">tips_and_updates</span>
                        <span>เทคนิคการจำและทบทวน (AI Study Tips)</span>
                      </span>
                      <ul className="flex flex-col gap-1.5 text-xs text-on-surface">
                        {summaryResult.studyTips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-600 dark:text-amber-400 font-bold shrink-0">✦</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Core Concepts */}
              {activeTab === 'concepts' && (
                <div className="flex flex-col gap-3 animate-fadeIn">
                  {summaryResult.coreConcepts.map((concept, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-surface-container-low border border-subtle flex flex-col gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {idx + 1}
                        </span>
                        <h3 className="font-bold text-sm text-on-surface">{concept.heading}</h3>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed pl-8">
                        {concept.detail}
                      </p>
                      {concept.bulletPoints.length > 0 && (
                        <div className="flex flex-col gap-1 pl-8 pt-1">
                          {concept.bulletPoints.map((bp, bIdx) => (
                            <div key={bIdx} className="flex items-start gap-2 text-xs text-on-surface">
                              <span className="text-primary font-bold shrink-0">•</span>
                              <span>{bp}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Key Terms & Definitions */}
              {activeTab === 'terms' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fadeIn">
                  {summaryResult.keyTerms.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-surface-container-low border border-subtle flex flex-col gap-1.5"
                    >
                      <span className="font-bold text-xs sm:text-sm text-primary flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">label</span>
                        <span>{item.term}</span>
                      </span>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {item.definition}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 4: Review Q&A Quiz Flashcards */}
              {activeTab === 'quiz' && (
                <div className="flex flex-col gap-3 animate-fadeIn">
                  <div className="text-xs text-on-surface-variant flex items-center gap-1.5 mb-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">psychology</span>
                    <span>ลองตอบคำถามในใจ แล้วคลิกเพื่อดูเฉลยและเหตุผลประกอบ</span>
                  </div>

                  {summaryResult.quizQuestions.map((quiz, idx) => {
                    const isRevealed = revealedQuizAnswers[idx];
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-surface-container-low border border-subtle flex flex-col gap-2.5 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                              Q{idx + 1}
                            </span>
                            <span className="font-bold text-xs sm:text-sm text-on-surface">
                              {quiz.question}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setRevealedQuizAnswers((prev) => ({
                                ...prev,
                                [idx]: !prev[idx],
                              }));
                              soundHelper.playChime('click', preferences.soundEnabled);
                            }}
                            className="px-3 py-1 rounded-xl bg-surface-container-high hover:bg-surface-container text-xs font-bold text-on-surface shrink-0 cursor-pointer transition-all active:scale-95"
                          >
                            {isRevealed ? 'ซ่อนเฉลย' : 'ดูเฉลย'}
                          </button>
                        </div>

                        {isRevealed && (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-950 dark:text-emerald-200 animate-fadeIn ml-8">
                            <strong className="text-emerald-700 dark:text-emerald-400">คำตอบ: </strong>
                            <span>{quiz.answer}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cross-Topic Knowledge Linkage & Synergy Section */}
            <div className="pt-5 border-t border-subtle flex flex-col gap-3.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">hub</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
                      <span>การเชื่อมโยงความรู้ &amp; สนับสนุนบทเรียนเดิม</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25">
                        AI Knowledge Synergy
                      </span>
                    </h3>
                    <p className="text-[11px] text-on-surface-variant">
                      AI ตรวจสอบความเกี่ยวข้องกับวิชาในแผนการเรียนและประวัติบทเรียนที่เคยบันทึกไว้
                    </p>
                  </div>
                </div>

                <span className="font-code-badge text-xs font-bold px-2.5 py-1 rounded-full bg-surface-container text-on-surface border border-subtle">
                  {summaryResult.relatedLinks && summaryResult.relatedLinks.length > 0
                    ? `พบ ${summaryResult.relatedLinks.length} จุดเชื่อมโยง`
                    : 'เนื้อหาเฉพาะเรื่อง'}
                </span>
              </div>

              {/* Connected Links Cards List */}
              {summaryResult.relatedLinks && summaryResult.relatedLinks.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {summaryResult.relatedLinks.map((link, lIdx) => {
                    const matchedPlan = plans.find(
                      (p) =>
                        p.title.toLowerCase().includes(link.targetTitle.toLowerCase()) ||
                        p.subjectName.toLowerCase().includes(link.targetTitle.toLowerCase()) ||
                        link.targetTitle.toLowerCase().includes(p.title.toLowerCase())
                    );

                    const isPrereq = link.relationshipType === 'prerequisite';
                    const isComplementary = link.relationshipType === 'complementary';
                    const isCrossDomain = link.relationshipType === 'cross_domain';

                    const relBadgeConfig = isPrereq
                      ? { label: '⚡ ความรู้พื้นฐาน / ต่อยอด', bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700/60' }
                      : isComplementary
                      ? { label: '🌿 เสริมความเข้าใจซึ่งกันและกัน', bg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700/60' }
                      : isCrossDomain
                      ? { label: '💡 ประยุกต์ข้ามวิชา / บูรณาการ', bg: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700/60' }
                      : { label: '📖 ทฤษฎี & หลักฐานสนับสนุน', bg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-950 dark:text-purple-200 border-purple-300 dark:border-purple-700/60' };

                    return (
                      <div
                        key={lIdx}
                        className="p-4 rounded-2xl bg-surface-container-low/80 border border-subtle flex flex-col gap-3 relative overflow-hidden transition-all hover:border-primary/50 shadow-2xs"
                      >
                        {/* Card Header: Target Title & Badges */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-subtle pb-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant border border-subtle flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">
                                {link.targetType === 'plan' ? 'assignment' : 'bookmark'}
                              </span>
                              <span>{link.targetType === 'plan' ? 'วิชาในแผนการเรียน' : 'บทเรียนที่เคยบันทึก'}</span>
                            </span>
                            <span className="material-symbols-outlined text-primary text-[16px]">sync_alt</span>
                            <span className="font-bold text-xs sm:text-sm text-on-surface">
                              {link.targetTitle}
                            </span>
                          </div>

                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${relBadgeConfig.bg} shrink-0`}>
                            {relBadgeConfig.label}
                          </span>
                        </div>

                        {/* Connection Summary */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-primary">link</span>
                            <span>เนื้อหาเกี่ยวข้องกันอย่างไร:</span>
                          </span>
                          <p className="text-xs text-on-surface leading-relaxed pl-5 font-medium">
                            {link.connectionSummary}
                          </p>
                        </div>

                        {/* How it Supports (Core User Request) */}
                        <div className="p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/25 flex flex-col gap-1">
                          <span className="text-[11px] font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-emerald-700 dark:text-emerald-400">auto_awesome</span>
                            <span>สนับสนุนและส่งเสริมบทเรียนเดิมอย่างไร:</span>
                          </span>
                          <p className="text-xs text-emerald-950 dark:text-emerald-100 leading-relaxed font-medium pl-5">
                            {link.howItSupports}
                          </p>
                        </div>

                        {/* Study Synergy Tip if provided */}
                        {link.studySynergyTip && (
                          <div className="flex items-start gap-2 text-xs text-amber-950 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/90 dark:border-amber-700/50">
                            <span className="material-symbols-outlined text-amber-800 dark:text-amber-400 text-[16px] shrink-0 mt-0.5">
                              lightbulb
                            </span>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-[11px] text-amber-900 dark:text-amber-300">
                                เคล็ดลับการอ่านควบคู่:
                              </span>
                              <p className="leading-relaxed">{link.studySynergyTip}</p>
                            </div>
                          </div>
                        )}

                        {/* Quick Jump Action if matched plan exists */}
                        {matchedPlan && onNavigateToPlan && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                onNavigateToPlan(matchedPlan.id);
                                soundHelper.playChime('click', preferences.soundEnabled);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary hover:text-primary-container text-xs font-bold transition-all flex items-center gap-1.5 border border-subtle cursor-pointer active:scale-95"
                            >
                              <span>เปิดดูแผนและตารางวิชา {matchedPlan.title || matchedPlan.subjectName}</span>
                              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-surface-container-low/60 border border-dashed border-subtle flex items-center gap-3 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary text-[22px] shrink-0">
                    scatter_plot
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-on-surface">บทเรียนนี้เป็นหัวข้อเฉพาะทางที่ยังไม่พบจุดทับซ้อนโดยตรง</span>
                    <p className="text-[11px] leading-relaxed">
                      เมื่อคุณเพิ่มวิชาในแผนการเรียนหรือสรุปบทเรียนเพิ่มเติม AI จะคอยเปรียบเทียบและดึงจุดเชื่อมโยงข้ามศาสตร์มาแสดงตรงนี้ให้อัตโนมัติ
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
