import { ExternalLink, GitCommit, Search, ArrowRight } from "lucide-react";
import { useState } from "react";
import { CommitInfo } from "../types";

interface CommitHistoryProps {
  commits: CommitInfo[];
  isLoading: boolean;
}

export default function CommitHistory({ commits, isLoading }: CommitHistoryProps) {
  const [search, setSearch] = useState("");

  const filteredCommits = commits.filter(
    (c) =>
      c.message.toLowerCase().includes(search.toLowerCase()) ||
      c.repoName.toLowerCase().includes(search.toLowerCase()) ||
      c.author.toLowerCase().includes(search.toLowerCase())
  );

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 30) return `${diffDays} days ago`;
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm" id="commit-history-card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center space-x-2">
            <GitCommit className="w-5 h-5 text-slate-700" />
            <span>Recent Commit History</span>
          </h2>
          <p className="text-xs text-slate-500">
            Showing most recent commits across selected repositories
          </p>
        </div>
      </div>

      {/* Search Bar for commits */}
      <div className="relative mb-4">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </span>
        <input
          type="text"
          placeholder="Filter commits by message, repository, or author..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 bg-slate-50 focus:bg-white transition"
          id="commit-search-input"
        />
      </div>

      {/* Commit List Timeline */}
      <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-6 max-h-[420px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 mb-2" />
            <p className="text-sm font-mono">Loading commit timeline...</p>
          </div>
        ) : filteredCommits.length > 0 ? (
          filteredCommits.map((commit) => (
            <div key={commit.sha} className="relative group/item animate-fadeIn">
              {/* Timeline marker */}
              <span className="absolute -left-[31px] top-1.5 flex items-center justify-center w-2.5 h-2.5 rounded-full bg-white border border-slate-300 ring-4 ring-white group-hover/item:border-slate-900 group-hover/item:bg-slate-900 transition-colors duration-150" />

              <div className="p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all duration-150">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="space-y-1">
                    {/* Commit Message */}
                    <p className="text-sm font-semibold text-slate-800 leading-snug">
                      {commit.message}
                    </p>

                    {/* Meta info */}
                    <div className="flex items-center space-x-2.5 flex-wrap text-xs text-slate-400 pt-0.5">
                      {/* Author */}
                      <div className="flex items-center space-x-1.5">
                        <img
                          src={commit.authorAvatar}
                          alt={commit.author}
                          className="w-4.5 h-4.5 rounded-full border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                        <span className="font-semibold text-slate-600">{commit.author}</span>
                      </div>

                      <span className="text-slate-300">•</span>

                      {/* Repo tag */}
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 font-mono">
                        {commit.repoName}
                      </span>

                      <span className="text-slate-300">•</span>

                      {/* Timeago */}
                      <span className="font-mono text-[10px]">{formatTimeAgo(commit.date)}</span>
                    </div>
                  </div>

                  {/* Actions / External Link */}
                  <div className="flex items-center space-x-2 self-end sm:self-start flex-shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono hidden group-hover/item:inline-block">
                      {commit.sha.substring(0, 7)}
                    </span>
                    <a
                      href={commit.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="View on GitHub"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-400 -ml-4 pl-0">
            <p className="text-sm">No commits found.</p>
            <p className="text-xs mt-1">Make sure you have selected repositories that contain commit history.</p>
          </div>
        )}
      </div>
    </div>
  );
}
