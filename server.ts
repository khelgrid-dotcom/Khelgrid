import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// API: Get OAuth Authorization URL
app.get("/api/auth/url", (req, res) => {
  const origin = (req.query.origin as string) || process.env.APP_URL || "http://localhost:3000";
  // Trim any trailing slash to avoid double slashes
  const cleanOrigin = origin.replace(/\/$/, "");
  const redirectUri = `${cleanOrigin}/auth/callback`;
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return res.status(400).json({
      error: "GITHUB_CLIENT_ID is not configured. Please open Secrets from the Settings menu and set GITHUB_CLIENT_ID.",
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "repo,user",
    state: "commit-craft-state",
  });

  const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
  res.json({ url: authUrl });
});

// OAuth Callback: Exchanges GitHub temporary code for access token
app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code } = req.query;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.send(`
      <html>
        <body style="font-family: sans-serif; padding: 20px; background: #f9fafb; color: #1f2937;">
          <h2 style="color: #ef4444;">Configuration Error</h2>
          <p>GitHub Client ID or Client Secret is missing. Please make sure they are set in the Secrets panel in AI Studio.</p>
          <button onclick="window.close()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Close Window</button>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.send(`
      <html>
        <body style="font-family: sans-serif; padding: 20px; background: #f9fafb; color: #1f2937;">
          <h2 style="color: #ef4444;">Authentication Error</h2>
          <p>No authorization code received from GitHub.</p>
          <button onclick="window.close()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Close Window</button>
        </body>
      </html>
    `);
  }

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const data = await tokenResponse.json();

    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    const token = data.access_token;

    // Send the token back to the React app and close the popup window
    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #f3f4f6; color: #111827;">
          <div style="max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <div style="width: 50px; height: 50px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
              <svg style="width: 30px; height: 30px; color: white;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 style="margin-bottom: 10px;">Success!</h2>
            <p style="color: #4b5563; margin-bottom: 20px;">GitHub account connected successfully.</p>
            <p style="font-size: 14px; color: #9ca3af;">This window will close automatically...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', token: '${token}' }, '*');
              setTimeout(() => {
                window.close();
              }, 1500);
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("Error exchanging code for access token:", error);
    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #f3f4f6; color: #111827;">
          <div style="max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <div style="width: 50px; height: 50px; background: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
              <svg style="width: 30px; height: 30px; color: white;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 style="margin-bottom: 10px; color: #ef4444;">Failed</h2>
            <p style="color: #4b5563; margin-bottom: 20px;">Authentication failed: ${error.message || "Unknown error"}</p>
            <button onclick="window.close()" style="padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">Close Window</button>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${error.message || "Failed to exchange token"}' }, '*');
            }
          </script>
        </body>
      </html>
    `);
  }
});

// Proxy: Get Authorized User details
app.get("/api/github/user", async (req, res) => {
  const token = req.headers["x-github-token"];
  if (!token) {
    return res.status(401).json({ error: "GitHub access token is required" });
  }

  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "commit-craft-tracker",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Proxy: Get User Repositories
app.get("/api/github/repos", async (req, res) => {
  const token = req.headers["x-github-token"];
  if (!token) {
    return res.status(401).json({ error: "GitHub access token is required" });
  }

  try {
    // Fetch repositories sorted by most recently updated
    const response = await fetch("https://api.github.com/user/repos?per_page=100&sort=pushed&direction=desc", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "commit-craft-tracker",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Proxy: Get Commits for a Repository
app.get("/api/github/commits", async (req, res) => {
  const token = req.headers["x-github-token"];
  const { owner, repo } = req.query;

  if (!token) {
    return res.status(401).json({ error: "GitHub access token is required" });
  }
  if (!owner || !repo) {
    return res.status(400).json({ error: "Owner and repo are required query parameters" });
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=50`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "commit-craft-tracker",
      },
    });

    if (!response.ok) {
      // Return empty array if no commits or empty repo instead of crashing
      if (response.status === 409 || response.status === 404) {
        return res.json([]);
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI analysis route: Analyzes commit history using Gemini
app.post("/api/gemini/analyze", async (req, res) => {
  const { commits } = req.body;

  if (!commits || !Array.isArray(commits) || commits.length === 0) {
    return res.status(400).json({ error: "A non-empty list of commits is required for AI analysis." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not configured on the server. Please ensure the Gemini key is present in Secrets.",
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const commitListString = commits
      .map((c: any, index: number) => {
        return `${index + 1}. [Repo: ${c.repo}] [Author: ${c.author}] [Date: ${c.date}] Message: ${c.message}`;
      })
      .join("\n");

    const prompt = `You are an expert technical lead, engineering manager, and developer advocate. Analyze the following recent GitHub commits to compile an engaging, highly detailed, professional coding progress report and developer analytics.

Commits:
${commitListString}

Based strictly on this data, construct a complete review. Please respond with a JSON object. Ensure the JSON is valid and matches this exact schema:
{
  "summary": "A cohesive, 2-paragraph professional analysis of the developer's accomplishments, focus areas, and overall coding progress based on the commits. Discuss technical areas, architecture, patterns, what went well, and recommendations for next steps.",
  "achievements": [
    {
      "title": "A witty, descriptive title (e.g., 'Refactoring Specialist' or 'Consistency Champion')",
      "description": "Short explanation of why this milestone or behavior was unlocked based on these specific commits.",
      "icon": "Lucide icon key name to match visually (choose exactly one of: 'Zap', 'Shield', 'Trophy', 'TrendingUp', 'GitBranch', 'CheckCircle', 'Activity', 'Award', 'Code2', 'Cpu', 'Database', 'Globe', 'Clock')"
    }
  ],
  "categories": [
    {
      "name": "Category name (e.g., 'Feature Implementation', 'Bug Fixes', 'Refactoring', 'Documentation', 'CI/CD')",
      "percentage": 40, // integer representing share of effort, totaling to 100 across all categories
      "description": "What specifically was accomplished in this focus area."
    }
  ],
  "technologies": [
    "List of technologies, frameworks, and languages inferred or identified from the commits (e.g., 'TypeScript', 'React', 'Vite', 'Node.js', 'Tailwind CSS')"
  ],
  "insights": [
    "A tactical developer insight or productivity trend identified in the commits.",
    "A smart suggestion or recommendation for improvement, code quality, or future planning."
  ]
}

Only return a raw, single JSON object. Do not include any markdown formatting like \`\`\`json or backticks. Just return a parseable JSON string.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text || "";
    let parsedData;
    try {
      parsedData = JSON.parse(resultText.trim());
    } catch (e) {
      // Fallback extraction
      const cleanJson = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedData = JSON.parse(cleanJson);
    }

    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in Gemini analysis:", error);
    res.status(500).json({ error: error.message || "Error running Gemini analysis" });
  }
});

// Vite Middleware & Static Server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
