import { SimulationInput, SimulationOutput, SimulationExtraMetrics } from '../types';

interface MaterialProperty {
  viscosity_cp: number; // Centipoise: water=1, milk=2, juice=5, cream=500, dough=100000, meat_paste=80000, powder=0
  density_kg_m3: number;
  heat_capacity_j_kg_c: number;
  is_emulsion_system: boolean;
  is_protein_sensitive: boolean;
  is_oxidation_sensitive: boolean;
  is_fermentation: boolean;
  is_dry_powder: boolean;
  initial_temp_c: number;
}

function analyzeMaterial(materialName: string): MaterialProperty {
  const lower = materialName.toLowerCase();
  
  if (lower.includes('貢丸') || lower.includes('肉') || lower.includes('魚漿') || lower.includes('surimi') || lower.includes('meat')) {
    return {
      viscosity_cp: 85000,
      density_kg_m3: 1080,
      heat_capacity_j_kg_c: 3200,
      is_emulsion_system: false,
      is_protein_sensitive: true,
      is_oxidation_sensitive: false,
      is_fermentation: false,
      is_dry_powder: false,
      initial_temp_c: 4,
    };
  }

  if (lower.includes('麵') || lower.includes('dough') || lower.includes('麵糰') || lower.includes('麵團')) {
    return {
      viscosity_cp: 120000,
      density_kg_m3: 1200,
      heat_capacity_j_kg_c: 2700,
      is_emulsion_system: false,
      is_protein_sensitive: true,
      is_oxidation_sensitive: false,
      is_fermentation: false,
      is_dry_powder: false,
      initial_temp_c: 20,
    };
  }

  if (lower.includes('沙拉醬') || lower.includes('蛋黃醬') || lower.includes('mayo') || lower.includes('花生醬') || lower.includes('dressing')) {
    return {
      viscosity_cp: 25000,
      density_kg_m3: 980,
      heat_capacity_j_kg_c: 2900,
      is_emulsion_system: true,
      is_protein_sensitive: false,
      is_oxidation_sensitive: true,
      is_fermentation: false,
      is_dry_powder: false,
      initial_temp_c: 18,
    };
  }

  if (lower.includes('鮮乳') || lower.includes('乳') || lower.includes('牛奶') || lower.includes('milk')) {
    return {
      viscosity_cp: 2.5,
      density_kg_m3: 1030,
      heat_capacity_j_kg_c: 3930,
      is_emulsion_system: true,
      is_protein_sensitive: false,
      is_oxidation_sensitive: false,
      is_fermentation: false,
      is_dry_powder: false,
      initial_temp_c: 12,
    };
  }

  if (lower.includes('果汁') || lower.includes('juice') || lower.includes('茶') || lower.includes('飲料') || lower.includes('油')) {
    return {
      viscosity_cp: 3.2,
      density_kg_m3: 1050,
      heat_capacity_j_kg_c: 3850,
      is_emulsion_system: false,
      is_protein_sensitive: false,
      is_oxidation_sensitive: true,
      is_fermentation: false,
      is_dry_powder: false,
      initial_temp_c: 15,
    };
  }

  if (lower.includes('發酵') || lower.includes('醪') || lower.includes('酵母') || lower.includes('ferment')) {
    return {
      viscosity_cp: 15,
      density_kg_m3: 1040,
      heat_capacity_j_kg_c: 3900,
      is_emulsion_system: false,
      is_protein_sensitive: false,
      is_oxidation_sensitive: false,
      is_fermentation: true,
      is_dry_powder: false,
      initial_temp_c: 28,
    };
  }

  if (lower.includes('粉') || lower.includes('咖啡') || lower.includes('powder') || lower.includes('奶精') || lower.includes('糖粉')) {
    return {
      viscosity_cp: 0.1,
      density_kg_m3: 650,
      heat_capacity_j_kg_c: 1600,
      is_emulsion_system: false,
      is_protein_sensitive: false,
      is_oxidation_sensitive: false,
      is_fermentation: false,
      is_dry_powder: true,
      initial_temp_c: 25,
    };
  }

  // Default semi-liquid
  return {
    viscosity_cp: 50,
    density_kg_m3: 1000,
    heat_capacity_j_kg_c: 3600,
    is_emulsion_system: false,
    is_protein_sensitive: false,
    is_oxidation_sensitive: false,
    is_fermentation: false,
    is_dry_powder: false,
    initial_temp_c: 20,
  };
}

