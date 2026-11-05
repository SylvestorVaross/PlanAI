import React from 'react';
import { UserPreferences } from '../types';
import { soundHelper } from '../utils/soundHelper';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-surface-container-lowest max-w-md w-full p-6 md:p-8 rounded-3xl border border-subtle shadow-xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-subtle pb-3">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-[24px]">accessibility_new</span>
            <h3 className="font-headline-sm text-base md:text-lg font-bold text-on-surface">
              การเข้าถึง &amp; สุขภาพสายตา
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-4 text-xs md:text-sm">
          {/* Dark Mode */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-subtle">
            <div className="flex flex-col">
              <span className="font-bold text-on-surface">โหมดมืด (Dark Mode)</span>
              <span className="text-xs text-on-surface-variant">ช่วยลดแสงจ้า ถนอมสายตาในที่แสงน้อย</span>
            </div>
            <input
              type="checkbox"
              checked={preferences.darkMode}
              onChange={(e) => {
                const checked = e.target.checked;
                onUpdatePreferences({ darkMode: checked });
                if (checked) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              }}
              className="w-5 h-5 accent-primary cursor-pointer"
            />
          </div>



          {/* Sound Effects */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-subtle">
            <div className="flex flex-col">
              <span className="font-bold text-on-surface">เสียงกระดิ่งเตือน (Sound Chimes)</span>
              <span className="text-xs text-on-surface-variant">เสียงดนตรีผ่อนคลายเมื่อเริ่ม/ครบเวลา</span>
            </div>
            <input
              type="checkbox"
              checked={preferences.soundEnabled}
              onChange={(e) => onUpdatePreferences({ soundEnabled: e.target.checked })}
              className="w-5 h-5 accent-primary cursor-pointer"
            />
          </div>

          {/* 20-20-20 Rule Guide */}
          <div className="p-3.5 rounded-xl bg-primary-fixed/20 border border-primary/30 flex items-start gap-2.5 text-xs text-on-surface">
            <span className="text-primary font-bold text-sm">💡</span>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-primary">กฎ 20-20-20 สากล:</span>
              <p className="text-on-surface-variant leading-relaxed">
                ทุกๆ 20 นาทีที่จ้องหน้าจอ ให้ละสายตามองวัตถุที่อยู่ไกลออกไป 20 ฟุต อย่างน้อย 20 วินาที เพื่อคลายกล้ามเนื้อเลนส์ตา
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-full bg-primary text-white text-xs md:text-sm font-semibold cursor-pointer shadow-xs"
        >
          ตกลง
        </button>
      </div>
    </div>
  );
};
