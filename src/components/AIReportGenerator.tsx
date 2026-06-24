import { useState, useEffect } from "react";
import {
  Sparkles,
  Zap,
  Shield,
  Trophy,
  TrendingUp,
  GitBranch,
  CheckCircle,
  Activity,
  Award,
  Code2,
  Cpu,
  Database,
  Globe,
  Clock,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { CommitInfo, AIAnalysisResult, AIAchievement } from "../types";

interface AIReportGeneratorProps {
  commits: CommitInfo[];
  analysisResult: AIAnalysisResult | null;
  onGenerate: () => Promise<void>;
  isAnalyzing: boolean;
  error: string | null;
}

const LOADING_STEPS = [
  "Analyzing commit messages and repository metrics...",
  "Clustering developer focal points and tech stack signatures...",
  "Running Gemini generative telemetry checks...",
  "Synthesizing key achievements and engineering accomplishments...",
  "Composing tactical productivity insights & recommendations...",
];

const ICON_MAP: { [key: string]: any } = {
  Zap,
  Shield,
  Trophy,
  TrendingUp,
  GitBranch,
  CheckCircle,
  Activity,
  Award,
  Code2,
  Cpu,
  Database,
  Globe,
  Clock,
};

export default function AIReportGenerator({
  commits,
  analysisResult,
  onGenerate,
  isAnalyzing,
  error,
}: AIReportGeneratorProps) {
  const [loadingTextIdx, setLoadingTextIdx] = useState(0);

  // Cycle loader texts
  useEffect(() => {
    if (!isAnalyzing) return;
    
    setLoadingTextIdx(0);
    const interval = setInterval(() => {
      setLoadingTextIdx((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const renderIcon = (iconName: string) => {
    const Component = ICON_MAP[iconName] || Trophy;
    return <Component className="w-5 h-5" />;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" id="ai-report-card">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600 fill-indigo-100 animate-pulse" />
            <span>AI-Powered Progress Analysis</span>
          </h2>
          <p className="text-xs text-slate-500">
            Let Gemini analyze your commit registry to uncover patterns and achievements
          </p>
        </div>
        
        {analysisResult && !isAnalyzing && (
          <button
            onClick={onGenerate}
            className="inline-flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-100 active:scale-95 transition-all font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Analysis</span>
          </button>
        )}
      </div>

      {/* Main interactive state container */}
      {isAnalyzing ? (
        /* LOADING STATE */
        <div className="py-16 text-center space-y-4 max-w-md mx-auto animate-pulse">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-50 text-indigo-600 rounded-full">
            <Sparkles className="w-8 h-8 animate-spin" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-800 font-mono">
              Generating Progress Report...
            </h3>
            <p className="text-xs text-slate-500 min-h-[40px] leading-relaxed transition-all">
              {LOADING_STEPS[loadingTextIdx]}
            </p>
          </div>
        </div>
      ) : error ? (
        /* ERROR STATE */
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start space-x-3 max-w-xl mx-auto">
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="text-xs font-semibold">Could not complete AI Analysis</h4>
            <p className="text-xs leading-relaxed">{error}</p>
            <button
              onClick={onGenerate}
              className="mt-2 text-[11px] font-semibold text-rose-800 hover:underline inline-flex items-center space-x-1"
            >
              <span>Retry Analysis</span>
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : !analysisResult ? (
        /* EMPTY CTA STATE */
        <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/40 p-6 max-w-xl mx-auto space-y-4">
          <div className="inline-flex items-center justify-center p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900">
              Ready for Developer Insights?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Select one or more active repositories to let the model generate progress metrics, unlocked achievements, language tags, and custom summaries.
            </p>
          </div>
          <button
            onClick={onGenerate}
            disabled={commits.length === 0}
            className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition shadow disabled:opacity-50 disabled:pointer-events-none active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-indigo-300 fill-indigo-500" />
            <span>Generate Progress Report</span>
          </button>
          {commits.length === 0 && (
            <p className="text-[10px] text-amber-600 font-medium">
              * Please connect GitHub and select repositories with commits to analyze.
            </p>
          )}
        </div>
      ) : (
        /* RENDER SUCCESS REPORT STATE */
        <div className="space-y-8 animate-fadeIn">
          
          {/* Executive Summary */}
          <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-mono text-slate-500 uppercase tracking-wider">
              Executive Summary
            </h3>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3">
              {analysisResult.summary.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>

          {/* Effort Split & Allocation */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono text-slate-500 uppercase tracking-wider">
              Work & Effort Allocation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {analysisResult.categories.map((cat, i) => (
                <div key={i} className="border border-slate-100 bg-white p-4 rounded-xl flex flex-col justify-between space-y-2.5 shadow-sm hover:border-slate-200 transition">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800">{cat.name}</span>
                      <span className="font-mono text-slate-500 font-semibold">{cat.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-slate-900 h-full rounded-full"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono text-slate-500 uppercase tracking-wider">
              Milestones & Achievements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisResult.achievements.map((ach, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-100 hover:border-slate-200 p-4 rounded-xl flex items-start space-x-3 shadow-sm hover:shadow-md transition duration-150"
                >
                  <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-lg flex-shrink-0">
                    {renderIcon(ach.icon)}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800">{ach.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{ach.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lower Analytics Block (Tech Tagging + Actionable Insights) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-slate-100">
            {/* Technologies */}
            <div className="md:col-span-1 space-y-3">
              <h3 className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                Tech Stack Profile
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {analysisResult.technologies.map((tech, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-900 text-white font-mono"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Smart Suggestions & Insights */}
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-xs font-mono text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Tactical Insights & Suggestions</span>
              </h3>
              <ul className="space-y-2">
                {analysisResult.insights.map((insight, i) => (
                  <li key={i} className="flex items-start space-x-2.5 text-xs text-slate-600 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