export function simulateFoodProcessLocally(input: SimulationInput): SimulationOutput {
  const { raw_material, equipment_type, rpm, mixing_time_min, cooling_jacket, target_product_goal, attachment_type, has_baffles } = input;
  const mat = analyzeMaterial(raw_material);
  const initialTemp = input.initial_temp_celsius ?? mat.initial_temp_c;

  const phenomena: string[] = [];
  let status: 'success' | 'warning' | 'fail' = 'success';
  let uniformityScore = 90;
  let qualityScore = 90;
  
  // Power & Frictional heating estimation
  let heatGenerationRateCPerMin = 0;
  let shearRate = 0;
  let reynoldsNumber = 0;
  let vortexDepthCm = 0;
  let airEntrapmentPct = 0;
  let proteinDenaturationPct = 0;
  let dropletSizeUm = 20;
  let demixingIndex = 0;

  const effectiveRpm = Math.max(10, rpm);
  const effectiveTime = Math.max(1, mixing_time_min);

  // 1. Fluid Dynamics & Reynolds Number
  const impellerDiameterM = 0.3; // 30cm standard batch
  const liquidDensity = mat.density_kg_m3;
  const dynViscosityPaS = Math.max(0.001, mat.viscosity_cp / 1000);
  const revPerSec = effectiveRpm / 60;
  
  reynoldsNumber = Math.round((liquidDensity * revPerSec * Math.pow(impellerDiameterM, 2)) / dynViscosityPaS);
  
  let flowRegime: '層流 (Laminar)' | '過渡流 (Transitional)' | '紊流 (Turbulent)' = '過渡流 (Transitional)';
  if (reynoldsNumber < 10) flowRegime = '層流 (Laminar)';
  else if (reynoldsNumber > 10000) flowRegime = '紊流 (Turbulent)';

  // 2. Equipment-Specific Physics & Rules
  // Agitation
  if (equipment_type === 'paddle') {
    shearRate = effectiveRpm * 1.5;
    if (mat.viscosity_cp > 5000) {
      phenomena.push('槳式攪拌葉片在高黏度物料中遭遇極大阻力，物料發生全體隨軸同步轉動 (Solid-body rotation)，缺乏剪切與上下軸向對流');
      uniformityScore -= 45;
      qualityScore -= 30;
      status = 'fail';
    } else if (mat.is_emulsion_system) {
      phenomena.push('槳式攪拌機 (Paddle) 剪切力嚴重不足，油水兩相無法碎化為微米乳滴，短時間內迅速浮油分層');
      uniformityScore -= 50;
      qualityScore -= 55;
      dropletSizeUm = 85;
      status = 'fail';
    } else {
      if (effectiveRpm > 300 && !has_baffles) {
        vortexDepthCm = Math.min(25, (effectiveRpm - 300) * 0.05 + 5);
        airEntrapmentPct = Math.min(35, vortexDepthCm * 1.2);
        phenomena.push(`轉速過高 (${effectiveRpm} RPM) 且槽壁未加裝擋板 (Baffle)，液面形成深漩渦並劇烈捲入大量空氣泡`);
        if (mat.is_oxidation_sensitive) {
          phenomena.push('空氣中氧氣被高度打入非發酵液體中，導致多酚氧化酵素活化、維生素C氧化分解、風味快速劣化');
          qualityScore -= 40;
          status = 'warning';
        }
      } else {
        phenomena.push('槳式攪拌在低黏度互溶液體中提供溫和對流循環，剪切力低，適合預混或互溶液體');
        uniformityScore = Math.min(95, 60 + effectiveTime * 3);
      }
    }
  } else if (equipment_type === 'propeller') {
    shearRate = effectiveRpm * 4.2;
    if (mat.viscosity_cp > 2000) {
      phenomena.push('螺旋槳葉片短小，在高黏度物料中形成「孔洞化 (Cavitation/Channeling)」短路流，周邊物料靜止不動');
      uniformityScore -= 40;
      status = 'fail';
    } else {
      if (effectiveRpm >= 500) {
        phenomena.push(`軸向高速流動 (轉速 ${effectiveRpm} RPM)，強烈軸向推進帶動上下翻騰，產生快速碎化均勻效果`);
        uniformityScore = 94;
        dropletSizeUm = 12;
      }
      if (!has_baffles && effectiveRpm > 450) {
        vortexDepthCm = Math.min(30, (effectiveRpm - 450) * 0.04 + 8);
        airEntrapmentPct = Math.min(45, vortexDepthCm * 1.5);
        phenomena.push('高速螺旋槳在中心產生強力向下漏斗狀漩渦，持續將液面空氣包埋入液體深處');
        if (mat.is_fermentation) {
          phenomena.push('✅ 包入之空氣顯著提高發酵醪溶氧率 (DO)，大幅促進好氧微生物呼吸與發酵代謝');
          qualityScore = 98;
        } else if (mat.is_oxidation_sensitive) {
          phenomena.push('❌ 非發酵系統（果汁/油脂）因空氣過度包入，加速氧化酸敗與褪色變質');
          qualityScore -= 45;
          status = 'warning';
        }
      }
    }
  } else if (equipment_type === 'turbine') {
    shearRate = effectiveRpm * 8.0;
    if (has_baffles) {
      phenomena.push('輪機式攪拌葉片配合槽壁垂直擋板 (Baffles)，有效破壞中心切向漩渦，轉化為強大徑向射流與上下二次循環');
      uniformityScore = 98;
      vortexDepthCm = 2;
    } else {
      vortexDepthCm = Math.min(35, effectiveRpm * 0.04);
      phenomena.push('輪機攪拌產生強烈旋轉流場，因缺少擋板產生深漩渦繞流，流體隨葉片整體旋轉降低混合效率');
      uniformityScore -= 15;
    }
    if (mat.is_emulsion_system) {
      dropletSizeUm = 8.5;
      phenomena.push('多葉片輪機提供強大剪切分散力，可使油滴粗分散為細緻均質乳液');
    }
  } else if (equipment_type === 'vertical_kneader') {
    shearRate = effectiveRpm * 3.0;
    const attachment = attachment_type || 'hook';
    heatGenerationRateCPerMin = (mat.viscosity_cp / 30000) * (effectiveRpm / 80) * 0.8;
    
    if (mat.is_protein_sensitive && (raw_material.includes('肉') || raw_material.includes('貢丸') || raw_material.includes('魚漿'))) {
      // Surimi / Meatball Paste Kneading Rule
      if (attachment === 'whipper') {
        phenomena.push('使用打發器 (Whipper) 處理高硬度肉糜，鋼絲受到巨大黏滯阻力變形，且過度打入氣泡導致貢丸結構產生大量孔洞');
        qualityScore -= 35;
      }
      phenomena.push('豎立式擂潰機構對肉糜施加強力捏揉剪切，促使鹽溶性肌球蛋白 (Myosin) 與肌原纖維蛋白質溶出');
      
      if (!cooling_jacket) {
        heatGenerationRateCPerMin *= 1.8;
        phenomena.push('⚠️ 未開啟冷卻夾套！高黏度肉糜激烈摩擦生熱，溫度迅速飆破 15°C~25°C');
        phenomena.push('❌ 高溫導致鹽溶性蛋白質熱變性凝固，失去天然成膠性 (Gelation capacity) 與網狀保水彈性，成品口感鬆散出水');
        proteinDenaturationPct = Math.min(95, effectiveTime * 7);
        qualityScore -= 60;
        status = 'fail';
      } else {
        phenomena.push('✅ 夾套冰水冷卻循環開啟，有效吸收摩擦剪切熱，物料溫度維持於 4°C~10°C 低溫安全區');
        phenomena.push('✅ 肌球蛋白維持天然活性，溶出後展開交聯形成細緻的三維凝膠網絡，賦予貢丸爽脆高彈性');
        qualityScore = 96;
        uniformityScore = 95;
      }
    } else if (raw_material.includes('麵') || raw_material.includes('dough')) {
      if (attachment === 'hook') {
        phenomena.push('S型麵糰勾 (Hook) 持續進行拉伸、摺疊、推擠，使麥穀蛋白與醇溶蛋白分子鏈定向排列，充分擴展麵筋 (Gluten network) 彈性與延伸性');
        uniformityScore = 95;
        qualityScore = 95;
      } else if (attachment === 'beater') {
        phenomena.push('拌合器 (Beater) 主要用於均勻混合粉狀與脂類，對長鏈麵筋的拉伸與展延效果有限，麵糰停留在拾起階段 (Pick-up stage)');
        qualityScore -= 20;
      } else if (attachment === 'whipper') {
        phenomena.push('打發器 (Whipper) 結構無法承受高黏度麵糰阻力，容易造成機件損壞，且無法提供足夠揉壓張力');
        qualityScore -= 40;
        status = 'warning';
      }
    } else {
      phenomena.push('豎立式捏揉機施加空間立體搓揉力場，適用於中高黏度糊狀物料');
    }
  } else if (equipment_type === 'horizontal_kneader') {
    shearRate = effectiveRpm * 5.5;
    heatGenerationRateCPerMin = (mat.viscosity_cp / 25000) * (effectiveRpm / 60) * 1.1;
    phenomena.push('橫臥式雙軸 Z 型葉片反向差速旋轉，在兩葉片相交隙縫產生極高剪切與撕扯力，專門克服低水分、高黏滯、高硬度固體物料');
    if (!cooling_jacket && mat.is_protein_sensitive) {
      phenomena.push('❌ 封閉式高剪切產生巨大摩擦熱，未開夾套造成物料嚴重過熱變性');
      proteinDenaturationPct = 85;
      qualityScore -= 50;
      status = 'fail';
    } else if (cooling_jacket) {
      phenomena.push('✅ 夾套冷卻有效帶走橫向捏合高摩擦熱量');
      qualityScore = 94;
    }
  } else if (equipment_type === 'colloid_mill') {
    shearRate = effectiveRpm * 35.0;
    heatGenerationRateCPerMin = (effectiveRpm / 1000) * 1.4;
    dropletSizeUm = 1.8;
    phenomena.push('膠體磨 (Colloid Mill) 利用精密定子與高速斜邊旋轉轉子（間隙 0.05~0.5 mm），對物料施加超高剪切力與水力剪切');
    if (mat.viscosity_cp > 1000 || mat.is_emulsion_system) {
      phenomena.push('✅ 對高黏度物料（如花生醬、濃稠沙拉醬）乳化與微粒細化效果極佳，油滴粒徑被微米化 (<2 µm)，乳化體系極為均勻安定');
      uniformityScore = 98;
      qualityScore = 96;
    } else if (mat.viscosity_cp < 5) {
      phenomena.push('低黏度液體通過膠體磨停留時間過短，剪切傳遞效率稍弱於高壓均質機');
    }
  } else if (equipment_type === 'pressure_homogenizer') {
    shearRate = 50000;
    dropletSizeUm = 0.6;
    phenomena.push('高壓均質機 (Homogenizer) 將粗乳化液加壓至 15~30 MPa，通過狹窄均質閥隙，利用劇烈空化爆炸 (Cavitation)、速度剪切與撞擊環碎化');
    if (mat.viscosity_cp < 200) {
      phenomena.push('✅ 適用於低黏度乳化系統（如生乳、低脂乳飲料），脂肪球直徑由 3~10 µm 劇烈碎化至 0.5~1 µm，徹底防止乳脂肪上浮分層 (Creaming)');
      uniformityScore = 99;
      qualityScore = 98;
    } else {
      phenomena.push('⚠️ 高黏度物料無法順利通過微小高壓閥門孔隙，產生閥門堵塞與泵浦過載風險');
      qualityScore -= 30;
      status = 'warning';
    }
  } else if (equipment_type === 'v_mixer') {
    // Blending Dry Powders Rule
    if (!mat.is_dry_powder) {
      phenomena.push('❌ V型調和機設計用於乾粉體系自由流動混合，處理液體或黏性物料時物料黏附於筒壁無法翻滾');
      uniformityScore = 20;
      qualityScore = 15;
      status = 'fail';
    } else {
      if (effectiveTime <= 12) {
        uniformityScore = Math.min(96, 50 + effectiveTime * 4.2);
        phenomena.push('V型混合機透過筒體連續 360° 旋轉，粉體在對稱兩臂中反覆分裂、聚合與對流擴散，達到良好均勻調和');
      } else {
        // Over blending / De-mixing
        demixingIndex = Math.min(80, (effectiveTime - 12) * 5.5);
        uniformityScore = Math.max(45, 96 - demixingIndex);
        phenomena.push('⚠️ 混合時間過長（>12 分鐘）發生「過度調和 (Over-blending)」！');
        phenomena.push('❌ 粒徑與密度差異較大之粉體因長時間滾動離心力與重力篩分，產生「反混合 (De-mixing / Segregation)」，大顆粒向上浮動、細粉下沉，均勻度不升反降');
        qualityScore -= 35;
        status = 'warning';
      }
    }
  }

  // Temperature Simulation calculation
  let tempDelta = 0;
  if (cooling_jacket) {
    // Cooling jacket draws heat out: cooling capacity
    const coolingDelta = (initialTemp - 4) * 0.15 * effectiveTime;
    const netHeat = heatGenerationRateCPerMin * effectiveTime * 0.35 - coolingDelta;
    tempDelta = Math.max(-5, netHeat);
  } else {
    tempDelta = heatGenerationRateCPerMin * effectiveTime;
  }

  const finalTemp = Math.round((initialTemp + tempDelta) * 10) / 10;
  
  let tempTrend = '持平穩定';
  if (tempDelta > 10) tempTrend = `劇烈上升 (${initialTemp}°C ➔ ${finalTemp}°C)`;
  else if (tempDelta > 3) tempTrend = `顯著升溫 (${initialTemp}°C ➔ ${finalTemp}°C)`;
  else if (cooling_jacket && finalTemp <= 10) tempTrend = `穩定低溫冷卻 (${initialTemp}°C ➔ ${finalTemp}°C)`;
  else if (tempDelta < 0) tempTrend = `降溫冷卻 (${initialTemp}°C ➔ ${finalTemp}°C)`;

  // Generate temp history
  const tempHistory: { timeMin: number; temp: number; uniformity: number }[] = [];
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const t = (effectiveTime / steps) * i;
    const fraction = i / steps;
    const curTemp = Math.round((initialTemp + tempDelta * fraction) * 10) / 10;
    let curUniformity = 0;
    if (equipment_type === 'v_mixer' && effectiveTime > 12) {
      if (t <= 10) curUniformity = Math.round(50 + t * 4.5);
      else curUniformity = Math.round(95 - (t - 10) * 4);
    } else {
      curUniformity = Math.min(uniformityScore, Math.round(30 + fraction * (uniformityScore - 30)));
    }
    tempHistory.push({ timeMin: Math.round(t * 10) / 10, temp: curTemp, uniformity: Math.max(0, curUniformity) });
  }

  // Power estimate
  const powerKW = Math.round((0.5 + (mat.viscosity_cp / 50000) * 2.5 + (effectiveRpm / 500) * 1.2) * 10) / 10;

  // Final scores clamp
  uniformityScore = Math.max(10, Math.min(100, uniformityScore));
  qualityScore = Math.max(10, Math.min(100, qualityScore));

  if (uniformityScore < 60 || qualityScore < 60) status = 'fail';
  else if (uniformityScore < 85 || qualityScore < 85) status = status === 'fail' ? 'fail' : 'warning';

  // Double loop questions generator
  const singleLoopQ = generateSingleLoopQuestion(input, status, mat, finalTemp);
  const doubleLoopQ = generateDoubleLoopQuestion(input, status, mat);

  const tutorAnalysis = generateTutorAnalysis(input, status, mat, finalTemp, uniformityScore, qualityScore, phenomena);

  const extraMetrics: SimulationExtraMetrics = {
    reynolds_number: reynoldsNumber,
    flow_regime: flowRegime,
    shear_rate_sec: Math.round(shearRate * 10) / 10,
    power_consumption_kw: powerKW,
    vortex_depth_cm: Math.round(vortexDepthCm * 10) / 10,
    air_entrapment_pct: Math.round(airEntrapmentPct * 10) / 10,
    oxidation_risk: airEntrapmentPct > 25 && mat.is_oxidation_sensitive ? '極高 (Critical)' : airEntrapmentPct > 10 ? '中 (Medium)' : '低 (Low)',
    protein_denaturation_pct: Math.round(proteinDenaturationPct),
    emulsion_droplet_d50_um: dropletSizeUm,
    segregation_de_mixing_index: Math.round(demixingIndex),
    temp_history: tempHistory,
  };

  return {
    simulation_status: status,
    uniformity_percentage: uniformityScore,
    temperature_trend: tempTrend,
    final_temperature_celsius: finalTemp,
    physical_phenomena: phenomena,
    grading: {
      uniformity_score: uniformityScore,
      product_quality_score: qualityScore,
    },
    tutor_analysis: tutorAnalysis,
    double_loop_questions: [
      `單迴圈反思 (Single-Loop)：${singleLoopQ}`,
      `雙迴圈關鍵提問 (Double-Loop)：${doubleLoopQ}`,
    ],
    extra_metrics: extraMetrics,
  };
}

