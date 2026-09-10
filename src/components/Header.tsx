import React from 'react';
import { Cpu, FileJson, Sparkles, BookOpen, RotateCcw, Share2, Award } from 'lucide-react';

interface HeaderProps {
  onOpenJson: () => void;
  onOpenPresets: () => void;
  onReset: () => void;
  isSimulating: boolean;
  hasResults: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenJson,
  onOpenPresets,
  onReset,
  isSimulating,
  hasResults,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/30">
              <Cpu className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  AI 食品工程數位孿生模擬器
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  <Sparkles className="w-3 h-3" /> 雙迴圈導師
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Food Processing Mixing, Kneading & Emulsification Digital Twin
              </p>
            </div>
          </div>

          <button
            id="btn-mobile-presets"
            onClick={onOpenPresets}
            className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-amber-300 text-xs font-medium border border-slate-700 hover:bg-slate-700"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>案例庫</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            id="btn-open-presets"
            onClick={onOpenPresets}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 hover:bg-slate-750 hover:border-amber-500/40 hover:text-amber-300 transition shadow-sm"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>經典加工案例庫</span>
          </button>

          <button
            id="btn-open-json-inspector"
            onClick={onOpenJson}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800/90 text-slate-200 text-xs font-semibold border border-slate-700 hover:bg-slate-750 hover:text-cyan-300 hover:border-cyan-500/40 transition shadow-sm"
          >
            <FileJson className="w-4 h-4 text-cyan-400" />
            <span>結構化 JSON 終端</span>
          </button>

          {hasResults && (
            <button
              id="btn-reset-params"
              onClick={onReset}
              disabled={isSimulating}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-750 hover:bg-slate-700 transition"
              title="重置參數"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">重置</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
