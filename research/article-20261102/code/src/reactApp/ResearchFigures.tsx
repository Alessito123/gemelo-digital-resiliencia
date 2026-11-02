import {useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,ScatterChart,Scatter,CartesianGrid} from 'recharts';
import ExportFigure from './ExportFigure';
import {useText} from './ui';
import type {Dataset,Report} from './api';

export function Histogram({data}:{data:Dataset}){
 const t=useText();const rows=useMemo(()=>{
  const values=data.target_values.map(v=>Math.log1p(v)),max=Math.max(...values,1);
  const bins=Array.from({length:20},(_,i)=>({area:(i*max/20).toFixed(1),count:0}));
  values.forEach(v=>bins[Math.min(19,Math.floor(v/max*20))].count++);return bins;
 },[data]);
 return <ExportFigure name="uci-area-histogram" title={t('Distribución del área quemada','Burned area distribution')} caption={t('UCI Forest Fires · CC BY 4.0 · solo desarrollo · eje X: log1p(área) · eje Y: registros.','UCI Forest Fires · CC BY 4.0 · development only · X: log1p(area) · Y: records.')}><div className="chart" role="img" aria-label={t('Histograma del área quemada','Burned area histogram')}><ResponsiveContainer width="100%" height={300}><BarChart data={rows} margin={{top:16,right:24,bottom:20,left:12}}><XAxis dataKey="area"/><YAxis/><Tooltip/><Bar dataKey="count" fill="var(--ink)" isAnimationActive={false}/></BarChart></ResponsiveContainer></div></ExportFigure>;
}

export function CorrelationFigure({data}:{data:Dataset}){
 const t=useText(),keys=Object.keys(data.correlations),cell=52,offset=92,size=offset+keys.length*cell+12;
 return <ExportFigure name="uci-correlations" title={t('Correlaciones entre variables','Variable correlations')} caption={t('UCI Forest Fires · CC BY 4.0 · solo desarrollo · correlación de Pearson; asociación no implica causalidad.','UCI Forest Fires · CC BY 4.0 · development only · Pearson correlation; association does not imply causation.')}>
 <div className="correlation-figure"><svg role="img" aria-label={t('Matriz de correlaciones','Correlation matrix')} viewBox={`0 0 ${size} ${size}`} width="100%" style={{color:'var(--ink)'}}>
 {keys.map((key,i)=><g key={key}><text x={offset+i*cell+cell/2} y={offset-18} textAnchor="middle" fontSize={12} fill="currentColor">{key}</text><text x={offset-12} y={offset+i*cell+cell/2+4} textAnchor="end" fontSize={12} fill="currentColor">{key}</text></g>)}
 {keys.flatMap((row,i)=>keys.map((col,j)=>{const value=data.correlations[col][row];return <g key={`${row}-${col}`}><rect x={offset+j*cell} y={offset+i*cell} width={cell-2} height={cell-2} fill="currentColor" fillOpacity={.05+Math.abs(value)*.22}/><text x={offset+j*cell+cell/2} y={offset+i*cell+cell/2+4} fontSize={11} textAnchor="middle" fill="currentColor">{value.toFixed(2)}</text></g>}))}
 </svg></div></ExportFigure>;
}

export function PredictionFigure({report,id}:{report:Report;id:string}){
 const t=useText();return <ExportFigure name={`predictions-${id}`} title={t('Área observada frente a estimada','Observed vs predicted area')} caption={`${t('Prueba reservada','Held-out test')} · ${report.winner} · ${t('semilla','seed')} ${report.seed} · UCI Forest Fires · X: ${t('real','observed')} (ha) · Y: ${t('estimada','predicted')} (ha).`}>
 <div className="chart"><ResponsiveContainer width="100%" height={340}><ScatterChart margin={{top:20,right:30,bottom:20,left:20}}><CartesianGrid stroke="var(--line)"/><XAxis type="number" dataKey="observed_ha" name={t('Real (ha)','Observed (ha)')}/><YAxis type="number" dataKey="predicted_ha" name={t('Estimada (ha)','Predicted (ha)')}/><Tooltip cursor={{strokeDasharray:'3 3'}}/><Scatter data={report.test_predictions} fill="var(--ink)" isAnimationActive={false}/></ScatterChart></ResponsiveContainer></div></ExportFigure>;
}

export function RankingFigure({report,id}:{report:Report;id:string}){
 const t=useText();return <ExportFigure name={`ranking-${id}`} title={t('Comparación de modelos','Model comparison')} caption={t('Media de MAE log en 5 folds externos · menor es mejor · selección no demuestra superioridad estadística.','Mean log MAE across 5 outer folds · lower is better · selection does not prove statistical superiority.')}>
 <div className="chart"><ResponsiveContainer width="100%" height={290}><BarChart data={report.ranking} layout="vertical" margin={{top:15,right:30,bottom:15,left:15}}><XAxis type="number"/><YAxis type="category" dataKey="model" width={135} tick={{fontSize:12}}/><Tooltip/><Bar dataKey="mean_mae_log" fill="var(--ink)" isAnimationActive={false}/></BarChart></ResponsiveContainer></div></ExportFigure>;
}
