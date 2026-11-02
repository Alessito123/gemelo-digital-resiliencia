import test from 'node:test';
import assert from 'node:assert/strict';
import {rankingReading,predictionsReading,testsReading,correlationReading,twinReading} from '../src/reactApp/readings';
import type {Report,Dataset,Point} from '../src/reactApp/api';
const t=(es:string,_en:string)=>es;
test('interpretation follows the actual run and does not invent significant superiority',()=>{
 const report:Report={seed:1,best_params:{},metadata:{},ranking:[],fold_results:[],hyperparameter_search:[],residual_shapiro:{},protocol:{},limitations:[],winner:'Example model',statistics:{friedman:{statistic:0,p_value:.77},wilcoxon_holm:[{p_holm:1}]},test_metrics:{r2:-.15,mae_ha:12.4,rmse_ha:32.5},test_predictions:[{row:1,observed_ha:1,predicted_ha:2}]};
 assert.match(rankingReading(report,t).interpretation,/Example model/);
 assert.match(rankingReading(report,t).interpretation,/negativo/);
 assert.match(predictionsReading(report,t).interpretation,/1 registros/);
 assert.match(testsReading(report,t).interpretation,/0 de 1/);
 report.statistics.wilcoxon_holm=[{p_holm:.01}];
 assert.match(testsReading(report,t).interpretation,/1 de 1/);
});
test('correlation ignores the diagonal and twin interpretation remains synthetic',()=>{
 const data={correlations:{A:{A:1,B:-.8},B:{A:-.8,B:1}}} as unknown as Dataset;
 assert.match(correlationReading(data,t).interpretation,/r=-0.800/);
 const point={time_min:30,safe_households:3,trapped_households:2} as Point;
 assert.match(twinReading(5,point,t).interpretation,/3 de 5/);
 assert.match(twinReading(5,point,t).explanation,/UCI.*separado/);
});
