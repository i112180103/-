import React, { useState } from 'react';
import { X, Copy, Check, FileJson, Download, Terminal } from 'lucide-react';
import { SimulationInput, SimulationOutput } from '../types';

interface JsonInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  input: SimulationInput;
  output: SimulationOutput | null;
}

export const JsonInspectorModal: React.FC<JsonInspectorModalProps> = ({
  isOpen,
  onClose,
  input,
  output,
}) => {
  const [activeTab, setActiveTab] = useState<'output' | 'input'>('output');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Clean strict schema representations
  const cleanInputJson = {
    raw_material: input.raw_material,
    equipment_type: input.equipment_type,
    rpm: input.rpm,
    mixing_time_min: input.mixing_time_min,
    cooling_jacket: input.cooling_jacket,
    target_product_goal: input.target_product_goal,
  };

  const cleanOutputJson = output
    ? {
        simulation_status: output.simulation_status,
        uniformity_percentage: output.uniformity_percentage,
        temperature_trend: output.temperature_trend,
        final_temperature_celsius: output.final_temperature_celsius,
        physical_phenomena: output.physical_phenomena,
        grading: {
          uniformity_score: output.grading.uniformity_score,
          product_quality_score: output.grading.product_quality_score,
        },
        tutor_analysis: output.tutor_analysis,
        double_loop_questions: output.double_loop_questions,
      }
    : null;

  const currentJsonString =
    activeTab === 'output'
      ? cleanOutputJson
        ? JSON.stringify(cleanOutputJson, null, 2)
        : '// 尚未執行模擬運算，請先點擊「啟動食品工程數位孿生模擬」'
      : JSON.stringify(cleanInputJson, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentJsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentJsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `food_simulation_${activeTab}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono">
              結構化 JSON 終端與通訊規格 (Strict JSON Schema)
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab & Actions */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('output')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition ${
                activeTab === 'output'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              輸出 JSON (Output Format)
            </button>
            <button
              onClick={() => setActiveTab('input')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition ${
                activeTab === 'input'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              輸入 JSON (Input Schema)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已複製' : '複製 JSON'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>匯出檔案</span>
            </button>
          </div>
        </div>

        {/* JSON Code Viewer */}
        <div className="p-5 overflow-auto bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed">
          <pre className="selection:bg-cyan-500/30 selection:text-cyan-200">
            <code>{currentJsonString}</code>
          </pre>
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-950 text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span>規格版本：FoodEng-JSON-v2.0 (Double-Loop Compliant)</span>
          <span className="text-emerald-400">● 嚴格 JSON 結構化輸出</span>
        </div>
      </div>
    </div>
  );
};
