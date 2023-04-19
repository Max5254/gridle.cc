

const key2Acronym = new Map<string, string>([
    // FIM
    ['2023micmp1', 'DT'],
    ['2023micmp2', 'FD'],
    ['2023micmp3', 'AP'],
    ['2023micmp4', 'CE'],
    // NE
    ['2023necmp1', 'M'],
    ['2023necmp2', 'W'],
    // TX
    ['2023txcmp1', 'AP'],
    ['2023txcmp2', 'ME'],
    // ONT
    ['2023oncmp1', 'T'],
    ['2023oncmp2', 'S'],
    // CMP
    ['2023cur', 'C'], // Curie
    ['2023arc', 'A'], // Archimedes
    ['2023dal', 'D'], // Daly
    ['2023gal', 'G'], // Galileo
    ['2023hop', 'H'], // Hopper
    ['2023joh', 'J'], // Johnson
    ['2023mil', 'M'], // Milstein
    ['2023new', 'N'], // Newton
]);

export const divisionFormatter = (key: string): string => {
    if (key2Acronym.has(key)) {
        return "-" + key2Acronym.get(key);
    } else {
        return "";
    }
}