import React from 'react';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Thermometer,
  Gauge,
  Sparkles,
  Zap,
  Droplets,
  Wind,
  ShieldAlert,
  Flame,
  Award,
} from 'lucide-react';
import { SimulationOutput } from '../types';

interface SimulationResultsProps {
  output: SimulationOutput;
}

export const SimulationResults: React.FC<SimulationResultsProps> = ({ output }) => {
  const {
    simulation_status,
    uniformity_percentage,
    temperature_trend,
    final_temperature_celsius,
    physical_phenomena,
    grading,
    extra_metrics,
  } = output;

  const getStatusBadge = () => {
    switch (simulation_status) {
      case 'success':
        return {
          label: '模擬成功 (Success) - 達到理想加工目標',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
          icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
          bgCard: 'bg-emerald-950/20 border-emerald-800/40',
        };
      case 'warning':
        return {
          label: '模擬警告 (Warning) - 部分指標異常或存在劣化風險',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          bgCard: 'bg-amber-950/20 border-amber-800/40',
        };
      case 'fail':
      default:
        return {
          label: '模擬未達標 (Fail) - 發生嚴重物理變性或相分離',
          color: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
          icon: <XCircle className="w-5 h-5 text-rose-400" />,
          bgCard: 'bg-rose-950/20 border-rose-800/40',
        };
    }
  };

  const statusInfo = getStatusBadge();

  return (
    <div className="bg-slate-850 border border-slate-750 rounded-2xl p-5 shadow-xl flex flex-col gap-6">
      {/* Status Top Banner */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${statusInfo.bgCard}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-900/60">{statusInfo.icon}</div>
          <div>
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Simulation Status
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
              {statusInfo.label}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 font-mono">均勻度百分比</span>
            <div className="text-lg font-mono font-black text-cyan-300">
              {uniformity_percentage}%
            </div>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div className="text-right">
            <span className="text-[11px] text-slate-400 font-mono">最終溫度</span>
            <div className="text-lg font-mono font-black text-amber-300">
              {final_temperature_celsius}°C
            </div>
          </div>
        </div>
      </div>

      {/* Grading Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Uniformity Score */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-750 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>均勻度評分 (Uniformity Score)</span>
            </span>
            <p className="text-xs text-slate-400 mt-1">物料空間分佈與微觀分散程度</p>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black font-mono text-cyan-300">
              {grading.uniformity_score}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ 100</span>
          </div>
        </div>

        {/* Product Quality Score */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-750 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>產品品質評分 (Quality Score)</span>
            </span>
            <p className="text-xs text-slate-400 mt-1">蛋白質活性/成膠性/抗氧化/乳化安定性</p>
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-3xl font-black font-mono ${
                grading.product_quality_score >= 85
                  ? 'text-emerald-400'
                  : grading.product_quality_score >= 60
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {grading.product_quality_score}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ 100</span>
          </div>
        </div>
      </div>

      {/* Temperature Trend & Thermodynamic Chart */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-750 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-bold text-slate-200">
              熱力學溫度與均勻度歷程 (Temperature & Uniformity Trend)
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 text-xs font-mono font-semibold border border-slate-700">
            {temperature_trend}
          </span>
        </div>

        {/* Dynamic Mini Chart */}
        {extra_metrics?.temp_history && (
          <div className="h-28 w-full mt-2 relative flex items-end justify-between gap-1 pt-4 pb-2 px-2 bg-slate-950/60 rounded-lg border border-slate-800">
            {extra_metrics.temp_history.map((point, idx) => {
              const maxT = 35;
              const minT = 0;
              const heightPct = Math.min(100, Math.max(10, ((point.temp - minT) / (maxT - minT)) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-white border border-slate-700 pointer-events-none whitespace-nowrap z-20 transition">
                    {point.timeMin}m: {point.temp}°C | {point.uniformity}%
                  </div>

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[16px] rounded-t transition-all ${
                      point.temp > 15
                        ? 'bg-rose-500'
                        : point.temp > 10
                        ? 'bg-amber-500'
                        : 'bg-cyan-500'
                    }`}
                  />
                  <span className="text-[9px] font-mono text-slate-500">{point.timeMin}m</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Observed Physical & Chemical Phenomena */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>物理與化學現象即時觀測 (Observed Phenomena)</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">{physical_phenomena.length} 項觀測</span>
        </div>

        <div className="flex flex-col gap-2">
          {physical_phenomena.map((item, index) => {
            const isDanger = item.includes('❌') || item.includes('變性') || item.includes('出水') || item.includes('分層') || item.includes('劣化');
            const isWarning = item.includes('⚠️') || item.includes('漩渦') || item.includes('反混合');
            const isSuccess = item.includes('✅') || item.includes('均質') || item.includes('網絡') || item.includes('彈性');

            return (
              <div
                key={index}
                className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                  isDanger
                    ? 'bg-rose-950/30 border-rose-800/40 text-rose-200'
                    : isWarning
                    ? 'bg-amber-950/30 border-amber-800/40 text-amber-200'
                    : isSuccess
                    ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
                    : 'bg-slate-900 border-slate-750 text-slate-200'
                }`}
              >
                <span className="font-mono text-slate-400 font-bold shrink-0 mt-0.5">
                  [{index + 1}]
                </span>
                <span>{item}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Engineering Domain Extra Metrics */}
      {extra_metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-750">
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col">
            <span className="text-[10px] text-slate-400 font-mono">雷諾數 (Reynolds)</span>
            <span className="text-sm font-bold font-mono text-cyan-300 mt-0.5">
              {extra_metrics.reynolds_number}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col">
            <span className="text-[10px] text-slate-400 font-mono">剪切速率 (Shear Rate)</span>
            <span className="text-sm font-bold font-mono text-purple-300 mt-0.5">
              {extra_metrics.shear_rate_sec} s⁻¹
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col">
            <span className="text-[10px] text-slate-400 font-mono">漩渦深度 / 空氣包裹</span>
            <span className="text-sm font-bold font-mono text-amber-300 mt-0.5">
              {extra_metrics.vortex_depth_cm} cm / {extra_metrics.air_entrapment_pct}%
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col">
            <span className="text-[10px] text-slate-400 font-mono">估算耗電功率</span>
            <span className="text-sm font-bold font-mono text-emerald-300 mt-0.5">
              {extra_metrics.power_consumption_kw} kW
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
