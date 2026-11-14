export const sources = {
    kharif: 'https://pau.edu/content/ccil/pf/pp_kharif.pdf',
    rabi: 'https://pau.edu/content/ccil/pf/pp_rabi.pdf',
    rice: 'https://pau.edu/content/ccil/pf/pp_kharif.pdf#page=10',
    climate: 'https://www.fao.org/4/x5648e/x5648e0e.htm',
    water: 'https://www.fao.org/4/s2022e/s2022e07.htm',
    cover: 'https://www.fao.org/conservation-agriculture/in-practice/soil-organic-cover/en'
};
export const systems = {
    Rice: {
        variety: 'PR 126, transplanted',
        earliest: '06-21',
        latest: '07-15',
        days: 93,
        family: 'grass',
        irrigated: true,
        waterMm: [
            450,
            700
        ],
        thermalC: [
            25,
            30
        ],
        source: sources.rice
    },
    Maize: {
        variety: 'PMH 1, irrigated grain',
        earliest: '05-25',
        latest: '06-30',
        days: 95,
        family: 'grass',
        irrigated: true,
        waterMm: [
            500,
            800
        ],
        thermalC: [
            30,
            35
        ],
        source: sources.kharif
    },
    Wheat: {
        variety: 'PBW 826, timely irrigated',
        earliest: '10-22',
        latest: '11-28',
        days: 148,
        family: 'grass',
        irrigated: true,
        waterMm: [
            450,
            650
        ],
        thermalC: [
            15,
            20
        ],
        source: sources.rabi
    },
    Moong: {
        variety: 'ML 2056',
        earliest: '07-16',
        latest: '07-31',
        days: 71,
        family: 'legume',
        irrigated: false,
        waterMm: null,
        thermalC: null,
        source: sources.kharif
    }
};
export const families = {
    Rice: 'grass',
    Wheat: 'grass',
    Maize: 'grass',
    Moong: 'legume',
    Chickpea: 'legume',
    Mustard: 'brassica'
};
export const wheatPartners = [
    'Rice',
    'Maize',
    'Moong'
];
