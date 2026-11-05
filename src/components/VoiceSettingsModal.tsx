import React from 'react';
import { UserPreferences } from '../types';
import { soundHelper } from '../utils/soundHelper';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
}) => {
  if (!isOpen) return null;

  const currentStyle = preferences.voiceStyle || 'friend';
  const isEnabled = preferences.voiceEnabled ?? true;

  const stylesList: Array<{
    id: 'friend' | 'mentor' | 'formal';
    title: string;
    desc: string;
    icon: string;
  }> = [
    {
      id: 'friend',
      title: 'เพื่อนสนิทวัยรุ่น',
      desc: 'กระตือรือร้น ให้กำลังใจแบบเพื่อนสนิท',
      icon: 'mood',
    },
    {
      id: 'mentor',
      title: 'พี่รหัสใจดี',
      desc: 'อบอุ่น นุ่มนวล คอยดูแลสุขภาวะ',
      icon: 'psychology',
    },
    {
      id: 'formal',
      title: 'เป็นทางการ',
      desc: 'สุภาพ กระชับ ชัดเจน ถูกระเบียบ',
      icon: 'record_voice_over',
    },
  ];

  const handleStyleSelect = (styleId: 'friend' | 'mentor' | 'formal') => {
    onUpdatePreferences({ voiceStyle: styleId });
  };

  const handleTestVoice = () => {
    if (!isEnabled) {
      soundHelper.stopSpeech();
      return;
    }
    soundHelper.speakThaiReminder('sample', currentStyle, true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-surface-container-lowest max-w-md w-full p-6 md:p-8 rounded-3xl border border-subtle shadow-xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-subtle pb-4">
          <div className="flex items-center gap-2.5 text-primary">
            <span className="material-symbols-outlined text-[26px]">settings</span>
            <h3 className="font-headline-sm text-base md:text-lg font-bold text-on-surface">
              ตั้งค่าเสียง AI ผู้ช่วย
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-5 text-xs md:text-sm">
          {/* Control 1: ON/OFF Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low border border-subtle shadow-xs">
            <div className="flex flex-col gap-0.5 pr-2">
              <span className="font-bold text-on-surface text-sm md:text-base">
                เปิด/ปิด เสียง AI ผู้ช่วย
              </span>
              <span className="text-xs text-on-surface-variant">
                เปิดเพื่อฟังเสียงเตือนและคำแนะนำภาษาไทยเมื่อถึงเวลาพักสายตาหรือสลับช่วงเวลา
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => {
                  const checked = e.target.checked;
                  onUpdatePreferences({ voiceEnabled: checked });
                  if (!checked) {
                    soundHelper.stopSpeech();
                  } else {
                    soundHelper.speakThaiReminder('sample', currentStyle, true);
                  }
                }}
                className="sr-only"
              />
              <div
                className="relative w-12 h-6.5 rounded-full transition-all duration-300 shadow-md"
                style={{
                  backgroundColor: isEnabled ? '#10B981' : '#94a3b8',
                  boxShadow: isEnabled ? '0 0 12px rgba(16, 185, 129, 0.45)' : 'none',
                }}
              >
                <div
                  className="absolute top-[2.5px] left-[2.5px] w-5 h-5 bg-white rounded-full border border-gray-300 shadow-sm transition-all duration-300"
                  style={{
                    transform: isEnabled ? 'translateX(22px)' : 'translateX(0px)',
                  }}
                />
              </div>
            </label>
          </div>

          {/* Control 2: Voice Style Clickable Button Chips */}
          <div className="flex flex-col gap-2.5">
            <span className="font-bold text-on-surface text-xs md:text-sm">
              เลือกสไตล์เสียง AI ผู้ช่วย:
            </span>
            <div className="grid grid-cols-1 gap-2.5">
              {stylesList.map((item) => {
                const isSelected = currentStyle === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleStyleSelect(item.id)}
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-primary-fixed/30 dark:bg-primary-fixed/20 border-2 border-primary text-on-surface shadow-xs'
                        : 'bg-surface-container-low hover:bg-surface-container border border-subtle text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-surface-container-lowest text-on-surface-variant border border-subtle'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-bold text-xs md:text-sm ${
                            isSelected ? 'text-primary' : 'text-on-surface'
                          }`}
                        >
                          {item.title}
                        </span>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[18px] text-primary font-bold">
                            check_circle
                          </span>
                        )}
                      </div>
                      <span className="text-[11.5px] text-on-surface-variant truncate">
                        {item.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Control 3: AI Voice Test Button */}
          <button
            type="button"
            onClick={handleTestVoice}
            className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-[#005237] via-[#006c49] to-[#047857] hover:from-[#003e29] hover:to-[#065f46] dark:from-[#10b981] dark:via-[#34d399] dark:to-[#6ffbbe] text-white dark:text-slate-950 font-extrabold text-xs md:text-sm shadow-xl shadow-emerald-950/25 dark:shadow-emerald-400/30 border-2 border-emerald-400/50 dark:border-white hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer mt-1 ring-4 ring-emerald-500/20 dark:ring-emerald-400/30"
          >
            <span className="material-symbols-outlined text-[22px] text-amber-300 dark:text-slate-950 font-bold animate-pulse">volume_up</span>
            <span className="tracking-wide">🔊 ทดสอบเสียง AI ตัวอย่าง (สุ่มทักทาย)</span>
          </button>
        </div>

        {/* Footer OK Button */}
        <button
          onClick={onClose}
          type="button"
          className="w-full py-3 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold text-xs md:text-sm transition-colors cursor-pointer border border-subtle"
        >
          เสร็จสิ้น
        </button>
      </div>
    </div>
  );
};
