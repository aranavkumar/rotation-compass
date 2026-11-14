import { checked, date, finite, list, nonempty, nullable, object, oneOf } from './schema.js';
const district = oneOf('Ludhiana');
const season = oneOf('Kharif', 'Rabi');
const evidence = object({
    source: checked(nonempty, (v)=>/^https?:\/\//.test(v), 'provide a source URL'),
    reference: nonempty,
    region: nonempty,
    assumptions: nonempty,
    units: nonempty
});
export const CropProfileSchema = object({
    name: nonempty,
    district,
    season,
    seasonEvidence: evidence,
    thresholds: list(object({
        parameter: nonempty,
        value: finite,
        evidence
    })),
    rotationRules: list(object({
        rule: nonempty,
        evidence
    })),
    unresolved: list(nonempty)
});
const soil = checked(object({
    texture: nullable(oneOf('Loam', 'Sandy', 'Clay')),
    basis: oneOf('unknown', 'measured', 'farmer-reported', 'estimated'),
    origin: oneOf('sample', 'user-entered'),
    source: nullable(nonempty),
    measuredOn: nullable(date)
}), (v)=>v.texture === null === (v.basis === 'unknown'), 'choose an input basis for a known texture, or select Unknown for both');
export const FarmProfileSchema = object({
    district,
    name: nonempty,
    areaHa: checked(finite, (v)=>v > 0, 'area must be greater than zero hectares'),
    soil
});
export const SeasonSchema = checked(object({
    label: nonempty,
    season,
    start: date,
    end: date
}), (s)=>s.start <= s.end, 'season end must be on or after its start');
export const RotationPlanSchema = checked(object({
    district,
    origin: oneOf('sample', 'user-entered'),
    slots: list(object({
        crop: nonempty,
        window: SeasonSchema
    }))
}), (v)=>v.slots.length === 3 && v.slots.every((s, i)=>i === 0 || v.slots[i - 1].window.end < s.window.start), 'provide three seasons in order with no shared dates (both endpoints are inclusive)');
const month = checked(nonempty, (v)=>/^\d{4}-(0[1-9]|1[0-2])$/.test(v), 'use YYYY-MM');
const series = checked(object({
    title: oneOf('Monthly rainfall', 'Mean temperature'),
    unit: oneOf('mm', '°C'),
    months: list(month),
    values: list(nullable(finite))
}), (v)=>v.months.length > 0 && v.months.length === v.values.length && v.months.every((m, i)=>!i || v.months[i - 1] < m) && (v.title === 'Monthly rainfall' ? v.unit === 'mm' && v.values.every((n)=>n === null || n >= 0) : v.unit === '°C'), 'check units, chronological months and matching observations; missing values must be null');
export const EnvironmentalContextSchema = checked(object({
    district,
    origin: oneOf('sample', 'downloaded', 'cached', 'estimated', 'missing'),
    source: nullable(nonempty),
    retrievedOn: nullable(date),
    spatialResolution: nullable(nonempty),
    series: list(series)
}), (v)=>v.origin === 'missing' ? v.series.every((s)=>s.values.every((n)=>n === null)) : ![
        'downloaded',
        'cached'
    ].includes(v.origin) || Boolean(v.source && v.retrievedOn), 'downloaded and cached data need source and retrieval date; missing data cannot contain observations');
export const ScenarioSchema = object({
    kind: oneOf('hypothetical'),
    waterPriorityPercent: checked(finite, (v)=>v >= 0 && v <= 100, 'priority must be between 0 and 100'),
    rainfallChangePercent: nullable(checked(finite, (v)=>v >= -100, 'rainfall reduction cannot exceed 100%'))
});
