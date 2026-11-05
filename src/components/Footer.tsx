import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-surface-container-low border-t border-subtle mt-12 transition-colors">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px] text-tertiary-container">spa</span>
          <p className="font-body-sm text-xs md:text-sm">
            🌟 สุขภาพกายและใจสำคัญที่สุด เรียนให้เต็มที่ พักผ่อนให้พอดีกับ PlanAI
          </p>
        </div>
        <div className="flex items-center gap-4 text-on-surface-variant font-label-sm text-xs">
          <span className="font-code-badge bg-surface-container px-3 py-1 rounded-full text-on-surface border border-subtle">
            v2.4 Cognitive Balance
          </span>
          <span>© 2026 PlanAI Studio</span>
        </div>
      </div>
    </footer>
  );
};
