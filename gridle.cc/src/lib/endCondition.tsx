import {GuessProps, GuessType} from "@/components/guess";
import {EncodeGrid} from "@/lib/gridEncoder";


const guess2Emoji = (g: GuessProps): string => {
    let success = 0;

    if (g.teamGuess == GuessType.CORRECT) {
        return "🟩";
    }

    if (g.teamGuess == GuessType.CLOSE) {
        return "🟨";
    }

    if (g.divisionGuess == GuessType.CORRECT) {
        success += 1;
    }

    if (g.districtGuess == GuessType.CORRECT) {
        success += 1;
    }

    if (g.stateGuess == GuessType.CORRECT) {
        success += 1;
    }

    switch (success){
        case 0:
        case 1:
            return "⬛";
        case 2:
            return "🟥"
        case 3:
            return "🟧";
    }

    return "⬛";
}

/**
 * Generates a text which can be shared representing the users guesses.
 */
export const generateShareText = (guesses: GuessProps[], gridName: string, eventKey: string, gridIndex: string): string => {
    let output: string = `https://gridle.cc/#${EncodeGrid(eventKey, gridIndex)}: ${gridName}`;

    for(let i = 0; i < guesses.length; i += 3) {
        output += `\n${guess2Emoji(guesses[i])}${guess2Emoji(guesses[i+1])}${guess2Emoji(guesses[i+2])}`
    }

    return output;
}