import type {Report} from './api';
import {Note,Table,useText} from './ui';
import {researchSource} from './readings';

export function ResearchAudit({report}:{report:Report}) {
 const t=useText();
 const uncertainty=report.test_uncertainty;
 const partition=report.partition_manifest;
 return <>
  {report.test_metrics.r2<0?<Note>{t('El predictor tuvo mayor error cuadrático que predecir la media de prueba. Este experimento no acredita uso operacional ni valida la escena 3D.','The predictor had greater squared error than predicting the test mean. This experiment establishes neither operational use nor validation of the 3D scene.')}</Note>:null}
  {uncertainty?<section aria-label={t('Incertidumbre de prueba','Test uncertainty')}>
   <h3>{t('Intervalos bootstrap de prueba','Test bootstrap intervals')} · {(100*uncertainty.confidence_level).toFixed(0)} %</h3>
   <Table title={t('Incertidumbre de las métricas','Metric uncertainty')} source={researchSource(report)}
    explanation={t('Estimación puntual y límites percentiles obtenidos al remuestrear celdas espaciales completas de la prueba.','Point estimate and percentile limits from resampling whole held-out spatial cells.')}
    interpretation={t(`Se usaron ${uncertainty.n_resamples} réplicas de ${uncertainty.n_groups} celdas, con nivel nominal ${(100*uncertainty.confidence_level).toFixed(0)} %. Las predicciones se mantienen fijas: no incluye incertidumbre del ajuste o selección. Con pocas celdas es exploratorio, sin garantía de cobertura nominal.`,`${uncertainty.n_resamples} resamples of ${uncertainty.n_groups} cells were used, at nominal ${(100*uncertainty.confidence_level).toFixed(0)}% confidence. Predictions stay fixed: training and selection uncertainty are excluded. With few cells this is exploratory, without guaranteed nominal coverage.`)}
    rows={Object.entries(uncertainty.metrics).map(([metric,interval])=>({
    [t('Métrica','Metric')]:metric,[t('Estimación','Estimate')]:interval.estimate,
    [t('Límite inferior','Lower bound')]:interval.lower,[t('Límite superior','Upper bound')]:interval.upper,
    [t('Réplicas válidas','Valid resamples')]:interval.valid_resamples
   }))}/>
   <p>{t('Se remuestrean celdas completas y se mantienen fijas las predicciones.','Whole cells are resampled while predictions remain fixed.')} {uncertainty.n_resamples.toLocaleString()} {t('réplicas','resamples')} · {uncertainty.n_groups} {t('celdas reservadas','held-out cells')}.</p>
   <Note>{t('Con pocas celdas, estos intervalos son exploratorios. No incluyen incertidumbre del entrenamiento o selección, ni demuestran validez en otra población.','With few cells, these intervals are exploratory. They exclude training and selection uncertainty and do not establish validity in another population.')}</Note>
  </section>:<Note>{t('Este informe anterior no incluye intervalos. Vuelve a ejecutar el entrenamiento para obtener el informe ampliado.','This older report contains no intervals. Rerun training to obtain the extended report.')}</Note>}
  {partition?<details><summary>{t('Celdas y proporciones auditables','Auditable cells and proportions')}</summary>
   <p>{t('Grupos definidos por igualdad de X/Y originales; no se infiere tamaño en kilómetros.','Groups use equality of original X/Y labels; no kilometre size is inferred.')}</p>
   <p>{t('Desarrollo','Development')}: {partition.development_pct.toFixed(2)} % · {t('Prueba','Test')}: {partition.test_pct.toFixed(2)} %</p>
   <Table title={t('Manifiesto de partición espacial','Spatial partition manifest')} source={researchSource(report)}
    explanation={t('Cada fila representa una combinación original X/Y del UCI, con su número de registros y asignación a desarrollo o prueba.','Each row represents an original UCI X/Y combination, its record count and development/test assignment.')}
    interpretation={t(`Se documentan ${partition.cells.length} celdas; desarrollo ${partition.development_pct.toFixed(2)} % y prueba ${partition.test_pct.toFixed(2)} % de filas. Las etiquetas no son latitud/longitud ni permiten atribuir tamaños en kilómetros.`,`There are ${partition.cells.length} documented cells; development contains ${partition.development_pct.toFixed(2)}% and test ${partition.test_pct.toFixed(2)}% of rows. Labels are not latitude/longitude and do not establish cell dimensions in kilometres.`)} rows={partition.cells}/>
  </details>:null}
 </>;
}
