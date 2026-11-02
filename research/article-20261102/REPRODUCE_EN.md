# Reproduce the analytical results

The manuscript evaluates historical observations, not generated survey responses or synthetic training records. The public dataset is UCI Forest Fires, DOI https://doi.org/10.24432/C5D88D (CC BY 4.0). Code is covered by the MIT licence in code/LICENSE.

The original four-model report, its cell-bootstrap extension and the earlier retraining verification are in data/. The original selected model and original statistical tests remain unchanged. additional_baselines.json records the later RBF SVR and training-mean analysis. That comparison is post hoc because the original holdout had already been inspected.

## Environment

Use Python 3.12.9 and the supplied code/requirements-lock.txt. The recorded analytical packages are scikit-learn 1.9.1, SciPy 1.18.1, pandas 3.0.3 and NumPy 2.5.3. Install in a separate virtual environment. Original engine test evidence is in code/Verificacion_motor.json and the earlier reproduction notes in code/REPRODUCIR.md. Those earlier checks are not claimed as newly run software tests for this translation.

## Additional benchmarks

From this extracted package, execute:

```text
python code/reproduce_additional_baselines.py
```

The script verifies the raw-file SHA-256, removes exact duplicates, regenerates the same seed-202609 split, evaluates the RBF SVR grid in 5-by-5 grouped validation, and fits a constant using the development-set mean. It writes data/additional_baselines.json. The full original execution script is also retained for provenance; the portable script changes only file locations and adds a size assertion. Results may differ across unrecorded numerical environments.

## Raw data and figure traceability

Data_and_results_GDDN.xlsx contains the 517 raw observations, reserved predictions, original and additional fold scores, the 36-cell manifest and formula-linked metrics. All nine MAE/RMSE/R-squared output formulas were checked against Python values within 1e-8.

Figure 1: audited workflow and split definitions. Figure 2: original CSV, log1p area histogram with 20 bins. Figure 3: original ranking means and sample SD. Figures 4 and 5: the 58 original test predictions. Figure 6: original test metrics and additional_baselines.json. Vector PDFs and 600 dpi JPGs are supplied separately. No GD3D figure is included.

## Public availability

This directory is the published computational snapshot. Its parent repository also contains an earlier application version. Cite the commit that contains this directory when reproducing the manuscript. No archival DOI is claimed. Human evaluation is outside the reported experiment.
