import {useText} from './locale';
export interface ReadingText {explanation:string;interpretation:string}
export function Reading({explanation,interpretation}:ReadingText){const t=useText();return <div className="reading"><p><strong>{t('Explicación','Explanation')}: </strong>{explanation}</p><p><strong>{t('Interpretación','Interpretation')}: </strong>{interpretation}</p></div>}
