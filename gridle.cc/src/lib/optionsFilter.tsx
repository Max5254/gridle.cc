import {PartnerData, TeamInput} from "@/lib/Types";


export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
}

/**
 * Find teams who have played with the given team at any of their events.
 *
 * @param team to find partners of
 * @param partners map from team to its partners
 */
const playedWithOne = (team: string, partners: PartnerData): Set<string> => {
    const teamsPlayedWith: Set<string> = new Set();

    Object.values(partners[team]).forEach((event: any) =>
        event.forEach((match: string[]) =>
            match.forEach(t => teamsPlayedWith.add(t))))

    return teamsPlayedWith;
}

/**
 * Find teams who have played with both of the given teams at any of their events.
 *
 * @param team1 to find partners of
 * @param team2 to find partners of
 * @param partners map from team to its partners
 */
const playedWithBoth = (team1: string, team2: string, partners: PartnerData): Set<string> => {
    const teamsPlayedWith: Set<string> = new Set();

    Object.values(partners[team1]).forEach((event: any) =>
        event.forEach((match: string[]) => {
            if (new Set(match).has(team2)) {
                match.forEach(t => teamsPlayedWith.add(t))
            }
        }));

    teamsPlayedWith.delete(team2)

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
 */
export const optionsForPosition = (
    inputs: (TeamInput | null)[],
    index: number,
    allOptions: { [key: string]: TeamInput },
    partners: PartnerData
): TeamInput[] => {

    // Remove the current team from consideration as this drop down should only consider the other two
    const splicedInputs = new Array(...inputs)
    splicedInputs.splice(index, 1);
    const guessedTeams: string[] = splicedInputs.filter(notEmpty).map(t => t.value);

    // Initial state
    const validOptions = {...allOptions}

    const allTeams: Set<string> = new Set(Object.keys(validOptions));

    let playedSameMatchTeams: Set<string>; // Played in the same match together with all teams selected
    let playedAMatchTeams: Set<string>; // Played in a match with all selected teams, but not necessarily the same
    let partialTeams: Set<string>; // Played with one of the teams but not the other
    let invalidTeams: Set<string>; // Never played with the selected teams

    if (guessedTeams.length > 0) {
        // Find teams who have matches with the first team
        const playedWithFirst: Set<string> = playedWithOne(guessedTeams[0], partners);

        if (guessedTeams.length == 2) {
            // Find teams who have matches with the second team
            const playedWithSecond: Set<string> = playedWithOne(guessedTeams[1], partners);

            // Find the teams who have played in a match with BOTH the first and second at the same time (aka they were an alliance)
            playedSameMatchTeams = playedWithBoth(guessedTeams[0], guessedTeams[1], partners);

            // Find intersection and union of who has played with who
            const intersection = new Set(Array.from(playedWithFirst.values()).filter(x => playedWithSecond.has(x)));
            const union = new Set([...Array.from(playedWithFirst.values()), ...Array.from(playedWithSecond.values())]);

            // Teams who have played with both selected teams at different times
            playedAMatchTeams = new Set(Array.from(intersection.values()).filter(x => !playedSameMatchTeams.has(x)));

            // Teams who only played with one selected team
            partialTeams = new Set(Array.from(union.values()).filter(x => !intersection.has(x)));

            // Teams who never played with selected team
            invalidTeams = new Set(Array.from(allTeams.values()).filter(x => !union.has(x)));
        } else {
            playedSameMatchTeams = playedWithFirst;
            playedAMatchTeams = new Set();
            partialTeams = new Set();
            invalidTeams = new Set(Array.from(allTeams.values()).filter(x => !playedSameMatchTeams.has(x)));
        }
    } else {
        // If there are no guesses there's nothing to do
        return Object.values(allOptions);
    }


    // Format for each type (gross)
    const formattedOptions: TeamInput[] = []

    allTeams.forEach(t => {
        if (playedSameMatchTeams.has(t)) {
            formattedOptions.push({...allOptions[t], color: '#22c55e'});
        }
    })

    allTeams.forEach(t => {
        if (playedAMatchTeams.has(t)) {
            formattedOptions.push({...allOptions[t], color: '#fde047'});
        }
    })

    allTeams.forEach(t => {
        if (partialTeams.has(t)) {
            formattedOptions.push({...allOptions[t], color: '#fb923c'});
        }
    })

    allTeams.forEach(t => {
        if (invalidTeams.has(t)) {
            formattedOptions.push({...allOptions[t]});
        }
    })

    // Return the formatted options excluding any guessed teams
    return formattedOptions.filter(t => !new Set(guessedTeams).has(t.value));
}