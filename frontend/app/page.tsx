"use client";

import { useEffect, useState } from "react";
import { TrendingUp, BookOpen, History, Tag } from "lucide-react";

// Replace with Aniket_K's actual ObjectId from MongoDB Compass
const USER_ID = "6ab2b4a9b791a3ca88e5a640"; 
const API_BASE = "http://127.0.0.1:8000";

export default function Dashboard() {
  const [trending, setTrending] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Fetch Trending
    fetch(`${API_BASE}/articles/trending/`)
      .then((res) => res.json())
      .then((data) => setTrending(data));

    // Fetch Recommendations
    fetch(`${API_BASE}/users/${USER_ID}/recommendations`)
      .then((res) => res.json())
      .then((data) => setRecommendations(data));

    // Fetch History
    fetch(`${API_BASE}/users/${USER_ID}/history`)
      .then((res) => res.json())
      .then((data) => setHistory(data));
  }, []);

  const ArticleCard = ({ article }: { article: any }) => (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-lg text-gray-800 mb-2">{article.title}</h3>
      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
        <span className="flex items-center gap-1"><BookOpen size={14} /> {article.views} views</span>
        <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
      </div>
      <div className="flex gap-2">
        {article.tags.map((tag: str) => (
          <span key={tag} className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-xs font-medium">
            <Tag size={12} /> {tag}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">News Recommendation Engine</h1>
          <p className="text-gray-500 mt-2">Welcome back, Aniket. Here is your personalized feed.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed Column */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-blue-500">✨</span> For You (Tag-Matched)
              </h2>
              <div className="space-y-4">
                {recommendations.map((article: any) => (
                  <ArticleCard key={article._id} article={article} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="text-red-500" /> Global Trending
              </h2>
              <div className="space-y-4">
                {trending.map((article: any) => (
                  <ArticleCard key={article._id} article={article} />
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar Column */}
          <div>
            <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <History className="text-gray-500" /> Reading History
              </h2>
              <div className="space-y-4">
                {history.map((item: any) => (
                  <div key={item._id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                    <p className="font-medium text-gray-800 text-sm mb-1">{item.article_details.title}</p>
                    <p className="text-xs text-gray-400">Read on {new Date(item.readAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}