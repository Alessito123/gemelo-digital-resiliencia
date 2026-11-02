import type {Report} from './api';
import {Note,Table,useText} from './ui';

export function ResearchAudit({report}:{report:Report}) {
 const t=useText();
 const uncertainty=report.test_uncertainty;
 const partition=report.partition_manifest;
 const format=(value:number|null)=>value===null?t('No definido','Undefined'):value.toFixed(4);
 return <>
  {report.test_metrics.r2<0?<Note>{t('El predictor tuvo mayor error cuadrático que predecir la media de prueba. Este experimento no acredita uso operacional ni valida la escena 3D.','The predictor had greater squared error than predicting the test mean. This experiment establishes neither operational use nor validation of the 3D scene.')}</Note>:null}
  {uncertainty?<section aria-label={t('Incertidumbre de prueba','Test uncertainty')}>
   <h3>{t('Intervalos bootstrap de prueba','Test bootstrap intervals')} · {(100*uncertainty.confidence_level).toFixed(0)} %</h3>
   <Table rows={Object.entries(uncertainty.metrics).map(([metric,interval])=>({
    [t('Métrica','Metric')]:metric,[t('Estimación','Estimate')]:format(interval.estimate),
    [t('Límite inferior','Lower bound')]:format(interval.lower),[t('Límite superior','Upper bound')]:format(interval.upper)
   }))}/>
   <p>{t('Se remuestrean celdas completas y se mantienen fijas las predicciones.','Whole cells are resampled while predictions remain fixed.')} {uncertainty.n_resamples.toLocaleString()} {t('réplicas','resamples')} · {uncertainty.n_groups} {t('celdas reservadas','held-out cells')}.</p>
   <Note>{t('Con pocas celdas, estos intervalos son exploratorios. No incluyen incertidumbre del entrenamiento o selección, ni demuestran validez en otra población.','With few cells, these intervals are exploratory. They exclude training and selection uncertainty and do not establish validity in another population.')}</Note>
  </section>:<Note>{t('Este informe anterior no incluye intervalos. Vuelve a ejecutar el entrenamiento para obtener el informe ampliado.','This older report contains no intervals. Rerun training to obtain the extended report.')}</Note>}
  {partition?<details><summary>{t('Celdas y proporciones auditables','Auditable cells and proportions')}</summary>
   <p>{t('Grupos definidos por igualdad de X/Y originales; no se infiere tamaño en kilómetros.','Groups use equality of original X/Y labels; no kilometre size is inferred.')}</p>
   <p>{t('Desarrollo','Development')}: {partition.development_pct.toFixed(2)} % · {t('Prueba','Test')}: {partition.test_pct.toFixed(2)} %</p>
   <Table rows={partition.cells}/>
  </details>:null}
 </>;
}
