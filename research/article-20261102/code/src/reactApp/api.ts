export type State = 'exposed' | 'safe' | 'trapped' | 'injured';
export interface Config { settlement_id:string; scenario_id:string; seed:number; hazard_intensity:number; warning_lead_time_min:number; enable_mutual_aid:boolean; enable_multi_scale_feedback:boolean; steps:number }
export interface Point { step:number; time_min:number; evacuation_rate_pct:number; resilience_index:number; safe_households:number; trapped_households:number; household_states:State[] }
export interface Workflow {
  execution_id:string;
  simulation:{ city:string; settlement_name:string; settlement_id:string; scenario_id:string; config:Config; metrics:Record<string,number>; history:Point[]; fragility_points:{title:string;category:string;risk_score:number;affected_households:number;mechanism:string;mitigation:string}[] };
  trace:{sequence:number;node:string;summary:string}[];
  validation:{status:string;compared_metrics:number;normalized_fit_score:number;limitations:string[]};
  protocol:{title:string;lead_time:string;levels:{level:string;threshold:string;action:string}[];checklist:string[]}|null;
  limitations:string[];
}
export interface Report {
 seed:number; winner:string; best_params:Record<string,unknown>; metadata:Record<string,unknown>;
 ranking:{model:string;mean_mae_log:number;std_mae_log:number}[];
 fold_results:Record<string,unknown>[]; hyperparameter_search:Record<string,unknown>[];
 test_metrics:Record<string,number>; statistics:{friedman:{statistic:number;p_value:number};wilcoxon_holm:Record<string,unknown>[]};
 residual_shapiro:Record<string,unknown>; test_predictions:{row:number;observed_ha:number;predicted_ha:number}[];
 protocol:Record<string,unknown>;limitations:string[];
 test_uncertainty?:{confidence_level:number;n_resamples:number;n_groups:number;metrics:Record<string,{estimate:number|null;lower:number|null;upper:number|null;valid_resamples:number}>};
 partition_manifest?:{definition:string;development_pct:number;test_pct:number;cells:{X:number;Y:number;rows:number;split:string}[]};
 evaluation_scope?:{worse_than_test_mean_squared_error:boolean;operational_validation:boolean;scene_3d_evaluated:boolean};
}
export interface Job {id:string;status:'running'|'completed'|'failed';progress:number;message:string;result:Report|null}
export interface Dataset { metadata:Record<string,unknown>; development_rows:number;test_rows:number;missing:Record<string,number>;preview:Record<string,unknown>[];summary:Record<string,unknown>;correlations:Record<string,Record<string,number>>;target_values:number[];numeric_ranges:Record<string,{min:number;max:number;median:number}> }
export interface Snapshot {settlement:string;retrieved_at:string;records:Record<string,unknown>[];license:string;source:string}
export async function api<T>(path:string, body?:unknown, signal?:AbortSignal):Promise<T> {
 const response=await fetch('/api'+path,{method:body===undefined?'GET':'POST',headers:body===undefined?undefined:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal});
 const data=await response.json().catch(()=>null);
 if(!response.ok) throw new Error(typeof data?.detail==='string'?data.detail:`HTTP ${response.status}: ${response.status===422?'Revisa los valores / Check input values':'No se pudo completar la consulta / Request failed'}`);
 return data as T;
}
export function download(value:unknown,name:string){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export const cities=[['lima-sjl','Lima · San Juan de Lurigancho'],['medellin-comuna13','Medellín · Comuna 13'],['cartagena-cienaga','Cartagena · Ciénaga de la Virgen'],['lapaz-cotahuma','La Paz · Cotahuma']];
export const initial:Config={settlement_id:'lima-sjl',scenario_id:'landslide',seed:202609,hazard_intensity:8,warning_lead_time_min:60,enable_mutual_aid:true,enable_multi_scale_feedback:true,steps:20};
