import React, { useState, useEffect } from 'react';
import IndexTicker from './components/IndexTicker';
import ProfileWizard from './components/ProfileWizard';
import RecommendationCard from './components/RecommendationCard';
import PortfolioDashboard from './components/PortfolioDashboard';
import MarketNewsFeed from './components/MarketNewsFeed';
import { InvestmentProfile, StockRecommendation, GroundingSource, PortfolioItem, AlertHistoryItem } from './types';
import { stockCatalog, CatalogStock } from './data';
import { TrendingUp, Award, Newspaper, Flame, HelpCircle, ExternalLink, RefreshCw, AlertCircle, Sparkles, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'recommend' | 'portfolio' | 'news'>('recommend');
  const [profile, setProfile] = useState<InvestmentProfile | null>(null);
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([]);
  const [marketOutlook, setMarketOutlook] = useState<string>('');
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFallbackActive, setIsFallbackActive] = useState(false);

  // Dynamic stock catalog state that gets populated with real-time prices
  const [catalog, setCatalog] = useState<CatalogStock[]>(() => {
    const saved = localStorage.getItem('ai_stock_catalog');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return stockCatalog;
  });

  // Keep catalog state saved
  useEffect(() => {
    localStorage.setItem('ai_stock_catalog', JSON.stringify(catalog));
  }, [catalog]);

  const [isSyncing, setIsSyncing] = useState(false);

  // Price Alerts States
  const [toasts, setToasts] = useState<AlertHistoryItem[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>(() => {
    const saved = localStorage.getItem('ai_stock_alert_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // Keep alert history saved
  useEffect(() => {
    localStorage.setItem('ai_stock_alert_history', JSON.stringify(alertHistory));
  }, [alertHistory]);

  // Trigger auto-dismiss of toasts
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts(prev => prev.slice(0, prev.length - 1));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  // Synchronize dynamic prices across portfolio items and the catalog
  const handleSyncPrices = async () => {
    setIsSyncing(true);
    try {
      const portfolioTickers = portfolio.map(item => item.ticker);
      const catalogTickers = catalog.map(item => item.ticker);
      const uniqueTickers = Array.from(new Set([...portfolioTickers, ...catalogTickers]));

      const response = await fetch('/api/realtime-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers: uniqueTickers }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.isFallback) {
          setIsFallbackActive(true);
        }
        if (data && data.prices && Array.isArray(data.prices)) {
          const pricesMap: Record<string, { price: string; change?: string; isPositive?: boolean }> = {};
          data.prices.forEach((p: any) => {
            if (p.symbol) {
              pricesMap[p.symbol] = p;
              pricesMap[p.symbol.toUpperCase()] = p;
            }
          });

          const parsePriceToNumber = (priceStr: string) => {
            const cleanStr = priceStr.replace(/[^0-9.]/g, '');
            const val = parseFloat(cleanStr);
            return isNaN(val) ? 100 : val;
          };

          // Update user's virtual portfolio items with fresh values
          setPortfolio(prev => {
            return prev.map(item => {
              const matched = pricesMap[item.ticker] || pricesMap[item.ticker.toUpperCase()];
              if (matched) {
                return {
                  ...item,
                  currentPrice: parsePriceToNumber(matched.price)
                };
              }
              return item;
            });
          });

          // Update stock catalog display prices
          setCatalog(prev => {
            return prev.map(item => {
              const matched = pricesMap[item.ticker] || pricesMap[item.ticker.toUpperCase()];
              if (matched) {
                return {
                  ...item,
                  price: parsePriceToNumber(matched.price),
                  change: matched.change || item.change,
                  isPositive: matched.isPositive !== undefined ? matched.isPositive : item.isPositive
                };
              }
              return item;
            });
          });
        }
      }
    } catch (err) {
      console.error("Failed to sync stock prices:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Initialize Portfolio with some realistic default items so the user has an active dashboard immediately
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(() => {
    const saved = localStorage.getItem('ai_stock_portfolio');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: '1',
        ticker: 'NVDA',
        name: '엔비디아',
        market: 'US',
        purchasePrice: 125.00,
        currentPrice: 135.50,
        shares: 15,
        currency: '$',
        dateAdded: new Date().toLocaleDateString()
      },
      {
        id: '2',
        ticker: '005930',
        name: '삼성전자',
        market: 'KR',
        purchasePrice: 76200,
        currentPrice: 75400,
        shares: 40,
        currency: '원',
        dateAdded: new Date().toLocaleDateString()
      }
    ];
  });

  // Save portfolio changes to localStorage
  useEffect(() => {
    localStorage.setItem('ai_stock_portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  // Centralized Price Alert System Monitor
  useEffect(() => {
    const alertsToTrigger: Array<{ item: PortfolioItem; triggeredPrice: number }> = [];

    portfolio.forEach(item => {
      if (item.alertPrice && !item.alertTriggered) {
        const isHit = item.alertCondition === 'above'
          ? item.currentPrice >= item.alertPrice
          : item.currentPrice <= item.alertPrice;

        if (isHit) {
          alertsToTrigger.push({ item, triggeredPrice: item.currentPrice });
        }
      }
    });

    if (alertsToTrigger.length > 0) {
      // 1. Mark triggered alerts as active in portfolio state
      setPortfolio(prev => {
        return prev.map(item => {
          const match = alertsToTrigger.find(a => a.item.id === item.id);
          if (match) {
            return {
              ...item,
              alertTriggered: true
            };
          }
          return item;
        });
      });

      // 2. Log triggered alerts to user UI (Toast and history list)
      alertsToTrigger.forEach(({ item, triggeredPrice }) => {
        const newAlert: AlertHistoryItem = {
          id: Math.random().toString(),
          ticker: item.ticker,
          name: item.name,
          alertPrice: item.alertPrice!,
          triggeredPrice,
          condition: item.alertCondition!,
          currency: item.currency,
          timestamp: new Date().toLocaleTimeString()
        };
        setToasts(prevToasts => [newAlert, ...prevToasts]);
        setAlertHistory(prevHist => [newAlert, ...prevHist].slice(0, 10));
      });
    }
  }, [portfolio]);

  // Load previous recommendations and profile if available
  useEffect(() => {
    const savedProfile = localStorage.getItem('ai_stock_user_profile');
    const savedRecs = localStorage.getItem('ai_stock_user_recs');
    const savedOutlook = localStorage.getItem('ai_stock_user_outlook');
    const savedSources = localStorage.getItem('ai_stock_user_sources');

    if (savedProfile) setProfile(JSON.parse(savedProfile));
    if (savedRecs) setRecommendations(JSON.parse(savedRecs));
    if (savedOutlook) setMarketOutlook(savedOutlook);
    if (savedSources) setSources(JSON.parse(savedSources));
  }, []);

  // Trigger auto-sync on mount to fetch actual real-time stock prices
  useEffect(() => {
    handleSyncPrices();
  }, []);

  // Fluctuate prices slightly in real-time to simulate market activity and test price alerts
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Fluctuate catalog
      setCatalog(prev => {
        return prev.map(stock => {
          const changePercent = (Math.random() * 0.16 - 0.08) / 100; // -0.08% to +0.08%
          const nextPrice = Math.round(stock.price * (1 + changePercent) * 100) / 100;
          return {
            ...stock,
            price: stock.currency === '원' ? Math.round(nextPrice) : nextPrice,
            change: `${changePercent >= 0 ? '+' : ''}${(changePercent * 100).toFixed(2)}%`,
            isPositive: changePercent >= 0
          };
        });
      });

      // 2. Fluctuate portfolio prices
      setPortfolio(prev => {
        return prev.map(item => {
          const changePercent = (Math.random() * 0.16 - 0.08) / 100; // -0.08% to +0.08%
          let nextPrice = item.currentPrice * (1 + changePercent);
          nextPrice = item.currency === '원' ? Math.round(nextPrice) : Math.round(nextPrice * 100) / 100;
          return {
            ...item,
            currentPrice: nextPrice
          };
        });
      });
    }, 7000); // every 7 seconds

    return () => clearInterval(interval);
  }, []);

  // Handler to request AI recommendation using search grounding
  const handleGetRecommendations = async (userProfile: InvestmentProfile) => {
    setIsLoading(true);
    setError(null);
    setProfile(userProfile);
    localStorage.setItem('ai_stock_user_profile', JSON.stringify(userProfile));

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userProfile),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'AI 주식 추천을 받아오는데 실패했습니다.');
      }

      const data = await response.json();
      if (data && data.isFallback) {
        setIsFallbackActive(true);
      }
      const recs = data.recommendations || [];
      const outlook = data.marketOutlook || '';
      const recSources = data.sources || [];

      setRecommendations(recs);
      setMarketOutlook(outlook);
      setSources(recSources);

      localStorage.setItem('ai_stock_user_recs', JSON.stringify(recs));
      localStorage.setItem('ai_stock_user_outlook', outlook);
      localStorage.setItem('ai_stock_user_sources', JSON.stringify(recSources));

      // Auto scroll to recommendations
      setTimeout(() => {
        const target = document.getElementById('recommendations-section');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);

    } catch (err: any) {
      console.error(err);
      setError(err.message || '추천 중 예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add stock to virtual portfolio
  const handleAddToPortfolio = (
    ticker: string,
    name: string,
    market: string,
    price: number,
    shares: number,
    currency: string
  ) => {
    setPortfolio(prev => {
      // Check if stock already exists in portfolio with the same purchase price (or average it)
      const existingIdx = prev.findIndex(item => item.ticker === ticker);
      if (existingIdx > -1) {
        const updated = [...prev];
        const existing = updated[existingIdx];
        const totalShares = existing.shares + shares;
        const avgPrice = ((existing.purchasePrice * existing.shares) + (price * shares)) / totalShares;
        
        updated[existingIdx] = {
          ...existing,
          shares: totalShares,
          purchasePrice: Math.round(avgPrice * 100) / 100,
          currentPrice: price // Use latest as current
        };
        return updated;
      }

      return [
        ...prev,
        {
          id: Math.random().toString(),
          ticker,
          name,
          market,
          purchasePrice: price,
          currentPrice: price,
          shares,
          currency,
          dateAdded: new Date().toLocaleDateString()
        }
      ];
    });
  };

  // Remove stock item from portfolio (virtual sale)
  const handleRemoveItem = (id: string) => {
    setPortfolio(prev => prev.filter(item => item.id !== id));
  };

  // Reset whole portfolio
  const handleResetPortfolio = () => {
    if (window.confirm('가상 투자 내역을 전체 매도하고 초기화하시겠습니까?')) {
      setPortfolio([]);
    }
  };

  // Set or update a price alert for a portfolio item
  const handleUpdateAlertPrice = (itemId: string, alertPrice: number) => {
    setPortfolio(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const alertCondition = alertPrice >= item.currentPrice ? 'above' : 'below';
          return {
            ...item,
            alertPrice,
            alertCondition,
            alertTriggered: false
          };
        }
        return item;
      });
    });
  };

  // Remove a price alert for a portfolio item
  const handleRemoveAlert = (itemId: string) => {
    setPortfolio(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const updated = { ...item };
          delete updated.alertPrice;
          delete updated.alertCondition;
          delete updated.alertTriggered;
          return updated;
        }
        return item;
      });
    });
  };

  const getStyleKoreanName = (style: string) => {
    const styleMap: Record<string, string> = {
      aggressive: "공격투자형",
      balanced: "균형성장형",
      dividend: "배당수익형",
      value: "가치투자형",
      tech: "AI/기술집중형",
      conservative: "안정형"
    };
    return styleMap[style] || style;
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      {/* 1. Scrolling Index Ticker Header */}
      <IndexTicker />

      {/* 2. Top Navigation Bar */}
      <header id="main-header" className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div id="header-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div id="brand-logo" className="flex items-center gap-2.5">
            <div id="brand-logo-icon" className="p-2.5 bg-slate-900 text-white rounded-xl shadow">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div id="brand-title">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>AI 주식 추천 비서</span>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase">Search Grounded</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">사용자 지향 맞춤 포트폴리오 빌더 및 모니터링</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav id="header-nav-tabs" className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full sm:w-auto">
            <button
              id="nav-tab-recommend"
              onClick={() => setActiveTab('recommend')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                activeTab === 'recommend'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-slate-700" />
              <span>AI 주식 추천</span>
            </button>
            <button
              id="nav-tab-portfolio"
              onClick={() => setActiveTab('portfolio')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                activeTab === 'portfolio'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Award className="w-4 h-4 text-slate-700" />
              <span>가상 포트폴리오</span>
            </button>
            <button
              id="nav-tab-news"
              onClick={() => setActiveTab('news')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                activeTab === 'news'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Newspaper className="w-4 h-4 text-slate-700" />
              <span>AI 실시간 뉴스</span>
            </button>
          </nav>
        </div>
      </header>

      {/* 3. Main Body Viewport */}
      <main id="main-content-viewport" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {isFallbackActive && (
          <div id="quota-fallback-notice-banner" className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-bold text-amber-800 block">⚠️ AI 실시간 API 할당량 초과 안내 (시뮬레이션 모드 활성화)</span>
              <p className="text-[11px] text-amber-700 mt-0.5 leading-normal">
                현재 Gemini API의 일일 실시간 검색 및 그라운딩 API 호출 한도가 초과되어, 고품질 백업 알고리즘 기반 시뮬레이션 데이터를 안전하게 활성화하여 서비스를 유지하고 있습니다. 가상 포트폴리오의 실시간 변동, 매매 실습 기능 등은 정상적으로 완벽히 이용 가능합니다.
              </p>
            </div>
          </div>
        )}

        {/* Tab 1: AI Recommendations & Diagnosis */}
        {activeTab === 'recommend' && (
          <div id="recommend-tab-container" className="space-y-8 animate-fade-in">
            <div id="recommend-banner" className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
              {/* Decorative light reflection */}
              <div id="banner-glow" className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 rounded-full blur-3xl"></div>
              
              <div id="banner-content" className="max-w-2xl relative z-10 space-y-3">
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-2.5 py-1 bg-white/10 rounded-full text-emerald-400">
                  personalized asset allocation
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-snug">
                  당신의 투자 DNA를 진단하고,<br/>구글 검색 기반의 실시간 최적 종목을 매칭해 드립니다.
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  원하는 투자 성향, 운용 예산, 타겟 국가를 정의하면, Gemini AI가 구글 서치 그라운딩을 통해 최신 실적 발표와 업계 동향 및 실시간 뉴스를 총합 분석하여 최상의 종목 조합을 처방합니다.
                </p>
              </div>
            </div>

            {/* Split Grid: Diagnosis inputs (Left) & Advice Results (Right) */}
            <div id="recommend-split-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Diagnostic Wizard (Left Panel) */}
              <div id="wizard-sticky-box" className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div id="wizard-title" className="border-b border-slate-100 pb-3">
                  <h3 className="font-sans font-bold text-base text-slate-900 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-slate-700" />
                    <span>성향 진단 및 맞춤 추천 설정</span>
                  </h3>
                </div>
                <ProfileWizard onSubmit={handleGetRecommendations} isLoading={isLoading} />
              </div>

              {/* Recommendation Results (Right Panels) */}
              <div id="results-display-panel" className="lg:col-span-2 space-y-6">
                {/* Loader Overlay */}
                {isLoading && (
                  <div id="recommendation-loader" className="py-20 flex flex-col items-center justify-center space-y-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div id="loading-spinner" className="relative w-12 h-12">
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-200 rounded-full"></div>
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div id="loading-advice" className="text-center space-y-2 max-w-sm px-4">
                      <span className="text-sm font-bold text-slate-800 block">AI가 정밀 실시간 검색을 수행하고 있습니다</span>
                      <p className="text-xs text-slate-400 leading-normal">
                        실제 구글 웹 검색을 통해 종목들의 최근 주가, 실적 컨센서스 및 최신 뉴스를 실시간으로 통합 대조하고 있으므로 약 5~10초의 대기 시간이 소요됩니다.
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div id="recommendation-error" className="bg-rose-50 border border-rose-200 p-5 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
                    <div id="error-text">
                      <span className="text-sm font-bold text-rose-800 block">데이터를 불러오는 중 문제가 발생했습니다</span>
                      <p className="text-xs text-rose-600 mt-1">{error}</p>
                    </div>
                  </div>
                )}

                {/* Initial Blank State (Before Diagnostic) */}
                {!isLoading && !error && recommendations.length === 0 && (
                  <div id="recommendation-empty-diagnostic" className="bg-white border border-slate-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center space-y-4 shadow-sm min-h-[350px]">
                    <div id="empty-icon-bg" className="p-4 bg-slate-50 text-slate-400 rounded-full border border-slate-100">
                      <HelpCircle className="w-10 h-10" />
                    </div>
                    <div id="empty-title">
                      <span className="text-base font-bold text-slate-800 block">아직 생성된 AI 추천 포트폴리오가 없습니다</span>
                      <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed mx-auto">
                        왼쪽 입력창에서 선호하는 투자 성향과 예산을 지정하고 하단의 추천 받기 버튼을 눌러주세요. 구글 실시간 데이터 기반의 정밀 분석 결과를 바로 받아보실 수 있습니다.
                      </p>
                    </div>
                  </div>
                )}

                {/* Active Portfolio Recommendations Results Card */}
                {!isLoading && !error && recommendations.length > 0 && (
                  <div id="recommendations-section" className="space-y-6 scroll-mt-24">
                    {/* Market Comment and Outlook Card */}
                    {marketOutlook && (
                      <div id="market-outlook-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm text-slate-100">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-400 block">
                          AI Market Outlook
                        </span>
                        <h4 className="font-bold text-sm text-white mt-1">포트폴리오 비중 제안 및 어드바이스</h4>
                        <p className="text-xs text-slate-300 mt-2.5 leading-relaxed font-medium">
                          {marketOutlook}
                        </p>
                        {profile && (
                          <div id="active-profile-summary-tags" className="flex flex-wrap gap-2 pt-4 mt-3 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
                            <span>진단 성향: {getStyleKoreanName(profile.style)}</span>
                            <span>•</span>
                            <span>총 예산: {profile.budget.toLocaleString()}원</span>
                            <span>•</span>
                            <span>국가: {profile.market}</span>
                            <span>•</span>
                            <span>기간: {profile.term === 'short' ? '단기' : profile.term === 'medium' ? '중기' : '장기'}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Stock Grid */}
                    <div id="recommendations-cards-grid" className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {recommendations.map((stock, sIdx) => (
                        <RecommendationCard
                          key={sIdx}
                          stock={stock}
                          onAddToPortfolio={handleAddToPortfolio}
                          allocatedBudget={profile ? profile.budget : 5000000}
                        />
                      ))}
                    </div>

                    {/* Grounding Source Attribution Links */}
                    {sources.length > 0 && (
                      <div id="grounding-sources-block" className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-xs">
                        <div id="sources-header" className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            실시간 팩트체크 출처 (Google Search Grounding)
                          </span>
                        </div>
                        <div id="sources-links" className="flex flex-wrap gap-x-6 gap-y-2 pl-3">
                          {sources.map((src, sIdx) => (
                            <a
                              key={sIdx}
                              id={`rec-source-link-${sIdx}`}
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
            </div>
          </div>
        )}

        {/* Tab 2: Virtual Portfolio Monitor */}
        {activeTab === 'portfolio' && (
          <div id="portfolio-tab-container" className="space-y-6 animate-fade-in">
            <div id="portfolio-intro" className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h2 className="text-base font-bold text-slate-900">가상 자산 거래소 및 수익률 모니터</h2>
              <p className="text-xs text-slate-500 mt-1">포트폴리오에 담긴 가상 자산들의 평가 손익과 원금 잔액을 실시간 대조하고 추가 매수/매도할 수 있는 시뮬레이션 환경입니다.</p>
            </div>
            
            <PortfolioDashboard
              portfolio={portfolio}
              onRemoveItem={handleRemoveItem}
              onAddItem={handleAddToPortfolio}
              onResetPortfolio={handleResetPortfolio}
              initialBudget={profile ? profile.budget : 10000000}
              catalog={catalog}
              onSyncPrices={handleSyncPrices}
              isSyncing={isSyncing}
              onUpdateAlertPrice={handleUpdateAlertPrice}
              onRemoveAlert={handleRemoveAlert}
              alertHistory={alertHistory}
            />
          </div>
        )}

        {/* Tab 3: Live AI Financial News */}
        {activeTab === 'news' && (
          <div id="news-tab-container" className="space-y-6 animate-fade-in">
            <MarketNewsFeed />
          </div>
        )}

      </main>

      {/* Floating Price Alert Toasts Container */}
      <div id="floating-toasts-container" className="fixed bottom-5 right-5 z-50 space-y-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: 50 }}
              className="pointer-events-auto bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-700/80 flex items-start gap-3"
            >
              <div className="p-2 bg-indigo-600 rounded-lg text-white">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-400">🔔 알림가 도달 알림</span>
                  <span className="text-[9px] text-slate-400">{toast.timestamp}</span>
                </div>
                <p className="text-xs font-bold mt-1">
                  {toast.name} ({toast.ticker})
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-normal">
                  설정 가격 {toast.currency}{toast.alertPrice.toLocaleString()} {toast.condition === 'above' ? '이상' : '이하'}에 도달했습니다! (현재가: {toast.currency}{toast.triggeredPrice.toLocaleString()})
                </p>
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-slate-400 hover:text-white font-bold text-xs shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 4. Footer */}
      <footer id="app-footer" className="bg-slate-900 text-slate-400 text-xs py-8 mt-12 border-t border-slate-800">
        <div id="footer-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div id="footer-brand">
            <span className="font-bold text-slate-200">AI 주식 추천 비서</span>
            <p className="text-[10px] text-slate-500 mt-1">본 서비스는 구글 실시간 검색 결과를 활용하여 제공되는 가상 투자 분석 도구이며, 실제 매매 손실에 대한 책임을 지지 않습니다.</p>
          </div>
          <div id="footer-copyright" className="text-[10px] text-slate-500">
            © 2026 AI Stock Recommendation. Powered by Gemini & Google Search.
          </div>
        </div>
      </footer>
    </div>
  );
}
