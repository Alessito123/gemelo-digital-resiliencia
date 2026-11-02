import { FormEvent, useState } from 'react';
import { ClipboardCheck, LockKeyhole } from 'lucide-react';
import { CommunitySurveyAggregate } from '../../types';

interface Props { onApply: (survey: CommunitySurveyAggregate) => void }

const initialSurvey: CommunitySurveyAggregate = {
  responseCount: 80,
  warningAccessPct: 68,
  institutionalTrustPct: 52,
  mutualAidPct: 74,
  mobilityConstraintPct: 22,
  priorDisasterExperiencePct: 61,
};

export function CommunitySurveyCard({ onApply }: Props) {
  const [survey, setSurvey] = useState(initialSurvey);
  const [applied, setApplied] = useState(false);
  const update = (field: keyof CommunitySurveyAggregate, value: number) => setSurvey((current) => ({ ...current, [field]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onApply(survey);
    setApplied(true);
  };

  return (
    <article className="evidence-card evidence-card--wide">
      <div className="evidence-card__icon" aria-hidden="true"><ClipboardCheck /></div>
      <div className="min-w-0">
        <p className="eyebrow">Calibración participativa</p>
        <h3>Encuesta comunitaria agregada</h3>
        <p className="privacy-note"><LockKeyhole aria-hidden="true" /> No solicita nombres, teléfonos ni ubicación de hogares.</p>
        <form className="survey-grid" onSubmit={submit}>
          <label>Respuestas<input name="responseCount" type="number" min="10" max="10000" value={survey.responseCount} onChange={(event) => update('responseCount', Number(event.target.value))} /></label>
          <label>Acceso a alertas<input name="warningAccessPct" type="number" min="0" max="100" value={survey.warningAccessPct} onChange={(event) => update('warningAccessPct', Number(event.target.value))} /><span>%</span></label>
          <label>Confianza institucional<input name="institutionalTrustPct" type="number" min="0" max="100" value={survey.institutionalTrustPct} onChange={(event) => update('institutionalTrustPct', Number(event.target.value))} /><span>%</span></label>
          <label>Apoyo mutuo<input name="mutualAidPct" type="number" min="0" max="100" value={survey.mutualAidPct} onChange={(event) => update('mutualAidPct', Number(event.target.value))} /><span>%</span></label>
          <label>Restricción de movilidad<input name="mobilityConstraintPct" type="number" min="0" max="100" value={survey.mobilityConstraintPct} onChange={(event) => update('mobilityConstraintPct', Number(event.target.value))} /><span>%</span></label>
          <label>Experiencia previa<input name="priorDisasterExperiencePct" type="number" min="0" max="100" value={survey.priorDisasterExperiencePct} onChange={(event) => update('priorDisasterExperiencePct', Number(event.target.value))} /><span>%</span></label>
          <button className="evidence-button" type="submit">Aplicar calibración</button>
        </form>
        <p className="field-message" aria-live="polite">{applied ? 'Calibración aplicada. La simulación volvió al paso inicial.' : 'Los porcentajes ajustan el preset sin almacenar respuestas individuales.'}</p>
      </div>
    </article>
  );
}
