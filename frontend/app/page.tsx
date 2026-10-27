"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  LayoutDashboard, ShieldAlert, Sparkles, BookOpen, 
  Clock, PlusCircle, Trash2, UserPlus, FileText, 
  Search, Tag, Users, Eye, AlertCircle, CheckCircle, RefreshCw, TrendingUp
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://0.0.0.0:8000";

interface UserType { _id: string; username: string; preferredTags: string[]; }
interface ArticleType { _id: string; title: string; body: string; tags: string[]; views: number; authorId: string; publishedAt?: string; }
interface HistoryType {
  _id: string; userId: string; articleId: string; readAt: string;
  article_details?: { _id: string; title: string; body: string; tags: string[]; views: number; };
}

export default function Dashboard() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [activeView, setActiveView] = useState<"feed" | "admin">("feed");
  const [userSubTab, setUserSubTab] = useState<"recommended" | "my_articles">("recommended");
  
  const [trending, setTrending] = useState<ArticleType[]>([]);
  const [recommendations, setRecommendations] = useState<ArticleType[]>([]);
  const [history, setHistory] = useState<HistoryType[]>([]);
  const [allArticles, setAllArticles] = useState<ArticleType[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const [newArticle, setNewArticle] = useState({ title: "", body: "", tags: "", authorId: "" });
  const [newUser, setNewUser] = useState({ username: "", preferredTags: "" });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/users/`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        if (data.length > 0 && !userId) setUserId(data[0]._id);
      }
    } catch (err) { setErrorMessage("Unable to connect to backend API."); }
  }, [userId]);

  const fetchAllArticles = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/articles/`);
      if (res.ok) setAllArticles(await res.json());
    } catch (err) {}
  }, []);

  const fetchFeedData = useCallback(async (activeUserId: string) => {
    setLoading(true); setErrorMessage(null);
    try {
      const trendingRes = await fetch(`${API_BASE}/articles/trending/`);
      if (trendingRes.ok) setTrending(await trendingRes.json());

      if (activeUserId && activeUserId.length === 24) {
        const [recRes, histRes] = await Promise.all([
          fetch(`${API_BASE}/users/${activeUserId}/recommendations`),
          fetch(`${API_BASE}/users/${activeUserId}/history`)
        ]);
        if (recRes.ok) setRecommendations(await recRes.json());
        if (histRes.ok) setHistory(await histRes.json());
      } else {
        setRecommendations([]); setHistory([]);
      }
    } catch (err) {
      setErrorMessage(`Cannot reach FastAPI at ${API_BASE}`);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); fetchAllArticles(); }, [fetchUsers, fetchAllArticles]);
  useEffect(() => { if (userId) fetchFeedData(userId); }, [userId, fetchFeedData]);

  const notify = (msg: string) => { setSuccessNotice(msg); setTimeout(() => setSuccessNotice(null), 3000); };

  const handleReadArticle = async (articleId: string) => {
    if (!userId || userId.length !== 24) return alert("Select a valid user first!");
    try {
      const res = await fetch(`${API_BASE}/articles/${articleId}/read`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId })
      });
      if (res.ok) { notify("Read logged & telemetry updated."); fetchFeedData(userId); fetchAllArticles(); }
    } catch (err) { console.error(err); }
  };

  const handleCreateArticle = async (e: React.FormEvent, assignedAuthorId: string) => {
    e.preventDefault();
    if (!assignedAuthorId) return alert("Article must be assigned to a valid user.");
    
    try {
      const res = await fetch(`${API_BASE}/articles/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: newArticle.title, 
          body: newArticle.body,
          tags: newArticle.tags.split(",").map((t) => t.trim()).filter(Boolean), 
          views: 0,
          authorId: assignedAuthorId
        })
      });
      if (res.ok) { 
        setNewArticle({ title: "", body: "", tags: "", authorId: "" }); 
        fetchAllArticles(); 
        fetchFeedData(userId); 
        notify("Article published successfully!"); 
      }
    } catch (err) { alert("Failed to publish."); }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Delete this article?")) return;
    try {
      const res = await fetch(`${API_BASE}/articles/${id}`, { method: "DELETE" });
      if (res.ok) { fetchAllArticles(); fetchFeedData(userId); }
    } catch (err) {}
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/users/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUser.username, preferredTags: newUser.preferredTags.split(",").map((t) => t.trim()).filter(Boolean) })
      });
      const data = await res.json();
      if (data && data._id) {
        setNewUser({ username: "", preferredTags: "" });
        await fetchUsers(); setUserId(data._id); notify(`User ${data.username} provisioned!`);
      }
    } catch (err) { alert("Failed to create user."); }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Permanently delete this user?")) return;
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, { method: "DELETE" });
      if (res.ok) { await fetchUsers(); if (userId === id) setUserId(""); }
    } catch (err) {}
  };

  const activeUser = users.find((u) => u._id === userId);
  const myArticles = allArticles.filter(a => a.authorId === userId);

  const ArticleCard = ({ article, isAdmin }: { article: ArticleType; isAdmin?: boolean; }) => {
    const author = users.find(u => u._id === article.authorId);
    
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex justify-between items-start group">
        <div className="space-y-2 flex-1 pr-4">
          <h3 className="font-bold text-lg text-slate-800 leading-snug">{article.title}</h3>
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{article.body}</p>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wide pt-2">
            <span className="flex items-center gap-1 text-indigo-600"><BookOpen size={14} /> {article.views} views</span>
            {author && <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">By: {author.username}</span>}
            <span className="text-slate-400 font-mono tracking-normal">ID: {article._id.slice(-6)}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {article.tags?.map((tag: string) => (
              <span key={tag} className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-xs font-bold"><Tag size={11} /> {tag}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {!isAdmin ? (
            <button onClick={() => handleReadArticle(article._id)} className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-2 rounded-lg font-bold transition shadow-sm border border-emerald-100"><Eye size={14} /> Read</button>
          ) : (
            <button onClick={() => handleDeleteArticle(article._id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={18} /></button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-10">
        <div className="p-6 bg-slate-950 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white tracking-tight leading-tight">News Engine<br/><span className="text-indigo-400 text-sm font-medium">Analytics Dashboard</span></h1>
        </div>
        
        <div className="p-6 border-b border-slate-800">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block flex justify-between items-center">
            Active System User
            <button onClick={() => { fetchFeedData(userId); fetchAllArticles(); fetchUsers(); }} className="hover:text-white transition"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button>
          </label>
          <select 
            value={userId} onChange={(e) => setUserId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3 text-sm text-white font-medium focus:outline-none focus:border-indigo-500 mb-3"
          >
            <option value="">-- Select Identity --</option>
            {users.map((u) => <option key={u._id} value={u._id}>{u.username}</option>)}
          </select>
          
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input type="text" placeholder="Manual Override ID..." value={userId} onChange={(e) => setUserId(e.target.value.trim())} className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-xs font-mono text-slate-400 focus:outline-none" />
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveView("feed")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeView === "feed" ? "bg-indigo-600 text-white shadow-md" : "hover:bg-slate-800 hover:text-white"}`}>
            <LayoutDashboard size={18} /> User Access Portal
          </button>
          <button onClick={() => setActiveView("admin")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeView === "admin" ? "bg-indigo-600 text-white shadow-md" : "hover:bg-slate-800 hover:text-white"}`}>
            <ShieldAlert size={18} /> Administrative Center
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center sticky top-0 z-0 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            {activeView === "feed" ? <LayoutDashboard className="text-indigo-600"/> : <ShieldAlert className="text-indigo-600"/>}
            {activeView === "feed" ? "User Access Portal" : "Administrative Center"}
          </h2>
          {activeUser && (
             <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-full">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               <span className="text-sm font-bold text-slate-700">{activeUser.username}</span>
             </div>
          )}
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-6">
          {errorMessage && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-semibold shadow-sm"><AlertCircle size={18} /><span>{errorMessage}</span></div>}
          {successNotice && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-semibold shadow-sm"><CheckCircle size={18} /><span>{successNotice}</span></div>}

          {activeView === "feed" ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex gap-2 border-b border-slate-200 pb-px">
                <button 
                  onClick={() => setUserSubTab("recommended")}
                  className={`px-6 py-2.5 text-sm font-bold border-b-2 transition-colors ${userSubTab === "recommended" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                >
                  Recommended Articles
                </button>
                <button 
                  onClick={() => setUserSubTab("my_articles")}
                  className={`px-6 py-2.5 text-sm font-bold border-b-2 transition-colors ${userSubTab === "my_articles" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                >
                  My Articles
                </button>
              </div>

              {userSubTab === "recommended" ? (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  <div className="xl:col-span-2 space-y-8">
                    <section>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center justify-between">
                        <span className="flex items-center gap-2"><Sparkles className="text-amber-500"/> Recommended For You</span>
                        <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded">$match & $in</span>
                      </h3>
                      {recommendations.length > 0 ? (
                        <div className="space-y-4">{recommendations.map((a) => <ArticleCard key={a._id} article={a} />)}</div>
                      ) : (
                        <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm font-medium">No algorithmic matches found for your current tag preferences.</div>
                      )}
                    </section>
                    <section>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center justify-between">
                        <span className="flex items-center gap-2"><TrendingUp className="text-red-500"/> Global Trending</span>
                        <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded">Top 5 by Views</span>
                      </h3>
                      <div className="space-y-4">{trending.map((a) => <ArticleCard key={a._id} article={a} />)}</div>
                    </section>
                  </div>
                  
                  <div>
                    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-28">
                      <div className="bg-slate-50 p-5 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-md font-bold text-slate-800 flex items-center gap-2"><Clock size={18} className="text-slate-500"/> Telemetry Logs</h3>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">$lookup</span>
                      </div>
                      <div className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
                        {history.length > 0 ? history.map((item) => (
                          <div key={item._id} className="group relative pl-4 border-l-2 border-slate-200 hover:border-indigo-500 transition-colors">
                            <p className="font-semibold text-slate-800 text-sm mb-1 group-hover:text-indigo-700">{item.article_details?.title}</p>
                            <p className="text-xs text-slate-400 font-medium font-mono">{new Date(item.readAt).toLocaleString()}</p>
                          </div>
                        )) : (
                          <p className="text-sm text-slate-500 text-center py-6 font-medium">Click 'Read' on any article to initiate telemetry logging.</p>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <section className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><PlusCircle size={20} className="text-indigo-600"/> Draft My Article</h3>
                      {activeUser ? (
                        <form onSubmit={(e) => handleCreateArticle(e, activeUser._id)} className="space-y-4">
                          <input className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="Title (e.g., The Future of NoSQL)" value={newArticle.title} onChange={e => setNewArticle({...newArticle, title: e.target.value})} required />
                          <textarea className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium resize-none" placeholder="Article Content..." value={newArticle.body} onChange={e => setNewArticle({...newArticle, body: e.target.value})} required rows={4} />
                          <input className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="Tags (Technology, Data, AI)" value={newArticle.tags} onChange={e => setNewArticle({...newArticle, tags: e.target.value})} required />
                          <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-md">Publish as {activeUser.username}</button>
                        </form>
                      ) : (
                        <p className="text-sm text-red-500 font-medium">Please select an active user from the sidebar first.</p>
                      )}
                    </div>
                  </section>
                  <section className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={20} className="text-slate-600"/> My Published Articles ({myArticles.length})</h3>
                    {myArticles.length > 0 ? (
                      myArticles.map((a) => <ArticleCard key={a._id} article={a} isAdmin={true} />)
                    ) : (
                      <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm font-medium">You haven't published any articles yet.</div>
                    )}
                  </section>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
              <section className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><PlusCircle size={20} className="text-indigo-600"/> Draft Global Article</h3>
                  <form onSubmit={(e) => handleCreateArticle(e, newArticle.authorId)} className="space-y-4">
                    <select 
                      className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium bg-white"
                      value={newArticle.authorId}
                      onChange={e => setNewArticle({...newArticle, authorId: e.target.value})}
                      required
                    >
                      <option value="">-- Assign Author --</option>
                      {users.map(u => <option key={u._id} value={u._id}>{u.username}</option>)}
                    </select>
                    <input className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="Title (e.g., Global AI Trends)" value={newArticle.title} onChange={e => setNewArticle({...newArticle, title: e.target.value})} required />
                    <textarea className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium resize-none" placeholder="Article Content..." value={newArticle.body} onChange={e => setNewArticle({...newArticle, body: e.target.value})} required rows={4} />
                    <input className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="Tags (Technology, Future)" value={newArticle.tags} onChange={e => setNewArticle({...newArticle, tags: e.target.value})} required />
                    <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-md">Publish to Network</button>
                  </form>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><UserPlus size={20} className="text-emerald-600"/> Provision User</h3>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <input className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium" placeholder="Username (e.g., admin_aniket)" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} required />
                    <input className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium" placeholder="Preferences (Finance, Startups)" value={newUser.preferredTags} onChange={e => setNewUser({...newUser, preferredTags: e.target.value})} required />
                    <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-md">Initialize Profile</button>
                  </form>
                </div>
              </section>

              <section className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Users size={20} className="text-slate-600"/> Active Directory ({users.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                    {users.map((u) => (
                      <div key={u._id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center group hover:border-indigo-300 transition-colors">
                        <div>
                          <p className="font-bold text-sm text-slate-800">{u.username}</p>
                          <p className="text-[11px] font-mono text-slate-400 mt-1">{u.preferredTags?.join(", ") || "No tags"}</p>
                        </div>
                        <button onClick={() => handleDeleteUser(u._id)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={20} className="text-slate-600"/> Content Registry ({allArticles.length})</h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {allArticles.map((a) => <ArticleCard key={a._id} article={a} isAdmin={true} />)}
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}