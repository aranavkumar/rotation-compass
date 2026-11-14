# Data and reference inventory

## NASA dataset used in the demonstration

Credit NASA Langley Research Center's Prediction Of Worldwide Energy Resources (POWER) project, supported by the NASA Earth Science Division. The sample was retrieved on 14 November 2026 at 19:23:47 UTC from the POWER Daily API v2.10.3. Its response identifies MERRA2 as the source. POWER is listed under the challenge's resources. [POWER referencing guide](https://power.larc.nasa.gov/docs/referencing/) · [Field Shift resources](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/?tab=resources)

| Item | Contents and use |
| --- | --- |
| Raw record | [Bundled JSON](data/ludhiana-daily.json) contains the retrieval timestamp, header, coordinates, units and dated values. The default sample covers 1 June 2022 through 31 May 2025 inclusive at 30.90° N, 75.86° E in Ludhiana. |
| Corrected precipitation | PRECTOTCORR measures precipitation rate in mm/day. Each UTC day contributes one day's depth in mm to its seasonal total. |
| Air temperature | T2M is daily mean air temperature at 2 metres in °C. The app computes a seasonal mean and reports the count of valid days. |
| Coverage and scale | The bundled series contains 1,096 valid values per variable across six seasons. POWER meteorology represents a 0.5° latitude × 0.625° longitude grid. The returned coordinates identify a point request. |
| API and fallback | The worker can request other completed crop years. It uses only a matching cached period after an upstream failure. Incomplete seasonal coverage leaves the corresponding scoring input unavailable. |

[Exact sample data request](https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR%2CT2M&community=AG&longitude=75.86&latitude=30.90&start=20220601&end=20250531&format=JSON&time-standard=UTC) · [POWER Daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/) · [NASA guidance on native resolution](https://power.larc.nasa.gov/docs/tutorials/service-data-request/api/)

## Agricultural references

| Source | Use in the pilot |
| --- | --- |
| [PAU College of Agriculture course catalogue](https://pau.edu/coa/index.php?DO=viewMatter&_act=manageDepartments&intDepTitleID=339&intLinkID=2) | AGRON-211 and AGRON-212 provide seasonal crop classifications. The three dated planning windows are application choices. |
| [PAU Kharif 2026](https://pau.edu/content/ccil/pf/pp_kharif.pdf) | Rice, maize and moong reference systems, cultivar durations and field conditions. The [rice chapter](https://pau.edu/content/ccil/pf/pp_kharif.pdf#page=10) covers soil pH, PR 126 and transplanting. |
| [PAU Rabi 2025–26](https://pau.edu/content/ccil/pf/pp_rabi.pdf) | Wheat cultivar timing, field conditions and recurring wheat rotations inform the screen. Undocumented transitions remain incomplete. |
| [FAO agronomic factors](https://www.fao.org/4/x5648e/x5648e0e.htm) | Table 33 provides crop-group photosynthesis temperature bands. Comparing whole-season mean temperature with those bands is a pilot approximation. |
| [FAO crop water needs](https://www.fao.org/4/s2022e/s2022e07.htm) | Table 14 supplies indicative growing-period water depths for rice, maize and wheat. Seasonal rain divided by the midpoint gives a gross rainfall comparison. Effective rainfall, crop timing and irrigation losses would be needed for a field irrigation estimate. |
| [FAO soil organic cover](https://www.fao.org/conservation-agriculture/in-practice/soil-organic-cover/en) | Basis for considering surface residue retention. The binary practice score is a design choice. |

## Example inputs and derived outputs

The [sample fixture](src/fixture.ts) supplies an illustrative 2.4 ha farm, estimated loam soil and a rice–wheat–rice practice. The optional monthly example charts contain synthetic rainfall and temperature series for June–September 2026, with missing rainfall in August. The ranker uses the historical POWER record independently of those charts. User-entered soil measurements carry their stated basis and source. Irrigation access, drainage and residue retention are field assumptions.

The [configuration](src/evaluation-config.ts) and [evaluator](src/evaluator.ts) define feasibility checks, per-component indicators, weighted scores and diversity shortlisting. Scenario adjustments apply to a separate hypothetical context. No yield, revenue, irrigation volume or measured change in soil condition is produced.

## Release link check

On 15 November 2026, anonymous HTTPS GET requests returned HTTP 200 for the official external references above, including the parameterized NASA data request. The check inspected HTML titles, PDF signatures and the returned JSON content. The link to the rice chapter replaces a PAU research subdomain that returned HTTP 523. The resource tab at the linked challenge URL included a NASA POWER link. This check establishes source access at the time of release. Independent agronomic validation and farmer testing remain outstanding.
