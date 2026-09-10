import React from 'react';
import {
  Settings2,
  Play,
  RotateCw,
  Clock,
  Snowflake,
  Flame,
  Target,
  FlaskConical,
  ShieldAlert,
  Sliders,
  Layers,
  ChevronRight,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { EquipmentType, SimulationInput, VerticalAttachment } from '../types';

interface ParameterStationProps {
  input: SimulationInput;
  onChange: (updated: Partial<SimulationInput>) => void;
  onSimulate: () => void;
  isSimulating: boolean;
}

const RAW_MATERIAL_SUGGESTIONS = [
  { name: '貢丸肉糊', category: '高黏度/肉糜', defaultGoal: '保持蛋白質活性與彈性', coolingRecommended: true },
  { name: '高筋麵糰', category: '高黏度/黏彈性', defaultGoal: '麵筋充分擴展具延展性', coolingRecommended: false },
  { name: '全脂生乳', category: '低黏度/油水', defaultGoal: '均勻微粒化防止浮油分層', coolingRecommended: false },
  { name: '沙拉醬', category: '高黏度/乳化', defaultGoal: '微米級均勻乳化長期安定', coolingRecommended: true },
  { name: '鮮榨柳橙汁', category: '低黏度/果汁', defaultGoal: '均勻混合且防止氧化', coolingRecommended: false },
  { name: '抗生素發酵醪', category: '低黏度/發酵', defaultGoal: '提高溶氧傳質促進微生物生長', coolingRecommended: true },
  { name: '即溶咖啡粉與奶精', category: '固體/乾粉', defaultGoal: '乾粉極致均勻防止顆粒分離', coolingRecommended: false },
];

const EQUIPMENT_OPTIONS: {
  type: EquipmentType;
  name: string;
  category: string;
  tag: string;
  rpmRange: [number, number];
  description: string;
  ruleHint: string;
}[] = [
  {
    type: 'paddle',
    name: '槳式攪拌機 (Paddle)',
    category: '攪拌 (Agitation)',
    tag: '低黏度/預拌',
    rpmRange: [20, 400],
    description: '轉速慢、剪切力低，適用於互溶液體混合或預拌。',
    ruleHint: '若無擋板且轉速過高會產生漩渦；剪切力不足無法用於乳化。',
  },
  {
    type: 'propeller',
    name: '316不銹鋼三葉螺旋槳 (3-Blade Marine Propeller)',
    category: '攪拌 (Agitation)',
    tag: '316不銹鋼/軸向推進流',
    rpmRange: [300, 1500],
    description: '標準 316 不銹鋼實驗室三葉螺旋推進葉片（Marine Impeller），與攪拌桿同心緊密組裝，外壁平滑無外露孔洞死角，產生強勁向下軸向流。',
    ruleHint: '高轉速（500-1200 rpm）且無擋板時易在液面引發深漩渦並捲入空氣。發酵系統可增氧，但果汁/油脂會引發快速氧化酸敗。',
  },
  {
    type: 'turbine',
    name: '輪機攪拌機 (Turbine)',
    category: '攪拌 (Agitation)',
    tag: '強剪切/徑向流',
    rpmRange: [100, 1000],
    description: '多葉片產生強大漩流，提供強勁剪切分散力。',
    ruleHint: '配合槽壁擋板 (Baffle) 可有效防止繞流、消除深漩渦並極大化均勻度。',
  },
  {
    type: 'vertical_kneader',
    name: '豎立式捏揉機 (Vertical Kneader)',
    category: '捏揉 (Kneading)',
    tag: '麵糰/肉糜擂潰',
    rpmRange: [30, 250],
    description: '適用於麵糰、乳油或肉糜（貢丸/魚漿）。可更換揉和器/拌合器/打發器。',
    ruleHint: '擂潰肉糜時摩擦生熱劇烈，必須開啟夾套冰水冷卻，否則鹽溶性蛋白質變性失去彈性！',
  },
  {
    type: 'horizontal_kneader',
    name: '橫臥式捏和機 (Horizontal Z-Kneader)',
    category: '捏揉 (Kneading)',
    tag: '低水分/高硬度',
    rpmRange: [20, 120],
    description: '雙軸 Z 型反向旋轉葉片，產生超強剪切力與撕揉力。',
    ruleHint: '適用於口香糖基劑、極硬麵糰、高稠度糊劑，剪切摩擦熱顯著。',
  },
  {
    type: 'colloid_mill',
    name: '膠體磨 (Colloid Mill)',
    category: '乳化 (Emulsification)',
    tag: '高黏度/微米磨碎',
    rpmRange: [1000, 4500],
    description: '斜邊圓盤定子與轉子高速旋轉（間隙0.05~0.5mm），超高水力剪切。',
    ruleHint: '處理高黏度物料（花生醬、濃稠沙拉醬、肉糜微化）乳化效果極佳。',
  },
  {
    type: 'pressure_homogenizer',
    name: '高壓均質機 (Homogenizer)',
    category: '乳化 (Emulsification)',
    tag: '低黏度/爆裂碎化',
    rpmRange: [1000, 2500],
    description: '利用 15~30 MPa 超高壓將粗乳化液逼過微孔隙，產生空化爆炸與碎化。',
    ruleHint: '生乳與低黏度乳化系統必備，可將脂肪球碎化至 <1 µm 防止浮油。',
  },
  {
    type: 'v_mixer',
    name: 'V型調和機 (V-Mixer)',
    category: '調和 (Blending)',
    tag: '乾粉/固體調和',
    rpmRange: [10, 60],
    description: 'V型對稱筒體 360° 旋轉，利用重力與對流擴散翻滾調和乾粉。',
    ruleHint: '過度調和（Over-blending）會因比重/粒徑差產生「反混合 (De-mixing)」，應即時停止。',
  },
];

const TARGET_GOAL_PRESETS = [
  '保持蛋白質活性與爽脆彈性',
  '均勻微粒化防止浮油分層',
  '微米級均勻乳化長期安定',
  '均勻混合且防止營養氧化',
  '提高溶氧傳質促進微生物生長',
  '麵筋充分擴展具延展性',
  '乾粉極致均勻防止顆粒分離',
];

export const ParameterStation: React.FC<ParameterStationProps> = ({
  input,
  onChange,
  onSimulate,
  isSimulating,
}) => {
  const currentEquipment = EQUIPMENT_OPTIONS.find((e) => e.type === input.equipment_type) || EQUIPMENT_OPTIONS[0];

  const handleSelectMaterialPreset = (preset: (typeof RAW_MATERIAL_SUGGESTIONS)[0]) => {
    onChange({
      raw_material: preset.name,
      target_product_goal: preset.defaultGoal,
      cooling_jacket: preset.coolingRecommended,
    });
  };

  const isMeatOrSurimi = input.raw_material.includes('肉') || input.raw_material.includes('貢丸') || input.raw_material.includes('魚漿');
  const isJuiceOrOil = input.raw_material.includes('果汁') || input.raw_material.includes('油') || input.raw_material.includes('茶');
  const isDryPowder = input.equipment_type === 'v_mixer' || input.raw_material.includes('粉');

  return (
    <div className="bg-slate-850 border border-slate-750 rounded-2xl p-5 shadow-xl flex flex-col gap-6">
      {/* Header of Station */}
      <div className="flex items-center justify-between border-b border-slate-750 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white tracking-wide">
            混合攪拌操作參數控制台
          </h2>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
          Input JSON Schema
        </span>
      </div>

      {/* 1. Raw Material Section */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <FlaskConical className="w-4 h-4 text-emerald-400" />
            <span>1. 加工物料種類 (raw_material)</span>
          </span>
          <span className="text-[11px] text-slate-400">點選快速標籤或自訂</span>
        </label>

        <div className="flex flex-wrap gap-1.5 mb-1">
          {RAW_MATERIAL_SUGGESTIONS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              id={`preset-mat-${preset.name}`}
              onClick={() => handleSelectMaterialPreset(preset)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                input.raw_material === preset.name
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-750 hover:text-white'
              }`}
            >
              <span>{preset.name}</span>
              <span className="text-[10px] text-slate-400">({preset.category.split('/')[0]})</span>
            </button>
          ))}
        </div>

        <input
          type="text"
          id="input-raw-material"
          value={input.raw_material}
          onChange={(e) => onChange({ raw_material: e.target.value })}
          placeholder="例如：貢丸肉糊, 全脂生乳, 鮮榨柳橙汁, 高筋麵糰, 咖啡乾粉..."
          className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition placeholder:text-slate-500"
        />
      </div>

      {/* 2. Equipment Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>2. 攪拌與混合設備 (equipment_type)</span>
          </span>
          <span className="text-[11px] text-slate-400">{currentEquipment.category}</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EQUIPMENT_OPTIONS.map((equip) => {
            const isSelected = input.equipment_type === equip.type;
            return (
              <button
                key={equip.type}
                type="button"
                id={`btn-equip-${equip.type}`}
                onClick={() => {
                  // adjust RPM into sensible range
                  const [minRpm, maxRpm] = equip.rpmRange;
                  let newRpm = input.rpm;
                  if (newRpm < minRpm) newRpm = minRpm;
                  if (newRpm > maxRpm) newRpm = Math.round((minRpm + maxRpm) / 2);
                  onChange({ equipment_type: equip.type, rpm: newRpm });
                }}
                className={`p-3 rounded-xl text-left transition border flex flex-col justify-between gap-1.5 relative overflow-hidden ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500 text-cyan-100 ring-1 ring-cyan-500/50 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900/60 border-slate-750 text-slate-300 hover:bg-slate-800 hover:border-slate-650'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs tracking-tight text-white flex items-center gap-1.5">
                    {equip.name}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {equip.tag}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {equip.description}
                </p>
                {isSelected && (
                  <div className="mt-1 pt-1.5 border-t border-cyan-800/40 flex items-start gap-1 text-[11px] text-cyan-300/90 font-mono">
                    <Info className="w-3 h-3 shrink-0 mt-0.5" />
                    <span className="leading-tight">{equip.ruleHint}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Extra equipment sub-options */}
      {input.equipment_type === 'vertical_kneader' && (
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-750 flex flex-col gap-2">
          <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <span>豎立式捏揉機配件選擇 (attachment_type)：</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'hook', name: '揉和器 (Hook)', hint: '麵糰拉伸展延、發揮麵筋筋性' },
              { id: 'beater', name: '拌合器 (Beater)', hint: '粉末油脂均勻、低剪切' },
              { id: 'whipper', name: '打發器 (Whipper)', hint: '高速打入空氣、蛋白打發' },
            ].map((att) => (
              <button
                key={att.id}
                type="button"
                id={`attachment-${att.id}`}
                onClick={() => onChange({ attachment_type: att.id as VerticalAttachment })}
                className={`p-2 rounded-lg text-center border text-xs transition flex flex-col items-center gap-0.5 ${
                  (input.attachment_type || 'hook') === att.id
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-semibold'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{att.name}</span>
                <span className="text-[10px] text-slate-400 leading-tight">{att.hint}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {(input.equipment_type === 'paddle' || input.equipment_type === 'propeller' || input.equipment_type === 'turbine') && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-750">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-200">槽壁垂直擋板 (Baffles)</span>
            <span className="text-[11px] text-slate-400">防止繞流與深漩渦，將切向轉化為軸向/徑向射流</span>
          </div>
          <button
            type="button"
            id="toggle-baffles"
            onClick={() => onChange({ has_baffles: !input.has_baffles })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              input.has_baffles
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {input.has_baffles ? '✅ 已裝設擋板' : '⚪ 無擋板 (易生漩渦)'}
          </button>
        </div>
      )}

      {/* 3. RPM and Mixing Time Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* RPM Slider */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-750 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              <span>操作轉速 (rpm)</span>
            </label>
            <span className="text-sm font-mono font-bold text-amber-300 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              {input.rpm} <span className="text-[10px] text-slate-400 font-normal">RPM</span>
            </span>
          </div>
          <input
            type="range"
            id="slider-rpm"
            min={currentEquipment.rpmRange[0]}
            max={currentEquipment.rpmRange[1]}
            step={10}
            value={input.rpm}
            onChange={(e) => onChange({ rpm: parseInt(e.target.value, 10) })}
            className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>{currentEquipment.rpmRange[0]} RPM</span>
            <span className="text-amber-400/80 font-medium">建議範圍</span>
            <span>{currentEquipment.rpmRange[1]} RPM</span>
          </div>
        </div>

        {/* Mixing Time Slider */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-750 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>操作時間 (mixing_time_min)</span>
            </label>
            <span className="text-sm font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              {input.mixing_time_min} <span className="text-[10px] text-slate-400 font-normal">分鐘</span>
            </span>
          </div>
          <input
            type="range"
            id="slider-mixing-time"
            min={1}
            max={30}
            step={1}
            value={input.mixing_time_min}
            onChange={(e) => onChange({ mixing_time_min: parseInt(e.target.value, 10) })}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>1 min</span>
            {isDryPowder && <span className="text-rose-400 font-medium">&gt;12min 易過度調和</span>}
            <span>30 min</span>
          </div>
        </div>
      </div>

      {/* 4. Cooling Jacket Switch (Crucial Domain Rule) */}
      <div
        className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          input.cooling_jacket
            ? 'bg-blue-950/30 border-blue-500/60 shadow-lg shadow-blue-950/30'
            : isMeatOrSurimi
            ? 'bg-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-950/30 animate-pulse'
            : 'bg-slate-900 border-slate-750'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              input.cooling_jacket
                ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-400/40'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            {input.cooling_jacket ? <Snowflake className="w-5 h-5 animate-spin text-blue-300" /> : <Flame className="w-5 h-5 text-slate-500" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                夾套冰水冷卻系統 (cooling_jacket)
              </span>
              {isMeatOrSurimi && !input.cooling_jacket && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> 肉糜熱變性極度危險
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {input.cooling_jacket
                ? '❄️ 冰水循環開啟：持續導出高剪切摩擦熱，保護熱敏性成分與蛋白質構型'
                : '⚠️ 未開啟冷卻：機械高剪切摩擦生熱將在槽內持續累積，導致料溫上升'}
            </p>
          </div>
        </div>

        <button
          type="button"
          id="toggle-cooling-jacket"
          onClick={() => onChange({ cooling_jacket: !input.cooling_jacket })}
          className={`w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 ${
            input.cooling_jacket
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/30'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
          }`}
        >
          {input.cooling_jacket ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>已開啟冷卻夾套</span>
            </>
          ) : (
            <span>點擊開啟冷卻夾套</span>
          )}
        </button>
      </div>

      {/* 5. Target Product Goal */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Target className="w-4 h-4 text-purple-400" />
            <span>3. 目標產品訴求 (target_product_goal)</span>
          </span>
          <span className="text-[11px] text-slate-400">雙迴圈引導評估基準</span>
        </label>

        <div className="flex flex-wrap gap-1.5 mb-1">
          {TARGET_GOAL_PRESETS.map((goal) => (
            <button
              key={goal}
              type="button"
              id={`preset-goal-${goal.slice(0, 4)}`}
              onClick={() => onChange({ target_product_goal: goal })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                input.target_product_goal === goal
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
            >
              {goal}
            </button>
          ))}
        </div>

        <input
          type="text"
          id="input-target-goal"
          value={input.target_product_goal}
          onChange={(e) => onChange({ target_product_goal: e.target.value })}
          placeholder="例如：保持蛋白質活性/彈性, 均勻不分層, 防止氧化, 均勻乳化, 均勻乾粉..."
          className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition"
        />
      </div>

      {/* Simulation Action Trigger */}
      <button
        type="button"
        id="btn-run-simulation"
        onClick={onSimulate}
        disabled={isSimulating}
        className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSimulating ? (
          <>
            <RotateCw className="w-5 h-5 animate-spin" />
            <span>數位孿生物理與熱力學運算中...</span>
          </>
        ) : (
          <>
            <Play className="w-5 h-5 fill-slate-950" />
            <span>啟動食品工程數位孿生模擬 (Simulate)</span>
          </>
        )}
      </button>
    </div>
  );
};
