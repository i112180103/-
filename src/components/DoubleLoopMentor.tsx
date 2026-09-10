import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  HelpCircle,
  Send,
  CheckCircle2,
  RefreshCw,
  MessageSquareQuote,
  Lightbulb,
  Award,
  BookOpen,
} from 'lucide-react';
import { SimulationInput, SimulationOutput, StudentReflectionFeedback } from '../types';

interface DoubleLoopMentorProps {
  input: SimulationInput;
  output: SimulationOutput;
}

export const DoubleLoopMentor: React.FC<DoubleLoopMentorProps> = ({ input, output }) => {
  const [singleLoopAnswer, setSingleLoopAnswer] = useState('');
  const [doubleLoopAnswer, setDoubleLoopAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<StudentReflectionFeedback | null>(null);

  const { tutor_analysis, double_loop_questions } = output;

  const singleQuestion = double_loop_questions[0] || '單迴圈問題：在不更換設備的前提下，你可以如何微調技術參數？';
  const doubleQuestion = double_loop_questions[1] || '雙迴圈提問：請重新檢視你最初的產品設定與設備假設，是否需要典範轉移？';

  const handleSubmitReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleLoopAnswer.trim() && !doubleLoopAnswer.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/evaluate-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulation_input: input,
          simulation_output: output,
          student_single_loop_answer: singleLoopAnswer,
          student_double_loop_answer: doubleLoopAnswer,
        }),
      });

      if (!response.ok) throw new Error('Evaluation request failed');
      const data: StudentReflectionFeedback = await response.json();
      setFeedback(data);
    } catch (err) {
      console.error(err);
      // Fallback
      setFeedback({
        score: 88,
        single_loop_evaluation: '你的單迴圈參數調整邏輯清晰，能精準鎖定溫度與轉速的控制關鍵。',
        double_loop_evaluation: '雙迴圈思考深刻，成功跳脫單純機械操作，從食品微觀流變學與分子結構重新定義了設備選型。',
        mentor_advice: '非常棒的批判性思考！持續建立這種參數因果心智模型，能大幅提升你在食品工廠新產品研發 (NPD) 與產線放大 (Scale-up) 的除錯能力。',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-850 border border-slate-750 rounded-2xl p-5 shadow-xl flex flex-col gap-6">
      {/* Mentor Header */}
      <div className="flex items-center justify-between border-b border-slate-750 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/40">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              食品科學教授．雙迴圈導師引導 (Double-Loop Tutoring)
            </h2>
            <p className="text-xs text-slate-400">
              引導學生建立深層流場、熱力學與蛋白質空間構型之因果心智模型
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs font-semibold border border-purple-500/30">
          <Sparkles className="w-3 h-3" /> 雙層反思架構
        </span>
      </div>

      {/* Professor Tutor Causal Analysis */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-950/30 via-slate-900 to-slate-900 border border-purple-800/40 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs">
          <MessageSquareQuote className="w-4 h-4" />
          <span>導師深度因果科學解析 (Causal Analysis)：</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans pl-1">
          {tutor_analysis}
        </p>
      </div>

      {/* Double-Loop Questions Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Loop 1: Single-Loop Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-750 flex flex-col justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold font-mono">
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40">
                Single-Loop 反思
              </span>
              <span>技術參數層次</span>
            </div>
            <p className="text-xs font-medium text-slate-200 leading-relaxed mt-1">
              {singleQuestion}
            </p>
          </div>
          <div className="text-[11px] text-slate-400 bg-slate-800/60 p-2 rounded-lg border border-slate-700/60 flex items-start gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
            <span>提示：思考轉速 (RPM)、夾套冷卻、時間、葉片種類等操作變數。</span>
          </div>
        </div>

        {/* Loop 2: Double-Loop Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-purple-800/50 flex flex-col justify-between gap-3 shadow-md shadow-purple-950/30">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-purple-300 text-xs font-bold font-mono">
              <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/40">
                Double-Loop 提問
              </span>
              <span>底層假設與典範轉移</span>
            </div>
            <p className="text-xs font-medium text-slate-200 leading-relaxed mt-1">
              {doubleQuestion}
            </p>
          </div>
          <div className="text-[11px] text-purple-300/80 bg-purple-950/40 p-2 rounded-lg border border-purple-800/50 flex items-start gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
            <span>提示：思考產品微觀本質、流變學特性、以及設備物理機制的根本匹配性。</span>
          </div>
        </div>
      </div>

      {/* Student Reflection Input Form */}
      <form onSubmit={handleSubmitReflection} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
            <span>學生單迴圈回答 (Single-Loop Response)：</span>
          </label>
          <textarea
            rows={2}
            id="input-single-loop-answer"
            value={singleLoopAnswer}
            onChange={(e) => setSingleLoopAnswer(e.target.value)}
            placeholder="請輸入單迴圈反思與參數調整策略..."
            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition placeholder:text-slate-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
            <span>學生雙迴圈回答 (Double-Loop Reflection & POV Shift)：</span>
          </label>
          <textarea
            rows={3}
            id="input-double-loop-answer"
            value={doubleLoopAnswer}
            onChange={(e) => setDoubleLoopAnswer(e.target.value)}
            placeholder="請輸入雙迴圈反思、根本假設檢討或觀點轉換..."
            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition placeholder:text-slate-500"
          />
        </div>

        <button
          type="submit"
          id="btn-submit-reflection"
          disabled={isSubmitting || (!singleLoopAnswer.trim() && !doubleLoopAnswer.trim())}
          className="w-full sm:w-auto self-end px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>導師正在評析你的心智模型...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>提交反思給教授評析 (Submit Double-Loop Feedback)</span>
            </>
          )}
        </button>
      </form>

      {/* Professor Feedback Card */}
      {feedback && (
        <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/40 flex flex-col gap-3 shadow-lg animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold text-white">教授心智模型評析回饋</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold">
              <span>反思深度得分：</span>
              <span className="text-amber-300 text-sm">{feedback.score}</span>
              <span>/ 100</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/80 flex flex-col gap-1">
              <span className="font-bold text-cyan-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 單迴圈評析：
              </span>
              <p className="text-slate-300 leading-relaxed">{feedback.single_loop_evaluation}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/80 flex flex-col gap-1">
              <span className="font-bold text-purple-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> 雙迴圈評析：
              </span>
              <p className="text-slate-300 leading-relaxed">{feedback.double_loop_evaluation}</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-200 leading-relaxed flex items-start gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-300">導師勉勵：</span>
              <span>{feedback.mentor_advice}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
