import {GuessProps, GuessType} from "@/components/guess";


const guess2Emoji = (g: GuessProps): string => {
    let success = 0;

    if (g.teamGuess == GuessType.CORRECT) {
        return "🟩";
    }

    if (g.eventGuess == GuessType.CORRECT) {
        success += 1;
    }

    if (g.districtGuess == GuessType.CORRECT) {
        success += 1;
    }

    switch (success){
        case 0:
            return "⬛";
        case 1:
            return "🟧";
        case 2:
            return "🟨";
    }

    return "⬛";
}

/**
 * Generates a text which can be shared representing the users guesses.
 */
export const generateShareText = (guesses: GuessProps[], gridName: string): string => {
    let output: string = "https://gridle.cc: " + gridName;

    for(let i = 0; i < guesses.length; i += 3) {
        output += `\n${guess2Emoji(guesses[i])}${guess2Emoji(guesses[i+1])}${guess2Emoji(guesses[i+2])}`
    }

    return output;
}