function generateSingleLoopQuestion(input: SimulationInput, status: string, mat: MaterialProperty, finalTemp: number): string {
  if (mat.is_protein_sensitive && !input.cooling_jacket) {
    return `在不更換「${input.equipment_type}」設備的前提下，若要防止物料溫度升破蛋白質變性溫度（如 10°C），你應該立刻開啟哪項控溫設施或調整什麼操作參數（如轉速、時間）？`;
  }
  if (input.equipment_type === 'v_mixer' && input.mixing_time_min > 12) {
    return `若想消除乾粉在調和後期因重力與粒徑差造成的反混合（De-mixing）現象，操作時間應如何修正？到達最佳均勻點後應採取什麼即時工序？`;
  }
  if (input.equipment_type === 'paddle' && input.rpm > 300) {
    return `如果不能更換攪拌葉片，要如何在當前槽體中抑制中心深漩渦產生，或者轉速應下調至多少 RPM 以減少液面空氣捲入？`;
  }
  if (input.equipment_type === 'propeller' && mat.is_oxidation_sensitive) {
    return `在維持適當混合效果的前提下，如何透過加裝「槽壁擋板 (Baffles)」或降低轉速來減少果汁與空氣的接觸面積？`;
  }
  return `在目前所選設備架構下，若要進一步優化「${input.target_product_goal}」的指標數值，你可以微調哪些具體技術參數（如：操作轉速 RPM、操作時間、溫度控制等）？`;
}

