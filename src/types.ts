export interface InvestmentProfile {
  style: 'aggressive' | 'conservative' | 'balanced' | 'dividend' | 'value' | 'tech';
  budget: number;
  market: 'US' | 'KR' | 'ALL' | string;
  term: 'short' | 'medium' | 'long' | string;
  sector: string;
}

export interface StockRecommendation {
  ticker: string;
  name: string;
  sector: string;
  market: string;
  currentPrice: string;
  targetPrice: string;
  riskLevel: string;
  reason: string;
  recentNewsSummary: string;
  expectedGrowth: string;
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface NewsItem {
  title: string;
  summary: string;
  impact: string;
  affectedSectors: string;
}

export interface PortfolioItem {
  id: string;
  ticker: string;
  name: string;
  market: string;
  purchasePrice: number; // numeric representation
  currentPrice: number;  // numeric representation
  shares: number;
  currency: string;
  dateAdded: string;
}
