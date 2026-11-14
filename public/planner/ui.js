import { components, evaluate, scenarioField } from './evaluator.js';
import { sources } from './evaluation-config.js';
import { FarmProfileSchema, EnvironmentalContextSchema } from './contracts.js';
import { calendar, catalogue, cropSource, unresolved, makePlan } from './ludhiana.js';
import { sample, sampleProfile, seasons, choices } from './fixture.js';
const node = (id)=>document.getElementById(id);
const field = (id)=>node(id);
const farmForm = node('farm');
const badge = '<span class="badge">Sample data</span>';
const ids = [
    'name',
    'area',
    'soil',
    'source',
    'date'
];
let usingSample = false;
let changed = new Set();
let selected = 0;
let loading = 0;
const today = new Date();
field('date').max = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
].join('-');
function labelOrigin(id) {
    return usingSample && !changed.has(id) ? 'Sample data' : 'User-entered';
}
node('catalogue').textContent = catalogue.map((c)=>c.name + ' (' + c.season + ')').join(', ') + '. ' + catalogue[0].seasonEvidence.assumptions;
node('season-reference').href = cropSource;
node('review-gaps').textContent = node('unresolved').textContent = 'Unresolved: ' + unresolved.join('; ') + '.';
node('crop-source').href = cropSource;
node('slots').innerHTML = seasons.map((s, i)=>'<label>' + s + '<small>' + calendar[i].start + ' – ' + calendar[i].end + '</small><select required id="crop' + i + '"><option value="">Select crop</option>' + choices[i].map((c)=>'<option>' + c + '</option>').join('') + '</select></label>').join('');
function readFarm() {
    return {
        name: field('name').value.trim(),
        area: field('area').value,
        soil: field('soil').value,
        source: field('source').value,
        date: field('date').value,
        sequence: [
            field('crop0').value,
            field('crop1').value,
            field('crop2').value
        ]
    };
}
function timeline(sequence) {
    return '<ol class="timeline">' + sequence.map((c, i)=>'<li><small>' + seasons[i] + '</small><strong>' + c + '</strong></li>').join('') + '</ol>';
}
function status() {
    const farm = readFarm();
    const origin = usingSample ? 'Sample data' + (changed.size ? ' · Includes user edits' : '') : farm.name || farm.area || changed.size ? 'User-entered farm' : 'No farm entered';
    node('status').textContent = origin;
}
function valid() {
    field('name').setCustomValidity(field('name').value.trim() ? '' : 'Enter a farm name.');
    field('basis').setCustomValidity('');
    const farm = readFarm();
    try {
        FarmProfileSchema({
            district: 'Ludhiana',
            name: farm.name,
            areaHa: Number(farm.area),
            soil: {
                texture: farm.soil || null,
                basis: field('basis').value,
                origin: labelOrigin('soil') === 'Sample data' ? 'sample' : 'user-entered',
                source: farm.source || null,
                measuredOn: farm.date || null
            }
        }, 'farm');
        makePlan(farm.sequence, usingSample ? 'sample' : 'user-entered');
    } catch (error) {
        if (error instanceof Error && error.message.startsWith('farm.soil:')) field('basis').setCustomValidity(error.message);
        return false;
    }
    return farmForm.checkValidity();
}
let history = null;
let historyRequested = false;
node('weights').innerHTML = components.map((name, i)=>'<label>' + name + ' <output id="percent' + i + '"></output><input id="w' + i + '" type="range" min="0" max="100" value="25"></label>').join('');
const questions = {
    irrigation: 'Irrigation available',
    drainage: 'Field drains well',
    salt: 'Severe saline or alkaline soil limitation',
    residue: 'Retain surface residues after each harvest'
};
node('conditions').innerHTML = Object.entries(questions).map(([key, title])=>'<label>' + title + '<select id="' + key + '"><option value="">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></label>').join('');
node('method').innerHTML = '<p>Feasibility uses three inclusive field-occupation periods. Each reference cultivar starts on the earliest allowed date inside its season. Maturity is approximate. PR 126 assumes an off-field nursery and transplanting after June 20. The analysis uses the PAU irrigated reference systems for rice, maize and wheat. Unknown field conditions and undocumented crop transitions remain incomplete.</p>' + '<p>Rice is screened within the published pH 5–9 range. For moong, a texture outside the verified class leaves the check incomplete. Wheat and moong screen for drainage and severe alkaline soil limitations. PAU lists wheat rotations with rice, maize and moong. We screen both directions as repeating two-season systems. No universal family exclusion or disease return interval has been verified for this district. Chickpea and mustard currently lack configured cultivar durations. Stage-specific temperature extremes, irrigation volumes and field disease history remain unchecked. Hard temperature exclusions require locally applicable survival limits and matching exposure data.</p>' + '<p>Each component uses 0–100 points. Climate counts the fraction of complete historical matching seasons whose mean temperature lies in the FAO crop-group photosynthesis band (rice 25–30, lowland maize 30–35, wheat 15–20 °C). This coarse historical proxy cannot establish a lethal temperature limit. Water averages min(1, seasonal precipitation / midpoint crop demand) × 100. FAO growing-period ranges in mm are rice 450–700, maize 500–800 and wheat 450–650. Season rainfall includes days outside crop occupation and excludes runoff or irrigation; this is a gross rainfall comparison.</p>' + '<p>Climate and water average all three slots equally and require complete records for each selected year. Diversity = 25 × (distinct crops − 1 + adjacent family changes). The residue practice earns 100 for planned retention after every crop or 0 for no retention. Unknown is unscored. These are preference indicators; no measured soil change is implied.</p>' + '<p>The overall indicator is the weighted mean, using the same weights for every plan. A missing component with positive weight prevents ranking. Higher unrounded scores rank first; ties use alphabetical crop sequence. Each displayed alternative changes at least one baseline crop and differs from other displayed alternatives in at least two seasons.</p>' + Object.entries(sources).map(([name, url])=>'<a href="' + url + '">' + name + ' reference ↗</a>').join(' · ');
function renderPlans() {
    const weights = components.map((_, i)=>Number(field('w' + i).value));
    const total = weights.reduce((a, b)=>a + b, 0);
    weights.forEach((w, i)=>node('percent' + i).textContent = total ? (100 * w / total).toFixed(1) + '%' : '—');
    node('weight-summary').textContent = total ? 'Weights are normalized across the four priorities.' : 'Set at least one priority above zero to rank alternatives.';
    node('history-note').textContent = history ? 'NASA POWER historical comparison · ' + history.provenance.start + '–' + history.provenance.end + ' · district grid' : 'Historical comparison unavailable or loading. Climate and water remain unscored.';
    const empty = '<div class="panel"><p>Complete the field profile and three crops to evaluate rotations.</p><a href="#setup">Open Farm Setup →</a></div>';
    if (!valid() || !field('field-ph').checkValidity()) {
        node('comparison').innerHTML = node('cards').innerHTML = node('plan').innerHTML = field('field-ph').checkValidity() ? empty : '<p>Enter a soil pH from 0 to 14.</p>';
        return;
    }
    const base = {
        irrigation: field('irrigation').value,
        drainage: field('drainage').value,
        salt: field('salt').value,
        texture: field('soil').value,
        ph: field('field-ph').value ? Number(field('field-ph').value) : null,
        residue: field('residue').value,
        history: history?.seasons ?? [],
        weights
    };
    const result = evaluate(readFarm().sequence, base);
    if (!node('scenario').hidden) renderComparison(base, result);
    const plans = [
        result.baseline,
        ...result.alternatives
    ];
    if (selected >= plans.length) selected = 0;
    function card(i, open) {
        const p = plans[i];
        const reason = p.score === null ? 'This plan has no overall score. See the screening and information checks below.' : (i ? 'This alternative passed the pilot checks and qualified for the diversity shortlist. ' : 'This is your current crop sequence. ') + 'Its largest weighted contribution comes from ' + components[p.scores.map((v, j)=>(v ?? 0) * weights[j]).indexOf(Math.max(...p.scores.map((v, j)=>(v ?? 0) * weights[j])))] + '.';
        return '<div class="panel">' + (usingSample ? badge : '') + '<h2>' + (i ? 'Rank ' + i : 'Current practice') + '</h2>' + timeline(p.sequence) + '<h3>Why this plan?</h3><p>' + reason + '</p><p><b>' + p.status + '</b> · Comparison indicator ' + (p.score === null ? 'unavailable' : p.score.toFixed(1) + ' / 100') + '</p><p>' + components.map((name, j)=>name + ' ' + (p.scores[j] === null ? 'unavailable' : p.scores[j].toFixed(1))).join(' · ') + '</p><details ' + (open ? 'open' : '') + '><summary>Assessment and ranking evidence</summary><p>' + p.distinct + ' distinct crops and ' + p.breaks + ' family changes. ' + (p.score !== null ? 'Weighted contributions: ' + p.scores.map((v, j)=>components[j] + ' ' + ((v ?? 0) * weights[j] / total).toFixed(1)).join(', ') + '.' : '') + '</p><p>' + p.schedule.join('<br>') + '</p>' + explain(p) + '</details>' + (open ? '' : '<button data-plan="' + i + '">View plan details →</button>') + '</div>';
    }
    function explain(p) {
        const missing = [
            ...p.missing,
            ...p.notes
        ];
        return (p.failures.length ? '<h4>Failed checks</h4><p>' + p.failures.join('<br>') + '</p>' : '') + '<h4>What information is missing?</h4><p>' + (missing.join('<br>') || 'All inputs needed for these pilot checks are available.') + '</p>' + (total === 0 ? '<p>Set a priority above zero to calculate an overall score.</p>' : '');
    }
    const omitted = result.ranked.filter((p)=>!result.alternatives.includes(p));
    const excluded = result.candidates.filter((c)=>c.score === null);
    node('cards').innerHTML = plans.map((_, i)=>card(i, false)).join('') + '<p>' + result.candidates.length + ' alternatives screened · ' + result.alternatives.length + ' shown. ' + (result.alternatives.length ? '' : 'No alternative qualifies with the current field inputs, evidence and weights.') + '</p>' + '<details><summary>Why not another plan? Inspect exclusions (' + (excluded.length + omitted.length) + ')</summary>' + excluded.map((p)=>'<p><b>' + p.sequence.join(' → ') + '</b><br>' + explain(p) + '</p>').join('') + omitted.map((p)=>'<p><b>' + p.sequence.join(' → ') + '</b> · Scored ' + p.score.toFixed(1) + '. ' + (result.alternatives.some((a)=>a.sequence.filter((c, i)=>c !== p.sequence[i]).length < 2) ? 'Too similar to a shortlisted plan (fewer than two different slots).' : 'The three shortlist places were filled by higher-ranked plans.') + '</p>').join('') + '</details>';
    node('plan').innerHTML = card(selected, true);
}
node('scenario-weights').innerHTML = components.map((name, i)=>'<label>' + name + '<input id="sw' + i + '" type="number" min="0" max="100" step="1"></label>').join('');
function renderComparison(base, before) {
    const out = node('comparison');
    const rain = field('rain-change'), temp = field('temp-change');
    const inputs = components.map((_, i)=>field('sw' + i));
    inputs.forEach((input, i)=>input.placeholder = 'Baseline ' + base.weights[i]);
    if ([
        rain,
        temp,
        ...inputs
    ].some((input)=>!input.checkValidity())) {
        out.textContent = 'Check the highlighted inputs. Use rainfall changes from −100 to 200%, temperature changes from −15 to 15 °C and whole priority weights from 0 to 100.';
        return;
    }
    const weights = inputs.map((input, i)=>input.value === '' ? base.weights[i] : input.valueAsNumber);
    const irrigation = field('scenario-irrigation').value;
    const context = scenarioField(base, rain.valueAsNumber, temp.valueAsNumber, irrigation === 'inherit' ? base.irrigation : irrigation, weights);
    const after = evaluate(readFarm().sequence, context);
    const points = (v)=>v === null ? 'Unscored' : Number(v.toFixed(2)).toString();
    function row(a, b, current) {
        const oldRank = before.ranked.indexOf(a) + 1, newRank = after.ranked.indexOf(b) + 1;
        const changed = components.map((_, i)=>i).filter((i)=>points(a.scores[i]) !== points(b.scores[i]));
        const reasons = b.failures.filter((x)=>!a.failures.includes(x));
        reasons.push(...b.missing.filter((x)=>!a.missing.includes(x)));
        if (a.status === 'Failed' && b.status !== 'Failed') reasons.push('The irrigation assumption clears the previous irrigation failure.');
        if (base.irrigation !== context.irrigation && a.status === 'Incomplete' && b.status !== a.status) reasons.push('The scenario supplies a definite irrigation availability.');
        if (changed.includes(0)) reasons.push('The temperature shift changes how often seasonal means fall inside the crop bands.');
        if (changed.includes(1)) reasons.push('Adjusted seasonal rain changes the share of reference crop demand covered by gross rainfall.');
        if (weights.every((w)=>w === 0)) reasons.push('All scenario priorities are zero, so there is no overall score.');
        else if (weights.some((w, i)=>w !== base.weights[i]) && a.score !== b.score) reasons.push('Changed priorities alter how the component scores count toward ranking.');
        if (oldRank && newRank && oldRank !== newRank) reasons.push('Moved ' + (oldRank > newRank ? 'up ' : 'down ') + Math.abs(oldRank - newRank) + ' relative to the other alternatives.');
        function cell(p, rank) {
            return '<td>' + (current ? 'Current practice' : rank ? 'Rank ' + rank : 'Unranked') + '<br>' + p.status + '<br>Overall: ' + points(p.score) + changed.map((i)=>'<br>' + components[i] + ': ' + points(p.scores[i])).join('') + '</td>';
        }
        return '<tr><th scope="row">' + a.sequence.join(' → ') + '</th>' + cell(a, oldRank) + cell(b, newRank) + '<td>' + (a.status !== 'Failed' && b.status === 'Failed' ? '<strong>Newly infeasible</strong><br>' : '') + (reasons.join(' ') || 'No change in assessed results.') + '</td></tr>';
    }
    const pairs = new Map(after.candidates.map((p)=>[
            p.sequence.join('/'),
            p
        ]));
    const ordered = [
        ...before.ranked,
        ...before.candidates.filter((p)=>p.score === null)
    ];
    out.innerHTML = '<h2>Plan comparison</h2><p>Ranks cover all scoreable alternatives before the diversity shortlist. Current practice is scored separately. Changed components are shown in points out of 100.</p><div class="comparison-scroll"><table><thead><tr><th>Rotation</th><th>Baseline</th><th>Scenario</th><th>Reason for change</th></tr></thead><tbody>' + row(before.baseline, after.baseline, true) + ordered.map((p)=>row(p, pairs.get(p.sequence.join('/')), false)).join('') + '</tbody></table></div>';
}
node('scenario').addEventListener('input', renderPlans);
node('scenario-reset').onclick = ()=>{
    field('rain-change').value = field('temp-change').value = '0';
    field('scenario-irrigation').value = 'inherit';
    components.forEach((_, i)=>field('sw' + i).value = '');
    renderPlans();
};
node('explorer').addEventListener('input', ()=>{
    selected = 0;
    renderPlans();
});
function chart(series) {
    const max = Math.max(1, ...series.values.map((v)=>v ?? 0));
    return '<figure>' + badge + '<figcaption>' + series.title + ' (' + series.unit + ')</figcaption><div class="bars">' + series.values.map((v, i)=>'<div><strong>' + (v === null ? 'Missing' : v) + '</strong><div class="track"><i style="height:' + (v ?? 0) / max * 100 + '%"></i></div><span>' + series.months[i] + '</span></div>').join('') + '</div></figure>';
}
let powerRequest = 0;
async function loadPower(refresh = false) {
    historyRequested = true;
    history = null;
    renderPlans();
    const ticket = ++powerRequest;
    const target = node('power-result');
    target.textContent = 'Loading NASA POWER daily data…';
    const query = new URLSearchParams({
        first: field('firstYear').value,
        last: field('lastYear').value,
        refresh: refresh ? '1' : '0'
    });
    try {
        const response = await fetch('/api/power?' + query);
        const result = await response.json();
        if (ticket !== powerRequest) return;
        if (!response.ok) throw Error(result.message || 'NASA POWER unavailable.');
        history = result;
        renderPlans();
        const title = document.createElement('h3');
        title.textContent = result.origin === 'live-retrieved' ? 'Live-retrieved NASA data' : 'Cached real NASA data';
        target.replaceChildren(title);
        function paragraph(value) {
            const p = document.createElement('p');
            p.textContent = value;
            target.append(p);
        }
        if (result.message) paragraph(result.message + ' Showing the matching cached period.');
        const table = document.createElement('table');
        table.innerHTML = '<caption>Seasonal variation across crop years</caption><thead><tr><th scope="col">Season</th><th scope="col">Rain total (mm)</th><th scope="col">Mean 2 m temp (°C)</th><th scope="col">Valid days / expected (rain · temp)</th></tr></thead>';
        for (const season of result.seasons){
            const row = table.insertRow();
            for (const text of [
                season.season + ' · ' + season.start + ' to ' + season.end,
                season.totalMm?.toFixed(1) ?? 'Incomplete',
                season.meanC?.toFixed(1) ?? 'Missing',
                season.rainDays + '/' + season.days + ' · ' + season.tempDays + '/' + season.days
            ])row.insertCell().textContent = text;
        }
        target.append(table);
        paragraph('Rainfall totals require every day. Temperatures average the available daily means. Coverage counts are separate for each parameter.');
        const p = result.provenance;
        paragraph(p.product + ' · ' + p.sources.join(', ') + ' · PRECTOTCORR (mm/day), T2M (°C) · ' + p.timeStandard + ' · ' + p.start + '–' + p.end + ' · retrieved ' + p.retrieved);
        paragraph('Requested lon/lat ' + p.requested.join(', ') + ' · returned lon/lat ' + p.returned.slice(0, 2).join(', ') + ' · grid spacing ' + p.resolution + ' · grid centre unavailable · missing sentinel ' + p.fillValue);
        const link = document.createElement('a');
        link.href = p.url;
        link.textContent = 'Inspect NASA daily response ↗';
        target.append(link);
    } catch (error) {
        if (ticket === powerRequest) target.textContent = 'Unavailable · ' + (error instanceof Error ? error.message : 'Unable to load historical data.');
    }
}
node('period').onsubmit = (e)=>{
    e.preventDefault();
    void loadPower();
};
node('refresh-power').onclick = ()=>{
    if (node('period').reportValidity()) void loadPower(true);
};
async function evidence() {
    void loadPower();
    const request = ++loading;
    const farm = readFarm();
    node('soil-record').textContent = [
        farm.soil ? farm.soil + ' · ' + field('basis').value + ' · ' + labelOrigin('soil') : 'Texture missing',
        farm.source || 'Source missing',
        farm.date || 'Measurement date missing'
    ].join(' / ');
    const target = node('environment');
    if (!usingSample) {
        target.innerHTML = '<p>No observations loaded. Load the sample farm to view the example charts.</p>';
        return;
    }
    target.textContent = 'Loading sample observations…';
    try {
        const response = await fetch('environment.json', {
            cache: 'no-store'
        });
        if (!response.ok) throw Error();
        const context = EnvironmentalContextSchema(await response.json());
        if (context.origin !== 'sample') throw new Error('Expected sample observations');
        const series = context.series;
        if (request !== loading) return;
        target.innerHTML = '<p>' + badge + ' Synthetic monthly examples · June–September 2026 · Spatial resolution unavailable.</p><div class="charts">' + series.map(chart).join('') + '</div>';
    } catch  {
        if (request === loading) target.innerHTML = '<p role="alert">Sample observations could not be loaded.</p><button id="retry">Retry loading</button>';
    }
}
function route() {
    const key = location.hash.slice(1);
    const current = [
        'setup',
        'evidence',
        'explorer',
        'details',
        'scenario',
        'methodology'
    ].includes(key) ? key : 'setup';
    document.querySelectorAll('.view').forEach((view)=>view.hidden = view.id !== current);
    document.querySelectorAll('nav a').forEach((link)=>{
        if (link.getAttribute('href') === '#' + current) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });
    status();
    renderPlans();
    if ((current === 'explorer' || current === 'details' || current === 'scenario') && !historyRequested) void loadPower();
    if (current === 'evidence') void evidence();
    document.title = node(current).querySelector('h1').textContent + ' · Rotation Compass';
}
node('sample').onclick = ()=>{
    field('basis').value = sampleProfile.soil.basis;
    ids.forEach((id)=>field(id).value = sample.farm[id]);
    sample.farm.sequence.forEach((c, i)=>field('crop' + i).value = c);
    usingSample = true;
    changed.clear();
    selected = 0;
    for (const [id, value] of Object.entries({
        irrigation: 'yes',
        drainage: 'yes',
        salt: 'no',
        residue: 'yes',
        'field-ph': '7'
    }))field(id).value = value;
    components.forEach((_, i)=>field('w' + i).value = '25');
    route();
};
farmForm.oninput = (e)=>{
    const id = e.target.id;
    changed.add(id);
    if (id === 'soil') {
        field('basis').value = field('soil').value ? 'farmer-reported' : 'unknown';
    }
    valid();
    status();
};
farmForm.onsubmit = (e)=>{
    e.preventDefault();
    if (valid()) location.hash = 'evidence';
};
document.addEventListener('click', (e)=>{
    const target = e.target;
    if (target.id === 'retry') void evidence();
    if (target.dataset.plan !== undefined) {
        selected = Number(target.dataset.plan);
        location.hash = 'details';
    }
});
window.addEventListener('hashchange', route);
route();
