import { useState, useEffect } from "react";
import { Github, Sparkles, FolderGit2, LineChart, AlertCircle, HelpCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import Navbar from "./components/Navbar";
import RepoSelector from "./components/RepoSelector";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import CommitHistory from "./components/CommitHistory";
import AIReportGenerator from "./components/AIReportGenerator";
import { GitHubUser, GitHubRepo, CommitInfo, AIAnalysisResult } from "./types";

export default function App() {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepoIds, setSelectedRepoIds] = useState<number[]>([]);
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  
  // Cache of AI report analysis
  const [aiReport, setAiReport] = useState<AIAnalysisResult | null>(null);

  // States for UX loadings/errors
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Load token and selections from LocalStorage on load
  useEffect(() => {
    const token = localStorage.getItem("github_access_token");
    if (token) {
      setUserToken(token);
    }
    setIsInitializing(false);
  }, []);

  // Fetch User and Repos when token is active
  useEffect(() => {
    if (!userToken) {
      setUser(null);
      setRepos([]);
      setCommits([]);
      setAiReport(null);
      return;
    }

    const fetchUserData = async () => {
      setIsLoadingUser(true);
      try {
        const res = await fetch("/api/github/user", {
          headers: {
            "x-github-token": userToken,
          },
        });
        if (!res.ok) {
          throw new Error("Failed to authenticate with stored GitHub token");
        }
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("User fetch error:", err);
        // Token might have expired or been revoked
        handleDisconnect();
      } finally {
        setIsLoadingUser(false);
      }
    };

    const fetchReposData = async () => {
      setIsLoadingRepos(true);
      try {
        const res = await fetch("/api/github/repos", {
          headers: {
            "x-github-token": userToken,
          },
        });
        if (!res.ok) {
          throw new Error("Failed to fetch repositories");
        }
        const data = await res.json();
        setRepos(data);

        // Load previously selected repos for this specific user
        const storedSelections = localStorage.getItem(`selected_repos_${userToken}`);
        if (storedSelections) {
          const parsedIds = JSON.parse(storedSelections) as number[];
          // Filter out IDs that might no longer exist in fetched list
          const validIds = parsedIds.filter((id) => data.some((r: any) => r.id === id));
          setSelectedRepoIds(validIds);
        } else if (data.length > 0) {
          // Default to selecting the first repo if no prior selection
          setSelectedRepoIds([data[0].id]);
        }
      } catch (err) {
        console.error("Repos fetch error:", err);
      } finally {
        setIsLoadingRepos(false);
      }
    };

    fetchUserData();
    fetchReposData();
  }, [userToken]);

  // Fetch commits when selected repos change
  useEffect(() => {
    if (!userToken || selectedRepoIds.length === 0 || repos.length === 0) {
      setCommits([]);
      setAiReport(null);
      return;
    }

    const activeRepos = repos.filter((r) => selectedRepoIds.includes(r.id));
    
    // Check if we have a cached AI report for this specific set of repos
    const selectionKey = selectedRepoIds.sort().join(",");
    const cachedReport = localStorage.getItem(`ai_report_${userToken}_${selectionKey}`);
    if (cachedReport) {
      try {
        setAiReport(JSON.parse(cachedReport));
      } catch {
        setAiReport(null);
      }
    } else {
      setAiReport(null);
    }

    const fetchCommitsForSelectedRepos = async () => {
      setIsLoadingCommits(true);
      try {
        const promises = activeRepos.map(async (repo) => {
          try {
            const res = await fetch(`/api/github/commits?owner=${repo.owner.login}&repo=${repo.name}`, {
              headers: {
                "x-github-token": userToken,
              },
            });
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            
            return data.map((commit: any) => ({
              sha: commit.sha,
              message: commit.commit.message,
              date: commit.commit.author?.date || commit.commit.committer?.date,
              author: commit.commit.author?.name || "Unknown",
              authorAvatar: commit.author?.avatar_url || "https://github.com/identicons/git.png",
              repoName: repo.name,
              repoFullName: repo.full_name,
              htmlUrl: commit.html_url,
              authorUrl: commit.author?.html_url,
            })) as CommitInfo[];
          } catch (err) {
            console.error(`Error fetching commits for ${repo.full_name}:`, err);
            return [] as CommitInfo[];
          }
        });

        const results = await Promise.all(promises);
        const allCommits = results.flat();
        
        // Sort all commits by date descending
        allCommits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setCommits(allCommits);
      } catch (err) {
        console.error("Error gathering aggregated commits:", err);
      } finally {
        setIsLoadingCommits(false);
      }
    };

    fetchCommitsForSelectedRepos();
  }, [selectedRepoIds, repos, userToken]);

  const handleConnect = (token: string) => {
    localStorage.setItem("github_access_token", token);
    setUserToken(token);
  };

  const handleDisconnect = () => {
    localStorage.removeItem("github_access_token");
    if (userToken) {
      localStorage.removeItem(`selected_repos_${userToken}`);
    }
    setUserToken(null);
    setUser(null);
    setRepos([]);
    setSelectedRepoIds([]);
    setCommits([]);
    setAiReport(null);
  };

  const handleToggleRepo = (repo: GitHubRepo) => {
    const isSelected = selectedRepoIds.includes(repo.id);
    let nextSelections: number[];
    
    if (isSelected) {
      nextSelections = selectedRepoIds.filter((id) => id !== repo.id);
    } else {
      nextSelections = [...selectedRepoIds, repo.id];
    }
    
    setSelectedRepoIds(nextSelections);
    if (userToken) {
      localStorage.setItem(`selected_repos_${userToken}`, JSON.stringify(nextSelections));
    }
  };

  const handleSelectAll = () => {
    const allIds = repos.map((r) => r.id);
    setSelectedRepoIds(allIds);
    if (userToken) {
      localStorage.setItem(`selected_repos_${userToken}`, JSON.stringify(allIds));
    }
  };

  const handleDeselectAll = () => {
    setSelectedRepoIds([]);
    if (userToken) {
      localStorage.setItem(`selected_repos_${userToken}`, JSON.stringify([]));
    }
  };

  const handleGenerateAIReport = async () => {
    if (commits.length === 0) return;
    
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      // Send the top 35 commits to optimize token usage and focus analysis on recent work
      const recentCommits = commits.slice(0, 35).map((c) => ({
        repo: c.repoName,
        message: c.message,
        author: c.author,
        date: c.date,
      }));

      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commits: recentCommits }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to analyze code history");
      }

      const reportData = (await response.json()) as AIAnalysisResult;
      setAiReport(reportData);

      // Cache the report for this selection
      if (userToken) {
        const selectionKey = selectedRepoIds.sort().join(",");
        localStorage.setItem(`ai_report_${userToken}_${selectionKey}`, JSON.stringify(reportData));
      }
    } catch (err: any) {
      console.error("AI report generation error:", err);
      setAnalysisError(err.message || "An unexpected error occurred while generating your progress report.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const activeSelectedRepos = repos.filter((r) => selectedRepoIds.includes(r.id));

  // Loading indicator for entire setup load
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
          <p className="text-sm font-mono text-slate-500">Initializing workspace environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900">
      {/* Navbar Section */}
      <Navbar
        user={user}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        isLoading={isLoadingUser || isLoadingRepos}
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!userToken ? (
          /* ONBOARDING STATE */
          <div className="max-w-4xl mx-auto py-12 space-y-12 animate-fadeIn" id="onboarding-panel">
            {/* Visual Hero Accent */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center p-3 bg-slate-900 text-white rounded-2xl shadow-sm mb-2">
                <Github className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Track and Analyze Your Coding Progress
              </h2>
              <p className="max-w-2xl mx-auto text-base text-slate-500 leading-relaxed">
                Connect your GitHub account to aggregate commit streams, compute productivity metrics, and generate deep, AI-powered developer insights using Gemini models.
              </p>
            </div>

            {/* Core Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              {/* Value Proposition Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-sm">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">Analytics & Tracking Features</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3 text-sm text-slate-600">
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Consolidated Repository Streams</strong>
                        <p className="text-slate-500 text-xs mt-0.5">Aggregate your pushes and commits seamlessly across multiple project repositories.</p>
                      </div>
                    </li>
                    <li className="flex items-start space-x-3 text-sm text-slate-600">
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Interactive Development Heatmaps</strong>
                        <p className="text-slate-500 text-xs mt-0.5">Explore active coding days, weekly weekday distributions, and custom language profiles.</p>
                      </div>
                    </li>
                    <li className="flex items-start space-x-3 text-sm text-slate-600">
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>AI Milestone & Progress Reports</strong>
                        <p className="text-slate-500 text-xs mt-0.5">Gemini analyzes your commit language to summarize technical focus, log categories, and suggest code tips.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Secure Onboarding Link */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-col justify-between shadow-md">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Secure Authorization Connection</h3>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    This application acts as a secure, stateless proxy. All authorization codes are exchanged on our backend server, keeping client secrets safe. The resulting tokens are stored locally in your browser's private state, and are only transmitted to proxy requests.
                  </p>
                  <p className="text-slate-400 text-xs">
                    * Make sure you have created and configured a GitHub OAuth Application inside your developer dashboard using the Homepage URL and Callback URL in our setup instructions.
                  </p>
                </div>
                
                <div className="pt-6">
                  <button
                    onClick={() => {
                      const btn = document.getElementById("connect-github-btn");
                      if (btn) btn.click();
                    }}
                    className="w-full inline-flex items-center justify-center space-x-2 bg-white text-slate-900 hover:bg-slate-100 font-semibold text-sm px-5 py-3 rounded-2xl transition duration-150 shadow"
                  >
                    <span>Authorize GitHub Account</span>
                    <ArrowRight className="w-4 h-4 text-slate-700" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Helper Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-800 flex items-start space-x-2.5 max-w-2xl mx-auto">
              <HelpCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Need help setting up?</strong> Click the help question mark button in the top right corner of the navigation bar at any time to view step-by-step instructions and retrieve your specific copyable Authorization Callback URL.
              </div>
            </div>
          </div>
        ) : (
          /* CONNECTED DASHBOARD STATE */
          <div className="space-y-8 animate-fadeIn">
            {/* Top Workspace Bar */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-200 gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Welcome back, {user?.name || user?.login}!
                </h2>
                <p className="text-xs text-slate-500">
                  Select repositories to configure your aggregate workspace and trigger coding evaluations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Repository Selection Panel */}
              <div className="lg:col-span-1 space-y-6">
                {isLoadingRepos ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 mb-2" />
                    <p className="text-xs font-mono">Syncing project repositories...</p>
                  </div>
                ) : (
                  <RepoSelector
                    repos={repos}
                    selectedRepoIds={selectedRepoIds}
                    onToggleRepo={handleToggleRepo}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                  />
                )}
              </div>

              {/* Right Column: Workspaces, Analytics & AI Evaluation */}
              <div className="lg:col-span-2 space-y-8">
                {selectedRepoIds.length === 0 ? (
                  <div className="text-center py-24 border border-dashed border-slate-300 rounded-3xl bg-slate-50 px-6 space-y-4">
                    <div className="inline-flex items-center justify-center p-4 bg-slate-100 text-slate-400 rounded-2xl">
                      <FolderGit2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-slate-900">No Repositories Selected</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Please check one or more projects in the left repository selector panel to load activity commits, analytics, and enable progress evaluations.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Analytics Metrics & Charts Component */}
                    <AnalyticsDashboard
                      commits={commits}
                      selectedRepos={activeSelectedRepos}
                    />

                    {/* AI Analytics Evaluation Report */}
                    <AIReportGenerator
                      commits={commits}
                      analysisResult={aiReport}
                      onGenerate={handleGenerateAIReport}
                      isAnalyzing={isAnalyzing}
                      error={analysisError}
                    />

                    {/* Timeline Commit Registry */}
                    <CommitHistory
                      commits={commits}
                      isLoading={isLoadingCommits}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-400 font-mono">
        <p>© 2026 GitHub Coding Progress Tracker • Powered by Google Gemini 3.5 & AI Studio</p>
      </footer>
    </div>
  );
}
