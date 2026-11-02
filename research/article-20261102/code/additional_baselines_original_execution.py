from pathlib import Path
import sys,json,hashlib
import numpy as np
import pandas as pd
from sklearn.svm import SVR
from sklearn.metrics import mean_absolute_error,mean_squared_error,r2_score
APP=Path('D:/trae_projects/trabajo/gemelo-digital-resiliencia')
sys.path.insert(0,str(APP))
from python_engine.research_data import validate_frame,split_dataset,five_folds,FEATURES,TARGET
from python_engine.research_ml import make_search
ROOT=Path(__file__).resolve().parents[1]
OLD=ROOT/'outputs/GDDN_revision_pares_20261026/datos'
OUT=ROOT/'outputs/GDDN_English_20261101'
(OUT/'data').mkdir(parents=True,exist_ok=True)
raw=(OLD/'forest_fires_uci.csv').read_bytes()
assert hashlib.sha256(raw).hexdigest()=='0d6586a1fa52f55bef48578aef14eb97273f1e9330e1a53423df497a77065253'
frame=validate_frame(pd.read_csv(OLD/'forest_fires_uci.csv')).drop_duplicates().reset_index(drop=True)
dev,test,groups=split_dataset(frame,202609)
X=frame.iloc[dev][FEATURES].reset_index(drop=True)
y=np.log1p(frame.iloc[dev][TARGET].to_numpy())
g=groups.iloc[dev].reset_index(drop=True)
folds=five_folds(X,g)
grid={'model__C':[0.1,1.,10.,100.], 'model__gamma':['scale',0.01,0.1], 'model__epsilon':[0.1,0.3]}
rows=[]
for i,(fit,val) in enumerate(folds):
 search=make_search(SVR(kernel='rbf'),grid,five_folds(X.iloc[fit],g.iloc[fit])).fit(X.iloc[fit],y[fit])
 rows.append({'fold':i+1,'mae_log':float(mean_absolute_error(y[val],search.predict(X.iloc[val]))),'best_params':search.best_params_})
 print('SVR fold',i+1,flush=True)
final=make_search(SVR(kernel='rbf'),grid,folds).fit(X,y)
obs=frame.iloc[test][TARGET].to_numpy()
pred=np.maximum(0,np.expm1(final.predict(frame.iloc[test][FEATURES])))
def metrics(p):
 return {'mae_ha':float(mean_absolute_error(obs,p)),'rmse_ha':float(np.sqrt(mean_squared_error(obs,p))),'r2':float(r2_score(obs,p))}
mean=float(frame.iloc[dev][TARGET].mean())
report={'scope':'Post hoc exploratory sensitivity analysis; original test previously inspected; original four-model selection unchanged',
 'seed':202609,'svr_grid':grid,'svr_folds':rows,'svr_mean_mae_log':float(np.mean([r['mae_log'] for r in rows])),
 'svr_sd_mae_log':float(np.std([r['mae_log'] for r in rows],ddof=1)), 'svr_best_params':final.best_params_,
 'svr_test':metrics(pred),'training_mean_ha':mean,'training_mean_test':metrics(np.full(len(obs),mean)),
 'test_predictions':[{'row':int(r),'observed_ha':float(o),'svr_ha':float(p),'training_mean_ha':mean} for r,o,p in zip(test,obs,pred)]}
(OUT/'data/additional_baselines.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k not in ['test_predictions','svr_folds']},indent=2))
