/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { ParameterStation } from './components/ParameterStation';
import { DigitalTwinCanvas } from './components/DigitalTwinCanvas';
import { SimulationResults } from './components/SimulationResults';
import { DoubleLoopMentor } from './components/DoubleLoopMentor';
import { JsonInspectorModal } from './components/JsonInspectorModal';
import { PresetModal } from './components/PresetModal';
import { SimulationInput, SimulationOutput } from './types';
import { PRESET_CASES } from './data/presetCases';
import { simulateFoodProcessLocally } from './utils/foodPhysicsEngine';

const INITIAL_INPUT: SimulationInput = {
  raw_material: '貢丸肉糊',
  equipment_type: 'vertical_kneader',
  rpm: 120,
  mixing_time_min: 15,
  cooling_jacket: false,
  target_product_goal: '保持蛋白質活性與爽脆彈性',
  attachment_type: 'hook',
  initial_temp_celsius: 4,
};

export default function App() {
  const [input, setInput] = useState<SimulationInput>(INITIAL_INPUT);
  const [output, setOutput] = useState<SimulationOutput | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState<boolean>(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState<boolean>(false);

  // Initial simulation calculation on mount so student sees instant live twin state
  useEffect(() => {
    const initialSim = simulateFoodProcessLocally(INITIAL_INPUT);
    setOutput(initialSim);
  }, []);

  const handleInputChange = (updated: Partial<SimulationInput>) => {
    setInput((prev) => ({ ...prev, ...updated }));
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) throw new Error('Simulation API failed');
      const data: SimulationOutput = await response.json();
      setOutput(data);

      if (data.simulation_status === 'success' && data.grading.product_quality_score >= 90) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.warn('Fallback to client-side physics simulation engine:', err);
      const fallbackData = simulateFoodProcessLocally(input);
      setOutput(fallbackData);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSelectPreset = (presetInput: SimulationInput) => {
    setInput(presetInput);
    // Automatically trigger immediate local preview
    const preview = simulateFoodProcessLocally(presetInput);
    setOutput(preview);
  };

  const handleReset = () => {
    setInput(INITIAL_INPUT);
    const resetOutput = simulateFoodProcessLocally(INITIAL_INPUT);
    setOutput(resetOutput);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navigation & Controls */}
      <Header
        onOpenJson={() => setIsJsonModalOpen(true)}
        onOpenPresets={() => setIsPresetModalOpen(true)}
        onReset={handleReset}
        isSimulating={isSimulating}
        hasResults={!!output}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {/* Quick Domain Banner & Mindset Guide */}
        <section className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-purple-500/10 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                雙迴圈心智模型 (Mental Model)
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white">
                食品物理與化學變化因果模擬導師
              </h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              嚴格遵循食品加工工程四大法則：低黏度液體攪拌漩渦與氧化、高黏度捏揉摩擦生熱與蛋白質變性、油水乳化微米化剪切閾值、以及乾粉調和反混合。
            </p>
          </div>

          <button
            onClick={() => setIsPresetModalOpen(true)}
            className="shrink-0 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>載入經典對照案例 ➔</span>
          </button>
        </section>

        {/* Primary Simulation Grid: Controls (Left) vs Digital Twin & Results (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Parameter Station Controls (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <ParameterStation
              input={input}
              onChange={handleInputChange}
              onSimulate={handleRunSimulation}
              isSimulating={isSimulating}
            />
          </div>

          {/* Right Column: 2D Digital Twin Canvas & Simulation Results (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Real-time 2D Canvas */}
            <DigitalTwinCanvas
              input={input}
              output={output}
              isSimulating={isSimulating}
            />

            {/* Results Dashboard */}
            {output && <SimulationResults output={output} />}
          </div>
        </div>

        {/* Full-width Double-Loop Guided Mentor Section */}
        {output && (
          <section className="w-full">
            <DoubleLoopMentor input={input} output={output} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800 bg-slate-900/60 py-4 px-4 text-center text-xs text-slate-500 font-mono">
        AI 食品工程數位孿生模擬器與引導式導師 (Food Engineering Digital Twin & Double-Loop Mentor)
      </footer>

      {/* JSON Terminal Inspector Modal */}
      <JsonInspectorModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        input={input}
        output={output}
      />

      {/* Preset Scenarios Modal */}
      <PresetModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        onSelectPreset={handleSelectPreset}
      />
    </div>
  );
}
