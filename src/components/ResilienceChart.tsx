import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ResilienceTimePoint } from '../hooks/useDigitalTwinSimulation';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface ResilienceChartProps {
  data?: ResilienceTimePoint[];
  history?: ResilienceTimePoint[];
}

export function ResilienceChart({ data, history }: ResilienceChartProps) {
  const chartData = data || history || [];
  const { isDark } = useTheme();
  const { language } = useLanguage();

  return (
    <div className="w-full h-64 p-3 rounded-xl bg-black/25 dark:bg-black/40 border border-white/10 shadow-inner">
      <div className="flex items-center justify-between mb-2 px-2">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
          {language === 'es' ? 'Dinámica Temporal de Resiliencia y Evacuación' : 'Temporal Resilience & Evacuation Dynamics'}
        </span>
        <div className="flex items-center gap-3 text-[10px] font-mono font-semibold">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
            {language === 'es' ? 'Evacuación (%)' : 'Evacuation (%)'}
          </span>
          <span className="flex items-center gap-1.5 text-[#F27D26]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F27D26] shadow-[0_0_8px_#F27D26]" />
            {language === 'es' ? 'Resiliencia R(t)' : 'Resilience R(t)'}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="88%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorEvac" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorResilience" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F27D26" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#F27D26" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.06)" : "#E2E8F0"} vertical={false} />
          <XAxis 
            dataKey="timeMin" 
            stroke={isDark ? "#64748B" : "#94A3B8"} 
            fontSize={10} 
            fontFamily="monospace"
            tickFormatter={(value) => `T+${value}m`} 
          />
          <YAxis 
            stroke={isDark ? "#64748B" : "#94A3B8"} 
            fontSize={10} 
            fontFamily="monospace"
            domain={[0, 100]} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? '#0F1117' : '#FFFFFF', 
              borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#E2E8F0', 
              borderRadius: '0.75rem', 
              fontSize: '11px', 
              color: isDark ? '#F1F5F9' : '#0F172A',
              boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
              fontFamily: 'monospace'
            }} 
          />
          <Area 
            type="monotone" 
            dataKey="evacuationRate" 
            name={language === 'es' ? 'Evacuación (%)' : 'Evacuation (%)'} 
            stroke="#10B981" 
            strokeWidth={2.5} 
            fill="url(#colorEvac)" 
          />
          <Area 
            type="monotone" 
            dataKey="resilienceIndex" 
            name={language === 'es' ? 'Resiliencia R(t)' : 'Resilience R(t)'} 
            stroke="#F27D26" 
            strokeWidth={2.5} 
            fill="url(#colorResilience)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
