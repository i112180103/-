import React from 'react';
import { X, BookOpen, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { PRESET_CASES } from '../data/presetCases';
import { PresetCase, SimulationInput } from '../types';

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (presetInput: SimulationInput) => void;
}

export const PresetModal: React.FC<PresetModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                經典食品工程教學案例庫 (Classic Process Scenarios)
              </h3>
              <p className="text-xs text-slate-400">
                點選案例即刻載入數位孿生參數，體驗攪拌、捏揉、乳化與調和的核心科學因果
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset Cards Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESET_CASES.map((preset) => {
            const isDanger = preset.title.includes('❌') || preset.title.includes('⚠️');
            return (
              <div
                key={preset.id}
                className="p-4 rounded-xl bg-slate-850 border border-slate-750 hover:border-amber-500/50 hover:bg-slate-800/80 transition flex flex-col justify-between gap-3 group"
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                      {preset.category}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {preset.input.rpm} RPM | {preset.input.mixing_time_min}m
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                    {preset.title}
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-750/70 flex flex-col gap-2">
                  <div className="text-[11px] text-slate-400 flex items-start gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-300 font-medium">學習核心：</strong>
                      {preset.learningFocus}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectPreset(preset.input);
                      onClose();
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 group-hover:border-amber-500/40"
                  >
                    <span>載入本案例參數</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
