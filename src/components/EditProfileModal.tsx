import React, { useState, useRef, useEffect } from 'react';
import { UserPreferences, INITIAL_USER_PREFERENCES } from '../types';
import { soundHelper } from '../utils/soundHelper';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSave: (updated: Partial<UserPreferences>) => void;
  rpgTitle?: string;
  rpgLevel?: number;
}

// Curated preset avatars with clear categories & pleasant styles
export const PRESET_AVATARS: { id: string; name: string; url: string; category: string }[] = [
  {
    id: 'default-student',
    name: 'นักศึกษาหญิง (ค่าเริ่มต้น)',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCt87xn9kzinKH9ugaubEqxih89vDX6s96VVfvvLxvkUdyJwCu5jXBFdklJ3kUORH56jxjJTojxZD5BwliVKBDfdWUSFAfEKYBLDDZAWVWy_sZOdV1UY2w8li7NtJgZE_cGwA6XTJqzOnCejZTqlw3uzwYyY57D5O-TwU3_6xmNANHYKSiHPq3ibvuT6wTDWQHAtSIHG8uDUWdjO2U6d8MNqlksmZyt6zXpAsHNzL8Pj4SgKXasiZSlwA',
    category: 'คลาสสิก',
  },
  {
    id: 'glasses-scholar',
    name: 'นักวิชาการแว่น',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300&q=80',
    category: 'มหาลัย',
  },
  {
    id: 'creative-guy',
    name: 'นักคิดสร้างสรรค์',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&h=300&q=80',
    category: 'มหาลัย',
  },
  {
    id: 'headphone-focus',
    name: 'โฟกัสเสียงเพลง',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&h=300&q=80',
    category: 'สมาธิ',
  },
  {
    id: 'smart-student',
    name: 'นักเรียนหัวกะทิ',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300&q=80',
    category: 'มหาลัย',
  },
  {
    id: 'calm-reader',
    name: 'หนอนหนังสือนิ่งสงบ',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&h=300&q=80',
    category: 'อ่านหนังสือ',
  },
  {
    id: 'tech-innovator',
    name: 'สายไอที / โค้ดดิ้ง',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=300&q=80',
    category: 'วิทยาศาสตร์',
  },
  {
    id: 'art-student',
    name: 'นักออกแบบศิลป์',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&h=300&q=80',
    category: 'ศิลปะ',
  },
  {
    id: 'owl-mascot',
    name: 'นกฮูกปัญญาชน (Athena)',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=300&h=300&q=80',
    category: 'มาสคอต',
  },
  {
    id: 'cat-study',
    name: 'แมวส้มอ่านสอบ',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&h=300&q=80',
    category: 'มาสคอต',
  },
  {
    id: 'coffee-study',
    name: 'นักดื่มกาแฟทบทวน',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300&q=80',
    category: 'สมาธิ',
  },
  {
    id: 'minimal-bot',
    name: 'หุ่นยนต์ Chrono AI',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&h=300&q=80',
    category: 'มาสคอต',
  },
];

export const EDUCATION_LEVELS = [
  'นักเรียน ม.ต้น',
  'นักเรียน ม.ปลาย',
  'นิสิตปี 1',
  'นิสิตปี 2',
  'นิสิตปี 3',
  'นิสิตปี 4 / จบการศึกษา',
  'นักศึกษาแพทย์ / สาธารณสุข',
  'เด็กซิ่วเตรียมสอบ',
  'บัณฑิตศึกษา / ป.โท-เอก',
  'คนทำงาน / วัยทำงาน',
];

