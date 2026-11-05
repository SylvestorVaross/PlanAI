import React, { useState } from 'react';
import { UserPreferences } from '../types';
import { soundHelper } from '../utils/soundHelper';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
  onOpenAccessibilityModal: () => void;
  onOpenVoiceModal: () => void;
  onOpenProfileModal?: () => void;
  level?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  preferences,
  onUpdatePreferences,
  onOpenAccessibilityModal,
  onOpenVoiceModal,
  onOpenProfileModal,
  level = 14,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleDarkMode = () => {
    const nextDark = !preferences.darkMode;
    onUpdatePreferences({ darkMode: nextDark });
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    soundHelper.playChime('click');
  };

  const toggleVoiceEnabled = () => {
    const nextVoice = !(preferences.voiceEnabled ?? true);
    onUpdatePreferences({ voiceEnabled: nextVoice });
    if (!nextVoice) {
      soundHelper.stopSpeech();
    } else {
      soundHelper.playChime('click', preferences.soundEnabled);
      soundHelper.speakThaiReminder('sample', preferences.voiceStyle, true);
    }
  };

  const handleVoiceTest = () => {
    if (!(preferences.voiceEnabled ?? true)) {
      toggleVoiceEnabled();
      return;
    }
    soundHelper.playChime('click', preferences.soundEnabled);
    soundHelper.speakThaiReminder('sample', preferences.voiceStyle, preferences.voiceEnabled ?? true);
  };

  const navItems = [
    { id: 'dashboard', label: 'หน้าแรก', icon: 'home' },
    { id: 'wizard', label: 'อัปโหลด & วิเคราะห์', icon: 'auto_awesome' },
    { id: 'summary', label: 'สรุปผล AI', icon: 'subject' },
    { id: 'schedule', label: 'สรุปบทเรียน AI', icon: 'menu_book' },
    { id: 'community', label: 'แชร์ความรู้ (Community)', icon: 'groups' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-subtle shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-colors">
      <div className="h-20 max-w-[1280px] mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
        {/* Logo & Main Nav */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              onSelectTab('dashboard');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 group cursor-pointer focus:outline-none transition-all duration-200"
            title="PlanAI - แพลนเนอร์การเรียนยุคใหม่"
          >
            {/* 3D Dimensional Logo Container with Ambient Glow & Glass Bezel */}
            <div className="relative flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-[#022c22] via-[#047857] to-[#0f766e] shadow-[0_8px_22px_-4px_rgba(5,150,105,0.45)] group-hover:shadow-[0_12px_28px_-3px_rgba(16,185,129,0.6)] border border-emerald-300/40 group-hover:scale-105 group-hover:-translate-y-0.5 transition-all duration-300 shrink-0 overflow-hidden ring-1 ring-white/25">
              {/* 3D Glass Light Sheen */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/30 pointer-events-none" />

              {/* 3D Volumetric Vector Icon */}
              <svg
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-7 h-7 md:w-8 md:h-8 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-1"
              >
                <defs>
                  {/* 3D Drop Shadow Filter */}
                  <filter id="p3d-shadow" x="-20%" y="-20%" width="150%" height="150%">
                    <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000" floodOpacity="0.4" />
                  </filter>
                  <filter id="gem-glow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#F59E0B" floodOpacity="0.7" />
                  </filter>

                  {/* Gradients for 3D Ribbon facets - High Contrast Luminous Platinum & Electric Mint */}
                  <linearGradient id="p-stem" x1="8" y1="6" x2="15" y2="28" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="45%" stopColor="#F0FDF4" />
                    <stop offset="85%" stopColor="#BBF7D0" />
                    <stop offset="100%" stopColor="#6EE7B7" />
                  </linearGradient>

                  <linearGradient id="p-loop-top" x1="11" y1="6" x2="26" y2="18" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="30%" stopColor="#F0FDFA" />
                    <stop offset="65%" stopColor="#A7F3D0" />
                    <stop offset="100%" stopColor="#34D399" />
                  </linearGradient>

                  <linearGradient id="p-loop-bottom" x1="26" y1="15" x2="11" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="45%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>

                  <linearGradient id="p-core-glow" x1="15" y1="11" x2="21" y2="17" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>

                  {/* 3D Faceted Crystal Colors */}
                  <linearGradient id="gem-top" x1="28.5" y1="2.5" x2="29" y2="7.5" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFFBEB" />
                    <stop offset="100%" stopColor="#FDE047" />
                  </linearGradient>
                  <linearGradient id="gem-right" x1="28.5" y1="7.5" x2="34" y2="7.5" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>
                  <linearGradient id="gem-bottom" x1="28.5" y1="7.5" x2="28.5" y2="12.5" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#D97706" />
                    <stop offset="100%" stopColor="#92400E" />
                  </linearGradient>
                  <linearGradient id="gem-left" x1="23.5" y1="7.5" x2="28.5" y2="7.5" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FEF08A" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                </defs>

                {/* Ambient Soft Glow Behind */}
                <circle cx="18" cy="18" r="13" fill="#10B981" fillOpacity="0.25" filter="blur(3px)" />

                {/* 3D Geometric Folded 'P' Ribbon with Volumetric Shadow & High Contrast */}
                <g filter="url(#p3d-shadow)">
                  {/* Under-fold facet with defined green edge */}
                  <path
                    d="M16 19.5H13V15.5H17C19.5 15.5 22 17.2 22 19.5C22 21.8 19.8 23.5 17 23.5H13C12.2 23.5 11.5 22.8 11.5 22V10C11.5 9.2 12.2 8.5 13 8.5H18C22.4 8.5 26 12 26 16C26 19.5 22.8 22.5 18.5 22.8"
                    fill="url(#p-loop-bottom)"
                    fillOpacity="0.85"
                  />

                  {/* Main 3D Vertical Pillar in Luminous Porcelain White with Crisp Border */}
                  <rect
                    x="8.5"
                    y="6.5"
                    width="5.5"
                    height="23"
                    rx="2.75"
                    fill="url(#p-stem)"
                    stroke="white"
                    strokeWidth="0.75"
                    strokeOpacity="0.9"
                  />
                  <rect x="8.8" y="7" width="1.6" height="22" rx="0.8" fill="white" fillOpacity="0.8" />

                  {/* Volumetric Upper Loop (curves outward in 3D perspective with crisp white-to-mint gradient) */}
                  <path
                    d="M11 6.5H18.5C22.6421 6.5 26 9.85786 26 14C26 18.1421 22.6421 21.5 18.5 21.5H11V16.5H18C19.3807 16.5 20.5 15.3807 20.5 14C20.5 12.6193 19.3807 11.5 18 11.5H11V6.5Z"
                    fill="url(#p-loop-top)"
                    stroke="white"
                    strokeWidth="0.8"
                    strokeOpacity="0.85"
                  />

                  {/* Top Highlight Rim */}
                  <path
                    d="M11 6.5H18.5C22.6421 6.5 26 9.85786 26 14"
                    stroke="white"
                    strokeWidth="1.4"
                    strokeOpacity="0.95"
                    strokeLinecap="round"
                  />

                  {/* Glowing 3D Cyber Core in Negative Space */}
                  <circle cx="17.5" cy="14" r="2.8" fill="url(#p-core-glow)" />
                  <circle cx="16.7" cy="13.2" r="0.9" fill="white" fillOpacity="1" />
                </g>

                {/* 3D Floating Faceted Diamond AI Crystal (Pops out in front) */}
                <g filter="url(#gem-glow)">
                  {/* Top Facet */}
                  <path d="M28.5 2.5L30.5 7.5L28.5 8L26.5 7.5L28.5 2.5Z" fill="url(#gem-top)" />
                  {/* Right Facet */}
                  <path d="M28.5 8L34 7.5L30.5 9L28.5 8Z" fill="url(#gem-right)" />
                  {/* Bottom Facet */}
                  <path d="M28.5 8L30.5 9L28.5 13.5L26.5 9L28.5 8Z" fill="url(#gem-bottom)" />
                  {/* Left Facet */}
                  <path d="M23 7.5L28.5 8L26.5 9L23 7.5Z" fill="url(#gem-left)" />
                  {/* Center Star Glint */}
                  <circle cx="28.5" cy="8" r="0.8" fill="white" />
                </g>
              </svg>
            </div>

            {/* App Typography */}
            <div className="flex flex-col text-left">
              <span className="font-headline-sm text-lg md:text-[22px] font-black tracking-tight text-on-surface group-hover:text-primary transition-colors leading-none">
                Plan<span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-300 bg-clip-text text-transparent font-black drop-shadow-xs">AI</span>
              </span>
              <span className="text-[10.5px] md:text-[11.5px] text-on-surface-variant font-medium tracking-tight hidden sm:block mt-1">
                เรียนฉลาด • บาลานซ์เวลา
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-surface-container-low/60 p-1 rounded-full border border-subtle">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`px-4 py-2 rounded-full font-label-md text-sm transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-surface-container-high text-primary font-semibold shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* Control Utility Buttons: Dark Mode, Gear Voice Settings, Accessibility */}
          <div className="flex items-center bg-surface-container-low rounded-full px-2 py-1 gap-1 border border-subtle shadow-xs">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-1.5 rounded-full text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center cursor-pointer"
              title={preferences.darkMode ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด (Dark Mode)'}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                {preferences.darkMode ? 'dark_mode' : 'light_mode'}
              </span>
            </button>

            {/* Single Gear Settings Button for AI Voice Settings */}
            <button
              onClick={onOpenVoiceModal}
              className="p-1.5 rounded-full text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center cursor-pointer"
              title="ตั้งค่าเสียง AI ผู้ช่วย"
              aria-label="ตั้งค่าเสียง AI ผู้ช่วย"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>

            {/* Accessibility & Eye Health Modal Button */}
            <button
              onClick={onOpenAccessibilityModal}
              className="p-1.5 rounded-full text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center cursor-pointer"
              title="การเข้าถึงและความช่วยเหลือ (ถนอมสายตา/กฎ 20-20-20)"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">accessibility_new</span>
            </button>
          </div>

          {/* User Profile with RPG Level - Clickable to open profile customization */}
          <button
            type="button"
            onClick={() => {
              if (onOpenProfileModal) onOpenProfileModal();
              soundHelper.playChime('click', preferences.soundEnabled);
            }}
            className="flex items-center gap-2 sm:gap-2.5 pl-1 p-1 rounded-2xl hover:bg-surface-container-low transition-all cursor-pointer group text-left border border-transparent hover:border-subtle shrink-0"
            title="แก้ไขโปรไฟล์ (เปลี่ยนรูป & ชื่อ)"
          >
            <div className="relative shrink-0">
              <img
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/25 shadow-xs group-hover:ring-primary/60 transition-all aspect-square shrink-0"
                src={preferences.avatarUrl}
              />
              <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[9px] px-1 py-0.5 rounded-md shadow-xs leading-none border border-white/50">
                {level}
              </span>
              <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <span className="material-symbols-outlined text-[14px]">edit</span>
              </div>
            </div>
            <div className="hidden sm:flex flex-col text-left max-w-[120px] md:max-w-[160px]">
              <div className="flex items-center gap-1">
                <span className="font-label-md text-sm text-on-surface leading-tight font-semibold group-hover:text-primary transition-colors truncate">
                  {preferences.userName}
                </span>
                <span className="material-symbols-outlined text-[13px] text-on-surface-variant opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all shrink-0">
                  edit
                </span>
              </div>
              <span className="font-label-sm text-xs text-on-surface-variant leading-tight truncate">
                {preferences.userRole}
              </span>
            </div>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-surface-container-low text-on-surface hover:text-primary transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined text-[22px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-surface-container-lowest border-b border-subtle px-4 py-4 flex flex-col gap-2 shadow-lg animate-fadeIn">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-label-md text-sm transition-all cursor-pointer ${
                  isActive
                    ? 'bg-surface-container-high text-primary font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-3 border-t border-subtle flex flex-col gap-2">
            <button
              onClick={() => {
                if (onOpenProfileModal) onOpenProfileModal();
                setMobileMenuOpen(false);
              }}
              type="button"
              className="w-full py-3 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-bold text-xs md:text-sm flex items-center justify-between transition-colors cursor-pointer border border-subtle"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
                <span>แก้ไขโปรไฟล์ (ชื่อและรูปภาพ)</span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
            </button>

            <button
              onClick={() => {
                onOpenVoiceModal();
                setMobileMenuOpen(false);
              }}
              type="button"
              className="w-full py-3 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-bold text-xs md:text-sm flex items-center justify-between transition-colors cursor-pointer border border-subtle"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-[20px]">settings</span>
                <span>ตั้งค่าเสียง AI ผู้ช่วย</span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
