"use client";

import { useState } from "react";
import Image from "next/image";

// Sample resumes for quick testing
const SAMPLE_RESUMES = {
  softwareEngineer: `JOHN DOE
Full Stack Engineer | React, Node.js, TypeScript

EXPERIENCE
Software Engineer - TechCorp (2023 - Present)
* Developed web applications using React and JavaScript.
* Worked with backend teams to build REST APIs.
* Fixed bugs and improved application loading times.

EDUCATION
B.S. in Computer Science - State University (2019 - 2023)

PROJECTS
* Portfolio Website: Built using HTML and CSS to showcase personal projects.
* Chat App: A basic socket.io chat room with Node.js.`,
  
  productManager: `SARAH SMITH
Product Manager | Agile, Scrum, Product Lifecycle

EXPERIENCE
Associate Product Manager - CommerceFlow (2022 - Present)
* Gathered requirements from stakeholders and wrote product specs.
* Led daily scrum meetings and collaborated with engineering.
* Managed the product roadmap for the checkout feature.

EDUCATION
B.A. in Business Administration - Global College (2018 - 2022)

SKILLS
Product Strategy, Roadmap Planning, Wireframing, Jira, Confluence`
};

interface AnalysisData {
  score: number;
  keywords: string[];
  suggestions: string[];
  rawText: string;
}