function generateDoubleLoopQuestion(input: SimulationInput, status: string, mat: MaterialProperty): string {
  if (mat.is_emulsion_system && input.equipment_type === 'paddle') {
    return `請重新檢視你最初的設備選型假設。你選擇了「槳式攪拌機 (Paddle)」來處理油水不互溶乳化系統，這是否代表你低估了介面微滴分散所需的剪切力（Shear force）等級？若從產品結構定義來看，乳化體系的本質需要何種等級的流體力學機制（如膠體磨的微米剪切或高壓均質的空化爆裂）？`;
  }
  if (mat.is_protein_sensitive && (input.raw_material.includes('肉') || input.raw_material.includes('貢丸'))) {
    return `請從食品化學與熱力學的底層視角思考：貢丸的「Q彈口感」本質上是建立在什麼分子層次的交聯網狀結構？當我們在思考生產效率（追求高 RPM 與快速完成）時，是否忽視了「機械能轉化為熱能」對天然鹽溶性蛋白質空間構型的不可逆破壞？`;
  }
  if (input.equipment_type === 'v_mixer') {
    return `在傳統心智模型中，我們常直覺認為「攪拌越久一定越均勻」。這個模擬結果是否挑戰了你對混合熱力學「熵增與顆粒重力分層」的根本認知？你該如何重新定義固體乾粉調和的「製程終點 (End point)」？`;
  }
  if (mat.is_fermentation) {
    return `「空氣包入」在果汁加工中是劣化的罪魁禍首，但在發酵工程中卻是關鍵生長因子。這反映出同一個物理現象在不同食品體系中的價值完全相反。這對你在制定不同產品的設備規格與流場設計時，帶來了什麼樣的典範思維啟發？`;
  }
  return `請跳脫單純的參數微調，重新審視你的「產品目標與物料流變學本質」：你目前選擇的設備機制（攪拌/捏揉/乳化/調和），與物料在微觀尺度下的分子交互作用力是否真正匹配？為什麼？`;
}

