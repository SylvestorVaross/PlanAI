import React, { useState } from 'react';
import { StudySharePost, UserPreferences, PlanItem, QuestActionType } from '../types';
import { soundHelper } from '../utils/soundHelper';

interface CommunityFeedProps {
  posts: StudySharePost[];
  onUpdatePosts: (posts: StudySharePost[]) => void;
  preferences: UserPreferences;
  plans: PlanItem[];
  onAwardXp?: (xp: number) => void;
  onTriggerQuestAction?: (action: QuestActionType) => void;
}

export const CommunityFeedView: React.FC<CommunityFeedProps> = ({
  posts,
  onUpdatePosts,
  preferences,
  plans,
  onAwardXp,
  onTriggerQuestAction,
}) => {
  const [selectedTag, setSelectedTag] = useState<string>('ทั้งหมด');
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form states for new post
  const [newTitle, setNewTitle] = useState<string>('');
  const [newSubject, setNewSubject] = useState<string>('');
  const [newSnippet, setNewSnippet] = useState<string>('');
  const [newTechnique, setNewTechnique] = useState<string>('Feynman Technique');
  const [newKeyPoints, setNewKeyPoints] = useState<string>('');

  const allTags = ['ทั้งหมด', '#ActiveRecall', '#Feynman', '#Medical', '#Econometrics', '#ComputerScience', '#Pomodoro', '#Flashcards'];

  const filteredPosts = posts.filter((post) => {
    const matchesTag = selectedTag === 'ทั้งหมด' || post.tags.includes(selectedTag);
    const matchesSearch =
      searchQuery === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.contentSnippet.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  const handleReact = (postId: string, type: 'mindblown' | 'coffee' | 'insight') => {
    soundHelper.playChime('click', preferences.soundEnabled);
    const updated = posts.map((p) => {
      if (p.id !== postId) return p;
      const isSame = p.brainFuel.userReacted === type;
      return {
        ...p,
        brainFuel: {
          ...p.brainFuel,
          [type]: isSame ? p.brainFuel[type] - 1 : p.brainFuel[type] + 1,
          userReacted: isSame ? undefined : type,
        },
      };
    });
    onUpdatePosts(updated);
    if (onAwardXp) {
      onAwardXp(15); // Reward user with 15 XP for engaging with community
    }
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSnippet.trim()) return;

    const pointsArray = newKeyPoints
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const newPost: StudySharePost = {
      id: `post-${Date.now()}`,
      authorName: preferences.userName || 'พิมพ์ชนก',
      authorRole: preferences.userRole || 'นิสิตปี 3',
      authorAvatar: preferences.avatarUrl,
      subject: newSubject || (plans[0]?.subjectName ?? 'วิชาทั่วไป'),
      title: newTitle,
      contentSnippet: newSnippet,
      tags: ['#StudyShare', `#${newTechnique.replace(/\s+/g, '')}`],
      technique: newTechnique,
      brainFuel: { mindblown: 1, coffee: 1, insight: 1, userReacted: 'insight' },
      keyPoints: pointsArray.length > 0 ? pointsArray : ['อ่านสรุปและเชื่อมโยงกับความรู้เดิม', 'ทบทวนสม่ำเสมอด้วย Spaced Repetition'],
      createdAt: 'เมื่อสักครู่',
    };

    onUpdatePosts([newPost, ...posts]);
    soundHelper.playChime('complete', preferences.soundEnabled);
    soundHelper.speakThaiReminder('congrats', preferences.voiceStyle, preferences.voiceEnabled);
    if (onAwardXp) {
      onAwardXp(100); // Reward 100 XP for sharing knowledge
    }
    if (onTriggerQuestAction) {
      onTriggerQuestAction('share_note');
    }

    // Reset
    setNewTitle('');
    setNewSubject('');
    setNewSnippet('');
    setNewKeyPoints('');
    setShowShareModal(false);
  };

  return (
    <div className="w-full py-6 flex flex-col gap-6 animate-fadeIn">
      {/* Top Banner: Community Study Share */}
      <div className="relative overflow-hidden bg-gradient-to-r from-secondary-fixed/40 via-surface-container-lowest to-primary-fixed/30 p-6 md:p-8 rounded-3xl border border-subtle shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1.5 z-10 max-w-xl">
          <div className="flex items-center gap-2 text-secondary font-bold text-xs md:text-sm">
            <span className="material-symbols-outlined text-[20px]">groups</span>
            <span>Study Share • ชุมชนแลกเปลี่ยนสรุปและเทคนิคการเรียน</span>
          </div>
          <h1 className="font-headline-md text-xl md:text-2xl font-black text-on-surface">
            เรียนรู้ร่วมกัน เติมพลังสมอง ไม่หมดไฟ
          </h1>
          <p className="font-body-sm text-xs md:text-sm text-on-surface-variant">
            แชร์โน้ตย่อ ไฮไลท์วิชาสอบ และเทคนิคจำแม่นจากเพื่อนๆ ทั่วประเทศ กดส่งพลังสมองเพื่อรับค่าประสบการณ์ (XP)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          className="w-full sm:w-auto px-6 py-3 rounded-full bg-emerald-100 hover:bg-emerald-200 border border-emerald-300/80 text-stone-900 shadow-md shadow-emerald-200/50 dark:bg-gradient-to-r dark:from-emerald-600 dark:via-teal-600 dark:to-emerald-700 dark:hover:from-emerald-700 dark:hover:to-teal-800 dark:text-white dark:border-emerald-500/40 dark:shadow-lg dark:shadow-emerald-900/40 font-label-lg text-sm font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 z-10"
        >
          <span className="material-symbols-outlined text-[20px] text-stone-900 dark:text-white">edit_note</span>
          <span className="font-bold tracking-wide text-stone-900 dark:text-white">แชร์สรุปของคุณ (+100 XP)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-container-lowest p-4 rounded-2xl border border-subtle shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setSelectedTag(tag);
                soundHelper.playChime('click', preferences.soundEnabled);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedTag === tag
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อวิชา หรือเนื้อหา..."
            className="w-full bg-surface-container-low text-on-surface text-xs pl-9 pr-4 py-2 rounded-xl border border-subtle focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Bento Grid: Community Study Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPosts.map((post) => {
          const isUserReacted = post.brainFuel.userReacted;
          return (
            <article
              key={post.id}
              className="group relative flex flex-col justify-between bg-surface-container-lowest p-5 rounded-2xl border border-subtle shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-300"
            >
              {/* Header: Author Info & Subject Tag */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2 border-b border-subtle pb-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/20"
                    />
                    <div className="flex flex-col leading-tight">
                      <span className="font-bold text-xs text-on-surface">{post.authorName}</span>
                      <span className="text-[11px] text-on-surface-variant">{post.authorRole}</span>
                    </div>
                  </div>
                  <span className="font-code-badge text-[10px] text-primary bg-primary-fixed/40 px-2.5 py-0.5 rounded-full font-bold">
                    {post.subject}
                  </span>
                </div>

                {/* Content: Title & Snippet */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-headline-sm text-sm md:text-base font-extrabold text-on-surface group-hover:text-primary transition-colors leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                    {post.contentSnippet}
                  </p>
                </div>

                {/* Bullet Key Takeaways */}
                {post.keyPoints && post.keyPoints.length > 0 && (
                  <div className="p-3 rounded-xl bg-surface-container-low/70 border border-subtle flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">stars</span>
                      <span>จุดเน้นสำคัญ ({post.technique})</span>
                    </span>
                    <ul className="flex flex-col gap-1">
                      {post.keyPoints.slice(0, 3).map((point, idx) => (
                        <li key={idx} className="text-[11px] text-on-surface-variant flex items-start gap-1.5 leading-tight">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-medium text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer: Brain Fuel Reactions & Timestamp */}
              <div className="flex items-center justify-between border-t border-subtle pt-3 mt-4">
                <span className="text-[10px] text-on-surface-variant">{post.createdAt}</span>

                <div className="flex items-center gap-1.5">
                  {/* Mindblown Reaction */}
                  <button
                    type="button"
                    onClick={() => handleReact(post.id, 'mindblown')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isUserReacted === 'mindblown'
                        ? 'bg-purple-500 text-white shadow-xs'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                    }`}
                    title="สมองแล่น / สุดยอดเทคนิค"
                  >
                    <span>🧠</span>
                    <span>{post.brainFuel.mindblown}</span>
                  </button>

                  {/* Coffee Boost */}
                  <button
                    type="button"
                    onClick={() => handleReact(post.id, 'coffee')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isUserReacted === 'coffee'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                    }`}
                    title="เติมพลังใจ / อ่านต่อ"
                  >
                    <span>☕</span>
                    <span>{post.brainFuel.coffee}</span>
                  </button>

                  {/* Insight */}
                  <button
                    type="button"
                    onClick={() => handleReact(post.id, 'insight')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isUserReacted === 'insight'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                    }`}
                    title="กระจ่างเลย / ชัดเจนมาก"
                  >
                    <span>💡</span>
                    <span>{post.brainFuel.insight}</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Share Note Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest max-w-lg w-full p-6 md:p-8 rounded-3xl border border-subtle shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[24px]">post_add</span>
                <h3 className="font-headline-sm text-base md:text-lg font-bold text-on-surface">
                  แชร์สรุปบทเรียนและเทคนิคสู่ชุมชน
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="flex flex-col gap-4 text-xs md:text-sm">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-on-surface">ชื่อวิชา / หมวดหมู่</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="เช่น ชีววิทยา ม.ปลาย, เศรษฐศาสตร์, แคลคูลัส 2"
                  className="w-full bg-surface-container-low text-on-surface px-3.5 py-2.5 rounded-xl border border-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 text-xs md:text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-on-surface">หัวข้อสรุปที่ต้องการแชร์</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="เช่น สรุปวัฏจักร Krebs แบบเข้าใจง่ายใน 3 ข้อ"
                  className="w-full bg-surface-container-low text-on-surface px-3.5 py-2.5 rounded-xl border border-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 text-xs md:text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-on-surface">คำอธิบายภาพรวมสั้นๆ</label>
                <textarea
                  rows={2}
                  required
                  value={newSnippet}
                  onChange={(e) => setNewSnippet(e.target.value)}
                  placeholder="เขียนอธิบายภาพรวมหรือวิธีจำที่คุณค้นพบ..."
                  className="w-full bg-surface-container-low text-on-surface px-3.5 py-2.5 rounded-xl border border-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 text-xs md:text-sm resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-on-surface">จุดเน้นสำคัญ (แยกบรรทัดละ 1 ข้อ)</label>
                <textarea
                  rows={3}
                  value={newKeyPoints}
                  onChange={(e) => setNewKeyPoints(e.target.value)}
                  placeholder="ข้อ 1: จุดที่อาจารย์เน้นเป็นพิเศษ&#10;ข้อ 2: สูตรลัดหรือวิธีตรวจคำตอบ&#10;ข้อ 3: ข้อควรระวังที่มักทำผิด"
                  className="w-full bg-surface-container-low text-on-surface px-3.5 py-2.5 rounded-xl border border-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 text-xs md:text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-on-surface">เทคนิคการเรียนที่ใช้</label>
                <select
                  value={newTechnique}
                  onChange={(e) => setNewTechnique(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface px-3.5 py-2.5 rounded-xl border border-subtle focus:outline-none text-xs md:text-sm cursor-pointer"
                >
                  <option value="Feynman Technique">Feynman Technique (สอนให้คนอื่นเข้าใจ)</option>
                  <option value="Active Recall">Active Recall (การดึงข้อมูลจากความจำ)</option>
                  <option value="Spaced Repetition">Spaced Repetition (ทบทวนตามคาบเวลา)</option>
                  <option value="Visual Mind Mapping">Visual Mind Mapping (แผนผังความคิด)</option>
                  <option value="Pomodoro Sprint">Pomodoro Sprint (อ่านสลับพักสายตา)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-subtle">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 rounded-full text-on-surface-variant hover:bg-surface-container text-xs font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-primary text-white font-bold text-xs md:text-sm shadow-md hover:bg-primary/90 cursor-pointer"
                >
                  โพสต์สรุป (+100 XP)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
