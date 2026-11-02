# GDDN analytical module research snapshot

This version contains the React/Python implementation, public UCI Forest Fires observations, the original four-model report, fixed-model cell-bootstrap intervals, exact split manifest and post hoc SVR/training-mean analysis used in the manuscript. It does not claim validation of operational community resilience.

Start with REPRODUCE_EN.md. The corrected application is in code/. Run its Python unit tests from that directory. The portable supplementary benchmark command, from this directory, is `python code/reproduce_additional_baselines.py`. Public raw data are also supplied in MS Excel.

Code: MIT (LICENSE). UCI Forest Fires: CC BY 4.0, DOI https://doi.org/10.24432/C5D88D. The data licence is independent of the software licence.

The application contains illustrative simulation capabilities outside the historical wildfire experiment. No simulated household state is presented as a measured evacuation or resilience outcome. No survey or expert-validation responses were collected.

This is a frozen computational research snapshot, not a new production deployment. It retains the dependency environment used for the recorded experiment. An archival DOI is not assigned in this repository.

Validation on 2 November 2026: 26 Python tests passed. The dependency audit of this historical lockfile reported eight advisories (two critical, five high, one moderate). Dependencies are preserved for research reproducibility; this snapshot should not be presented as a hardened production release.
