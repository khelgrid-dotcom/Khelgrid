import { GitCommit, Calendar, Code, BarChart3, Clock, Flame } from "lucide-react";
import { CommitInfo, GitHubRepo } from "../types";

interface AnalyticsDashboardProps {
  commits: CommitInfo[];
  selectedRepos: GitHubRepo[];
}

export default function AnalyticsDashboard({ commits, selectedRepos }: AnalyticsDashboardProps) {
  // 1. Compute Analytics
  const totalCommits = commits.length;
  const totalRepos = selectedRepos.length;

  // Active Days count (unique calendar days in local time)
  const activeDays = Array.from(
    new Set(
      commits.map((c) => {
        try {
          return new Date(c.date).toISOString().split("T")[0];
        } catch {
          return "";
        }
      })
    )
  ).filter(Boolean);

  const totalActiveDaysCount = activeDays.length;

  // Most active repo name
  const repoCounts: { [key: string]: number } = {};
  commits.forEach((c) => {
    repoCounts[c.repoName] = (repoCounts[c.repoName] || 0) + 1;
  });
  let topRepo = "N/A";
  let topRepoCount = 0;
  Object.entries(repoCounts).forEach(([name, count]) => {
    if (count > topRepoCount) {
      topRepo = name;
      topRepoCount = count;
    }
  });

  // Language Breakdown from selected repos
  const langCounts: { [key: string]: number } = {};
  selectedRepos.forEach((r) => {
    if (r.language) {
      langCounts[r.language] = (langCounts[r.language] || 0) + 1;
    }
  });
  const totalLanguages = Object.values(langCounts).reduce((a, b) => a + b, 0);
  const sortedLanguages = Object.entries(langCounts)
    .map(([name, count]) => ({
      name,
      percentage: totalLanguages ? Math.round((count / totalLanguages) * 100) : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Commit Frequency by Weekday
  // Index 0: Sunday, 1: Monday, etc.
  const weekdayCounts = Array(7).fill(0);
  commits.forEach((c) => {
    try {
      const day = new Date(c.date).getDay();
      weekdayCounts[day]++;
    } catch {}
  });
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const maxWeekdayCount = Math.max(...weekdayCounts, 1);

  // Streak calculation (consecutive calendar days)
  const calculateStreak = () => {
    if (activeDays.length === 0) return 0;
    
    // Sort descending
    const sortedDates = [...activeDays].map(d => new Date(d).getTime()).sort((a, b) => b - a);
    let streak = 0;
    const oneDayMs = 24 * 60 * 60 * 1000;
    const today = new Date().setHours(0, 0, 0, 0);

    // Check if the most recent active day is today or yesterday
    const latestActiveDate = new Date(sortedDates[0]).setHours(0, 0, 0, 0);
    if (today - latestActiveDate > oneDayMs) {
      return 0; // Streak broken
    }

    streak = 1;
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const diff = sortedDates[i] - sortedDates[i + 1];
      if (diff <= oneDayMs + 1000 * 60 * 60) { // accounting for daylight savings
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const streakCount = calculateStreak();

  return (
    <div className="space-y-6" id="analytics-panel">
      {/* 4x1 Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="bg-slate-100 text-slate-900 p-2.5 rounded-xl">
            <GitCommit className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">Total Commits</p>
            <p className="text-xl font-bold font-mono text-slate-900">{totalCommits}</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="bg-slate-100 text-slate-900 p-2.5 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">Active Days</p>
            <p className="text-xl font-bold font-mono text-slate-900">{totalActiveDaysCount}</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="bg-slate-100 text-slate-900 p-2.5 rounded-xl">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">Coding Streak</p>
            <p className="text-xl font-bold font-mono text-slate-900">
              {streakCount} {streakCount === 1 ? "day" : "days"}
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="bg-slate-100 text-slate-900 p-2.5 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">Top Project</p>
            <p className="text-sm font-semibold text-slate-900 truncate max-w-[130px]" title={topRepo}>
              {topRepo !== "N/A" ? topRepo : "No Data"}
            </p>
            {topRepoCount > 0 && (
              <p className="text-[10px] text-slate-400 font-mono">{topRepoCount} commits</p>
            )}
          </div>
        </div>
      </div>

      {/* Visual Analytics Block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Activity Density */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center space-x-1.5">
            <BarChart3 className="w-4 h-4 text-slate-700" />
            <span>Commit Distribution by Weekday</span>
          </h3>
          
          <div className="flex items-end justify-between h-40 pt-4 px-2">
            {weekdays.map((day, idx) => {
              const count = weekdayCounts[idx];
              const percent = Math.max(5, Math.round((count / maxWeekdayCount) * 100));
              return (
                <div key={day} className="flex flex-col items-center flex-1 group">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-mono rounded px-1.5 py-0.5 mb-2 -translate-y-1 absolute z-10 pointer-events-none shadow">
                    {count} {count === 1 ? "commit" : "commits"}
                  </div>
                  <div className="w-full px-1.5 sm:px-3">
                    <div
                      style={{ height: `${percent}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        count > 0 ? "bg-slate-900 hover:bg-slate-800" : "bg-slate-100"
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-2">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Technologies Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center space-x-1.5">
            <Code className="w-4 h-4 text-slate-700" />
            <span>Project Language Profile</span>
          </h3>
          
          {sortedLanguages.length > 0 ? (
            <div className="space-y-3.5 pt-2">
              {sortedLanguages.map((lang) => (
                <div key={lang.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{lang.name}</span>
                    <span className="font-mono text-slate-500">{lang.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-900 h-full rounded-full transition-all duration-500"
                      style={{ width: `${lang.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-xs">
              <p>No repository languages identified yet.</p>
              <p className="mt-0.5">Languages are parsed from selected repositories.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
