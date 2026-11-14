import { calendar, catalogue, makePlan } from './ludhiana.js';
import { EnvironmentalContextSchema, FarmProfileSchema } from './contracts.js';
export const seasons = calendar.map((s)=>s.label);
export const choices = calendar.map((s)=>catalogue.filter((c)=>c.season === s.season).map((c)=>c.name));
export const sample = {
    farm: {
        name: 'Satluj farm',
        area: '2.4',
        soil: 'Loam',
        source: '',
        date: '',
        sequence: [
            'Rice',
            'Wheat',
            'Rice'
        ]
    },
    environment: [
        {
            title: 'Monthly rainfall',
            unit: 'mm',
            months: [
                '2026-06',
                '2026-07',
                '2026-08',
                '2026-09'
            ],
            values: [
                72,
                164,
                null,
                88
            ]
        },
        {
            title: 'Mean temperature',
            unit: '°C',
            months: [
                '2026-06',
                '2026-07',
                '2026-08',
                '2026-09'
            ],
            values: [
                32,
                30,
                29,
                28
            ]
        }
    ],
    alternatives: [
        [
            'Maize',
            'Chickpea',
            'Maize'
        ],
        [
            'Rice',
            'Mustard',
            'Moong'
        ],
        [
            'Moong',
            'Wheat',
            'Maize'
        ]
    ]
};
export const sampleEnvironment = EnvironmentalContextSchema({
    district: 'Ludhiana',
    origin: 'sample',
    source: 'Synthetic example fixture · OpenAI Codex-assisted',
    retrievedOn: null,
    spatialResolution: null,
    series: sample.environment
});
export const sampleProfile = FarmProfileSchema({
    district: 'Ludhiana',
    name: sample.farm.name,
    areaHa: Number(sample.farm.area),
    soil: {
        texture: sample.farm.soil,
        basis: 'estimated',
        origin: 'sample',
        source: null,
        measuredOn: null
    }
});
for (const sequence of [
    sample.farm.sequence,
    ...sample.alternatives
])makePlan(sequence, 'sample');
