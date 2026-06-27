import React, { useState, useEffect } from 'react';
import { NewsItem, GroundingSource } from '../types';
import { Newspaper, ArrowUpRight, TrendingUp, AlertTriangle, ExternalLink, RefreshCw, Layers } from 'lucide-react';

export default function MarketNewsFeed() {
  const [category, setCategory] = useState<'all' | 'global' | 'KR' | 'tech'>('all');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async (targetCategory: typeof category) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/market-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: targetCategory }),
      });

      if (!response.ok) {
        throw new Error('실시간 뉴스를 가져오지 못했습니다.');
      }

      const data = await response.json();
      setNews(data.news || []);
      setSources(data.sources || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '인터넷 연결을 확인하거나 나중에 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(category);
  }, [category]);

  const impactBadge = (impact: string) => {
    if (impact.includes('호재') || impact.toLowerCase().includes('pos') || impact.includes('상승')) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
          <TrendingUp className="w-3 h-3" /> 호재
        </span>
      );
    }
    if (impact.includes('악재') || impact.toLowerCase().includes('neg') || impact.includes('하락')) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-rose-200 bg-rose-50 text-rose-600">
          <AlertTriangle className="w-3 h-3" /> 악재
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-100 text-slate-500">
        중립
      </span>
    );
  };

  return (
    <div id="market-news-feed-root" className="space-y-6">
      {/* Category selector */}
      <div id="news-header-panel" className="flex flex-wrap justify-between items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div id="news-title">
          <h3 className="font-sans font-bold text-base text-slate-900 flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-slate-700" />
            <span>AI 기반 실시간 증시 뉴스 브리핑</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">Google Search 그라운딩을 활용해 실시간 시장 뉴스를 분석해 줍니다.</p>
        </div>

        {/* Categories Grid */}
        <div id="news-tabs" className="flex bg-slate-200/80 p-1 rounded-xl">
          {(['all', 'global', 'KR', 'tech'] as const).map((cat) => (
            <button
              key={cat}
              id={`news-tab-${cat}`}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                category === cat
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat === 'all' ? '전체' : cat === 'global' ? '글로벌/미국' : cat === 'KR' ? '국내/한국' : 'AI/테크'}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div id="news-loading-spinner" className="py-16 flex flex-col items-center justify-center space-y-4 bg-white border border-slate-200 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-slate-800 animate-spin" />
          <div id="loading-text" className="text-center space-y-1">
            <span className="text-sm font-bold text-slate-700 block">실시간 증시 뉴스를 탐색하고 있습니다</span>
            <p className="text-xs text-slate-400">구글 실시간 검색을 기반으로 현재 가장 화제인 이벤트를 요약하는 중입니다...</p>
          </div>
        </div>
      ) : error ? (
        <div id="news-error-panel" className="p-8 text-center bg-white border border-rose-100 rounded-2xl space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <span className="text-sm font-bold text-slate-800 block">오류가 발생했습니다</span>
          <p className="text-xs text-slate-500">{error}</p>
          <button
            id="news-retry-btn"
            onClick={() => fetchNews(category)}
            className="text-xs text-white bg-slate-900 px-4 py-2 rounded-lg font-bold"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div id="news-grid" className="space-y-4">
          <div id="news-items-container" className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {news.map((item, idx) => (
              <div
                key={idx}
                id={`news-card-${idx}`}
                className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div id="news-card-content" className="space-y-3.5">
                  <div id="news-card-badge-row" className="flex items-center justify-between">
                    {impactBadge(item.impact)}
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Layers className="w-3 h-3 text-slate-300" /> {item.affectedSectors}
                    </span>
                  </div>

                  <h4 id={`news-headline-${idx}`} className="font-sans font-bold text-sm text-slate-900 leading-snug tracking-tight">
                    {item.title}
                  </h4>

                  <p id={`news-summary-${idx}`} className="text-xs text-slate-500 leading-relaxed font-sans">
                    {item.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Sources section */}
          {sources.length > 0 && (
            <div id="news-sources" className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                실시간 팩트체크 출처 (Google Search Grounding)
              </span>
              <div id="news-sources-links" className="flex flex-wrap gap-x-6 gap-y-1.5">
                {sources.map((src, sIdx) => (
                  <a
                    key={sIdx}
                    id={`news-source-link-${sIdx}`}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 transition-colors group"
                  >
                    <span className="truncate max-w-[200px]">{src.title}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-slate-600 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
