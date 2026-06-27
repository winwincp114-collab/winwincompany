import React, { useEffect, useState } from 'react';
import { initialIndexTrends, IndexTrend } from '../data';
import { ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

export default function IndexTicker() {
  const [trends, setTrends] = useState<IndexTrend[]>(initialIndexTrends);
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    // Update digital clock
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchRealtimeIndexes = async () => {
      try {
        const res = await fetch("/api/realtime-prices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tickers: ["S&P 500", "NASDAQ", "KOSPI", "KOSDAQ", "NVDA", "005930"]
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.prices && Array.isArray(data.prices)) {
            setTrends(prev => {
              return prev.map(item => {
                let match = data.prices.find((p: any) => 
                  p.symbol === item.name || 
                  (item.name.includes("NVDA") && p.symbol === "NVDA") || 
                  (item.name === "삼성전자" && p.symbol === "005930")
                );
                if (!match) {
                  match = data.prices.find((p: any) => 
                    item.name.toLowerCase().includes(p.symbol.toLowerCase()) || 
                    p.symbol.toLowerCase().includes(item.name.toLowerCase())
                  );
                }
                if (match) {
                  return {
                    ...item,
                    value: match.price,
                    change: match.change || item.change,
                    isPositive: match.isPositive !== undefined ? match.isPositive : item.isPositive
                  };
                }
                return item;
              });
            });
          }
        }
      } catch (e) {
        console.error("Failed to fetch real-time indexes", e);
      }
    };

    fetchRealtimeIndexes();
    // Refresh indices every 45 seconds
    const priceInterval = setInterval(fetchRealtimeIndexes, 45000);
    return () => clearInterval(priceInterval);
  }, []);

  useEffect(() => {
    // Softly fluctuate stock indexes every 10 seconds for real-time micro-variation feeling
    const interval = setInterval(() => {
      setTrends(prev =>
        prev.map(item => {
          const cleanStr = item.value.replace(/[^0-9.]/g, '');
          const currentVal = parseFloat(cleanStr);
          if (isNaN(currentVal)) return item;

          const isPos = Math.random() > 0.48;
          const deltaPercent = (Math.random() * 0.04).toFixed(3);
          const newVal = isPos ? currentVal * (1 + parseFloat(deltaPercent) / 100) : currentVal * (1 - parseFloat(deltaPercent) / 100);

          let formattedValue = item.value;
          if (item.value.includes('$')) {
            formattedValue = `$${newVal.toFixed(2)}`;
          } else if (item.value.includes('원')) {
            formattedValue = `${Math.round(newVal).toLocaleString()}원`;
          } else {
            formattedValue = newVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          }
          
          return {
            ...item,
            value: formattedValue,
            change: `${isPos ? '+' : '-'}${deltaPercent}%`,
            isPositive: isPos
          };
        })
      );
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div id="index-ticker-container" className="bg-slate-900 border-b border-slate-800 text-xs text-slate-300 py-2 px-4 flex flex-wrap justify-between items-center gap-4 z-50">
      <div id="ticker-slider" className="flex items-center gap-6 overflow-x-auto scrollbar-none flex-1">
        <span className="font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider shrink-0 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> LIVE
        </span>
        <div id="ticker-items" className="flex items-center gap-8 shrink-0">
          {trends.map((item, idx) => (
            <div key={idx} id={`ticker-item-${item.name.replace(/\s+/g, '-')}`} className="flex items-center gap-2 font-mono shrink-0">
              <span className="text-slate-400 font-sans">{item.name}</span>
              <span className="font-semibold text-white">{item.value}</span>
              <span className={`flex items-center text-[11px] font-medium ${item.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {item.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {item.change}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div id="ticker-clock" className="flex items-center gap-2 font-mono text-slate-400 shrink-0 text-[11px]">
        <Clock className="w-3.5 h-3.5 text-slate-500" />
        <span>KST {time}</span>
      </div>
    </div>
  );
}
