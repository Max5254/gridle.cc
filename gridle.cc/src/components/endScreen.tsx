import * as React from "react";
import {GridData} from "@/lib/Types";
import {GuessProps} from "@/components/guess";
import {generateShareText} from "@/lib/endCondition";

interface EndScreenProps {
    grid: GridData;
    guesses: GuessProps[];
    gridName: string;

    eventKey: string;
    gridIndex: string;
}


/**
 * Represents the end screen after winning or running out of guesses.
 */
const EndScreen: React.FunctionComponent<EndScreenProps> = (props: EndScreenProps): JSX.Element => {

    const formatMatchName = () => {
        if (props.grid.compLevel == 'qm') {
            return `Quals ${props.grid.matchNumber}`;
        } else if (props.grid.compLevel == 'sf') {
            return `Semifinals ${props.grid.setNumber}`;
        } else {
            return `Finals ${props.grid.matchNumber}`;
        }
    }


    return (
        <div className="bg-gray-400 p-5 mt-5 content-center">
            <div>
                <h3 className="text-center content-center text-l font-semibold mb-1">{props.grid.eventName}</h3>
                <h3 className="text-center content-center text-xl font-semibold mb-1">{`${formatMatchName()} - ${props.grid.color}`}</h3>
            </div>
            <hr className="m-5"/>
            <div className="grid grid-cols-3 gap-4 text-center">
                {props.grid.teams.map((t: string, i: number) => <p key={i}>{t}</p>)}
                <a className="mt-1 col-start-2 content-center" href={`https://www.thebluealliance.com/match/${props.grid.matchKey}`} target="_blank">
                    <img className="mx-auto" src="https://www.thebluealliance.com/images/tba_lamp.svg" width="25%" height="auto" alt="TheBlueAlliance"/>
                </a>
                <div className="mt-1 col-start-2 col-span-1">
                    <button
                        type="submit"
                        className="block w-full rounded-md bg-indigo-600 px-3.5 py-1 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        onClick={() => navigator.clipboard.writeText(generateShareText(props.guesses, props.gridName, props.eventKey, props.gridIndex))}
                    >
                        Copy Share Text
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EndScreen;
