import React, { useState } from 'react';
import { StockRecommendation } from '../types';
import { ArrowUpRight, TrendingUp, AlertCircle, ShoppingCart, Check, Globe } from 'lucide-react';

interface RecommendationCardProps {
  stock: StockRecommendation;
  onAddToPortfolio: (ticker: string, name: string, market: string, price: number, shares: number, currency: string) => void;
  allocatedBudget: number;
}

export default function RecommendationCard({ stock, onAddToPortfolio, allocatedBudget }: RecommendationCardProps) {
  const [shares, setShares] = useState<number>(0);
  const [isAdded, setIsAdded] = useState(false);

  // Helper to parse price string like "$135.20" or "74,500원"
  const parsePrice = (priceStr: string) => {
    const isUsd = priceStr.includes('$') || stock.market === 'US';
    const cleanStr = priceStr.replace(/[^0-9.]/g, '');
    const val = parseFloat(cleanStr);
    return {
      value: isNaN(val) ? 100 : val,
      currency: (isUsd ? '$' : '원') as '$' | '원'
    };
  };

  const { value: priceValue, currency } = parsePrice(stock.currentPrice);

  // Auto-calculate suggested shares based on 1/3 of the allocated budget
  const suggestedShares = React.useMemo(() => {
    // If USD, assume approximate conversion of 1350 KRW = 1 USD for budget split
    const priceInWon = currency === '$' ? priceValue * 1350 : priceValue;
    const suggestedWonBudget = allocatedBudget / 3;
    const count = Math.floor(suggestedWonBudget / priceInWon);
    return count > 0 ? count : 1;
  }, [priceValue, currency, allocatedBudget]);

  // Set initial shares once when component loads
  React.useEffect(() => {
    setShares(suggestedShares);
  }, [suggestedShares]);

  const handlePurchase = () => {
    if (shares <= 0) return;
    onAddToPortfolio(stock.ticker, stock.name, stock.market, priceValue, shares, currency);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  const riskBadgeColor = (level: string) => {
    if (level.includes('상') || level.toLowerCase().includes('high')) return 'bg-rose-50 text-rose-600 border-rose-200';
    if (level.includes('하') || level.toLowerCase().includes('low')) return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    return 'bg-amber-50 text-amber-600 border-amber-200';
  };

  return (
    <div id={`rec-card-${stock.ticker}`} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden h-full">
      {/* Card Header */}
      <div id={`rec-card-header-${stock.ticker}`} className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
        <div id={`company-meta-${stock.ticker}`}>
          <div id="ticker-badge" className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-900 bg-slate-200 px-2.5 py-0.5 rounded">
              {stock.ticker}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-white flex items-center gap-1">
              <Globe className="w-2.5 h-2.5" /> {stock.market}
            </span>
          </div>
          <h3 id={`company-name-${stock.ticker}`} className="font-sans font-bold text-lg text-slate-900 mt-2 tracking-tight">
            {stock.name}
          </h3>
          <span className="text-xs text-slate-500 font-medium block mt-1">{stock.sector}</span>
        </div>

        <div id={`price-meta-${stock.ticker}`} className="text-right">
          <span className="text-xs text-slate-400 block font-medium">추천가</span>
          <span className="font-mono text-lg font-extrabold text-slate-900 block mt-0.5">
            {stock.currentPrice}
          </span>
          <span className="text-xs text-emerald-500 font-semibold flex items-center gap-0.5 justify-end mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {stock.expectedGrowth}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div id={`rec-card-body-${stock.ticker}`} className="p-5 flex-1 space-y-4">
        {/* Badges/Metrics Grid */}
        <div id="metrics-grid" className="grid grid-cols-2 gap-3 text-xs border-b border-slate-100 pb-3">
          <div id="metric-target-price">
            <span className="text-slate-400 block">목표가 (Consensus)</span>
            <span className="font-mono font-bold text-slate-800 mt-0.5 block">{stock.targetPrice}</span>
          </div>
          <div id="metric-risk-level">
            <span className="text-slate-400 block">리스크 등급</span>
            <span className={`inline-block px-2 py-0.5 rounded font-bold border mt-0.5 ${riskBadgeColor(stock.riskLevel)}`}>
              {stock.riskLevel}
            </span>
          </div>
        </div>

        {/* Advisor Reason */}
        <div id="advisor-reason" className="space-y-1.5">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-500" /> 추천 투자 포인트
          </span>
          <p className="text-xs text-slate-600 leading-relaxed font-sans bg-slate-50 p-3 rounded-xl border border-slate-100">
            {stock.reason}
          </p>
        </div>

        {/* Real-time Grounding News */}
        <div id="grounding-news" className="space-y-1.5">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" /> 실시간 검색 요약 뉴스
          </span>
          <p className="text-xs text-slate-500 leading-relaxed font-sans bg-slate-50/50 p-3 rounded-xl border border-dashed border-slate-200">
            {stock.recentNewsSummary}
          </p>
        </div>
      </div>

      {/* Card Footer - Virtual Purchase Panel */}
      <div id={`rec-card-footer-${stock.ticker}`} className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
        <div id="purchase-controls" className="flex items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200">
          <div id="shares-input-wrapper" className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium pl-1">수량</span>
            <input
              id={`shares-input-${stock.ticker}`}
              type="number"
              min="1"
              value={shares}
              onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 px-2 py-1 text-xs font-mono font-bold text-center bg-slate-50 border border-slate-200 rounded focus:outline-none"
            />
            <span className="text-xs text-slate-500">주</span>
          </div>
          <div id="total-purchase-cost" className="text-right">
            <span className="text-[10px] text-slate-400 block font-medium">총 매수 추정액</span>
            <span className="font-mono text-xs font-bold text-slate-800">
              {currency === '$' ? '$' : ''}
              {Math.round(priceValue * shares).toLocaleString()}
              {currency === '원' ? '원' : ''}
            </span>
          </div>
        </div>

        <button
          id={`buy-btn-${stock.ticker}`}
          onClick={handlePurchase}
          disabled={isAdded}
          className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isAdded
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
              : 'bg-slate-900 hover:bg-slate-800 text-white hover:shadow'
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4" />
              <span>포트폴리오 추가 완료!</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              <span>가상 투자 포트폴리오에 담기</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
