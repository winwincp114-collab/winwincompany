import React, { useState, useMemo } from 'react';
import { PortfolioItem } from '../types';
import { stockCatalog, generateChartData, CatalogStock } from '../data';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Percent, Trash2, Plus, Info, Award } from 'lucide-react';

interface PortfolioDashboardProps {
  portfolio: PortfolioItem[];
  onRemoveItem: (id: string) => void;
  onAddItem: (ticker: string, name: string, market: 'US' | 'KR', price: number, shares: number, currency: '$' | '원') => void;
  onResetPortfolio: () => void;
  initialBudget: number;
}

export default function PortfolioDashboard({
  portfolio,
  onRemoveItem,
  onAddItem,
  onResetPortfolio,
  initialBudget
}: PortfolioDashboardProps) {
  const [selectedStock, setSelectedStock] = useState<CatalogStock | null>(stockCatalog[0]);
  const [buyShares, setBuyShares] = useState<number>(10);

  // Generate 7-day interactive chart data for selected stock
  const chartData = useMemo(() => {
    if (!selectedStock) return [];
    return generateChartData(selectedStock.price, selectedStock.market === 'US' ? 0.03 : 0.015);
  }, [selectedStock]);

  // Calculations for portfolio summary metrics
  // We'll normalize USD to KRW using 1350 KRW/USD for consolidated statistics
  const metrics = useMemo(() => {
    let totalInvestedWon = 0;
    let totalCurrentValueWon = 0;

    portfolio.forEach(item => {
      const itemCost = item.purchasePrice * item.shares;
      const itemCurrent = item.currentPrice * item.shares;

      if (item.currency === '$') {
        totalInvestedWon += itemCost * 1350;
        totalCurrentValueWon += itemCurrent * 1350;
      } else {
        totalInvestedWon += itemCost;
        totalCurrentValueWon += itemCurrent;
      }
    });

    const netProfitWon = totalCurrentValueWon - totalInvestedWon;
    const profitPercentage = totalInvestedWon > 0 ? (netProfitWon / totalInvestedWon) * 100 : 0;
    const cashRemainingWon = Math.max(initialBudget - totalInvestedWon, 0);
    const totalAssetValuationWon = cashRemainingWon + totalCurrentValueWon;

    return {
      totalInvestedWon,
      totalCurrentValueWon,
      netProfitWon,
      profitPercentage,
      cashRemainingWon,
      totalAssetValuationWon
    };
  }, [portfolio, initialBudget]);

  const handleCatalogBuy = () => {
    if (!selectedStock || buyShares <= 0) return;
    onAddItem(
      selectedStock.ticker,
      selectedStock.name,
      selectedStock.market,
      selectedStock.price,
      buyShares,
      selectedStock.currency
    );
  };

  return (
    <div id="portfolio-dashboard-root" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Metrics and Interactive Chart (Span 2) */}
      <div id="dashboard-main-col" className="lg:col-span-2 space-y-6">
        {/* Metrics Grid */}
        <div id="dashboard-metrics-row" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Box 1: Total Valuation */}
          <div id="metric-box-total-asset" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div id="total-asset-text">
              <span className="text-xs text-slate-400 font-medium block">총 자산 평가액</span>
              <span className="font-mono text-xl font-extrabold text-slate-900 mt-1 block">
                {Math.round(metrics.totalAssetValuationWon).toLocaleString()}원
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">
                (예수금 + 보유 주식 가치)
              </span>
            </div>
            <div id="total-asset-icon-bg" className="p-3 rounded-xl bg-slate-100 text-slate-700">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          {/* Box 2: Total Invested */}
          <div id="metric-box-cash" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div id="cash-text">
              <span className="text-xs text-slate-400 font-medium block">남은 투자 예수금</span>
              <span className="font-mono text-xl font-extrabold text-slate-900 mt-1 block">
                {Math.round(metrics.cashRemainingWon).toLocaleString()}원
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">
                초기 예산의 {Math.round((metrics.cashRemainingWon / initialBudget) * 100)}%
              </span>
            </div>
            <div id="cash-icon-bg" className="p-3 rounded-xl bg-slate-100 text-slate-700">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Box 3: Net Profit */}
          <div id="metric-box-profit" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div id="profit-text">
              <span className="text-xs text-slate-400 font-medium block">누적 투자 수익률</span>
              <span className={`font-mono text-xl font-extrabold mt-1 block ${
                metrics.netProfitWon >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {metrics.netProfitWon >= 0 ? '+' : ''}
                {Math.round(metrics.netProfitWon).toLocaleString()}원
              </span>
              <span className={`text-[10px] font-semibold flex items-center gap-0.5 mt-1 ${
                metrics.netProfitWon >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {metrics.netProfitWon >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {metrics.profitPercentage.toFixed(2)}% 수익률
              </span>
            </div>
            <div id="profit-icon-bg" className={`p-3 rounded-xl ${
              metrics.netProfitWon >= 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
            }`}>
              <Percent className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Dynamic Chart Container */}
        <div id="dashboard-chart-card" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div id="chart-header" className="flex flex-wrap justify-between items-center gap-3">
            <div id="chart-title">
              <h3 className="font-sans font-bold text-base text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-700" />
                <span>종목 모니터링 및 실시간 시세 시뮬레이션</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">상단 카탈로그에서 기업을 클릭하면 7일 가격 추이를 볼 수 있습니다.</p>
            </div>

            {/* Quick stock selector from Catalog */}
            <div id="chart-selector" className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">선택 종목:</span>
              <select
                id="stock-selector-dropdown"
                value={selectedStock?.ticker || ''}
                onChange={(e) => {
                  const stock = stockCatalog.find(s => s.ticker === e.target.value);
                  if (stock) setSelectedStock(stock);
                }}
                className="text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg focus:outline-none"
              >
                {stockCatalog.map(s => (
                  <option key={s.ticker} value={s.ticker}>
                    {s.name} ({s.ticker})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Chart Canvas */}
          {selectedStock && (
            <div id="chart-canvas-wrapper" className="h-64 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={selectedStock.market === 'US' ? '#10b981' : '#06b6d4'} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={selectedStock.market === 'US' ? '#10b981' : '#06b6d4'} stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    labelStyle={{ fontWeight: 'bold', fontSize: '11px', color: '#94a3b8' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(val) => [`${selectedStock.currency}${Number(val).toLocaleString()}`, '주가']}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={selectedStock.market === 'US' ? '#10b981' : '#06b6d4'}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Catalog Buy Assistant Bar */}
          {selectedStock && (
            <div id="chart-trade-panel" className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div id="trade-meta" className="flex items-center gap-3">
                <span className="text-xs bg-slate-800 text-white font-bold px-2 py-0.5 rounded">
                  {selectedStock.ticker}
                </span>
                <span className="text-sm font-bold text-slate-800">{selectedStock.name}</span>
                <span className="font-mono text-sm font-semibold text-slate-600">
                  {selectedStock.currency === '$' ? '$' : ''}
                  {selectedStock.price.toLocaleString()}
                  {selectedStock.currency === '원' ? '원' : ''}
                </span>
              </div>

              <div id="trade-controls" className="flex items-center gap-3">
                <div id="trade-shares-input" className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">추가 수량:</span>
                  <input
                    id="chart-shares-input"
                    type="number"
                    min="1"
                    value={buyShares}
                    onChange={(e) => setBuyShares(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 px-2 py-1 text-xs text-center font-mono font-bold bg-white border border-slate-200 rounded-lg focus:outline-none"
                  />
                  <span className="text-xs text-slate-500">주</span>
                </div>
                <button
                  id="trade-buy-btn"
                  onClick={handleCatalogBuy}
                  className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-800 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>가상 매수하기</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Virtual Portfolio Assets Table (Span 1) */}
      <div id="dashboard-side-col" className="space-y-6">
        {/* Holdings List Card */}
        <div id="dashboard-assets-card" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col h-full min-h-[430px]">
          <div id="assets-header" className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <h3 className="font-sans font-bold text-base text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>나의 포트폴리오 자산 ({portfolio.length})</span>
            </h3>
            {portfolio.length > 0 && (
              <button
                id="portfolio-reset-btn"
                onClick={onResetPortfolio}
                className="text-[10px] text-rose-500 font-semibold border border-rose-200 hover:bg-rose-50 px-2 py-1 rounded transition-colors cursor-pointer"
              >
                전체 초기화
              </button>
            )}
          </div>

          {portfolio.length === 0 ? (
            <div id="assets-empty-state" className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Info className="w-8 h-8 text-slate-400" />
              <div id="empty-text">
                <span className="text-sm font-bold text-slate-700 block">보유 중인 주식이 없습니다</span>
                <p className="text-xs text-slate-400 mt-1 leading-normal">
                  왼쪽 추천 탭에서 포트폴리오를 발굴하거나, 위의 종목 모니터링을 통해 시뮬레이션 매수를 시작하세요!
                </p>
              </div>
            </div>
          ) : (
            <div id="assets-list-wrapper" className="flex-1 space-y-3 overflow-y-auto max-h-[380px] pr-1">
              {portfolio.map((item) => {
                const totalCost = item.purchasePrice * item.shares;
                const totalValue = item.currentPrice * item.shares;
                const profitRatio = ((item.currentPrice - item.purchasePrice) / item.purchasePrice) * 100;

                return (
                  <div
                    key={item.id}
                    id={`asset-card-${item.ticker}`}
                    className="p-3.5 border border-slate-150 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2.5 relative group"
                  >
                    {/* Trash Can Button on Hover */}
                    <button
                      id={`sell-btn-${item.id}`}
                      onClick={() => onRemoveItem(item.id)}
                      className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50/80 transition-colors cursor-pointer"
                      title="전량 가상 매도"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div id={`asset-meta-${item.ticker}`} className="flex justify-between pr-6">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-200 px-1.5 py-0.2 rounded">
                            {item.ticker}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{item.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          평균매수가: {item.currency}{item.purchasePrice.toLocaleString()} | {item.shares}주
                        </span>
                      </div>
                    </div>

                    <div id={`asset-performance-${item.ticker}`} className="flex justify-between items-end border-t border-slate-150/50 pt-2 font-mono">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-medium">평가 금액</span>
                        <span className="text-xs font-bold text-slate-800">
                          {item.currency}{Math.round(totalValue).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 block font-medium">수익률</span>
                        <span className={`text-xs font-bold flex items-center justify-end gap-0.5 ${
                          profitRatio >= 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          {profitRatio >= 0 ? '+' : ''}
                          {profitRatio.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
