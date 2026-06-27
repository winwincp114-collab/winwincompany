import React, { useState } from 'react';
import { InvestmentProfile } from '../types';
import { Flame, Shield, Activity, Coins, Scale, Cpu, Search, HelpCircle } from 'lucide-react';

interface ProfileWizardProps {
  onSubmit: (profile: InvestmentProfile) => void;
  isLoading: boolean;
}

export default function ProfileWizard({ onSubmit, isLoading }: ProfileWizardProps) {
  const [style, setStyle] = useState<InvestmentProfile['style']>('balanced');
  const [budget, setBudget] = useState<number>(5000000); // Default 5 million KRW
  const [market, setMarket] = useState<InvestmentProfile['market']>('ALL');
  const [term, setTerm] = useState<InvestmentProfile['term']>('medium');
  const [sector, setSector] = useState<string>('');

  const styleOptions = [
    {
      id: 'aggressive' as const,
      name: '공격투자형',
      desc: '고성장주, 테크주 중심 높은 변동성과 극대화된 수익성 지향',
      icon: Flame,
      color: 'border-rose-500/30 hover:border-rose-500 text-rose-500 bg-rose-500/5',
      activeColor: 'ring-2 ring-rose-500 bg-rose-500/10 border-rose-500 text-rose-500'
    },
    {
      id: 'tech' as const,
      name: 'AI/기술집중형',
      desc: '반도체, 인공지능, 자율주행 등 미래 하이테크 메가트렌드 투자',
      icon: Cpu,
      color: 'border-cyan-500/30 hover:border-cyan-500 text-cyan-500 bg-cyan-500/5',
      activeColor: 'ring-2 ring-cyan-500 bg-cyan-500/10 border-cyan-500 text-cyan-500'
    },
    {
      id: 'balanced' as const,
      name: '균형성장형',
      desc: '시장 지수 추종 대형 우량주와 고배당 성장주의 균형 잡힌 자산 배분',
      icon: Activity,
      color: 'border-emerald-500/30 hover:border-emerald-500 text-emerald-500 bg-emerald-500/5',
      activeColor: 'ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500 text-emerald-500'
    },
    {
      id: 'dividend' as const,
      name: '배당수익형',
      desc: '고배당금, 배당 귀족주 중심의 정기적인 인컴 수익과 높은 현금 흐름',
      icon: Coins,
      color: 'border-amber-500/30 hover:border-amber-500 text-amber-500 bg-amber-500/5',
      activeColor: 'ring-2 ring-amber-500 bg-amber-500/10 border-amber-500 text-amber-500'
    },
    {
      id: 'value' as const,
      name: '가치투자형',
      desc: '재무 상태가 탄탄하고 본질 가치 대비 주가가 저평가된 장기 유망주',
      icon: Scale,
      color: 'border-indigo-500/30 hover:border-indigo-500 text-indigo-500 bg-indigo-500/5',
      activeColor: 'ring-2 ring-indigo-500 bg-indigo-500/10 border-indigo-500 text-indigo-500'
    },
    {
      id: 'conservative' as const,
      name: '안정형',
      desc: '경기 방어주, 필수 소비재, 현금 자산 중심 손실 위험 극소화',
      icon: Shield,
      color: 'border-slate-500/30 hover:border-slate-500 text-slate-500 bg-slate-500/5',
      activeColor: 'ring-2 ring-slate-500 bg-slate-500/10 border-slate-500 text-slate-500'
    }
  ];

  const handleQuickBudget = (amount: number) => {
    if (amount === 0) {
      setBudget(1000000);
    } else {
      setBudget(prev => Math.min(prev + amount, 100000000)); // Cap at 100m KRW
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ style, budget, market, term, sector });
  };

  return (
    <form id="profile-wizard-form" onSubmit={handleFormSubmit} className="space-y-6">
      {/* 1. Investment Style Selection */}
      <div id="profile-section-style" className="space-y-3">
        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <span>1. 투자 성향 선택</span>
          <span className="text-xs text-slate-400 font-normal">(포트폴리오의 투자 방향성을 결정합니다)</span>
        </label>
        <div id="style-cards-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {styleOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = style === opt.id;
            return (
              <button
                key={opt.id}
                id={`style-btn-${opt.id}`}
                type="button"
                onClick={() => setStyle(opt.id)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                  isSelected ? opt.activeColor : `bg-white border-slate-200 text-slate-700 hover:bg-slate-50`
                }`}
              >
                <div id={`style-icon-wrapper-${opt.id}`} className="p-2 rounded-lg bg-slate-100 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div id={`style-text-wrapper-${opt.id}`}>
                  <h4 className="font-bold text-sm tracking-tight">{opt.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Budget Input */}
      <div id="profile-section-budget" className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div id="budget-labels" className="flex justify-between items-center">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <span>2. 가상 투자 예산 설정</span>
          </label>
          <span className="font-mono text-base font-bold text-slate-900">
            {Number(budget).toLocaleString()}원
          </span>
        </div>
        <input
          id="budget-range-input"
          type="range"
          min="500000"
          max="50000000"
          step="500000"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full accent-slate-800 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
        />
        <div id="quick-budget-buttons" className="flex flex-wrap gap-2 pt-1.5">
          <button
            id="budget-add-1m"
            type="button"
            onClick={() => handleQuickBudget(1000000)}
            className="px-2.5 py-1 text-xs font-medium border border-slate-300 rounded bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            +100만
          </button>
          <button
            id="budget-add-5m"
            type="button"
            onClick={() => handleQuickBudget(5000000)}
            className="px-2.5 py-1 text-xs font-medium border border-slate-300 rounded bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            +500만
          </button>
          <button
            id="budget-add-10m"
            type="button"
            onClick={() => handleQuickBudget(10000000)}
            className="px-2.5 py-1 text-xs font-medium border border-slate-300 rounded bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            +1000만
          </button>
          <button
            id="budget-reset"
            type="button"
            onClick={() => handleQuickBudget(0)}
            className="px-2.5 py-1 text-xs font-medium border border-rose-200 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            초기화 (100만)
          </button>
        </div>
      </div>

      {/* 3. Market & Term Config */}
      <div id="profile-section-market-term" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Target Market */}
        <div id="market-config" className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">3. 투자 목표 시장</label>
          <div id="market-options" className="grid grid-cols-3 gap-2">
            {(['ALL', 'KR', 'US'] as const).map((m) => (
              <button
                key={m}
                id={`market-btn-${m}`}
                type="button"
                onClick={() => setMarket(m)}
                className={`py-2 text-xs font-bold border rounded-lg cursor-pointer transition-all ${
                  market === m
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                {m === 'ALL' ? '글로벌 전체' : m === 'KR' ? '국내 (한국)' : '해외 (미국)'}
              </button>
            ))}
          </div>
        </div>

        {/* Investment Horizon */}
        <div id="term-config" className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">4. 선호 투자 기간</label>
          <div id="term-options" className="grid grid-cols-3 gap-2">
            {(['short', 'medium', 'long'] as const).map((t) => (
              <button
                key={t}
                id={`term-btn-${t}`}
                type="button"
                onClick={() => setTerm(t)}
                className={`py-2 text-xs font-bold border rounded-lg cursor-pointer transition-all ${
                  term === t
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                {t === 'short' ? '단기 (1~3M)' : t === 'medium' ? '중기 (3~12M)' : '장기 (1Y+)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Sector Selection */}
      <div id="profile-section-sector" className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 flex justify-between items-center">
          <span>5. 관심 산업군/섹터 (선택 사항)</span>
          <span className="text-xs text-slate-400 font-normal">쉼표(,)로 구분하여 입력</span>
        </label>
        <div id="sector-input-wrapper" className="relative">
          <input
            id="sector-text-input"
            type="text"
            placeholder="예: AI 반도체, 이차전지, 바이오헬스, 우주항공"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>
        <p className="text-[11px] text-slate-400 leading-normal pl-1">
          특정 산업군을 명시하면 AI가 해당 카테고리 내에서 사용자의 성향에 맞는 우량 종목들을 우선 발굴합니다.
        </p>
      </div>

      {/* Submit Button */}
      <button
        id="profile-submit-btn"
        type="submit"
        disabled={isLoading}
        className={`w-full py-4 rounded-xl text-white font-bold text-sm shadow-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
          isLoading
            ? 'bg-slate-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 hover:shadow-lg active:scale-[0.99]'
        }`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>AI 가 주식 정보 분석 및 추천을 구성 중...</span>
          </>
        ) : (
          <>
            <span>AI 맞춤 주식 포트폴리오 추천 받기</span>
          </>
        )}
      </button>
    </form>
  );
}
