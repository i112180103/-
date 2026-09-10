export type EquipmentType =
  | 'paddle'
  | 'propeller'
  | 'turbine'
  | 'vertical_kneader'
  | 'horizontal_kneader'
  | 'colloid_mill'
  | 'pressure_homogenizer'
  | 'v_mixer';

export type VerticalAttachment = 'hook' | 'beater' | 'whipper';

export interface SimulationInput {
  raw_material: string;
  equipment_type: EquipmentType;
  rpm: number;
  mixing_time_min: number;
  cooling_jacket: boolean;
  target_product_goal: string;
  attachment_type?: VerticalAttachment;
  has_baffles?: boolean;
  initial_temp_celsius?: number;
}

export interface SimulationGrading {
  uniformity_score: number;
  product_quality_score: number;
}

export interface SimulationExtraMetrics {
  reynolds_number: number;
  flow_regime: '層流 (Laminar)' | '過渡流 (Transitional)' | '紊流 (Turbulent)';
  shear_rate_sec: number;
  power_consumption_kw: number;
  vortex_depth_cm: number;
  air_entrapment_pct: number;
  oxidation_risk: '低 (Low)' | '中 (Medium)' | '極高 (Critical)';
  protein_denaturation_pct: number;
  emulsion_droplet_d50_um: number;
  segregation_de_mixing_index: number; // 0 (perfect) to 100 (complete segregation/demixing)
  temp_history: { timeMin: number; temp: number; uniformity: number }[];
}

export interface SimulationOutput {
  simulation_status: 'success' | 'warning' | 'fail';
  uniformity_percentage: number;
  temperature_trend: string;
  final_temperature_celsius: number;
  physical_phenomena: string[];
  grading: SimulationGrading;
  tutor_analysis: string;
  double_loop_questions: string[];
  extra_metrics?: SimulationExtraMetrics;
}

export interface PresetCase {
  id: string;
  title: string;
  category: '攪拌 (Agitation)' | '捏揉 (Kneading)' | '乳化 (Emulsification)' | '調和 (Blending)';
  description: string;
  learningFocus: string;
  input: SimulationInput;
}

export interface StudentReflectionFeedback {
  score: number;
  single_loop_evaluation: string;
  double_loop_evaluation: string;
  mentor_advice: string;
}