// Custom parser to extract sections from the Gemini agent's markdown response
function parseAnalysis(text: string): AnalysisData {
  let score = 70; // fallback default
  
  // Find ATS score out of 100
  const scoreMatch = text.match(/(\d+)\s*\/\s*100/) || text.match(/score[:\s]*(\d+)/i) || text.match(/(\d+)\s*%/);
  if (scoreMatch) {
    const val = parseInt(scoreMatch[1], 10);
    if (val >= 0 && val <= 100) {
      score = val;
    }
  }

  const keywords: string[] = [];
  const suggestions: string[] = [];
  const lines = text.split("\n");
  
  let inKeywordsSection = false;
  let inSuggestionsSection = false;

  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;

    // Detect section headers
    const lowerLine = cleanLine.toLowerCase();
    if (
      lowerLine.includes("keyword") ||
      lowerLine.includes("missing skill") ||
      lowerLine.includes("skills to add")
    ) {
      inKeywordsSection = true;
      inSuggestionsSection = false;
      continue;
    }
    if (
      lowerLine.includes("suggestion") ||
      lowerLine.includes("recommendation") ||
      lowerLine.includes("concrete suggestion") ||
      lowerLine.includes("improvement")
    ) {
      inKeywordsSection = false;
      inSuggestionsSection = true;
      continue;
    }

    if (cleanLine.startsWith("#")) {
      inKeywordsSection = false;
      inSuggestionsSection = false;
      if (lowerLine.includes("keyword") || lowerLine.includes("missing")) {
        inKeywordsSection = true;
      } else if (lowerLine.includes("suggestion") || lowerLine.includes("improvement")) {
        inSuggestionsSection = true;
      }
      continue;
    }

    // Extract list items
    if (inKeywordsSection) {
      const bulletMatch = cleanLine.match(/^[-*•\d\.]+\s*(.*)/);
      if (bulletMatch) {
        const item = bulletMatch[1].replace(/[\*`_]/g, "").trim();
        if (item && item.length < 50) {
          keywords.push(item);
        }
      }
    } else if (inSuggestionsSection) {
      const bulletMatch = cleanLine.match(/^[-*•\d\.]+\s*(.*)/);
      if (bulletMatch) {
        const item = bulletMatch[1].replace(/[\*`_]/g, "").trim();
        if (item) {
          suggestions.push(item);
        }
      }
    }
  }

  // Fallback keyword extraction using code ticks (e.g. `React`)
  if (keywords.length === 0) {
    const codeTicks = text.match(/`([^`]+)`/g);
    if (codeTicks) {
      codeTicks.forEach(tick => {
        const word = tick.replace(/`/g, "").trim();
        if (word && word.length < 35 && !keywords.includes(word) && isNaN(Number(word))) {
          keywords.push(word);
        }
      });
    }
  }

  // Fallback suggestions extraction using generic bullets
  if (suggestions.length === 0) {
    lines.forEach(line => {
      const match = line.trim().match(/^[-*•]\s*(.*)/);
      if (match) {
        const cleanItem = match[1].replace(/[\*`_]/g, "").trim();
        if (cleanItem && !keywords.includes(cleanItem) && cleanItem.length > 20) {
          suggestions.push(cleanItem);
        }
      }
    });
  }

  return {
    score,
    keywords: keywords.slice(0, 8),
    suggestions: suggestions.slice(0, 5),
    rawText: text
  };
}

export default function Home() {
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [showRawText, setShowRawText] = useState(false);

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      setError("Please paste your resume text to begin.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch("http://localhost:8000/api/resume/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resume_text: resumeText }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to the analysis engine. Please ensure the FastAPI backend is running.");
      }

      const data = await response.json();
      if (data.analysis) {
        const parsed = parseAnalysis(data.analysis);
        setAnalysis(parsed);
      } else {
        throw new Error("Analysis failed. No review output received from the agent.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const loadSample = (type: "softwareEngineer" | "productManager") => {
    setResumeText(SAMPLE_RESUMES[type]);
    setError(null);
  };

  // SVG Gauge calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = analysis
    ? circumference - (analysis.score / 100) * circumference
    : circumference;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Gradient Accents */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.982-11.795H13.62l1.38-7.205L6 13.795h5.193L9.813 15.904z" />
              </svg>
            </div>
            <div>
              <span className="font-semibold tracking-tight text-white">TalentMatch <span className="text-indigo-400">AI</span></span>
              <span className="text-xs block text-zinc-500 font-medium">Autonomous Career OS</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Agent Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Column: Inputs */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Resume Auditer</h2>
              <p className="text-xs text-zinc-400 mt-1">Paste your professional resume details below to receive specialized ATS feedback.</p>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => loadSample("softwareEngineer")}
                className="flex-1 py-2 px-3 text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg transition font-medium cursor-pointer"
              >
                📝 Software Resume
              </button>
              <button 
                onClick={() => loadSample("productManager")}
                className="flex-1 py-2 px-3 text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg transition font-medium cursor-pointer"
              >
                📝 PM Resume
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="resume-textarea" className="sr-only">Resume Text</label>
              <textarea
                id="resume-textarea"
                className="w-full h-96 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none font-mono"
                placeholder="Paste the full text of your resume here..."
                value={resumeText}
                onChange={(e) => {
                  setResumeText(e.target.value);
                  if (error) setError(null);
                }}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-950/30 border border-red-900/50 text-red-400 rounded-lg text-xs flex gap-2">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-violet-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Auditing Resume...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Verify Match & Score</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Right Column: Dynamic Analysis Screens */}
        <section className="lg:col-span-7 flex flex-col justify-start">
          
          {/* Welcome Screen (No analysis, no loading) */}
          {!loading && !analysis && (
            <div className="bg-zinc-900/10 border border-zinc-900 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center h-[580px]">
              <div className="w-16 h-16 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Unlock ATS Insights</h3>
              <p className="text-sm text-zinc-500 max-w-sm mt-2 leading-relaxed">
                Paste your resume text and run our analysis engine to extract real-time recommendations, check ATS compatibility, and identify keyword deficits.
              </p>
            </div>
          )}

          {/* Skeleton Pulse Loader */}
          {loading && (
            <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-8 flex flex-col gap-8 h-[580px]">
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-zinc-900">
                <div className="w-28 h-28 rounded-full border-4 border-zinc-900 flex items-center justify-center animate-pulse bg-zinc-900/40" />
                <div className="flex-1 space-y-3 w-full">
                  <div className="h-4 bg-zinc-900 rounded w-1/3 animate-pulse" />
                  <div className="h-3 bg-zinc-900 rounded w-2/3 animate-pulse" />
                  <div className="h-3 bg-zinc-900 rounded w-1/2 animate-pulse" />
                </div>
              </div>
              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <div className="h-3.5 bg-zinc-900 rounded w-1/4 animate-pulse" />
                  <div className="flex flex-wrap gap-2">
                    <div className="h-7 bg-zinc-900 rounded-full w-20 animate-pulse" />
                    <div className="h-7 bg-zinc-900 rounded-full w-24 animate-pulse" />
                    <div className="h-7 bg-zinc-900 rounded-full w-16 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-3.5 bg-zinc-900 rounded w-1/3 animate-pulse" />
                  <div className="h-10 bg-zinc-900 rounded-xl animate-pulse" />
                  <div className="h-10 bg-zinc-900 rounded-xl animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Results Presentation */}
          {analysis && !loading && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              
              {/* Score Header */}
              <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-6 backdrop-blur-sm flex flex-col sm:flex-row items-center gap-6">
                {/* SVG Radial Progress */}
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r={radius}
                      className="text-zinc-800"
                      strokeWidth="6"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r={radius}
                      className="text-indigo-500 transition-all duration-1000 ease-out"
                      strokeWidth="6"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      stroke="url(#scoreGradient)"
                      fill="transparent"
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#c084fc" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white tracking-tight">{analysis.score}</span>
                    <span className="text-[10px] text-zinc-500 font-semibold tracking-widest uppercase">ATS Score</span>
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-semibold text-white">Analysis Complete</h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Your resume matches typical industry patterns with a compatibility rating of <span className="font-semibold text-indigo-400">{analysis.score}%</span>. Review the audit areas below.
                  </p>
                  <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      analysis.score >= 75
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : analysis.score >= 50
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      {analysis.score >= 75 ? "Excellent Status" : analysis.score >= 50 ? "Needs Tuning" : "Critical Deficit"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Keywords Gap */}
              <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-6 backdrop-blur-sm">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16" />
                  </svg>
                  Missing Keywords & Skills
                </h4>
                <p className="text-xs text-zinc-400 mt-1 mb-4">Adding these keywords can help bypass automated filters for your target roles.</p>
                {analysis.keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analysis.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-950 border border-zinc-800 hover:border-indigo-500/40 text-zinc-300 transition duration-200"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic">No missing keywords specifically identified.</p>
                )}
              </div>

              {/* Structural Suggestions */}
              <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-6 backdrop-blur-sm">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Concrete Recommendations
                </h4>
                {analysis.suggestions.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {analysis.suggestions.map((sug, i) => (
                      <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-zinc-950/40 border border-zinc-900/80">
                        <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">{sug}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic">No structural suggestions provided.</p>
                )}
              </div>

              {/* Detailed Markdown Report */}
              <div className="border border-zinc-900 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowRawText(!showRawText)}
                  className="w-full p-4 bg-zinc-900/20 hover:bg-zinc-900/40 text-left flex items-center justify-between text-xs text-zinc-300 font-semibold cursor-pointer"
                >
                  <span>Full Intelligence Report</span>
                  <svg className={`w-4 h-4 transform transition-transform duration-200 ${showRawText ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showRawText && (
                  <div className="p-5 bg-zinc-950 border-t border-zinc-900 text-xs text-zinc-400 font-mono leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap">
                    {analysis.rawText}
                  </div>
                )}
              </div>

            </div>
          )}

        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 mt-auto py-6 bg-zinc-950/45">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <span>&copy; 2026 TalentMatch AI. Autonomous career operating systems powered by Gemini.</span>
          <div className="flex gap-6">
            <span className="hover:text-zinc-400 transition cursor-default">Privacy Protocol</span>
            <span className="hover:text-zinc-400 transition cursor-default">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