export const INTEREST_TAGS = [
  'เตรียมสอบ IELTS / TOEFL',
  'เตรียมสอบ ก.พ. / ภาค ก',
  'เตรียมสอบ กสพท. / TPAT',
  'เตรียมสอบ TGAT / A-Level',
  'คนทำงานพัฒนาทักษะ (Upskill)',
  'ภาษาต่างประเทศ (JP/KR/CN)',
  'AI & เทคโนโลยี / Coding',
  'บริหารธุรกิจ & การเงิน',
  'วิทยาศาสตร์ & วิจัย',
  'สมาธิ & การจัดการเวลา',
  'การออกแบบ & งานสร้างสรรค์',
  'เตรียมสอบสัมภาษณ์ & ทุน',
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSave,
  rpgTitle = 'Chronomancer • นักจัดสรรเวลา',
  rpgLevel = 14,
}) => {
  const [userName, setUserName] = useState(preferences.userName);
  const [userRole, setUserRole] = useState(preferences.userRole);
  const [interests, setInterests] = useState<string[]>(preferences.interests || []);
  const [avatarUrl, setAvatarUrl] = useState(preferences.avatarUrl);
  const [activeTab, setActiveTab] = useState<'preset' | 'upload'>('preset');
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUserName(preferences.userName);
      setUserRole(preferences.userRole);
      setInterests(preferences.interests || []);
      setAvatarUrl(preferences.avatarUrl);
      setUploadError(null);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  }, [isOpen, preferences.userName, preferences.userRole, preferences.avatarUrl, preferences.interests]);

  if (!isOpen) return null;

  // Categories for presets
  const categories = ['ทั้งหมด', 'คลาสสิก', 'มหาลัย', 'สมาธิ', 'อ่านหนังสือ', 'วิทยาศาสตร์', 'ศิลปะ', 'มาสคอต'];

  const filteredPresets = selectedCategory === 'ทั้งหมด'
    ? PRESET_AVATARS
    : PRESET_AVATARS.filter((p) => p.category === selectedCategory);

  // Resize and compress user uploaded image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (JPG, PNG, WebP)');
      return;
    }

    setUploadError(null);
    setIsProcessingImage(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxSize = 256;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
            setAvatarUrl(compressedDataUrl);
            soundHelper.playChime('click', preferences.soundEnabled);
          } else {
            setAvatarUrl(event.target?.result as string);
          }
        } catch (err) {
          console.error('Image compression error:', err);
          setAvatarUrl(event.target?.result as string);
        } finally {
          setIsProcessingImage(false);
        }
      };
      img.onerror = () => {
        setUploadError('ไม่สามารถโหลดภาพนี้ได้ โปรดลองภาพอื่น');
        setIsProcessingImage(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setUploadError('เกิดข้อผิดพลาดในการอ่านไฟล์');
      setIsProcessingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const toggleInterest = (tag: string) => {
    setInterests((prev) => {
      const exists = prev.includes(tag);
      soundHelper.playChime('click', preferences.soundEnabled);
      if (exists) {
        return prev.filter((t) => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleSave = () => {
    const trimmedName = userName.trim() || 'ผู้เรียนรู้';
    const trimmedRole = userRole.trim() || 'ผู้จัดสรรเวลา';
    
    onSave({
      userName: trimmedName,
      userRole: trimmedRole,
      avatarUrl,
      interests,
    });

    soundHelper.playChime('complete', preferences.soundEnabled);
    onClose();
  };

  const handleResetToDefault = () => {
    setUserName(INITIAL_USER_PREFERENCES.userName);
    setUserRole(INITIAL_USER_PREFERENCES.userRole);
    setAvatarUrl(INITIAL_USER_PREFERENCES.avatarUrl);
    setInterests(INITIAL_USER_PREFERENCES.interests || []);
    soundHelper.playChime('click', preferences.soundEnabled);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-lg md:max-w-xl max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-surface-container-lowest border border-subtle rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-labelledby="edit-profile-title"
      >
        {/* Header with Warm Creamy / Dark Surface */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-subtle bg-surface-container-low/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">badge</span>
            </div>
            <div>
              <h2 id="edit-profile-title" className="font-headline-sm text-base sm:text-lg font-bold text-on-surface">
                แก้ไขข้อมูลโปรไฟล์
              </h2>
              <p className="font-body-sm text-[11px] sm:text-xs text-on-surface-variant">
                ปรับเปลี่ยนชื่อ ตำแหน่ง และรูปภาพอวตารตามสไตล์ของคุณ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="ปิดหน้าต่าง"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Pinned Live Preview Card (Always visible, responsive on Mobile & PC, never squished!) */}
        <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-3.5 bg-surface-container-low/30 border-b border-subtle">
          <div className="p-3 sm:p-3.5 rounded-2xl bg-surface-container-lowest border border-subtle flex items-center gap-3.5 sm:gap-4 relative shadow-xs shrink-0">
            {/* Avatar Preview */}
            <div className="relative shrink-0">
              <img
                src={avatarUrl}
                alt={userName || 'อวตาร'}
                className="w-14 h-14 sm:w-16 sm:h-16 aspect-square rounded-2xl object-cover ring-2 sm:ring-4 ring-primary/25 shadow-md bg-surface-container shrink-0"
              />
              <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md shadow-xs leading-none border border-white/60">
                LV.{rpgLevel}
              </span>
            </div>

            {/* User Info Preview */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="font-headline-sm font-bold text-sm sm:text-base text-on-surface truncate max-w-[150px] sm:max-w-[220px]">
                  {userName || 'พิมพ์ชื่อของคุณ'}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 truncate max-w-[130px] sm:max-w-none">
                  {userRole || 'ระบุระดับการศึกษา'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-on-surface-variant mt-0.5 truncate">
                {rpgTitle}
              </p>

              {/* Selected Interests Tags Preview */}
              {interests.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap mt-1">
                  {interests.slice(0, 3).map((item) => (
                    <span
                      key={item}
                      className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary dark:text-emerald-300 font-medium border border-primary/20 truncate max-w-[130px]"
                    >
                      #{item}
                    </span>
                  ))}
                  {interests.length > 3 && (
                    <span className="text-[9px] text-on-surface-variant font-bold">
                      +{interests.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>ตัวอย่างแสดงผลแบบเรียลไทม์</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 flex flex-col gap-5">
          {/* Form Fields: Name & Sessions */}
          <div className="space-y-4 shrink-0">
            {/* Display Name */}
            <div>
              <label htmlFor="user-name-input" className="block text-xs font-bold text-on-surface mb-1.5">
                ชื่อที่แสดง (Display Name) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  person
                </span>
                <input
                  id="user-name-input"
                  type="text"
                  maxLength={30}
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="เช่น พิมพ์ชนก, ติวเตอร์เอ, น้องพีช"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-subtle bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-body-md"
                />
              </div>
            </div>

            {/* Session 1: ระดับการศึกษา (Single selection) */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-surface-container-low/40 border border-subtle space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-primary">school</span>
                  <label htmlFor="user-role-input" className="block text-xs font-bold text-on-surface">
                    ระดับการศึกษา (Education Level)
                  </label>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  เลือกได้แค่ 1 รายการ
                </span>
              </div>

              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  edit_note
                </span>
                <input
                  id="user-role-input"
                  type="text"
                  maxLength={35}
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  placeholder="เช่น นิสิตปี 3, นักเรียน ม.ปลาย, คนทำงาน"
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-subtle bg-surface-container-lowest text-on-surface text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-body-md"
                />
              </div>

              {/* Single Select Chips for Education Level */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {EDUCATION_LEVELS.map((level) => {
                  const isSelected = userRole === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => {
                        setUserRole(level);
                        soundHelper.playChime('click', preferences.soundEnabled);
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-primary text-white border-primary font-bold shadow-xs scale-102 ring-2 ring-primary/20'
                          : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant border-subtle'
                      }`}
                    >
                      {isSelected && (
                        <span className="material-symbols-outlined text-[13px]">check</span>
                      )}
                      <span>{level}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Session 2: ความสนใจของฉัน (Multi selection) */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-surface-container-low/40 border border-subtle space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-amber-500 dark:text-amber-400">interests</span>
                  <label className="block text-xs font-bold text-on-surface">
                    ความสนใจของฉัน (My Interests)
                  </label>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-primary font-bold px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                    เลือกได้หลายแท็ก {interests.length > 0 ? `(${interests.length})` : ''}
                  </span>
                  {interests.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setInterests([]);
                        soundHelper.playChime('click', preferences.soundEnabled);
                      }}
                      className="text-[10px] text-on-surface-variant hover:text-rose-500 underline transition-colors cursor-pointer"
                    >
                      ล้าง
                    </button>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-on-surface-variant">
                เลือกเป้าหมายหรือเนื้อหาที่คุณสนใจ สามารถเลือกได้หลายหัวข้อพร้อมกัน:
              </p>

              {/* Multi Select Chips for Interests */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {INTEREST_TAGS.map((tag) => {
                  const isSelected = interests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleInterest(tag)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-primary/20 border-primary text-primary dark:text-emerald-300 font-bold shadow-xs scale-102 ring-1 ring-primary/30'
                          : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant border-subtle'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {isSelected ? 'check_box' : 'add'}
                      </span>
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Avatar Source Tabs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-on-surface">
                เลือกรูปภาพอวตาร (Profile Avatar)
              </label>
              <span className="text-[11px] text-on-surface-variant">
                เลือกอวตารหรืออัปโหลดรูปของตนเอง
              </span>
            </div>

            <div className="flex items-center gap-2 p-1 rounded-xl bg-surface-container-low border border-subtle mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('preset')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'preset'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">face</span>
                <span>เลือกอวตารสำเร็จรูป</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                <span>อัปโหลดภาพจากเครื่อง</span>
              </button>
            </div>

            {/* Tab 1: Preset Avatars */}
            {activeTab === 'preset' && (
              <div className="flex flex-col gap-3">
                {/* Category filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-primary text-white font-bold shadow-xs'
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Grid of Avatars */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-2.5 max-h-48 sm:max-h-56 overflow-y-auto p-1">
                  {filteredPresets.map((preset) => {
                    const isSelected = avatarUrl === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setAvatarUrl(preset.url);
                          soundHelper.playChime('click', preferences.soundEnabled);
                        }}
                        className={`group relative flex flex-col items-center gap-1 p-1 sm:p-1.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary/10 border-primary ring-2 ring-primary/40 shadow-sm scale-102'
                            : 'bg-surface-container-low hover:bg-surface-container border-subtle hover:scale-105'
                        }`}
                        title={preset.name}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-11 h-11 sm:w-12 sm:h-12 aspect-square rounded-xl object-cover shrink-0"
                          loading="lazy"
                        />
                        <span className="text-[10px] text-on-surface-variant group-hover:text-on-surface truncate max-w-[60px] text-center">
                          {preset.name.split(' ')[0]}
                        </span>
                        {isSelected && (
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[10px] shadow-xs">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: Custom Local Upload */}
            {activeTab === 'upload' && (
              <div className="flex flex-col gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-subtle hover:border-primary/60 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-surface-container-low/40 hover:bg-surface-container-low text-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[26px]">add_photo_alternate</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface">
                      คลิกเพื่อเลือกไฟล์รูปภาพจากอุปกรณ์
                    </p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      รองรับไฟล์ JPG, PNG, WebP (ระบบจะย่อขนาดให้อย่างเหมาะสมอัตโนมัติ)
                    </p>
                  </div>
                </div>

                {isProcessingImage && (
                  <div className="flex items-center justify-center gap-2 text-xs text-primary font-bold py-2">
                    <span className="animate-spin material-symbols-outlined text-[16px]">sync</span>
                    <span>กำลังประมวลผลรูปภาพ...</span>
                  </div>
                )}

                {uploadError && (
                  <p className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
                    {uploadError}
                  </p>
                )}

                {/* Current Custom Image status */}
                {avatarUrl.startsWith('data:image') && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2.5">
                      <img src={avatarUrl} alt="Upload preview" className="w-9 h-9 rounded-xl object-cover" />
                      <div className="text-xs">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 block">อัปโหลดภาพสำเร็จ</span>
                        <span className="text-[11px] text-on-surface-variant">พร้อมใช้งานเป็นรูปประจำตัว</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarUrl(INITIAL_USER_PREFERENCES.avatarUrl);
                        soundHelper.playChime('click', preferences.soundEnabled);
                      }}
                      className="text-xs text-rose-500 hover:text-rose-600 font-bold px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      ลบภาพที่อัปโหลด
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-subtle bg-surface-container-low/60 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 order-2 sm:order-1"
            title="รีเซ็ตเป็นชื่อและรูปภาพเริ่มต้น"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            <span>คืนค่าเริ่มต้น</span>
          </button>

          <div className="flex items-center gap-2 ml-auto order-1 sm:order-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-bold shadow-md shadow-primary/25 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              <span>บันทึกการเปลี่ยนแปลง</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
