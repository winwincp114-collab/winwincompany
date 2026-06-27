export interface IndexTrend {
  name: string;
  value: string;
  change: string;
  isPositive: boolean;
}

export const initialIndexTrends: IndexTrend[] = [
  { name: "S&P 500", value: "5,473.17", change: "+0.47%", isPositive: true },
  { name: "NASDAQ", value: "17,721.59", change: "+0.82%", isPositive: true },
  { name: "KOSPI", value: "2,689.12", change: "-0.24%", isPositive: false },
  { name: "KOSDAQ", value: "852.14", change: "+0.12%", isPositive: true },
  { name: "NVIDIA (NVDA)", value: "135.50", change: "+3.24%", isPositive: true },
  { name: "삼성전자", value: "75,400", change: "-0.53%", isPositive: false },
];

export interface CatalogStock {
  ticker: string;
  name: string;
  market: 'US' | 'KR';
  price: number;
  currency: '$' | '원';
  sector: string;
  change: string;
  isPositive: boolean;
}

export const stockCatalog: CatalogStock[] = [
  { ticker: "NVDA", name: "엔비디아", market: "US", price: 135.50, currency: "$", sector: "AI 반도체", change: "+3.24%", isPositive: true },
  { ticker: "AAPL", name: "애플", market: "US", price: 208.50, currency: "$", sector: "빅테크/스마트폰", change: "+1.15%", isPositive: true },
  { ticker: "MSFT", name: "마이크로소프트", market: "US", price: 412.30, currency: "$", sector: "클라우드/AI", change: "-0.45%", isPositive: false },
  { ticker: "TSLA", name: "테슬라", market: "US", price: 182.20, currency: "$", sector: "전기차/자율주행", change: "+2.10%", isPositive: true },
  { ticker: "005930", name: "삼성전자", market: "KR", price: 75400, currency: "원", sector: "반도체/가전", change: "-0.53%", isPositive: false },
  { ticker: "000660", name: "SK하이닉스", market: "KR", price: 188300, currency: "원", sector: "메모리 반도체", change: "+1.89%", isPositive: true },
  { ticker: "005380", name: "현대자동차", market: "KR", price: 245000, currency: "원", sector: "완성차/친환경", change: "+0.82%", isPositive: true },
  { ticker: "035420", name: "NAVER", market: "KR", price: 168000, currency: "원", sector: "인터넷 플랫폼", change: "-1.12%", isPositive: false }
];

// Generates 7 days of realistic mock price history for charting
export function generateChartData(basePrice: number, volatility: number = 0.02) {
  const data = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    
    // Random walk
    const multiplier = 1 + (Math.random() - 0.48) * volatility * (i === 0 ? 0 : 1);
    const price = Math.round(basePrice * multiplier * 100) / 100;
    
    data.push({
      date: dateStr,
      price: price
    });
  }
  return data;
}
