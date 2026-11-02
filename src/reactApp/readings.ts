import type {Dataset,Report,Point,Snapshot} from './api';
import type {ReadingText} from './Reading';
type Translate=(es:string,en:string)=>string;
export function twinReading(count:number,point:Point,t:Translate):ReadingText{
 return {explanation:t('Cada vivienda representa un hogar sintético estable. Sus estados proceden del motor poblacional Python; el terreno y las calles son esquemáticos. UCI entrena un módulo de incendios separado y no determina estos estados.','Each house represents a stable synthetic household. States come from the Python population engine; terrain and streets are schematic. UCI trains a separate fire module and does not determine these states.'),
 interpretation:t(`Al minuto ${point.time_min.toFixed(1)}, ${point.safe_households} de ${count} hogares están a salvo y ${point.trapped_households} quedan atrapados, incluidos los lesionados. Es el resultado de este escenario y semilla: no es una medición del barrio ni una validación operativa.`,`At minute ${point.time_min.toFixed(1)}, ${point.safe_households} of ${count} households are safe and ${point.trapped_households} remain trapped, including injured households. This is a result for this scenario and seed, not a neighborhood measurement or operational validation.`)};
}

export function publicReading(snapshot:Snapshot,t:Translate):ReadingText{
 const rows=snapshot.records;
 const limits=snapshot.limitations??t('La consulta aporta contexto, no calibra automáticamente el gemelo.','The query provides context and does not automatically calibrate the twin.');
 return {explanation:t(`Registros devueltos por la fuente pública para el territorio consultado. Son ${rows.length} filas obtenidas el ${snapshot.retrieved_at}; se conserva su procedencia y licencia.`,`Records returned by the public source for the queried area: ${rows.length} rows retrieved at ${snapshot.retrieved_at}, with provenance and license preserved.`),
 interpretation:rows.some(row=>'mapped_buildings' in row)?t(`Se registran ${String(rows[0].mapped_buildings)} edificios cartografiados. No equivale a hogares, población, informalidad ni seguridad estructural. ${limits}`,`${String(rows[0].mapped_buildings)} mapped buildings are recorded. This does not establish households, population, informality or structural safety. ${limits}`):
 rows.some(row=>'magnitude' in row)?t(`Los ${rows.length} eventos son una consulta acotada, no un catálogo completo para estimar frecuencia o predecir sismos. ${limits}`,`The ${rows.length} events form a bounded query, not a complete catalogue for frequency estimation or earthquake prediction. ${limits}`):
 rows.some(row=>'precipitation_mm_day' in row)?t(`Las ${rows.length} observaciones describen precipitación diaria de grilla, no una medición en cada hogar ni una alerta oficial. ${limits}`,`The ${rows.length} observations describe gridded daily precipitation, not household measurements or an official warning. ${limits}`):
 t(`No se deben inferir ausencia de peligro ni valores cero a partir de registros vacíos. ${limits}`,`Empty records must not be interpreted as no hazard or zero values. ${limits}`)};
}
export function researchSource(report:Report){return `UCI Forest Fires · DOI 10.24432/C5D88D · seed ${report.seed} · SHA-256 ${String(report.metadata.sha256??'not recorded')}`;}

export function histogramReading(data:Dataset,t:Translate):ReadingText{
 const values=data.target_values,zero=values.filter(v=>v===0).length;
 return {explanation:t('Distribución del área quemada en desarrollo, agrupada en 20 intervalos de log1p(área). El eje vertical cuenta registros.','Development burned-area distribution in 20 log1p(area) bins. The vertical axis counts records.'),
 interpretation:values.length?t(`${zero} de ${values.length} registros tienen área cero (${(100*zero/values.length).toFixed(1)} %). El máximo es ${Math.max(...values).toFixed(2)} ha. La escala logarítmica reduce el peso visual de los extremos; no representa resiliencia urbana.`,`${zero} of ${values.length} records have zero area (${(100*zero/values.length).toFixed(1)}%). The maximum is ${Math.max(...values).toFixed(2)} ha. Log scaling reduces visual dominance of extremes; this is not urban resilience.`):t('No hay registros para interpretar.','No records are available to interpret.')};
}

export function correlationReading(data:Dataset,t:Translate):ReadingText{
 const keys=Object.keys(data.correlations);let strongest:{a:string;b:string;v:number}|null=null;
 keys.forEach((a,i)=>keys.slice(i+1).forEach(b=>{const v=data.correlations[a]?.[b];if(Number.isFinite(v)&&(!strongest||Math.abs(v)>Math.abs(strongest.v)))strongest={a,b,v};}));
 return {explanation:t('Coeficientes de Pearson de las variables numéricas en desarrollo. Valores entre −1 y 1 indican asociación lineal; la diagonal es autocorrelación.','Pearson coefficients for development numeric variables. Values from −1 to 1 measure linear association; the diagonal is self-correlation.'),
 interpretation:strongest?t(`La asociación absoluta más alta fuera de la diagonal es ${strongest.a}–${strongest.b}: r=${strongest.v.toFixed(3)}. No demuestra causalidad ni utilidad predictiva fuera de muestra.`, `The strongest off-diagonal absolute association is ${strongest.a}–${strongest.b}: r=${strongest.v.toFixed(3)}. It does not demonstrate causality or out-of-sample predictive utility.`):t('No hay pares válidos para interpretar.','No valid pairs are available to interpret.')};
}

