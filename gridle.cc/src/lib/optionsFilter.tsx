import {PartnerData, TeamInput} from "@/lib/Types";


export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
}

/**
 * Find teams who have played with the given team.
 *
 * @param team to find partners of
 * @param partners map from team to its partners
 */
const playedWithOne = (team: string, partners: PartnerData): Set<string> => {
    const teamsPlayedWith: Set<string> = new Set();

    const allianceKeys: string[] = partners.teams[team];

    allianceKeys.forEach(k => {
        partners.alliances[k].forEach(t => teamsPlayedWith.add(t));
    });

    teamsPlayedWith.delete(team);

    return teamsPlayedWith;
}

/**
 * Find teams who have played with the given teams in any positions.
 *
 * @param teams to find partners of
 * @param partners map from team to its partners
 */
const playedWithAll = (teams: string[], partners: PartnerData): Set<string> => {
    const teamsPlayedWith: Set<string> = new Set();

    const inputTeams: string[] = teams.filter((x): x is string => x !== null);

    const allianceKeys: string[] = [];
    inputTeams.forEach(t => {
        allianceKeys.push(...partners.teams[t]);
    });

    allianceKeys.forEach(k => {
        const teamsInMatch = partners.alliances[k];
        let validMatch = true;
        teams.forEach(t => {
            if (!teamsInMatch.includes(t)) {
                validMatch = false;
            }
        })
        if (validMatch) {
            teamsInMatch.forEach(t => teamsPlayedWith.add(t));
        }
    });

    inputTeams.forEach(t => teamsPlayedWith.delete(t));

    return teamsPlayedWith;
}

/**
 * Find teams who have played with the given teams in the correct positions.
 *
 * @param teams to find partners of
 * @param index of the team position to return
 * @param partners map from team to its partners
 */
const playedWithPositional = (teams: (string | null)[], index: number, partners: PartnerData): Set<string> => {
    const teamsPlayedWith: Set<string> = new Set();

    const inputTeams: string[] = teams.filter((x): x is string => x !== null);

    const allianceKeys: string[] = [];
    inputTeams.forEach(t => {
        allianceKeys.push(...partners.teams[t]);
    });

    allianceKeys.forEach(k => {
        const teamsInMatch = partners.alliances[k];
        let validMatch = true;
        for (let i = 0; i < teams.length; i++) {
            if (teams[i] !== null && teams[i] !== teamsInMatch[i]) {
                validMatch = false
            }
        }
        if (validMatch) {
            teamsPlayedWith.add(teamsInMatch[index]);
        }
    });

    inputTeams.forEach(t => teamsPlayedWith.delete(t));

    return teamsPlayedWith;
}

/**
 * Returns the autofill options which are formatted depending on the input for the other dropdowns.
 *
 *  TODO: Various bugs related to colors
 *
 * @param inputs list of team inputs, length 3
 * @param index of the dropdown which these options will be for (1 would mean the middle team)
 * @param allOptions the starting baseline options
 * @param partners the mapping of all teams a team has played with
 * @param incorrectGuesses previous guesses which aren't correct
 * @param correctDivisionTeams teams which are in a division which was guessed and correct
 * @param incorrectDivisionTeams teams which are in a division which was guessed and incorrect
 */
export const optionsForPosition = (
    inputs: (TeamInput | null)[],
    index: number,
    allOptions: { [key: string]: TeamInput },
    partners: PartnerData,
    incorrectGuesses: string[],
    correctDivisionTeams: string[],
    incorrectDivisionTeams: string[],
): TeamInput[] => {

    // Remove the current team from consideration as this drop down should only consider the other two
    const splicedInputs = new Array(...inputs)
    splicedInputs.splice(index, 1);
    const guessedTeams: string[] = splicedInputs.filter(notEmpty).map(t => t.value);

    const inputTeams: (string | null)[] = inputs.map((t, i) => (t && index !== i) ? t.value : null);

    const allTeams: Set<string> = new Set(Object.keys(allOptions));

    let green: Set<string>; // Played in the same match together with all teams selected in correct positions
    let yellow: Set<string>; // Played in a match with all selected teams
    let orange: Set<string>; // Played with one of the teams but not the other
    let noColor: Set<string>; // Never played with the selected teams

    if (guessedTeams.length > 0) {
        green = playedWithPositional(inputTeams, index, partners);

        // Find teams who have matches with the first team
        const playedWithFirst: Set<string> = playedWithOne(guessedTeams[0], partners);

        if (guessedTeams.length == 2) {
            // Find teams who have matches with the second team
            const playedWithSecond: Set<string> = playedWithOne(guessedTeams[1], partners);

            // Find intersection and union of who has played with who
            const intersection = new Set(Array.from(playedWithFirst.values()).filter(x => playedWithSecond.has(x)));

            // Teams who have played with both selected teams at different times
            yellow = new Set(Array.from(playedWithAll(guessedTeams, partners).values()).filter(x => !green.has(x)));

            // Teams who only played with one selected team
            orange = new Set(Array.from(intersection.values()).filter(x => !yellow.has(x) && !green.has(x)));

            // Teams who never played with selected team
            noColor = new Set(Array.from(allTeams.values()).filter(x => !orange.has(x)));
        } else {
            yellow = new Set(Array.from(playedWithFirst.values()).filter(x => !green.has(x)));
            orange = new Set();
            noColor = new Set(Array.from(allTeams.values()).filter(x => !yellow.has(x) && !green.has(x)));
        }
    } else {
        // If there are no guesses then filter out to be valid division teams before incorrect ones already guessed
        const allValidOptions: TeamInput[] = Object.values(allOptions).filter(t => !new Set([...guessedTeams, ...incorrectGuesses]).has(t.value));
        const sequencedOptions: TeamInput[] = allValidOptions.filter(x => correctDivisionTeams.includes(x.value));
        sequencedOptions.push(...allValidOptions.filter(x => !incorrectDivisionTeams.includes(x.value) && !correctDivisionTeams.includes(x.value)))
        sequencedOptions.push(...allValidOptions.filter(x => incorrectDivisionTeams.includes(x.value) && !correctDivisionTeams.includes(x.value)))
        return sequencedOptions;
    }


    // Format for each type (gross)
    const formattedOptions: TeamInput[] = []

    allTeams.forEach(t => {
        if (green.has(t)) {
            formattedOptions.push({...allOptions[t], color: '#22c55e'});
        }
    })

    allTeams.forEach(t => {
        if (yellow.has(t)) {
            formattedOptions.push({...allOptions[t], color: '#fde047'});
        }
    })

    allTeams.forEach(t => {
        if (orange.has(t)) {
            formattedOptions.push({...allOptions[t], color: '#fb923c'});
        }
    })


    const remainingTeams: TeamInput[] = Array.from(allTeams.values())
        .filter(t => noColor.has(t))
        .map(t => allOptions[t]);

    formattedOptions.push(...remainingTeams.filter(x => correctDivisionTeams.includes(x.value)))
    formattedOptions.push(...remainingTeams.filter(x => !incorrectDivisionTeams.includes(x.value) && !correctDivisionTeams.includes(x.value)))
    formattedOptions.push(...remainingTeams.filter(x => incorrectDivisionTeams.includes(x.value) && !correctDivisionTeams.includes(x.value)))

    // Return the formatted options excluding any guessed teams
    return formattedOptions.filter(t => !new Set([...guessedTeams, ...incorrectGuesses]).has(t.value));
}