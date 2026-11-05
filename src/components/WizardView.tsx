import React, { useState, useRef } from 'react';
import { PlanItem, TaskType, UploadedFile, TopicItem, DailyScheduleDay, UserPreferences } from '../types';
import { soundHelper } from '../utils/soundHelper';

interface WizardViewProps {
  preferences: UserPreferences;
  onSavePlan: (newPlan: PlanItem) => void;
  onGoToDashboard: () => void;
  onGoToSchedule: (planId?: string) => void;
}

export const WizardView: React.FC<WizardViewProps> = ({
  preferences,
  onSavePlan,
  onGoToDashboard,
  onGoToSchedule,
}) => {
  // Wizard step: 1 (Setup & Initial Upload), 2 (Review Date/Summary & Deep Upload), 3 (Detailed Topics & Daily Timetable)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [taskType, setTaskType] = useState<TaskType>('exam');
  const [subjectName, setSubjectName] = useState<string>('');
  const [category, setCategory] = useState<string>('วิชาเอก');
  const [userNotes, setUserNotes] = useState<string>('');

  // Initial files for Step 1
  const [initialFiles, setInitialFiles] = useState<UploadedFile[]>([]);
  // Detailed files for Step 2
  const [detailedFiles, setDetailedFiles] = useState<UploadedFile[]>([]);
  const [dailyHours, setDailyHours] = useState<number>(2);

  // Loading & Progress
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStatusText, setScanStatusText] = useState<string>('พร้อมประมวลผล');

  // Real Extracted JSON from Image (date, subject, topics)
  const [extractedJson, setExtractedJson] = useState<{
    date: string;
    subject: string;
    topics: string[];
  } | null>(null);
  const [isExtractingImage, setIsExtractingImage] = useState<boolean>(false);
  const [extractingFileId, setExtractingFileId] = useState<string | null>(null);

  // Step 2 & 3 AI Output Data
  const [briefResult, setBriefResult] = useState<{
    title: string;
    detectedDate: string;
    daysRemaining: number;
    summary: string;
    keyHighlights: string[];
    recommendedPrepDays: number;
    confidence: string;
    suggestedDailyHours?: number;
    date?: string;
    subject?: string;
    topics?: string[];
  } | null>(null);

  const [deepResult, setDeepResult] = useState<{
    topics: TopicItem[];
    dailySchedule: DailyScheduleDay[];
    wellnessAdvice: string;
    cognitiveLoadScore: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const deepFileInputRef = useRef<HTMLInputElement>(null);

  // Category presets
  const categories = ['วิชาเอก', 'วิชาโท', 'วิชาเลือกเสรี', 'โปรเจกต์จบ', 'ศึกษาทั่วไป (GE)'];

  // Handle file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isDeep = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      const isImage = file.type.startsWith('image/');
      const sizeFormatted = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const newFile: UploadedFile = {
          id: 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          name: file.name,
          size: sizeFormatted,
          type: file.type || 'application/octet-stream',
          base64: base64,
          previewUrl: isImage ? base64 : undefined,
        };

        if (isDeep) {
          setDetailedFiles((prev) => [...prev, newFile]);
        } else {
          setInitialFiles((prev) => [...prev, newFile]);
          // If it's an image, auto-trigger extraction to immediately read date, subject, topics!
          if (isImage) {
            handleExtractFromImage(newFile);
          }
        }
      };
      reader.readAsDataURL(file);
    });
    soundHelper.playChime('click', preferences.soundEnabled);
  };

  // Dedicated handler to read image and extract JSON with keys: date, subject, topics
  const handleExtractFromImage = async (file: UploadedFile) => {
    setIsExtractingImage(true);
    setExtractingFileId(file.id);

    try {
      const res = await fetch('/api/ai/extract-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: file.base64,
          mimeType: file.type || 'image/jpeg',
          imageUrl: file.previewUrl,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setExtractedJson(json.data);
        soundHelper.playChime('complete', preferences.soundEnabled);
        soundHelper.speakThaiReminder('ocr_success', preferences.voiceStyle, preferences.voiceEnabled);
      }
    } catch (err) {
      console.error('Failed to extract image:', err);
    } finally {
      setIsExtractingImage(false);
      setExtractingFileId(null);
    }
  };

  const removeFile = (id: string, isDeep = false) => {
    if (isDeep) {
      setDetailedFiles((prev) => prev.filter((f) => f.id !== id));
    } else {
      setInitialFiles((prev) => prev.filter((f) => f.id !== id));
    }
  };

  // Step 1: Run Brief Analysis
  const handleStartBriefAnalysis = async () => {
    const effectiveSubject = subjectName.trim() || extractedJson?.subject || '';
    if (!effectiveSubject && initialFiles.length === 0) {
      alert('กรุณากรอกชื่อวิชาของคุณ หรืออัปโหลดไฟล์ภาพประกาศ/โจทย์ เพื่อให้ AI อ่านข้อมูล');
      return;
    }

    setIsAnalyzing(true);
    setScanProgress(15);
    setScanStatusText('กำลังตรวจจับไฟล์เอกสารและแยกแยะข้อมูลเสียง/ภาพ...');

    // Progress animation simulation
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 85) {
          clearInterval(interval);
          return 85;
        }
        return prev + 18;
      });
    }, 350);

    try {
      const res = await fetch('/api/ai/analyze-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: taskType,
          subjectName: effectiveSubject,
          extractedJson,
          category,
          files: initialFiles.map((f) => ({
            name: f.name,
            mimeType: f.type,
            base64: f.base64,
          })),
          userNotes,
        }),
      });

      const json = await res.json();
      clearInterval(interval);
      setScanProgress(100);
      setScanStatusText('วิเคราะห์ข้อมูลเสร็จสมบูรณ์!');

      setTimeout(() => {
        setIsAnalyzing(false);
        if (json.data) {
          setBriefResult(json.data);
          // Preserve real image OCR data (do not allow placeholders or empty strings to wipe it out)
          const validDate = (json.data.date && !json.data.date.includes('ไม่พบวันที่'))
            ? json.data.date
            : (extractedJson?.date || json.data.detectedDate || '');

          const validSubject = (json.data.subject && json.data.subject !== 'วิชาสำหรับการสอบ' && json.data.subject !== 'วิชาสำหรับการบ้าน')
            ? json.data.subject
            : (extractedJson?.subject || effectiveSubject || json.data.title || '');

          const validTopics = (Array.isArray(json.data.topics) && json.data.topics.length > 0)
            ? json.data.topics
            : (extractedJson?.topics || json.data.keyHighlights || []);

          setExtractedJson({
            date: validDate,
            subject: validSubject,
            topics: validTopics,
          });
        }
        setCurrentStep(2);
        soundHelper.playChime('complete', preferences.soundEnabled);
      }, 500);
    } catch (err) {
      console.error(err);
      clearInterval(interval);
      setIsAnalyzing(false);
      alert('เกิดข้อผิดพลาดในการวิเคราะห์ โปรดลองใหม่อีกครั้ง');
    }
  };

  // Step 2: Run Deep Breakdown & Timetable Creation
  const handleStartDeepAnalysis = async () => {
    setIsAnalyzing(true);
    setScanProgress(20);
    setScanStatusText('กำลังวิเคราะห์โครงสร้างเนื้อหาอย่างละเอียดและคำนวณช่วงเวลาพักผ่อน...');

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 400);

    try {
      const res = await fetch('/api/ai/analyze-deep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: taskType,
          subjectName,
          briefSummary: briefResult?.summary,
          targetDate: briefResult?.detectedDate,
          dailyHours,
          detailedFiles: detailedFiles.map((f) => ({
            name: f.name,
            mimeType: f.type,
            base64: f.base64,
          })),
        }),
      });

      const json = await res.json();
      clearInterval(interval);
      setScanProgress(100);
      setScanStatusText('สร้างตารางเวลาที่ถูกสุขภาวะสำเร็จ!');

      setTimeout(() => {
        setIsAnalyzing(false);
        setDeepResult(json.data);
        setCurrentStep(3);
        soundHelper.playChime('complete', preferences.soundEnabled);
        soundHelper.speakThaiReminder('congrats', preferences.voiceStyle, preferences.voiceEnabled);
      }, 500);
    } catch (err) {
      console.error(err);
      clearInterval(interval);
      setIsAnalyzing(false);
      alert('เกิดข้อผิดพลาดในการสร้างตารางเวลา โปรดลองใหม่อีกครั้ง');
    }
  };

  // Step 3: Save Plan
  const handleFinalSave = () => {
    if (!briefResult || !deepResult) return;

    const newPlan: PlanItem = {
      id: 'plan-' + Date.now(),
      type: taskType,
      subjectName: extractedJson?.subject || subjectName,
      category,
      title: extractedJson?.subject ? `${taskType === 'exam' ? 'สอบ' : 'การบ้าน'}: ${extractedJson.subject}` : briefResult.title,
      detectedDate: extractedJson?.date || briefResult.detectedDate,
      daysRemaining: briefResult.daysRemaining || (taskType === 'exam' ? 14 : 7),
      summary: briefResult.summary,
      keyHighlights: extractedJson?.topics && extractedJson.topics.length > 0 ? extractedJson.topics : (briefResult.keyHighlights || []),
      recommendedPrepDays: briefResult.recommendedPrepDays || 7,
      suggestedDailyHours: dailyHours,
      initialFiles,
      detailedFiles,
      topics: deepResult.topics || [],
      dailySchedule: deepResult.dailySchedule || [],
      wellnessAdvice: deepResult.wellnessAdvice || 'รักษาสมดุลสุขภาพสายตาและการนอนหลับให้เพียงพอเสมอ',
      cognitiveLoadScore: deepResult.cognitiveLoadScore || 'สมดุลดีเยี่ยม (Optimal)',
      createdAt: new Date().toISOString(),
    };

    onSavePlan(newPlan);
    soundHelper.playChime('complete', preferences.soundEnabled);
    soundHelper.speakThaiReminder('congrats', preferences.voiceStyle, preferences.voiceEnabled);
    onGoToSchedule(newPlan.id);
  };

  return (
    <div className="w-full py-6 flex flex-col gap-6 animate-fadeIn">
      {/* Step Tracker Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-subtle">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-primary">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-fixed text-on-primary-fixed font-code-badge font-bold text-xs">
              {currentStep}
            </span>
            <span className="font-label-lg tracking-wide text-xs md:text-sm">
              ขั้นตอนที่ {currentStep} จาก 3: {currentStep === 1 ? 'ข้อมูลวิชา & ไฟล์ต้นฉบับ' : currentStep === 2 ? 'สรุปผลเบื้องต้น & เพิ่มไฟล์เนื้อหา' : 'ตารางอ่าน/ทำการบ้านเพื่อสุขภาพ'}
            </span>
          </div>
          <h1 className="font-headline-lg text-xl md:text-2xl font-bold text-on-surface">
            {currentStep === 1 && 'เริ่มต้นสร้างแผนการเรียนอัจฉริยะ'}
            {currentStep === 2 && 'ตรวจสอบวันสอบ/กำหนดส่ง และเพิ่มเนื้อหาเชิงลึก'}
            {currentStep === 3 && 'ตารางแบ่งเวลาเรียน/การบ้านเพื่อสุขภาพที่สมบูรณ์'}
          </h1>
          <p className="font-body-md text-xs md:text-sm text-on-surface-variant">
            {currentStep === 1 && 'เลือกประเภท ตั้งชื่อวิชา แล้วให้ AI สแกนหาวันสอบหรือกำหนดส่งจากภาพ วิดีโอ หรือเสียง'}
            {currentStep === 2 && 'AI พบกำหนดการสำคัญแล้ว เพิ่มสไลด์หรือชีทเรียนเพื่อให้ AI แตกหัวข้อย่อยและจัดเวลา'}
            {currentStep === 3 && 'วางแผนการเตรียมตัวกระจายตามวันอย่างผ่อนคลาย ไม่ต้องโต้รุ่ง สุขภาพไม่พัง'}
          </p>
        </div>

        {/* Step Indicator Pills */}
        <div className="flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-full self-start md:self-auto border border-subtle">
          <div className="flex items-center gap-1.5">
            <span
              onClick={() => setCurrentStep(1)}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${
                currentStep >= 1 ? 'bg-primary text-white shadow-xs' : 'bg-surface-container text-on-surface-variant'
              }`}
            >
              1
            </span>
            <div className={`w-4 h-0.5 ${currentStep >= 2 ? 'bg-primary' : 'bg-surface-container-highest'}`} />
            <span
              onClick={() => briefResult && setCurrentStep(2)}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep >= 2
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-container text-on-surface-variant cursor-not-allowed opacity-60'
              }`}
            >
              2
            </span>
            <div className={`w-4 h-0.5 ${currentStep >= 3 ? 'bg-primary' : 'bg-surface-container-highest'}`} />
            <span
              onClick={() => deepResult && setCurrentStep(3)}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep >= 3
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-container text-on-surface-variant cursor-not-allowed opacity-60'
              }`}
            >
              3
            </span>
          </div>
          <span className="font-label-sm text-xs text-on-surface ml-1 hidden sm:inline">
            {currentStep === 1 ? 'ตั้งค่า & อัปโหลด' : currentStep === 2 ? 'สรุป & เสริมเนื้อหา' : 'ตารางเพื่อสุขภาวะ'}
          </span>
        </div>
      </div>

      {/* ================= STEP 1: Type Selection, Subject Name, Initial File Upload ================= */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (5 Cols): Task Type Selection + Course Form */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Core Requirement: Type Selector (Exam vs Homework) */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-subtle flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-headline-sm text-sm md:text-base font-semibold text-on-surface">
                  เลือกประเภทสิ่งที่ต้องการเพิ่ม
                </span>
                <span className="font-code-badge bg-primary-fixed/40 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
                  ขั้นตอนสำคัญ
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Button: หัวข้อสอบ */}
                <button
                  type="button"
                  onClick={() => {
                    setTaskType('exam');
                    soundHelper.playChime('click');
                  }}
                  className={`p-4 rounded-xl text-left border-2 transition-all flex flex-col gap-2 cursor-pointer ${
                    taskType === 'exam'
                      ? 'border-primary bg-primary-fixed/15 shadow-sm ring-2 ring-primary/20'
                      : 'border-subtle bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-primary-fixed text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">assignment</span>
                    </span>
                    {taskType === 'exam' && (
                      <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-label-lg font-bold block text-sm text-on-surface">
                      หัวข้อสอบ (Exam)
                    </span>
                    <span className="font-body-sm text-xs text-on-surface-variant leading-relaxed block mt-0.5">
                      หาวันสอบ สัดส่วนคะแนน และขอบเขตบทเรียน
                    </span>
                  </div>
                </button>

                {/* Button: หัวข้อการบ้าน */}
                <button
                  type="button"
                  onClick={() => {
                    setTaskType('homework');
                    soundHelper.playChime('click');
                  }}
                  className={`p-4 rounded-xl text-left border-2 transition-all flex flex-col gap-2 cursor-pointer ${
                    taskType === 'homework'
                      ? 'border-secondary bg-secondary-fixed/20 shadow-sm ring-2 ring-secondary/20'
                      : 'border-subtle bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-secondary-fixed text-secondary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">menu_book</span>
                    </span>
                    {taskType === 'homework' && (
                      <span className="w-5 h-5 rounded-full bg-secondary text-white flex items-center justify-center text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-label-lg font-bold block text-sm text-on-surface">
                      หัวข้อการบ้าน (Homework)
                    </span>
                    <span className="font-body-sm text-xs text-on-surface-variant leading-relaxed block mt-0.5">
                      หากำหนดส่ง (Deadline) เกณฑ์ และข้อกำหนด
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Subject Setup Card */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-subtle flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary-fixed text-secondary">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </span>
                <label className="font-headline-sm text-sm md:text-base font-semibold text-on-surface" htmlFor="course-input">
                  ตั้งชื่อวิชาของคุณ
                </label>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="relative">
                  <input
                    id="course-input"
                    type="text"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="พิมพ์ชื่อวิชา เช่น แคลคูลัส 2, การตลาดดิจิทัล, เคมีอินทรีย์"
                    className="w-full bg-surface-container-low text-on-surface font-body-md text-sm px-4 py-3 rounded-xl border border-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-lowest transition-all pr-10"
                  />
                  {subjectName && (
                    <button
                      type="button"
                      onClick={() => setSubjectName('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error transition-colors p-1"
                      title="ล้างข้อความ"
                    >
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                    </button>
                  )}
                </div>
                <span className="font-label-sm text-xs text-on-surface-variant">
                  ระบุชื่อวิชาหรือรหัสวิชาเพื่อให้ AI จัดการโฟลเดอร์และสร้างตารางได้อย่างแม่นยำ
                </span>
              </div>

              {/* Category Selector Chips */}
              <div className="flex flex-col gap-2 pt-1">
                <span className="font-label-md text-xs font-semibold text-on-surface-variant">
                  หมวดหมู่วิชา
                </span>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategory(cat);
                        soundHelper.playChime('click');
                      }}
                      className={`px-3.5 py-1.5 rounded-full font-label-md text-xs transition-all cursor-pointer ${
                        category === cat
                          ? 'bg-primary-fixed text-on-primary-fixed font-semibold shadow-xs ring-1 ring-primary/30'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-subtle'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Notes from class */}
              <div className="flex flex-col gap-1.5 pt-1">
                <label className="font-label-md text-xs font-semibold text-on-surface-variant">
                  หมายเหตุเพิ่มเติม (ถ้ามี)
                </label>
                <textarea
                  rows={2}
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="เช่น อาจารย์เน้นบทที่ 4 เป็นพิเศษ หรือต้องส่งไฟล์ผ่านระบบก่อนเที่ยงคืน"
                  className="w-full bg-surface-container-low text-on-surface font-body-sm text-xs px-3.5 py-2.5 rounded-xl border border-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
                />
              </div>
            </div>

            {/* Smart Syllabus Digest Companion Card (From original HTML) */}
            <div className="relative overflow-hidden bg-gradient-to-br from-secondary-fixed via-surface-container-low to-primary-fixed/20 p-6 rounded-2xl shadow-sm border border-subtle flex flex-col justify-between min-h-[190px]">
              <div className="flex items-start justify-between z-10">
                <div className="flex flex-col gap-1">
                  <span className="font-label-md text-xs uppercase tracking-wider text-secondary font-bold">
                    Smart Syllabus Digest
                  </span>
                  <span className="font-headline-sm text-sm md:text-base font-bold text-on-surface max-w-[220px]">
                    {taskType === 'exam' ? 'อ่านสรุปครบ ไม่พลาดสักคะแนนสอบ' : 'ส่งงานครบตรงเวลา ไร้กังวลเรื่องเดดไลน์'}
                  </span>
                </div>
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-lowest/80 backdrop-blur-md text-primary shadow-xs">
                  <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
                </span>
              </div>
              <div className="flex items-center gap-3.5 z-10 pt-4">
                <img
                  className="w-14 h-14 rounded-xl object-cover shadow-sm ring-1 ring-white/50"
                  alt="Student studying with calm balance"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzjQQhoA06kDEBjCjyBygcA6AaU3jEMrseI0cO8jjNqmpbA1IJ84GZDJnU6uLant9bxSoA3OY3yEb5KxnWjsswUSeKYU_1rHqM5UBGLZZ8p5dtpTClkGtjQc7ab1Fz8VVjxUKjx5tvolJcfFY5HaQnt-fVoyzx3urRt7P203JqMmcwU260oBrEkLMcdl-GmsJGmPWQRc0AbPQs0Hubae3DY4wabYPqW6wk5dbPfBPHs0YHFAnlwXZ2mA"
                />
                <div className="flex flex-col">
                  <span className="font-label-md text-xs md:text-sm text-on-surface font-semibold">
                    หมดห่วงเรื่องอ่านข้ามสไลด์
                  </span>
                  <span className="font-body-sm text-xs text-on-surface-variant">
                    AI แยกวันสอบ สัดส่วนคะแนน และงานกลุ่มให้อัตโนมัติ
                  </span>
                </div>
              </div>
            </div>

            {/* Privacy & Wellness Guarantee Card */}
            <div className="bg-surface-container-low p-4 rounded-xl flex items-start gap-2.5 text-on-surface-variant border border-subtle">
              <span className="material-symbols-outlined text-tertiary-container text-[20px] shrink-0 mt-0.5">
                verified_user
              </span>
              <p className="font-body-sm text-xs leading-relaxed">
                🔒 ข้อมูลการเรียนของคุณปลอดภัย 100% และ AI จะแนะนำเวลาพักผ่อนเพื่อสุขภาพสายตาของคุณเสมอ
              </p>
            </div>
          </div>

          {/* Right Column (7 Cols): File Upload & Scanner Dropzone */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-subtle flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-headline-sm text-base md:text-lg font-bold text-on-surface">
                    ส่งไฟล์ให้ AI วิเคราะห์หาวันที่และสรุปเนื้อหา
                  </label>
                  <span className="font-code-badge text-primary bg-primary-fixed/40 px-2.5 py-1 rounded-full font-semibold">
                    Multi-modal v2
                  </span>
                </div>
                <p className="font-body-sm text-xs md:text-sm text-on-surface-variant">
                  {taskType === 'exam'
                    ? 'รองรับไฟล์ภาพใบประกาศสอบ, สไลด์เกณฑ์การสอบ หรือคลิปเสียงที่อาจารย์ชี้แจงท้ายคาบ'
                    : 'รองรับไฟล์โจทย์การบ้าน, ภาพสไลด์สั่งงาน, ใบงานอาจารย์ หรือคลิปเสียงอัดสั่งงาน'}
                </p>
              </div>

              {/* Supported Media Types Badges */}
              <div className="flex flex-wrap items-center gap-2 text-on-surface-variant">
                <span className="inline-flex items-center gap-1 font-code-badge bg-surface-container px-2.5 py-1 rounded-lg border border-subtle text-xs">
                  <span className="material-symbols-outlined text-[14px]">image</span> .jpg, .png
                </span>
                <span className="inline-flex items-center gap-1 font-code-badge bg-surface-container px-2.5 py-1 rounded-lg border border-subtle text-xs">
                  <span className="material-symbols-outlined text-[14px]">movie</span> .mp4, .mov, .webm
                </span>
                <span className="inline-flex items-center gap-1 font-code-badge bg-surface-container px-2.5 py-1 rounded-lg border border-subtle text-xs">
                  <span className="material-symbols-outlined text-[14px]">mic</span> .mp3, .m4a, voice
                </span>
                <span className="inline-flex items-center gap-1 font-code-badge bg-surface-container px-2.5 py-1 rounded-lg border border-subtle text-xs">
                  <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span> .pdf, docx
                </span>
              </div>

              {/* Interactive Dropzone Box */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,audio/*,video/*,application/pdf"
                className="hidden"
                onChange={(e) => handleFileUpload(e, false)}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="group cursor-pointer rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all p-8 flex flex-col items-center justify-center text-center gap-3 relative border-2 border-dashed border-subtle hover:border-primary/50"
              >
                <div className="w-16 h-16 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary group-hover:scale-105 transition-transform shadow-xs border border-subtle">
                  <span className="material-symbols-outlined text-[32px]">cloud_upload</span>
                </div>
                <div className="flex flex-col gap-1 z-10">
                  <span className="font-headline-sm text-sm md:text-base font-bold text-on-surface">
                    📤 ลากไฟล์มาวางที่นี่ หรือ คลิกเพื่ออัปโหลด
                  </span>
                  <span className="font-body-sm text-xs text-on-surface-variant">
                    ลากได้หลายไฟล์พร้อมกัน ทั้งภาพใบประกาศ เสียงอัด หรือวิดีโอ
                  </span>
                </div>
                <button
                  type="button"
                  className="mt-1 px-5 py-2 rounded-full bg-surface-container-lowest font-label-md text-xs font-semibold text-primary shadow-xs hover:shadow transition-shadow border border-subtle cursor-pointer"
                >
                  เลือกไฟล์จากเครื่อง
                </button>
              </div>

              {/* Uploaded File List */}
              <div className="flex flex-col gap-2 pt-1">
                <span className="font-label-md text-xs font-semibold text-on-surface-variant">
                  ไฟล์ที่เตรียมพร้อมประมวลผล ({initialFiles.length} รายการ)
                </span>

                {initialFiles.length === 0 ? (
                  <div className="p-4 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-xl border border-subtle">
                    ยังไม่มีไฟล์ที่เลือก (สามารถทดลองกดปุ่มด้านล่างได้ทันที)
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {initialFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors border border-subtle"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {file.previewUrl ? (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-surface-container-highest border border-subtle">
                              <img
                                alt={file.name}
                                src={file.previewUrl}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-0 inset-x-0 bg-black/60 flex items-center justify-center">
                                <span className="font-code-badge text-[9px] text-white">IMG</span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
                              <span className="material-symbols-outlined text-[22px]">
                                {file.type.includes('audio') ? 'graphic_eq' : file.type.includes('video') ? 'videocam' : 'description'}
                              </span>
                            </div>
                          )}

                          <div className="flex flex-col min-w-0">
                            <span className="font-label-md text-xs md:text-sm text-on-surface font-semibold truncate">
                              {file.name}
                            </span>
                            <span className="font-code-badge text-xs text-on-surface-variant">
                              {file.size} • {file.type.includes('image') ? 'ภาพประกาศ' : file.type.includes('audio') ? 'เสียงอัดท้ายคาบ' : 'เอกสาร'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* If image, provide instant OCR extract button */}
                          {(file.type.includes('image') || file.name.match(/\.(jpg|jpeg|png|webp)/i)) && (
                            <button
                              type="button"
                              disabled={isExtractingImage && extractingFileId === file.id}
                              onClick={() => handleExtractFromImage(file)}
                              className="px-3 py-1 rounded-full bg-secondary-fixed text-secondary hover:bg-secondary hover:text-white font-label-sm text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 border border-secondary/30"
                              title="ให้ AI อ่านข้อความจริงในภาพนี้ (ดึง date, subject, topics)"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {isExtractingImage && extractingFileId === file.id ? 'progress_activity' : 'document_scanner'}
                              </span>
                              <span>
                                {isExtractingImage && extractingFileId === file.id ? 'กำลังสแกน...' : 'อ่านข้อมูลภาพนี้'}
                              </span>
                            </button>
                          )}

                          <span className="inline-flex items-center gap-1.5 bg-primary-fixed text-on-primary-fixed font-label-sm text-xs px-2.5 py-1 rounded-full font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                            พร้อมวิเคราะห์
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile(file.id, false)}
                            className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-lg cursor-pointer"
                            title="ลบไฟล์นี้"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Real Extracted JSON Display Card */}
              {extractedJson && (
                <div className="p-4 rounded-2xl bg-primary-fixed/20 border border-primary/40 flex flex-col gap-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span>ข้อมูลจริงที่ AI สกัดจากภาพ (JSON Data)</span>
                    </div>
                    <span className="text-[11px] font-code-badge bg-primary text-white px-2.5 py-0.5 rounded-full font-semibold">
                      date • subject • topics
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-subtle flex flex-col">
                      <span className="text-on-surface-variant text-[11px] font-medium">📅 date (วันที่):</span>
                      <span className="font-bold text-primary text-xs mt-0.5">{extractedJson.date || 'ไม่พบในภาพ'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-subtle flex flex-col">
                      <span className="text-on-surface-variant text-[11px] font-medium">📚 subject (ชื่อวิชา):</span>
                      <span className="font-bold text-on-surface text-xs mt-0.5">{extractedJson.subject || 'ไม่พบในภาพ'}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-subtle flex flex-col gap-1.5">
                    <span className="text-on-surface-variant text-[11px] font-medium">
                      📝 topics (หัวข้อหรือรายละเอียดที่ต้องสอบ) ({extractedJson.topics?.length || 0} หัวข้อ):
                    </span>
                    <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                      {extractedJson.topics?.map((top, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs text-on-surface">
                          <span className="text-primary font-bold">•</span>
                          <span>{top}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Formatted JSON Inspector */}
                  <details className="text-xs">
                    <summary className="cursor-pointer text-[11px] text-on-surface-variant hover:text-primary font-code-badge select-none">
                      คลิกดูโค้ด JSON ที่ได้จากภาพ (Raw JSON Response)
                    </summary>
                    <pre className="mt-1.5 p-3 rounded-xl bg-surface-container-lowest font-code-badge text-[11px] overflow-x-auto text-primary border border-subtle">
                      {JSON.stringify(extractedJson, null, 2)}
                    </pre>
                  </details>
                </div>
              )}

              {/* Real-time Analysis Progress / Simulation Bar */}
              {isAnalyzing && (
                <div className="bg-surface-container p-4 rounded-xl flex flex-col gap-2 border border-subtle animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-on-surface">
                      <span className="material-symbols-outlined text-primary text-[20px] animate-spin">
                        progress_activity
                      </span>
                      <span className="font-label-md text-xs md:text-sm font-semibold">
                        {scanStatusText}
                      </span>
                    </div>
                    <span className="font-code-badge font-bold text-primary text-sm">
                      {scanProgress}%
                    </span>
                  </div>

                  <div className="w-full bg-surface-container-highest h-2.5 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-primary via-primary-container to-secondary rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-on-surface-variant font-code-badge text-xs pt-0.5">
                    <span>
                      {taskType === 'exam'
                        ? 'กำลังค้นหาวันสอบกลางภาค/ปลายภาค และหัวข้อสอบ'
                        : 'กำลังค้นหากำหนดส่งการบ้าน และเกณฑ์การให้คะแนน'}
                    </span>
                    <span className="text-primary font-medium">Gemini 3.8 Flash Vision</span>
                  </div>
                </div>
              )}

              {/* Action Buttons Area */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={onGoToDashboard}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full text-on-surface-variant hover:text-on-surface font-label-md text-xs md:text-sm flex items-center justify-center gap-1.5 transition-colors border border-subtle cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  ย้อนกลับไปหน้าแรก
                </button>

                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={handleStartBriefAnalysis}
                  className="w-full sm:w-auto px-9 py-4 rounded-full bg-gradient-to-r from-[#005237] via-[#006c49] to-[#047857] hover:from-[#003e29] hover:to-[#065f46] dark:from-[#10b981] dark:via-[#34d399] dark:to-[#6ffbbe] text-white dark:text-slate-950 font-label-lg text-sm md:text-base font-extrabold shadow-xl shadow-emerald-950/30 dark:shadow-emerald-400/35 border-2 border-emerald-400/50 dark:border-white hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 ring-4 ring-emerald-500/20 dark:ring-emerald-400/30"
                >
                  <span className="material-symbols-outlined text-[22px] text-amber-300 dark:text-slate-900 font-bold animate-pulse">bolt</span>
                  <span className="tracking-wide">{isAnalyzing ? 'กำลังประมวลผล...' : 'ให้ AI เริ่มวิเคราะห์ข้อมูล'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 2: Review Date/Summary & Deep Content Upload ================= */}
      {currentStep === 2 && briefResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Left Column (5 Cols): Review Detected Date & Summary */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Detected Date Highlight Card */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-subtle flex flex-col gap-4">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px]">event_available</span>
                <span>ผลการตรวจจับจาก AI</span>
              </div>

              <div className="p-4 rounded-xl bg-primary-fixed/20 border border-primary/30 flex flex-col gap-1.5">
                <span className="text-xs text-on-surface-variant">
                  {taskType === 'exam' ? '📅 วันที่สอบที่ตรวจพบ:' : '⏰ กำหนดส่งงาน (Deadline):'}
                </span>
                <span className="text-lg md:text-xl font-bold text-primary font-headline-sm">
                  {extractedJson?.date || briefResult?.detectedDate || 'ไม่พบข้อมูลวันที่'}
                </span>
                <span className="font-code-badge text-xs text-on-surface-variant">
                  ⏳ เหลือเวลาอีกประมาณ {briefResult.daysRemaining} วัน • {briefResult.confidence}
                </span>
              </div>

              {/* Title & Scope */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-on-surface-variant">ชื่อวิชา / หัวข้อ:</span>
                <input
                  type="text"
                  value={subjectName || briefResult?.title || extractedJson?.subject || 'ไม่ระบุชื่อวิชา'}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSubjectName(val);
                    setBriefResult({ ...briefResult, title: val });
                    if (extractedJson) {
                      setExtractedJson({ ...extractedJson, subject: val });
                    }
                  }}
                  className="bg-surface-container-low text-on-surface font-semibold text-sm px-3.5 py-2.5 rounded-xl border border-subtle focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-on-surface-variant">
                  {taskType === 'exam' ? 'สรุปขอบเขตการสอบ:' : 'สรุปรายละเอียดการบ้าน:'}
                </span>
                <textarea
                  rows={4}
                  value={briefResult.summary}
                  onChange={(e) => setBriefResult({ ...briefResult, summary: e.target.value })}
                  className="bg-surface-container-low text-on-surface text-xs md:text-sm px-3.5 py-2.5 rounded-xl border border-subtle focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Extracted Image Real Data Preview */}
              {extractedJson && (
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-primary/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">image_search</span>
                      ข้อมูลจริงจากภาพ (JSON Data จากรูปภาพ)
                    </span>
                    <span className="font-code-badge text-[10px] bg-primary-fixed text-primary px-2 py-0.5 rounded-full font-bold">
                      ดึงจากภาพจริง 100%
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-on-surface-variant font-medium">date:</span>
                      <span className="font-bold text-primary">{extractedJson.date}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-on-surface-variant font-medium">subject:</span>
                      <span className="font-bold text-on-surface">{extractedJson.subject}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      <span className="text-on-surface-variant font-medium">
                        topics ({extractedJson.topics?.length || 0} หัวข้อที่ต้องสอบ):
                      </span>
                      <div className="flex flex-col gap-1 pl-2 max-h-28 overflow-y-auto">
                        {extractedJson.topics?.map((top, idx) => (
                          <div key={idx} className="flex items-start gap-1 text-[11px] text-on-surface">
                            <span className="text-secondary font-bold">•</span>
                            <span>{top}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Topics / Key Highlights List from Extracted Data */}
              {(() => {
                const topicItems: string[] = (extractedJson?.topics && extractedJson.topics.length > 0)
                  ? extractedJson.topics
                  : (briefResult.keyHighlights && briefResult.keyHighlights.length > 0)
                  ? briefResult.keyHighlights
                  : [];

                return (
                  <div className="flex flex-col gap-2 pt-1">
                    <span className="text-xs font-semibold text-on-surface-variant">
                      หัวข้อหรือรายละเอียดที่ตรวจพบจากภาพ ({topicItems.length} ข้อ):
                    </span>
                    {topicItems.length === 0 ? (
                      <p className="text-xs text-on-surface-variant bg-surface-container-low p-2.5 rounded-lg border border-subtle">
                        ไม่พบหัวข้อย่อยในภาพ
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {topicItems.map((hl, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-on-surface bg-surface-container-low p-2.5 rounded-lg border border-subtle">
                            <span className="text-primary font-bold shrink-0 mt-0.5">✓</span>
                            <span>{hl}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 text-xs text-on-surface-variant hover:text-on-surface flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              ย้อนกลับไปแก้ไขข้อมูลเบื้องต้น
            </button>
          </div>

          {/* Right Column (7 Cols): Upload Detailed Study Content & Preference */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-subtle flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-headline-sm text-base md:text-lg font-bold text-on-surface">
                    {taskType === 'exam'
                      ? 'ส่งไฟล์สไลด์/ชีทเรียนเพิ่มเติม เพื่อแตกหัวข้อย่อยและจัดตารางอ่าน'
                      : 'ส่งไฟล์รายละเอียดงาน/โจทย์/คู่มือ เพื่อจัดเวลาแบ่งทำการบ้าน'}
                  </label>
                  <span className="font-code-badge text-secondary bg-secondary-fixed/40 px-2.5 py-1 rounded-full font-semibold">
                    Deep Cognitive Plan
                  </span>
                </div>
                <p className="font-body-sm text-xs md:text-sm text-on-surface-variant">
                  AI จะอ่านเนื้อหาอย่างละเอียด เพื่อแตกหัวข้อย่อย ประเมินความยาก และจัดตารางเวลาต่อวันพร้อมเวลาพักสายตา
                </p>
              </div>

              {/* Daily Study Time Slider / Radio */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-subtle flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm font-semibold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-primary">timelapse</span>
                    เวลาที่คุณสะดวกอ่านหนังสือหรือทำการบ้านต่อวัน:
                  </span>
                  <span className="font-code-badge text-primary font-bold text-sm bg-primary-fixed/40 px-2.5 py-0.5 rounded-full">
                    {dailyHours} ชั่วโมง / วัน
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 1.5, 2, 2.5, 3].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setDailyHours(hrs)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        dailyHours === hrs
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {hrs} ชม.
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-on-surface-variant">
                  💡 ระบบจะแบ่งเป็นบล็อกอ่าน 40-45 นาที และสลับด้วยเวลาพักสายตา 10-15 นาทีตามหลักสุขภาวะที่ดี
                </span>
              </div>

              {/* Upload Dropzone for Deep Materials */}
              <input
                ref={deepFileInputRef}
                type="file"
                multiple
                accept="application/pdf,image/*,audio/*,text/plain"
                className="hidden"
                onChange={(e) => handleFileUpload(e, true)}
              />

              <div
                onClick={() => deepFileInputRef.current?.click()}
                className="group cursor-pointer rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all p-6 flex flex-col items-center justify-center text-center gap-2.5 border-2 border-dashed border-subtle hover:border-secondary/50"
              >
                <div className="w-12 h-12 rounded-full bg-surface-container-lowest flex items-center justify-center text-secondary shadow-xs">
                  <span className="material-symbols-outlined text-[26px]">library_books</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-headline-sm text-sm font-bold text-on-surface">
                    อัปโหลดสไลด์บทเรียน, เอกสารสรุป, ชีท หรือไฟล์เสียงบรรยาย
                  </span>
                  <span className="font-body-sm text-xs text-on-surface-variant">
                    รองรับไฟล์ PDF, สไลด์ภาพ, หรือบันทึกข้อความ (หากไม่มี สามารถกดข้ามเพื่อให้ AI จัดตารางมาตรฐานได้ทันที)
                  </span>
                </div>
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-full bg-surface-container-lowest font-label-md text-xs font-semibold text-secondary shadow-xs border border-subtle cursor-pointer"
                >
                  เลือกไฟล์สไลด์/ชีท
                </button>
              </div>

              {/* Detailed Files List */}
              {detailedFiles.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="font-label-md text-xs font-semibold text-on-surface-variant">
                    ไฟล์เนื้อหาที่เพิ่มเข้ามา ({detailedFiles.length} รายการ):
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {detailedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-subtle"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="material-symbols-outlined text-secondary text-[20px]">description</span>
                          <span className="font-label-md text-xs text-on-surface truncate">
                            {file.name}
                          </span>
                          <span className="font-code-badge text-[11px] text-on-surface-variant">
                            {file.size}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id, true)}
                          className="text-on-surface-variant hover:text-error p-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deep Analysis Progress Simulation */}
              {isAnalyzing && (
                <div className="bg-surface-container p-4 rounded-xl flex flex-col gap-2 border border-subtle animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-on-surface">
                      <span className="material-symbols-outlined text-secondary text-[20px] animate-spin">
                        psychology
                      </span>
                      <span className="font-label-md text-xs md:text-sm font-semibold">
                        {scanStatusText}
                      </span>
                    </div>
                    <span className="font-code-badge font-bold text-secondary text-sm">
                      {scanProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-secondary via-primary-container to-primary rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Button for Step 2 */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full text-on-surface-variant hover:text-on-surface font-label-md text-xs md:text-sm flex items-center justify-center gap-1.5 border border-subtle cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  ย้อนกลับ
                </button>

                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={handleStartDeepAnalysis}
                  className="w-full sm:w-auto px-9 py-4 rounded-full bg-gradient-to-r from-[#2e31b8] via-[#4648d4] to-[#6063ee] hover:from-[#23259e] hover:to-[#4648d4] dark:from-[#a5b4fc] dark:via-[#818cf8] dark:to-[#6366f1] text-white dark:text-slate-950 font-label-lg text-sm md:text-base font-extrabold shadow-xl shadow-indigo-950/30 dark:shadow-indigo-400/35 border-2 border-indigo-300/50 dark:border-white hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 ring-4 ring-indigo-500/20 dark:ring-indigo-400/30"
                >
                  <span className="material-symbols-outlined text-[22px] text-amber-300 dark:text-slate-900 font-bold animate-pulse">auto_awesome</span>
                  <span className="tracking-wide">
                    {isAnalyzing
                      ? 'กำลังจัดตารางเวลา...'
                      : 'ให้ AI แตกหัวข้อย่อยและจัดตารางเวลาเพื่อสุขภาพ'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 3: Detailed Topic Breakdown & Daily Schedule ================= */}
      {currentStep === 3 && deepResult && briefResult && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Cognitive Balance Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-primary-fixed/30 via-surface-container to-secondary-fixed/30 border border-primary/30 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-white shadow-xs">
                <span className="material-symbols-outlined text-[26px]">spa</span>
              </span>
              <div className="flex flex-col">
                <span className="font-headline-sm text-sm md:text-base font-bold text-on-surface">
                  {deepResult.cognitiveLoadScore}
                </span>
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                  {deepResult.wellnessAdvice}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinalSave}
              className="w-full md:w-auto px-6 py-3 rounded-full bg-primary text-white font-label-lg text-sm font-semibold shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">save</span>
              <span>บันทึกแผนและเริ่มใช้งานทันที</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (5 Cols): Detailed Topics Breakdown */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-subtle flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-headline-sm text-sm md:text-base font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">checklist</span>
                    หัวข้อย่อยอย่างละเอียด ({deepResult.topics.length} หัวข้อ)
                  </span>
                  <span className="text-xs text-on-surface-variant font-code-badge">
                    ประมาณ {deepResult.topics.reduce((acc, t) => acc + t.estimatedMinutes, 0)} นาทีรวม
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {deepResult.topics.map((topic, idx) => (
                    <div
                      key={topic.id || idx}
                      className="p-4 rounded-xl bg-surface-container-low border border-subtle flex flex-col gap-2 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-label-md text-xs md:text-sm font-bold text-on-surface">
                          {topic.title}
                        </span>
                        <span
                          className={`font-code-badge text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
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

                      {/* Subtopics */}
                      <div className="flex flex-col gap-1 pl-1">
                        {topic.subtopics.map((sub, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                            <span>{sub}</span>
                          </div>
                        ))}
                      </div>

                      {/* Recommended Technique */}
                      <div className="flex items-center gap-1.5 text-[11px] text-primary bg-primary-fixed/20 px-2.5 py-1 rounded-lg mt-1 font-medium">
                        <span className="material-symbols-outlined text-[14px]">tips_and_updates</span>
                        <span>เทคนิคแนะนำ: {topic.technique}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (7 Cols): Daily Schedule with Wellness Breaks */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-subtle flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">calendar_month</span>
                    ตารางเวลาต่อวันแบ่งตามหลักสุขภาวะ ({deepResult.dailySchedule.length} วัน)
                  </span>
                  <span className="font-code-badge text-xs text-primary bg-primary-fixed/40 px-2.5 py-1 rounded-full">
                    วันละ ~{dailyHours} ชม.
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  {deepResult.dailySchedule.map((day) => (
                    <div
                      key={day.dayNumber}
                      className="p-4 rounded-xl bg-surface-container-low border border-subtle flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between border-b border-subtle pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-secondary text-white font-code-badge text-xs flex items-center justify-center font-bold">
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

                      {/* Time blocks within the day */}
                      <div className="flex flex-col gap-2">
                        {day.blocks.map((block, bIdx) => (
                          <div
                            key={bIdx}
                            className={`p-2.5 rounded-lg flex items-start justify-between gap-3 text-xs ${
                              block.type === 'break'
                                ? 'bg-tertiary-container/10 border border-tertiary-container/30 text-on-surface'
                                : block.type === 'review'
                                ? 'bg-secondary-fixed/20 border border-secondary/20 text-on-surface'
                                : 'bg-surface-container-lowest border border-subtle text-on-surface'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <span className="font-code-badge font-semibold text-xs text-primary shrink-0 mt-0.5">
                                {block.timeSlot}
                              </span>
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold">{block.title}</span>
                                {block.wellnessTip && (
                                  <span className="text-[11px] text-tertiary-container font-medium flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[13px]">self_improvement</span>
                                    {block.wellnessTip}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span
                              className={`font-code-badge text-[10px] px-2 py-0.5 rounded-full shrink-0 font-bold ${
                                block.type === 'break'
                                  ? 'bg-amber-300 text-slate-950 dark:bg-amber-400 dark:text-slate-950'
                                  : block.type === 'review'
                                  ? 'bg-secondary text-white'
                                  : 'bg-primary-fixed text-primary'
                              }`}
                            >
                              {block.type === 'break' ? 'พักฟื้น' : block.type === 'review' ? 'ทบทวน' : 'โฟกัส'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 rounded-full text-on-surface-variant hover:text-on-surface font-label-md text-xs md:text-sm border border-subtle cursor-pointer"
                >
                  ย้อนกลับไปแก้ไข
                </button>

                <button
                  type="button"
                  onClick={handleFinalSave}
                  className="px-6 py-3 rounded-full bg-primary text-white font-label-lg text-sm md:text-base font-semibold shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  <span>บันทึกแผนและเริ่มใช้งานทันที</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
