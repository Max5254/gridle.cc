/**
 * Represents a given grids json file with any necessary information for validating guesses
 */
export interface GridData {
    matchKey: string;

    eventKey: string;

    teams: string[];

    won: boolean;

    autoGrid: {
        [key: string]: string[];
    };

    grid: {
        [key: string]: string[];
    };

    links: {
        [key: string]: string[];
    };

    district_abbreviation: string;

    district_name: string;
}

/**
 * Represents teams.json for storing info on all teams
 */
export interface TeamData {
    name: string;
    country: string;

    state_prov: string;
    school: string;
    rookie_year: string;
    events: string[];
    district_abbreviation: string;
    district_name: string;
}

/**
 * Represents partners.json
 *
 * {
 *     "<team>": {
 *         "<eventKey>": [
 *             ["<partner1>", "<partner2>"],
 *             ...
 *         ]
 *     },
 *     ...
 * }
 */
export type PartnerData  = {
    [key: string]: // Team number
        {[key: string]: // Event key
                string[][]} // Matches w/ partners
}

/**
 * Interface for the dropdown to represent a given team.
 */
export interface TeamInput {
    value: string;
    label: string;
    color: string;
}