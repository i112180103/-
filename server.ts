import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { simulateFoodProcessLocally } from './src/utils/foodPhysicsEngine';
import { SimulationInput, SimulationOutput } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client if API key is provided
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: !!process.env.GEMINI_API_KEY });
});

// Primary Food Engineering Simulation API
app.post('/api/simulate', async (req, res) => {
  const input: SimulationInput = req.body;

  // Compute deterministic physics foundation
  const localResult = simulateFoodProcessLocally(input);

  // If Gemini API is available, enhance with AI food engineering reasoning
  if (aiClient) {
    try {
      const systemInstruction = `你是一位精通食品工程與食品加工學的「AI 數位孿生模擬器與引導式導師」。
你的任務是根據學生輸入的「混合與攪拌參數」，進行極度精準的食品物理與化學變化動態模擬，並嚴格遵循以下食品加工工程邏輯：
1. 【攪拌 (Agitation - 低黏度液體)】：
   - 槳式 (Paddle)：轉速慢、剪切力低，適合互溶液體混合或預拌。無擋板高轉速會產生漩渦。
   - 螺旋槳 (Propeller)：葉片短、轉速高（500-1000 rpm），適合低黏度液體快速混合，具碎化作用。
   - 輪機 (Turbine)：多葉片、產生強大漩流，加擋板可防止繞流、促進均勻。
   - ⚠️ 漩渦與空氣包裹規則：低黏度液體在高流速（高 RPM）下會產生漩渦並包入空氣。發酵醪攪拌有助發酵溶氧；非發酵食品（果汁、油脂）則會因空氣接觸而氧化、營養流失、品質劣化。
2. 【捏揉 (Kneading - 高黏度/半固體)】：
   - 適用麵糰、乳油狀食品或肉糜（貢丸/魚漿）。
   - 豎立式捏揉機：揉和器 (Hook) 發揮麵筋筋性；拌合器 (Beater) 均勻粉末；打發器 (Whipper) 高速打入空氣。
   - 橫臥式捏和機（Z型反向旋轉）：適用低水分、高硬度材料。
   - ⚠️ 摩擦生熱與變性規則：高黏度材料捏揉時摩擦生熱劇烈。若模擬肉糜擂潰（貢丸/魚丸），必須開啟「夾套冰水冷卻」，否則溫度升高（>10~15°C）會導致肌肉纖維中的鹽溶性蛋白質（肌球蛋白）變性，失去凝膠成膠性與彈性。
3. 【乳化 (Emulsification - 油水不互溶系統)】：
   - 槳式攪拌機剪切力不足，無法用於最終乳化。
   - 高速螺旋槳或輪機式乳化機：提供強大剪切力，使油水相分散成微滴。
   - 高壓均質機 (Homogenizer)：利用高壓將低黏度粗乳化液通過狹窄孔隙爆裂碎化。
   - 膠體磨 (Colloid Mill)：利用斜邊圓盤高速旋轉的剪切力，處理高黏度物料乳化效果極佳。
   - 超音波乳化機：利用高頻振動（>10 kHz）產生空化效應碎化微滴。
4. 【調和 (Blending - 乾粉或固體體系)】：
   - 粒徑、比重不同會產生向下分離（Segregation）。過度調和（Over-blending）會導致反混合（De-mixing）使均一性降低，達到最佳效果後應及時停止並包裝。

【雙迴圈教學框架】：
- 單迴圈反思 (Single-loop)：當模擬結果不理想，引導學生調整技術參數（如：降溫、調整 RPM、更換葉片）。
- 雙迴圈反思 (Double-loop)：引導學生回到「原始假設與觀點（POV）」，思考例如「這個產品的定位是否一開始就選錯了設備種類？」、「是否需要重新定義產品的需求？」。

請以嚴格符合 Schema 的 JSON 輸出。`;

      const prompt = `請模擬以下食品加工混合操作：
物料名稱: ${input.raw_material}
設備類型: ${input.equipment_type}
操作轉速 (RPM): ${input.rpm}
操作時間 (分鐘): ${input.mixing_time_min}
冷卻夾套開啟: ${input.cooling_jacket ? '是 (開啟夾套冰水冷卻)' : '否 (未開啟冷卻)'}
目標產品訴求: ${input.target_product_goal}
配件選擇: ${input.attachment_type || '標準'}
槽壁擋板: ${input.has_baffles ? '有' : '無'}
初始溫度: ${input.initial_temp_celsius ?? '常規初始溫'}

請輸出極度精準的食品物理化學現象、評分、導師因果分析與雙迴圈反思問題。`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              simulation_status: {
                type: Type.STRING,
                description: 'must be success, warning, or fail',
              },
              uniformity_percentage: {
                type: Type.NUMBER,
                description: '0 to 100 percentage',
              },
              temperature_trend: {
                type: Type.STRING,
                description: 'e.g. 持平 / 劇烈上升 (4°C -> 22°C) / 穩定低溫',
              },
              final_temperature_celsius: {
                type: Type.NUMBER,
                description: 'final temperature in celsius',
              },
              physical_phenomena: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'List of detailed physical/chemical phenomena observed',
              },
              grading: {
                type: Type.OBJECT,
                properties: {
                  uniformity_score: { type: Type.NUMBER },
                  product_quality_score: { type: Type.NUMBER },
                },
                required: ['uniformity_score', 'product_quality_score'],
              },
              tutor_analysis: {
                type: Type.STRING,
                description: 'Food science professor tone detailed causal analysis',
              },
              double_loop_questions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Array containing single-loop and double-loop questions',
              },
            },
            required: [
              'simulation_status',
              'uniformity_percentage',
              'temperature_trend',
              'final_temperature_celsius',
              'physical_phenomena',
              'grading',
              'tutor_analysis',
              'double_loop_questions',
            ],
          },
        },
      });

      const parsed: SimulationOutput = JSON.parse(response.text || '{}');
      // Merge with deterministic extra metrics
      parsed.extra_metrics = localResult.extra_metrics;
      if (parsed.final_temperature_celsius && parsed.extra_metrics) {
        // adjust final point on curve
        const history = parsed.extra_metrics.temp_history;
        if (history && history.length > 0) {
          history[history.length - 1].temp = parsed.final_temperature_celsius;
        }
      }
      return res.json(parsed);
    } catch (err: any) {
      console.warn('Gemini simulation fallback to local physics engine:', err.message);
      return res.json(localResult);
    }
  }

  // Fallback to local physics engine
  return res.json(localResult);
});