export function rankingReading(report:Report,t:Translate):ReadingText{
 const p=report.statistics.friedman.p_value;
 return {explanation:t('Orden descriptivo por el MAE medio de log1p(área) en los cinco folds externos; menor es mejor. La desviación informa variación entre folds.','Descriptive ranking by mean log1p(area) MAE across five outer folds; lower is better. Standard deviation describes between-fold variation.'),
 interpretation:t(`${report.winner} fue seleccionado en esta ejecución. Friedman p=${p.toPrecision(4)}: ${p<.05?'hay una señal global exploratoria, que no identifica por sí sola los pares diferentes':'no se detectan diferencias globales al nivel 0.05'}. ${report.test_metrics.r2<0?'El R² de prueba es negativo: no supera a la media en error cuadrático.':'El desempeño observado no acredita utilidad operativa.'} Selección no equivale a superioridad; la potencia no está cuantificada.`,`${report.winner} was selected in this run. Friedman p=${p.toPrecision(4)}: ${p<.05?'there is an exploratory global signal, which does not identify differing pairs on its own':'no global differences are detected at the 0.05 level'}. ${report.test_metrics.r2<0?'Held-out R² is negative: squared error exceeds the test-mean baseline.':'Observed performance does not establish operational utility.'} Selection is not superiority; power has not been quantified.`)};
}

export function predictionsReading(report:Report,t:Translate):ReadingText{
 const m=report.test_metrics;
 return {explanation:t('Área real y predicha de los registros reservados. En la dispersión, X es el área observada y Y la estimada, ambas en hectáreas. La tabla conserva los identificadores disponibles.','Observed and predicted areas for held-out records. Scatter X is observed area and Y is predicted area, both in hectares. The table preserves available identifiers.'),
 interpretation:t(`Se evalúan ${report.test_predictions.length} registros: MAE=${m.mae_ha.toFixed(3)} ha, RMSE=${m.rmse_ha.toFixed(3)} ha y R²=${m.r2.toFixed(3)}. ${m.r2<0?'El modelo tiene mayor error cuadrático que predecir la media de esta prueba.':'Estos resultados se limitan a esta reserva espacial.'} No valida estados de hogares ni la escena 3D.`,`${report.test_predictions.length} records are evaluated: MAE=${m.mae_ha.toFixed(3)} ha, RMSE=${m.rmse_ha.toFixed(3)} ha and R²=${m.r2.toFixed(3)}. ${m.r2<0?'The model has higher squared error than predicting this test set’s mean.':'These results apply only to this spatial hold-out.'} They do not validate household states or the 3D scene.`)};
}

export function foldsReading(report:Report,t:Translate):ReadingText{
 const models=new Set(report.fold_results.map(row=>row.model));
 return {explanation:t('Una fila por modelo y fold externo. Incluye error log, tamaños de entrenamiento/validación e hiperparámetros elegidos dentro del ajuste interno.','One row per model and outer fold, including log error, training/validation sizes and hyperparameters selected by inner tuning.'),
 interpretation:t(`Hay ${report.fold_results.length} evaluaciones de ${models.size} modelos. Compara el promedio y la variación, no solo un fold favorable. Los folds comparten entrenamiento; no son cinco experimentos independientes.`,`${report.fold_results.length} evaluations cover ${models.size} models. Compare means and variation rather than choosing a favorable fold. Folds share training data; they are not five independent experiments.`)};
}

export function testsReading(report:Report,t:Translate):ReadingText{
 const pairs=report.statistics.wilcoxon_holm,significant=pairs.filter(row=>typeof row.p_holm==='number'&&row.p_holm<.05).length;
 return {explanation:t('Wilcoxon compara errores emparejados entre dos modelos; Holm ajusta los valores p por comparaciones múltiples. La diferencia media conserva el orden izquierda menos derecha.','Wilcoxon compares paired errors for two models; Holm adjusts p-values for multiple comparisons. Mean differences retain left-minus-right order.'),
 interpretation:t(`${significant} de ${pairs.length} pares tienen p ajustado menor que 0.05. No significancia no demuestra equivalencia. Con cinco folds dependientes, los contrastes son exploratorios y no se ha estimado potencia estadística.`,`${significant} of ${pairs.length} pairs have adjusted p below 0.05. Non-significance does not demonstrate equivalence. With five dependent folds, these tests are exploratory and statistical power has not been estimated.`)};
}