function generateTutorAnalysis(
  input: SimulationInput,
  status: string,
  mat: MaterialProperty,
  finalTemp: number,
  uniformity: number,
  quality: number,
  phenomena: string[]
): string {
  const { raw_material, equipment_type, rpm, mixing_time_min, cooling_jacket } = input;
  
  if (mat.is_protein_sensitive && (raw_material.includes('肉') || raw_material.includes('貢丸') || raw_material.includes('魚漿'))) {
    if (!cooling_jacket) {
      return `同學你好！這是一次極具教學意義的模擬結果。在肉糜擂潰過程中，物料具有極高黏滯係數（約 85,000 cP），機械旋轉將大量的能量轉化為摩擦熱。當缺少「夾套冰水冷卻」時，肉溫由初始低溫迅速攀升至 ${finalTemp}°C。食品生物化學告訴我們：肌原纖維中的鹽溶性肌球蛋白（Myosin）在超過 12~15°C 時會發生不可逆的空間構型變性，導致蛋白質提早變性凝聚，無法在後續加熱熟成時形成緊密的三維凝膠網絡，這正是貢丸失去脆度彈性、發生出水軟爛的關鍵科學因果。`;
    } else {
      return `做得非常出色！你精準開啟了「夾套冷卻」系統。在豎立式捏揉的高剪切作用下，雖然機械摩擦產生可觀熱量，但冰水夾套即時將熱能導出，將終溫穩定控制在 ${finalTemp}°C 的低溫安全區。這使得鹽溶性蛋白質能充分展開活性頭部，在保持空間構型的前提下與水分子及脂肪微滴形成極致緊密、富含彈性的天然網狀乳糜結構，達成了 ${quality} 分的極高產品品質！`;
    }
  }

  if (equipment_type === 'paddle' && mat.is_emulsion_system) {
    return `同學請注意：槳式攪拌機（Paddle）是典型的低轉速、低剪切設備，其主要流場為整體對流而非局部高剪切。油水不互溶體系的乳化需要克服極高的介面自由能（ΔG = γ·ΔA），將油相碎化為微米級分散微滴。由於槳式攪拌機提供的韋伯數（Weber Number）遠低於臨界乳化閾值，油滴無法被剪切撕裂，靜置後必然迅速發生浮油分層，這也是本次均勻度與品質受限的根本原因。`;
  }

  if (equipment_type === 'v_mixer' && input.mixing_time_min > 12) {
    return `這是一個非常經典的「反混合（De-mixing）」案例！在固體粉體工程中，不同粒徑與密度的顆粒在 V 型混合機內受重力與離心力作用。在適當時間內（約 5~10 分鐘），擴散與對流佔優勢，均勻度達到峰值；然而一旦操作時間長達 ${mixing_time_min} 分鐘，過度的相對運動使得細粉向下滲透、粗顆粒向上浮聚（巴西堅果效應），導致均一性反而由高點下滑至 ${uniformity}%。請記住：乾粉調和並非時間越長越好，抓準平衡終點即刻出料是食品粉體工程的黃金法則。`;
  }

  return `同學好！從流體力學與食品工程的角度審視本組數據：在物料「${raw_material}」與設備「${equipment_type}」的交互作用下，系統在 ${rpm} RPM 的運轉下呈現出相應的流場特性。本次模擬均勻度達到 ${uniformity}%，產品品質評分為 ${quality} 分。請仔細觀察物理現象清單中的微觀變化，並透過後續的雙迴圈引導問題，深化你對設備動能傳遞與食品物理化學變化的因果理解。`;
}
