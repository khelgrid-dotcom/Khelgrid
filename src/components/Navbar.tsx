import { useState, useEffect } from "react";
import { Github, LogOut, Settings, HelpCircle, Key, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { GitHubUser } from "../types";

interface NavbarProps {
  user: GitHubUser | null;
  onConnect: (token: string) => void;
  onDisconnect: () => void;
  isLoading: boolean;
}

export default function Navbar({ user, onConnect, onDisconnect, isLoading }: NavbarProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Determine the redirect callback URL dynamically
    setCallbackUrl(`${window.location.origin}/auth/callback`);
  }, []);

  useEffect(() => {
    // Listen to message from OAuth popup
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      // Allow local and Cloud Run preview URLs
      if (!origin.endsWith(".run.app") && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
        return;
      }

      if (event.data?.type === "OAUTH_AUTH_SUCCESS" && event.data?.token) {
        onConnect(event.data.token);
        setErrorMsg(null);
      } else if (event.data?.type === "OAUTH_AUTH_ERROR") {
        setErrorMsg(event.data.error || "Authentication failed.");
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, [onConnect]);

  const handleConnectClick = async () => {
    setErrorMsg(null);
    try {
      const originParam = encodeURIComponent(window.location.origin);
      const res = await fetch(`/api/auth/url?origin=${originParam}`);
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to retrieve GitHub authentication URL");
      }

      const { url } = await res.json();
      
      // Open GitHub OAuth directly in a popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        url,
        "github_oauth_popup",
        `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=yes`
      );

      if (!popup) {
        setErrorMsg("Popup was blocked by your browser. Please allow popups for this site to log in.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Could not start authorization flow.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Callback URL copied to clipboard!");
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-sm flex items-center justify-center">
              <Github className="w-5 h-5" id="navbar-logo-icon" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 tracking-tight" id="navbar-title">
                GitHub Progress Tracker
              </h1>
              <p className="text-xs text-slate-500 font-mono hidden sm:block">
                ai-powered commit analyst
              </p>
            </div>
          </div>

          {/* Actions & Connection Info */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors duration-150"
              title="Setup Instructions"
              id="help-btn"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {isLoading ? (
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-1.5 text-xs text-slate-500 font-mono">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Syncing...</span>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-3" id="user-profile-panel">
                {/* User Card */}
                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl pl-2 pr-3 py-1">
                  <img
                    src={user.avatar_url}
                    alt={user.login}
                    className="w-7 h-7 rounded-full border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">
                      {user.name || user.login}
                    </p>
                    <a
                      href={user.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-slate-400 font-mono hover:text-slate-600 hover:underline block leading-tight"
                    >
                      @{user.login}
                    </a>
                  </div>
                </div>

                {/* Log Out */}
                <button
                  onClick={onDisconnect}
                  className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all duration-150"
                  title="Disconnect GitHub"
                  id="disconnect-btn"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectClick}
                className="inline-flex items-center space-x-2 bg-slate-900 text-white font-medium text-sm px-4 py-2 rounded-xl hover:bg-slate-800 active:scale-95 transition-all shadow-sm"
                id="connect-github-btn"
              >
                <Github className="w-4 h-4" />
                <span>Connect GitHub</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Warning Messages */}
        {errorMsg && (
          <div className="mb-4 mx-auto p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Help & Setup Panel */}
        {showHelp && (
          <div className="border-t border-slate-100 bg-slate-50 p-6 rounded-b-2xl transition-all animate-fadeIn" id="help-panel">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center space-x-1.5">
              <Settings className="w-4 h-4 text-slate-600" />
              <span>GitHub OAuth Application Configuration Instructions</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
              <div className="space-y-3">
                <p className="font-medium text-slate-700">1. Create a GitHub OAuth App</p>
                <p>
                  Go to your GitHub Account Settings &gt;{" "}
                  <a
                    href="https://github.com/settings/developers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline font-semibold"
                  >
                    Developer Settings &gt; OAuth Apps
                  </a>{" "}
                  and click <strong className="text-slate-900">New OAuth App</strong>.
                </p>
                
                <p className="font-medium text-slate-700 mt-2">2. Register the Application Fields</p>
                <ul className="list-disc list-inside space-y-1.5 pl-1">
                  <li><strong>Application name:</strong> GitHub Progress Tracker</li>
                  <li><strong>Homepage URL:</strong> <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{window.location.origin}</span></li>
                  <li>
                    <strong>Authorization callback URL:</strong>
                    <div className="flex items-center mt-1 space-x-1">
                      <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 select-all overflow-x-auto block max-w-xs sm:max-w-md">
                        {callbackUrl}
                      </span>
                      <button
                        onClick={() => copyToClipboard(callbackUrl)}
                        className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 px-2 py-1 rounded transition"
                      >
                        Copy
                      </button>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <p className="font-medium text-slate-700">3. Set Environment Secrets in AI Studio</p>
                <p>
                  Once created, generate a <strong className="text-slate-900">Client Secret</strong> inside your GitHub OAuth App settings, then paste both key values inside the **Settings &gt; Secrets** panel in the AI Studio UI:
                </p>
                <div className="bg-slate-900 text-slate-300 p-3 rounded-xl font-mono text-[11px] leading-relaxed">
                  <p className="text-slate-400"># Set these in Settings &gt; Secrets</p>
                  <p><span className="text-indigo-400">GITHUB_CLIENT_ID</span>=your_github_client_id</p>
                  <p><span className="text-indigo-400">GITHUB_CLIENT_SECRET</span>=your_github_client_secret</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px]">
                    <strong>Note:</strong> Make sure to register the callback URL exactly. If your preview URL changes, copy the updated Callback URL from this panel to GitHub settings!
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
