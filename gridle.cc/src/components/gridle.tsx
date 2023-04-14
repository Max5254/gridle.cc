import * as React from "react";
import {useEffect, useState} from "react";
import Grid from "@/components/grid";
import Guess, {GuessProps, GuessType} from "@/components/guess";
import {loadGrid, loadPartners, loadTeams} from "@/lib/loader";
import {GridData, TeamData, TeamInput} from "@/lib/Types";
import Select from 'react-select';
import {dropdownStyles} from "@/lib/styles";
import {generateShareText} from "@/lib/endCondition";
import {notEmpty, optionsForPosition} from "@/lib/optionsFilter";

interface GridleProps {
    gridKey: string;

    gridName: string;
}

const Gridle: React.FunctionComponent<GridleProps> = (props: GridleProps): JSX.Element => {

    /**
     * Constants.
     */
    const NUM_GUESSES = 7;

    /**
     * State for the data which is pulled in for autofill and guess validation.
     */
    let [teams, setTeams] = useState<{ [key: string]: TeamData }>({});
    let [partners, setPartners] = useState<{ [key: string]: any }>({});
    const [grid, setGrid] = useState<GridData>({
        autoGrid: {},
        district_abbreviation: "",
        district_name: "",
        eventKey: "",
        grid: {},
        links: {},
        matchKey: "",
        teams: [],
        won: false

    });

    /**
     * State for user guesses.
     */
    const [input1, setInput1] = React.useState<TeamInput | null>(null);
    const [input2, setInput2] = React.useState<TeamInput | null>(null);
    const [input3, setInput3] = React.useState<TeamInput | null>(null);
    const [guesses, setGuesses] = useState<GuessProps[]>([]);

    /**
     * State for the dropdown
     */
        // The options for each dropdown which are dependent on the input for the other two (2) teams
    const [options1, setOptions1] = React.useState<TeamInput[]>([]);
    const [options2, setOptions2] = React.useState<TeamInput[]>([]);
    const [options3, setOptions3] = React.useState<TeamInput[]>([]);
    // All the available options, used for resetting the dropdown
    const [allOptions, setAllOptions] = React.useState<{ [key: string]: TeamInput }>({});

    let [showEndCondition, setShowEndCondition] = useState<boolean>(false);

    /**
     * ComponentDidMount hook
     */
    useEffect(() => {
        const fetchData = async () => {
            // Pull the grid
            const loadedGrid =  await loadGrid(props.gridKey);
            setGrid(loadedGrid);

            // Pull all the team information
            const _teams: { [key: string]: any } = await loadTeams();
            setTeams(_teams);

            // Pull all the partners a team has had in their matches
            setPartners(await loadPartners());

            // Create the dropdown options given the team list
            const _options: TeamInput[] = Object.keys(_teams).map((t: string): TeamInput => {
                return {value: t, label: t, color: '#000000'};
            })

            setOptions1(_options);
            setOptions2(_options);
            setOptions3(_options);

            const _allOptions: { [key: string]: TeamInput } = {};
            _options.forEach((t: TeamInput) => _allOptions[t.value] = t);
            setAllOptions(_allOptions);

            // Reset dropdowns and guesses
            setInput1(null);
            setInput2(null);
            setInput3(null);
            setGuesses([]);
            setShowEndCondition(false);
        }

        fetchData().catch(console.error);
    }, [props.gridKey]);

    /**
     * Callback for when a guess dropdown changes to adjust the dropdown lists based on the current state. Used to
     * filter out already selected teams and sort remaining ones by matches together.
     */
    const handleOptionsUpdate = (input: TeamInput | null, index: number): void => {
        // Get the current input
        const rawInputs: (TeamInput | null)[] = [input1, input2, input3];
        rawInputs[index] = input;

        // Set the options for each position depending on the other inputs
        setOptions1(optionsForPosition(rawInputs, 0, allOptions, partners));
        setOptions2(optionsForPosition(rawInputs, 1, allOptions, partners));
        setOptions3(optionsForPosition(rawInputs, 2, allOptions, partners));

        // Update state (gross)
        switch (index) {
            case 0:
                setInput1(input);
                break;
            case 1:
                setInput2(input);
                break;
            case 2:
                setInput3(input);
                break;
        }
    }

    /**
     * Handles the scoring of the guess for a given team.
     *
     * @param t string of team number
     * @param correctDistricts list of the districts of the teams in the grid
     */
    const guessForTeam = (t: string, correctDistricts: string[]): GuessProps => {
        const teamData = teams[t];
        const districtCorrect = correctDistricts.includes(teamData['district_abbreviation']);
        const eventCorrect = teamData['events'].includes(grid['eventKey']);

        if (districtCorrect) {
            const index = correctDistricts.indexOf(teamData['district_abbreviation']);
            correctDistricts.splice(index, 1);
        }

        return {
            teamNumber: t,
            districtGuess: districtCorrect ? GuessType.CORRECT : GuessType.WRONG,
            eventGuess: eventCorrect ? GuessType.CORRECT : GuessType.WRONG,
            teamGuess: grid['teams'].includes(t) ? GuessType.CORRECT : GuessType.WRONG,
        }
    }

    /**
     * Handles the submission of a guess by the user by adding the current guess to the existing guesses and validating
     * if the game has completed.
     *
     * @param event from mouse click
     */
    const handleSubmit = (event: React.MouseEvent<HTMLButtonElement>): void => {
        event.preventDefault()


        const rawInputs: (TeamInput | null)[] = [input1, input2, input3];
        const isFull = rawInputs.filter(t => t).length === 3;

        // TODO: Show error to user in this case
        if (!isFull) {
            return;
        }

        // Filter down to only the teams which were actually guesses and not blanks
        const guessedTeams: string[] = rawInputs.filter(notEmpty).map(t => t.value);
        console.log(guessedTeams);

        // Initial conditions
        const allGuessProps: { [key: string]: GuessProps } = {}
        const incorrectTeams: string[] = []
        let fullyCorrect = true;

        // Find the district for all teams in the grid
        const correctDistricts = grid['teams'].map((t: string) => teams[t]['district_abbreviation']);
        console.log("Correct Districts: " + correctDistricts)

        // Map through all teams first, only updating if the guess was correct
        // Do this first to make sure there aren't weird cases where one part of this team is marked incorrect because
        // that condition applies to a subset of teams which wouldn't necessarily be true if the correct team is last
        guessedTeams.map((t: string) => {
            if(grid['teams'].includes(t)) {
                allGuessProps[t] = guessForTeam(t, correctDistricts);
            } else {
                incorrectTeams.push(t);
                fullyCorrect = false;
            }
        });

        // Map through remaining incorrect teams
        incorrectTeams.map((t: string) => allGuessProps[t] = guessForTeam(t, correctDistricts));

        // Update guesses state
        const newGuessesValues = [...guesses, ...Object.values(allGuessProps)];
        setGuesses(newGuessesValues);

        // Check end condition
        if (newGuessesValues.length >= 3 * NUM_GUESSES || fullyCorrect) {
            setShowEndCondition(true);
        }

        // Reset dropdowns and inputs
        setOptions1(Object.values(allOptions));
        setOptions2(Object.values(allOptions));
        setOptions3(Object.values(allOptions));

        setInput1(null);
        setInput2(null);
        setInput3(null);
    }

    return (
        <div className="gridle-container">
            <h1 className="text-center content-center text-2xl font-semibold mb-5">Gridle</h1>
            {/*
                The grid itself.
            */}
            <div className="p-5 content-center">
                <Grid grid={grid.grid} autoGrid={grid.autoGrid}/>
            </div>

            {/*
                The actual guesses.
            */}
            <div className="grid grid-cols-3 gap-4 text-center">
                {...guesses.map((guess: GuessProps, i: number) => {
                    return <Guess key={i} {...guess} />
                })}
            </div>

            {/*
                User input for guessing teams.
            */}
            {!showEndCondition &&
                <div className="grid grid-cols-3 gap-4 mt-2 text-center">
                    <Select
                        className="basic-single"
                        classNamePrefix="select"
                        isClearable={false}
                        isSearchable={true}
                        value={input1}
                        onChange={(v) => {
                            handleOptionsUpdate(v as TeamInput, 0);
                        }}
                        name="team1"
                        placeholder="Team 1"
                        options={options1}
                        styles={dropdownStyles}
                    />
                    <Select
                        className="basic-single"
                        classNamePrefix="select"
                        isClearable={false}
                        isSearchable={true}
                        value={input2}
                        onChange={(v) => {
                            handleOptionsUpdate(v as TeamInput, 1);

                        }}
                        name="team2"
                        placeholder="Team 2"
                        options={options2}
                        styles={dropdownStyles}
                    />
                    <Select
                        className="basic-single"
                        classNamePrefix="select"
                        isClearable={false}
                        isSearchable={true}
                        value={input3}
                        onChange={(v) => {
                            handleOptionsUpdate(v as TeamInput, 2);

                        }}
                        name="team3"
                        placeholder="Team 3"
                        options={options3}
                        styles={dropdownStyles}
                    />
                    <div className="mt-1 col-start-2">
                        <button
                            type="submit"
                            className="block w-full rounded-md bg-indigo-600 px-3.5 py-1 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            onClick={handleSubmit}
                        >
                            Guess
                        </button>
                    </div>
                </div>
            }

            {/*
                Ending screen, displaying correct result and allowing user to share.

                TODO: Make own component
            */}
            {showEndCondition &&
                <div className="bg-gray-400 p-5 mt-5 content-center">
                    <a href={`https://www.thebluealliance.com/match/${grid.matchKey}`} target="_blank">
                        <h1 className="text-center content-center text-2xl font-semibold mb-5">{grid.matchKey}</h1>
                    </a>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        {grid.teams.map((t: string, i: number) => <p key={i}>{t}</p>)}
                        <div className="mt-1 col-start-1 col-span-3">
                            <button
                                type="submit"
                                className="block w-full rounded-md bg-indigo-600 px-3.5 py-1 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                onClick={() => navigator.clipboard.writeText(generateShareText(guesses, props.gridName))}
                            >
                                Copy Share Text
                            </button>
                        </div>
                    </div>
                </div>
            }

        </div>
    );
}

export default Gridle;