// Evaluate Student Double-Loop Reflection API
app.post('/api/evaluate-reflection', async (req, res) => {
  const {
    simulation_input,
    simulation_output,
    student_single_loop_answer,
    student_double_loop_answer,
  } = req.body;

  if (aiClient) {
    try {
      const prompt = `你是一位食品科學系資深教授兼雙迴圈教學導師。
學生剛剛進行了一次食品加工模擬：
物料: ${simulation_input.raw_material}
設備: ${simulation_input.equipment_type}, 轉速: ${simulation_input.rpm} RPM, 時間: ${simulation_input.mixing_time_min} 分鐘, 夾套冷卻: ${simulation_input.cooling_jacket}
模擬結果: 均勻度 ${simulation_output.uniformity_percentage}%, 狀態 ${simulation_output.simulation_status}, 終溫 ${simulation_output.final_temperature_celsius}°C

模擬器提出的引導問題是：
${JSON.stringify(simulation_output.double_loop_questions, null, 2)}

學生的回答如下：
【單迴圈回答 (調整技術參數)】:
${student_single_loop_answer || '（未作答）'}

【雙迴圈回答 (檢視底層假設與產品本質)】:
${student_double_loop_answer || '（未作答）'}

請評估學生的回答深度：
1. 單迴圈評析：學生是否精準指出了具體工程參數的調整方向（如轉速、冷卻、時間、葉片類型）？
2. 雙迴圈評析：學生是否成功跳出單純的參數微調，觸及了流變學本質、微觀分子結構（如蛋白質空間構型、界面張力、粉體偏析熱力學）、或重新審視產品定義與設備選型哲學？
3. 給予 0-100 分數與溫暖、具啟發性的教授評語。`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER, description: 'Score between 0 and 100' },
              single_loop_evaluation: { type: Type.STRING, description: 'Evaluation of single loop answer' },
              double_loop_evaluation: { type: Type.STRING, description: 'Evaluation of double loop answer' },
              mentor_advice: { type: Type.STRING, description: 'Inspiring summary advice from food science professor' },
            },
            required: ['score', 'single_loop_evaluation', 'double_loop_evaluation', 'mentor_advice'],
          },
        },
      });

      return res.json(JSON.parse(response.text || '{}'));
    } catch (err: any) {
      console.warn('Gemini reflection evaluation fallback:', err.message);
    }
  }

  // Fallback evaluation
  const singleLen = (student_single_loop_answer || '').trim().length;
  const doubleLen = (student_double_loop_answer || '').trim().length;
  let score = 70;
  if (singleLen > 10) score += 12;
  if (doubleLen > 20) score += 15;

  return res.json({
    score: Math.min(98, score),
    single_loop_evaluation: singleLen > 0
      ? '你清楚指出了技術參數的調整邏輯，能敏銳辨識轉速與溫度控制對物理變化的直接影響。'
      : '建議針對操作轉速 (RPM)、夾套冷卻與操作時間進行更具體的數值化調整規劃。',
    double_loop_evaluation: doubleLen > 0
      ? '很好的反思！你觸及了物料在微觀分子尺度（如界面張力或蛋白質熱變性）的本質，開始跳脫既定設備框架重新思考加工原理。'
      : '雙迴圈思考的關鍵在於：不要只問「怎麼把這台機器調好」，而是問「為什麼一開始會認為這台設備的流場能滿足該物料的分子特性？」。',
    mentor_advice: '食品工程的核心就是「將宏觀機械動能精準轉化為微觀所需的分子排列」。繼續保持這種雙迴圈反思習慣，你將具備卓越的製程開發與除錯洞察力！',
  });
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Food Engineering Digital Twin Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
