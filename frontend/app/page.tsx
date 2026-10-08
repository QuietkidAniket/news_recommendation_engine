"use client";

import { useEffect, useState } from "react";
import { TrendingUp, BookOpen, History, Tag, Trash2, Plus, UserPlus } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

export default function Dashboard() {
  const [userId, setUserId] = useState("REPLACE_WITH_YOUR_ACTUAL_USER_ID");
  const [trending, setTrending] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [history, setHistory] = useState([]);
  const [view, setView] = useState("feed"); // 'feed' or 'admin'

  // Admin form states
  const [newArticle, setNewArticle] = useState({ title: "", tags: "" });
  const [newUser, setNewUser] = useState({ username: "", preferredTags: "" });

  const fetchData = () => {
    fetch(`${API_BASE}/articles/trending/`).then(res => res.json()).then(setTrending);
    if (userId.length === 24) {
      fetch(`${API_BASE}/users/${userId}/recommendations`).then(res => res.json()).then(setRecommendations);
      fetch(`${API_BASE}/users/${userId}/history`).then(res => res.json()).then(setHistory);
    }
  };

  useEffect(() => { fetchData(); }, [userId]);

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: newArticle.title,
      tags: newArticle.tags.split(",").map(t => t.trim()),
      views: 0
    };
    await fetch(`${API_BASE}/articles/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setNewArticle({ title: "", tags: "" });
    fetchData();
  };

  const handleDeleteArticle = async (id: string) => {
    await fetch(`${API_BASE}/articles/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      username: newUser.username,
      preferredTags: newUser.preferredTags.split(",").map(t => t.trim())
    };
    const res = await fetch(`${API_BASE}/users/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    alert(`User created! New ID: ${data._id}`);
    setNewUser({ username: "", preferredTags: "" });
  };

  const ArticleCard = ({ article, isAdmin }: { article: any, isAdmin?: boolean }) => (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex justify-between items-start">
      <div>
        <h3 className="font-semibold text-lg text-gray-800 mb-2">{article.title}</h3>
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1"><BookOpen size={14} /> {article.views} views</span>
        </div>
        <div className="flex gap-2">
          {article.tags.map((tag: string) => (
            <span key={tag} className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-xs font-medium">
              <Tag size={12} /> {tag}
            </span>
          ))}
        </div>
      </div>
      {isAdmin && (
        <button onClick={() => handleDeleteArticle(article._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
          <Trash2 size={18} />
        </button>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">News Recommendation Engine</h1>
            <input 
              type="text" 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)}
              className="mt-2 text-sm border p-1 rounded w-64 bg-transparent text-gray-500"
              placeholder="Active User ID"
            />
          </div>
          <div className="flex gap-2 bg-white rounded-lg p-1 border">
            <button onClick={() => setView("feed")} className={`px-4 py-2 rounded-md text-sm font-medium ${view === "feed" ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-50"}`}>My Feed</button>
            <button onClick={() => setView("admin")} className={`px-4 py-2 rounded-md text-sm font-medium ${view === "admin" ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-50"}`}>Admin Panel</button>
          </div>
        </header>

        {view === "feed" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><span className="text-blue-500">✨</span> For You</h2>
                <div className="space-y-4">{recommendations.map((a: any) => <ArticleCard key={a._id} article={a} />)}</div>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp className="text-red-500" /> Trending</h2>
                <div className="space-y-4">{trending.map((a: any) => <ArticleCard key={a._id} article={a} />)}</div>
              </section>
            </div>
            <div>
              <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><History className="text-gray-500" /> Reading History</h2>
                <div className="space-y-4">
                  {history.map((item: any) => (
                    <div key={item._id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                      <p className="font-medium text-gray-800 text-sm mb-1">{item.article_details?.title}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white p-6 rounded-xl border border-gray-100">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus /> Add Article</h2>
              <form onSubmit={handleCreateArticle} className="space-y-4">
                <input className="w-full border p-2 rounded" placeholder="Title (e.g. Future of AI)" value={newArticle.title} onChange={e => setNewArticle({...newArticle, title: e.target.value})} required />
                <input className="w-full border p-2 rounded" placeholder="Tags (comma separated)" value={newArticle.tags} onChange={e => setNewArticle({...newArticle, tags: e.target.value})} required />
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700">Publish Article</button>
              </form>
            </section>
            
            <section className="bg-white p-6 rounded-xl border border-gray-100">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><UserPlus /> Create User</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <input className="w-full border p-2 rounded" placeholder="Username" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} required />
                <input className="w-full border p-2 rounded" placeholder="Preferred Tags (comma separated)" value={newUser.preferredTags} onChange={e => setNewUser({...newUser, preferredTags: e.target.value})} required />
                <button type="submit" className="w-full bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700">Register User</button>
              </form>
            </section>

            <section className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-100">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Trash2 /> Manage Existing Articles</h2>
              <div className="space-y-4">
                {trending.map((a: any) => <ArticleCard key={a._id} article={a} isAdmin={true} />)}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}