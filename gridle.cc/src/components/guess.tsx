import * as React from 'react'

/**
 * Type of guess to correspond to a given color result.
 */
export enum GuessType {
    WRONG,
    SOMEWHAT,
    CLOSE,
    CORRECT
}

export interface GuessProps {
    teamNumber: string;

    // Guess for the district of this given team (NOT the district of the event)
    districtGuess: GuessType,

    // Guess for if this team attended the event for the grid
    eventGuess: GuessType,

    // Guess for if the team itself was in the match
    teamGuess: GuessType,
}

/**
 * Mapping from guess type to the given color to highlight that section.
 */
const guess2Color: {[key in GuessType]: string} = {
    [GuessType.WRONG]: "bg-gray-400",
    [GuessType.SOMEWHAT]: "bg-orange-400",
    [GuessType.CLOSE]: "bg-yellow-300",
    [GuessType.CORRECT]: "bg-green-500",
}

/**
 * Represents an individual guess for a given team. Each guess from the user will be made up of three (3) of these, one for each team on an alliance.
 */
const Guess: React.FunctionComponent<GuessProps> = (props: GuessProps): JSX.Element => {

    return (
        <div className={`gap-4 bg-gray-100 text-center p-1 m-1 ${props.teamGuess === GuessType.CORRECT ? "outline outline-green-500" : ""}`}>
            <div className={`pt-1 pb-0.5 m-1 ${props.teamGuess === GuessType.WRONG ? "bg-white" : guess2Color[props.teamGuess]}`}>{props.teamNumber}</div>
            <div>
                <div className={`pt-0.5 pb-0.5 m-1 ${guess2Color[props.districtGuess]}`}>District</div>
                <div className={`pt-0.5 pb-0.5 m-1 ${guess2Color[props.eventGuess]}`}>Event</div>
            </div>
        </div>
    );
}

export default Guess;

