"use client";

import React, { useState } from "react";

type Course = {
  id: number;
  code: string | null;
  title: string | null;
  teacher: string | null;
  year: number | null;
  semester: string | null;
  faculty: string | null;
  credits: number | null;
  similarity: number;
};

type RecommendResponse = {
  summary?: string;
  courses?: Course[];
};

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState<"local" | "gemini">("local");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");

  const handleRecommend = async () => {
    setLoading(true);
    setError("");
    setSummary("");
    setCourses([]);

    try {
      const res = await fetch("http://localhost:8000/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          top_k: 10,
          provider, // ← ここで LLM の種類を一緒に送る
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error: ${res.status}`);
      }

      const data: RecommendResponse = await res.json();

      setSummary(data.summary ?? "");
      setCourses(Array.isArray(data.courses) ? data.courses : []);
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        setError(`エラーが発生しました: ${e.message}`);
      } else {
        setError("エラーが発生しました（詳細不明）。");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex justify-center">
      <div className="w-full max-w-3xl p-6 space-y-6">
        <h1 className="text-2xl font-bold mb-2">
          履修登録レコメンドAI（検索＋推薦）
        </h1>

        <p className="text-sm text-slate-300">
          興味のあることを入力すると、AI
          が授業を検索し、おすすめ理由を生成します。
        </p>

        <div className="space-y-4">
          {/* 入力テキスト */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              興味・学びたい内容（日本語）
            </label>

            <textarea
              className="w-full h-32 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring focus:ring-sky-500"
              value={query}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setQuery(e.target.value)
              }
              placeholder="例：観光の基礎を学びたい。地域振興・まちづくりにも興味があります。"
            />
          </div>

          {/* LLM選択 */}
          <div className="space-y-1 text-sm text-slate-200">
            <span className="font-medium">利用するAIモデル</span>
            <div className="flex gap-4 mt-1">
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  value="local"
                  checked={provider === "local"}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setProvider(e.target.value as "local" | "gemini")
                  }
                />
                <span>ローカル LLM-jp（無料）</span>
              </label>

              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  value="gemini"
                  checked={provider === "gemini"}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setProvider(e.target.value as "local" | "gemini")
                  }
                />
                <span>Gemini（API）</span>
              </label>
            </div>
          </div>

          {/* 実行ボタン */}
          <button
            onClick={handleRecommend}
            disabled={loading || !query.trim()}
            className="px-4 py-2 rounded-lg bg-sky-500 disabled:bg-slate-600 text-sm font-semibold"
          >
            {loading ? "AIが考え中..." : "AIにおすすめを聞く"}
          </button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="text-sm text-red-400 border border-red-500/50 bg-red-950/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* AI の推薦文 */}
        {summary && (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">AIからのコメント</h2>
            <div className="whitespace-pre-wrap text-sm bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
              {summary}
            </div>
          </section>
        )}

        {/* 授業候補のリスト */}
        {courses.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">候補授業一覧（類似度順）</h2>
            <ul className="space-y-2 text-sm">
              {courses.map((c) => (
                <li
                  key={c.id}
                  className="border border-slate-800 rounded-lg px-3 py-2 bg-slate-900/70"
                >
                  <div className="font-semibold">
                    {c.title ?? "(タイトル不明)"}
                    {c.code && (
                      <span className="text-slate-400 text-xs ml-1">
                        （{c.code}）
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {c.teacher && <span>担当: {c.teacher} / </span>}
                    {c.year && <span>{c.year}年度 </span>}
                    {c.semester && <span>{c.semester} / </span>}
                    {c.faculty && <span>{c.faculty}</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    類似度: {c.similarity.toFixed(3)}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
