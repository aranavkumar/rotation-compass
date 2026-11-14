# Rotation Compass submission draft

## Project name and high-level summary

**Rotation Compass**

Which three-season crop rotations can a field support, and what changes if irrigation becomes unavailable? Rotation Compass helps users explore that question for Ludhiana, Punjab. It combines historical NASA POWER rainfall and temperature with a crop calendar and user-supplied field conditions. Reviewers can compare a sample rice–wheat–rice rotation with alternatives, see which assumptions drive the ranking, and change those assumptions without changing the historical record.

## Detailed project description

The sample journey starts with an illustrative 2.4-hectare field. Farm Evidence shows where the soil information came from and retrieves district-scale meteorology from NASA POWER. The bundled June 2022–May 2025 record lets reviewers explore the default period during an upstream outage. For other periods, the app shows a matching cached response when available or reports the data gap.

The TypeScript engine enumerates 27 three-season sequences across kharif, rabi and kharif. It screens crop windows, field occupation, irrigation availability, drainage, and other documented constraints. A failed constraint, an unresolved required check and a missing scoring input have different consequences. Among scoreable alternatives, the engine applies the user's weights for climate, water, crop diversity and residue retention. It then selects up to three alternatives that differ in at least two crop slots from each other. The user can inspect the reasons a sequence missed the shortlist.

Scenario Explorer reruns the same engine with hypothetical rainfall and temperature shifts, different irrigation access or revised farmer priorities. For example, removing irrigation from the sample makes its reference rice and wheat systems fail. The comparison shows the affected crops alongside the unchanged baseline. Historical seasonal rainfall helps compare gross water availability. Estimating irrigation volume would require effective rainfall, soil-water balance and losses.

A browser interface and server-side POWER endpoint deliver this pilot. Automated checks exercise calendar boundaries, hard failures, evidence gaps, weight handling, repeatability, scenario isolation, empty shortlists and cache fallback. The sample journey was exercised at desktop and mobile viewport sizes. Agronomist review, farmer testing, farm-level predictions and measured impact remain outside the completed work.

## NASA data

NASA POWER daily point meteorology supplied corrected precipitation and mean near-surface temperature at 75.86° E, 30.90° N. The app aggregates the daily values into inclusive seasons, tracks missing days per variable and compares complete historical seasons with reference crop ranges. The evidence view exposes the data period, source, coordinates and request link.

## Space agency partner data and other references

Use the entries and links in the [dataset and reference inventory](DATA-SOURCES.md). Identify Punjab Agricultural University for crop calendars and reference systems, FAO for global crop-group ranges and residue-cover guidance, and NASA POWER for meteorology. List the project tooling and retained third-party notices from the repository's license documentation. No additional space-agency partner dataset is claimed.

## Use of Super Intelligence (SI)

OpenAI Codex assisted with implementing the planner and scenario comparison, writing regression checks, operating browser checks, researching submission guidance and drafting explanations and submission text. The agricultural scores come from deterministic rules. NASA POWER is the source of the historical meteorology. The sample farm and separate example charts are synthetic. Before submission, the team should add any further AI or asset use outside this development record and confirm the account of its own contributions.

## Proposed future work

Seek independent review of the district-specific assumptions and test the explanations with farmers. Extend the supported crop systems only after obtaining appropriate cultivar and transition evidence. A field irrigation model would require additional data and validation. These are proposals.

## Seven-slide demonstration outline

| Slide | What to show | What to say |
| --- | --- | --- |
| 1. Rotation Compass | The app's Farm Setup view, Team Dracarys, Aranav Kumar and “Field Shift: Adapting Farms with NASA Data” | Ask which three-season alternatives a Ludhiana field can support. |
| 2. Start with the field | Load Satluj farm. Show rice → wheat → rice, 2.4 ha and estimated loam texture. | The field is an illustrative sample. Field reports, assumptions and measurements can have different origins. |
| 3. Locate the NASA evidence | Show the default evidence table and its date, grid and coverage labels. | POWER daily rainfall and temperature become historical seasonal comparisons; the grid describes the district. |
| 4. Explain the shortlist | Show Maize → Wheat → Rice details and open the exclusions. | All 27 rotations receive the same checks. Unavailable crop evidence can leave a sequence unranked. |
| 5. Stress-test a choice | Set rainfall to −50%, temperature to +3 °C and climate priority to 100, leaving the other weights at their sample values. | Maize → Wheat → Maize moves from rank 3 to rank 1 in the full alternatives comparison for the default record. |
| 6. Lose irrigation | Change irrigation availability to Unavailable. Show the current practice row and then reset. | The rice–wheat–rice system now fails the reference irrigation checks. Reset restores the baseline table. |
| 7. Scope and evidence | Show the methodology screen, POWER/PAU/FAO credits, AI disclosure and the verified public app address when available. | Software checks and desktop/mobile-viewport journeys were completed. Local agronomic review and farmer testing are future work. |

Use English throughout. Count the title and credits within these seven slides. Use captures of the actual interface and credit assets. The prepared browser presentation credits Team Dracarys and Aranav Kumar.

## Current form and submission handoff

The official guide dated November 13, 2026 was retrieved and read on November 15. It documents the team-only form. This review covered the published instructions rather than a signed-in team's saved form. The form asks for the project name, summary, demo URL, final-project URL, detailed description, SI disclosure, NASA data, and partner data/other references. [Official Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/)

1. Confirm team registration and challenge selection. For award eligibility the guide requires team members to be accepted at the same event. Use **My Team → Project → Edit**.
2. Supply two distinct public URLs: the final project and its demo. The release serves the final project at / and the seven-slide presentation at /demo. Use the release report for verified addresses. If a demo URL is pending, make an English slide deck from the outline or a video up to 30 seconds. A non-English narration needs English subtitles. The submission site accepts links to hosted documents/videos. Check both links in a signed-out browser. [Organizer hosting clarification](https://github.com/nasa/spaceapps/discussions/1991)
3. Enter the English draft and source inventory, check rights, and review SI attribution. The guide calls for disclosure in descriptions and metadata for generated code/data or audio, and visible watermarks on SI-generated images/video. It prohibits generated NASA branding and likenesses of people under 18 in demos/final projects.
4. Save progress. A team member must review and agree to the terms and originality declarations, select **Submit for Judging** and verify the confirmation banner. After later edits, submit again. The deadline is **November 15, 2026 at 11:59 p.m. in the team's Local Event timezone**. The Universal Event uses the team owner's residence timezone. Local judging arrangements can differ. [Official Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/)
