/**
 * Represents a given grids json file with any necessary information for validating guesses
 */
export interface GridData {
    matchKey: string;

    eventKey: string;

    eventName: string;

    compLevel: string;

    setNumber: number;

    matchNumber: number;

    color: string;

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
    division: string;
    epa: number;
    epa_recent: number;
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
 *     "teams": {
 *          "<team>": [<matchKey>, ...],
 *          ...
*      },
 *     "alliances": {
 *         "<matchKey>": [<teams>],
 *         ...
 *     }
 * }
 */
export type PartnerData  = {

    teams: {[key: string]: // Team
            string[]} // Match keys

    alliances: {[key: string]: // Match key
            string[]} // Teams
}

/**
 * Interface for the dropdown to represent a given team.
 */
export interface TeamInput {
    value: string;
    label: string;
    color: string;
}