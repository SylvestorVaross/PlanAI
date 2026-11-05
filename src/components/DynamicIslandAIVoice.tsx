import React, { useState, useEffect } from 'react';
import { UserPreferences } from '../types';
import { soundHelper } from '../utils/soundHelper';

interface DynamicIslandProps {
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
  isTimerRunning?: boolean;
  timerMode?: 'focus' | 'break';
}

export const DynamicIslandAIVoice: React.FC<DynamicIslandProps> = ({
  preferences,
  onUpdatePreferences,
  isTimerRunning = false,
  timerMode = 'focus',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [tipMessage, setTipMessage] = useState<string>('พร้อมช่วยจัดเวลาและเตือนพักสายตาเสมอ');

  // Randomize supportive micro-tips based on mode
  useEffect(() => {
    if (isTimerRunning) {
      if (timerMode === 'focus') {
        const focusTips = [
          'ช่วงเวลาโฟกัสเข้มข้น หายใจเข้าลึกๆ ค่อยๆ ลุยทีละหัวขอนะครับ',
          'สมองกำลังซึมซับข้อมูลได้ดีมาก โฟกัสเต็มที่เลยนะ!',
          'เหลือเวลาอีกนิดเดียว ใกล้ถึงช่วงพักสายตาแล้วครับ',
        ];
        setTipMessage(focusTips[Math.floor(Math.random() * focusTips.length)]);
      } else {
        const breakTips = [
          'มองออกไปนอกหน้าต่าง 20 ฟุต 20 วินาที คลายกล้ามเนื้อตากันนะ',
          'จิบน้ำเปล่าสักแก้ว ยืดเหยียดคอบ่าให้สมองปลอดโปร่ง',
          'เวลาพักสายตาคือการชาร์จแบตให้จำแม่นขึ้นครับ',
        ];
        setTipMessage(breakTips[Math.floor(Math.random() * breakTips.length)]);
      }
    } else {
      setTipMessage('พร้อมเริ่มโฟกัส กดเริ่มจับเวลาได้เลยครับ');
    }
  }, [isTimerRunning, timerMode]);

  const handleSpeakWhisper = () => {
    if (!preferences.voiceEnabled) {
      onUpdatePreferences({ voiceEnabled: true });
    }
    setIsSpeaking(true);
    soundHelper.playChime('click', preferences.soundEnabled);
    soundHelper.speakThaiReminder(
      timerMode === 'break' ? 'break' : 'focus',
      preferences.voiceStyle,
      true
    );
    setTimeout(() => setIsSpeaking(false), 4500);
  };

  const toggleVoice = () => {
    const nextVoice = !preferences.voiceEnabled;
    onUpdatePreferences({ voiceEnabled: nextVoice });
    if (!nextVoice) {
      soundHelper.stopSpeech();
    } else {
      soundHelper.playChime('click', preferences.soundEnabled);
      handleSpeakWhisper();
    }
  };

  return (
    <aside
      aria-label="AI Voice Assistant Companion"
      className="fixed bottom-[4.75rem] md:bottom-6 right-3 md:right-6 z-50 transition-all duration-300 max-w-[calc(100vw-1.5rem)]"
    >
      <div
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        onClick={() => setIsExpanded((prev) => !prev)}
        className={`group relative flex items-center gap-2.5 sm:gap-3 bg-slate-950/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 text-white rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] transition-all duration-300 ease-out cursor-pointer select-none ${
          isExpanded ? 'px-3.5 sm:px-4 py-2 sm:py-2.5 max-w-[calc(100vw-1.5rem)] md:max-w-md ring-2 ring-emerald-500/30' : 'px-2.5 sm:px-3 py-1.5 sm:py-2 max-w-[260px] sm:max-w-xs'
        }`}
      >
        {/* Animated AI Core / Waveform Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSpeakWhisper();
          }}
          type="button"
          className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-indigo-500 shadow-md shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all"
          title="แตะเพื่อให้ AI ช่วยพูดให้กำลังใจ"
        >
          {isSpeaking ? (
            <div className="flex items-center gap-0.5 h-3.5">
              <span className="w-0.5 h-full bg-white rounded-full animate-pulse" />
              <span className="w-0.5 h-2/3 bg-white rounded-full animate-bounce" />
              <span className="w-0.5 h-full bg-white rounded-full animate-pulse" />
            </div>
          ) : (
            <span className="material-symbols-outlined text-[18px] text-white">auto_awesome</span>
          )}

          {/* Green active ping dot */}
          {preferences.voiceEnabled && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-950 animate-pulse" />
          )}
        </button>

        {/* Text Details & Live Status */}
        <div className="flex flex-col text-left overflow-hidden pr-1">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-[11px] sm:text-xs font-extrabold text-white tracking-wide">
              AI Tutor ({preferences.voiceStyle === 'friend' ? 'สไตล์เพื่อน' : preferences.voiceStyle === 'mentor' ? 'สไตล์รุ่นพี่' : 'ทางการ'})
            </span>
            <span className="text-[9px] sm:text-[10px] text-emerald-400 font-bold shrink-0">
              {preferences.voiceEnabled ? '• เปิดเสียง' : '• ปิดเสียง'}
            </span>
          </div>

          <span className="text-[10px] sm:text-[11px] text-slate-300 truncate max-w-[140px] sm:max-w-[210px] mt-0.5">
            {isSpeaking ? 'กำลังพูดคำแนะนำ...' : tipMessage}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0 ml-auto pl-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleVoice();
            }}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              preferences.voiceEnabled
                ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                : 'bg-white/10 text-slate-400 hover:text-white'
            }`}
            title={preferences.voiceEnabled ? 'ปิดเสียง AI ผู้ช่วย' : 'เปิดเสียง AI ผู้ช่วย'}
          >
            <span className="material-symbols-outlined text-[16px]">
              {preferences.voiceEnabled ? 'volume_up' : 'volume_off'}
            </span>
          </button>

          {isExpanded && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSpeakWhisper();
              }}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer text-xs"
              title="ทดสอบฟังเสียง"
            >
              <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
