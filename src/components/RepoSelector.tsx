import { useState } from "react";
import { Search, Star, GitFork, Shield, ShieldAlert, CheckSquare, Square, FolderGit2 } from "lucide-react";
import { GitHubRepo } from "../types";

interface RepoSelectorProps {
  repos: GitHubRepo[];
  selectedRepoIds: number[];
  onToggleRepo: (repo: GitHubRepo) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

// GitHub Language Colors mapping
const LANGUAGE_COLORS: { [key: string]: string } = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Python: "#3572a5",
  Java: "#b07219",
  Go: "#00add8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4f5d95",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Shell: "#89e051",
  Kotlin: "#a97bff",
  Swift: "#f05138",
};

export default function RepoSelector({
  repos,
  selectedRepoIds,
  onToggleRepo,
  onSelectAll,
  onDeselectAll,
}: RepoSelectorProps) {
  const [search, setSearch] = useState("");

  const filteredRepos = repos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(search.toLowerCase()) ||
      (repo.description && repo.description.toLowerCase().includes(search.toLowerCase())) ||
      (repo.language && repo.language.toLowerCase().includes(search.toLowerCase()))
  );

  const getLanguageColor = (lang: string | null) => {
    if (!lang) return "#9ca3af";
    return LANGUAGE_COLORS[lang] || "#4b5563";
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm" id="repo-selector-card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center space-x-2">
            <FolderGit2 className="w-5 h-5 text-slate-700" />
            <span>Select Repositories to Track</span>
          </h2>
          <p className="text-xs text-slate-500">
            {selectedRepoIds.length} of {repos.length} repos selected
          </p>
        </div>
        
        {/* Bulk select buttons */}
        <div className="flex space-x-2 text-xs">
          <button
            onClick={onSelectAll}
            disabled={repos.length === 0}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-medium transition disabled:opacity-50 disabled:pointer-events-none"
          >
            Select All
          </button>
          <button
            onClick={onDeselectAll}
            disabled={selectedRepoIds.length === 0}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-medium transition disabled:opacity-50 disabled:pointer-events-none"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </span>
        <input
          type="text"
          placeholder="Search repositories by name, description, or language..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 bg-slate-50 focus:bg-white transition"
          id="repo-search-input"
        />
      </div>

      {/* Repos List */}
      <div className="max-h-[380px] overflow-y-auto pr-1 space-y-2 divide-y divide-slate-50">
        {filteredRepos.length > 0 ? (
          filteredRepos.map((repo) => {
            const isSelected = selectedRepoIds.includes(repo.id);
            return (
              <div
                key={repo.id}
                onClick={() => onToggleRepo(repo)}
                className={`flex items-start justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? "bg-slate-50/80 border border-slate-200 shadow-sm"
                    : "hover:bg-slate-50 border border-transparent"
                }`}
              >
                <div className="flex items-start space-x-3 max-w-[85%]">
                  {/* Custom Checkbox */}
                  <div className="mt-1 flex-shrink-0 text-slate-400">
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-slate-900 fill-slate-50" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </div>

                  {/* Repo details */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="font-semibold text-slate-800 text-sm hover:underline" onClick={(e) => e.stopPropagation()}>
                        <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                          {repo.name}
                        </a>
                      </span>
                      {repo.private ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-100">
                          <ShieldAlert className="w-2.5 h-2.5 mr-0.5" />
                          Private
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <Shield className="w-2.5 h-2.5 mr-0.5" />
                          Public
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {repo.description || <span className="italic text-slate-400">No description provided</span>}
                    </p>

                    {/* Meta stats */}
                    <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-mono pt-1">
                      {repo.language && (
                        <span className="flex items-center space-x-1">
                          <span
                            className="w-2 h-2 rounded-full inline-block"
                            style={{ backgroundColor: getLanguageColor(repo.language) }}
                          />
                          <span>{repo.language}</span>
                        </span>
                      )}
                      
                      <span className="flex items-center space-x-0.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>{repo.stargazers_count}</span>
                      </span>

                      <span className="flex items-center space-x-0.5">
                        <GitFork className="w-3 h-3" />
                        <span>{repo.forks_count}</span>
                      </span>

                      <span>Updated {formatDate(repo.pushed_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <p className="text-sm">No repositories found matching "{search}"</p>
            <p className="text-xs mt-1">Make sure GitHub is authorized and you have active repositories.</p>
          </div>
        )}
      </div>
    </div>
  );
}
