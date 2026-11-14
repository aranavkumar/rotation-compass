# Rotation Compass

Team Dracarys · Aranav Kumar · NASA Space Apps 2026, Field Shift

Explore three-season crop rotations for Ludhiana, Punjab, against historical NASA POWER meteorology and field assumptions. The release includes a runnable sample and a separate seven-slide presentation at `/demo`.

## Run locally

From this directory, use Node.js 24. The standalone planner uses Node built-ins. No API key, account or dependency installation is needed.

```sh
node scripts/check.mjs
node scripts/local.mjs
```

Open `http://localhost:4173/` for the app or `http://localhost:4173/demo` for the presentation. Stop the server with Ctrl+C. Run `node scripts/build-planner.mjs` to regenerate the deployable Worker module at `dist/server/index.js`.

## Reviewer journey

1. Load the sample farm and choose **Save & view evidence**. Inspect the source, date range and number of valid days in each NASA season.
2. Choose **Explore rotations**. Inspect the rankings, exclusions and a shortlisted plan's details.
3. Open **Scenario Explorer**. Set rainfall to −50%, temperature to +3 °C and climate priority to 100. Compare both columns. Set irrigation to unavailable, inspect the failures, then reset.
4. Open **Methodology & sources** to inspect the evidence behind each assessment. Inputs live in browser memory for this page session.

## Architecture and methodology

The Sites Worker serves the planner, demo and a same-origin POWER endpoint. The TypeScript browser interface in src/ui.ts collects field assumptions and calls a deterministic engine. src/power.ts validates NASA responses, aggregates daily values and caches matching periods. A bundled June 2022–May 2025 record keeps the default journey usable during an upstream outage. Other periods need a matching cache or a working NASA connection.

The engine enumerates 27 kharif–rabi–kharif combinations. It checks crop seasons, inclusive occupation dates, documented soil conditions and irrigation availability. Unknown mandatory conditions leave the plan incomplete. On feasible plans it computes climate-band frequency, a gross seasonal rainfall comparison, crop and family diversity, and a residue-retention indicator. A missing component with positive weight prevents ranking. The weighted mean orders alternatives, with alphabetical tie-breaking and a two-slot difference between shortlisted alternatives. The current plan is assessed separately. A scenario copies the historical summaries and field inputs, adjusts rain by percentage and temperature in °C, then reruns the same engine.

## Evidence, limitations and future work

District-scale meteorology and global crop preference bands support coarse comparisons. Seasonal rain includes days outside field occupation. An irrigation prescription would also require effective rainfall, soil water and delivery losses. The pilot covers one district and three fixed planning slots. Chickpea and mustard lack configured cultivar durations. Historical comparisons do not predict yield, price, profit or climate outcomes.

The Phase 6 browser journey passed at 1280 × 900 and a simulated 390 × 844 viewport. The regression suite covers calendars, missing information, constraint failures, deterministic ranking, weights, scenario isolation, empty shortlists and NASA outage/cache behavior. Agricultural review consisted of checking software behavior against configured assumptions. Independent agronomist review and farmer usability testing are proposed future work.

## Release and submission files

- [Dataset and reference inventory](DATA-SOURCES.md)
- [Draft submission, AI disclosure and seven-slide outline](SUBMISSION.md)
- [Original work license](LICENSE) and [third-party notices](THIRD-PARTY.md)

OpenAI Codex assisted with source code, synthetic examples, browser checks, research and release text. The original NASA response is stored separately from synthetic examples. Production uses the existing project ID in .openai/hosting.json, the Sites source workflow and the archive built from the pushed commit. See the release handoff for public access and submission status.
