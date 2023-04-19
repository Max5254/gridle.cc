import * as React from "react";
import {useEffect, useState} from "react";
import Grid from "@/components/grid";
import Guess, {GuessProps, GuessType} from "@/components/guess";
import {loadGrid, loadPartners, loadTeams} from "@/lib/loader";
import {GridData, PartnerData, TeamData, TeamInput} from "@/lib/Types";
import Select from 'react-select';
import {dropdownStyles, IndicatorsContainer} from "@/lib/styles";
import {notEmpty, optionsForPosition} from "@/lib/optionsFilter";
import EndScreen from "@/components/endScreen";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCircleQuestion} from "@fortawesome/free-regular-svg-icons";
import HelpModal from "@/components/helpModal";
import {NUM_GUESSES} from "@/lib/constants";
import {divisionFormatter} from "@/lib/divisionFormatter";

interface GridleProps {
    gridKey: string;
    gridIndex: string;

    gridName: string;

    eventKey: string;
}

const Gridle: React.FunctionComponent<GridleProps> = (props: GridleProps): JSX.Element => {

    /**
     * State for the data which is pulled in for autofill and guess validation.
     */
    let [teams, setTeams] = useState<{ [key: string]: TeamData }>({});
    let [partners, setPartners] = useState<PartnerData>({alliances: {}, teams: {}});
    const [grid, setGrid] = useState<GridData>({
        color: "",
        autoGrid: {},
        district_abbreviation: "",
        district_name: "",
        eventKey: "",
        compLevel: "",
        eventName: "",
        matchNumber: 0,
        setNumber: 0,
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
    let [showHelp, setShowHelp] = useState<boolean>(false);

    /**
     * ComponentDidMount hook
     */
    useEffect(() => {
        const fetchData = async () => {
            // Pull the grid
            const loadedGrid =  await loadGrid(props.eventKey, props.gridKey);
            setGrid(loadedGrid);

            // Pull all the team information
            const _teams: { [key: string]: any } = await loadTeams(props.eventKey);
            setTeams(_teams);

            // Pull all the partners a team has had in their matches
            setPartners(await loadPartners(props.eventKey));

            // Create the dropdown options given the team list
            const _options: TeamInput[] = Object.keys(_teams).map((t: string): TeamInput => {
                return {value: t, label: `${t}${divisionFormatter(_teams[t]['division'])}`, color: '#000000'};
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

        const incorrectGuessedTeams: string[] = guesses
            .filter(g => g.teamGuess === GuessType.WRONG)
            .map(g => g.teamNumber);

        const incorrectDivisions: Set<string> = new Set(guesses
            .filter(g => g.divisionGuess === GuessType.WRONG)
            .map(g => teams[g.teamNumber]['division']));

        const incorrectDivisionTeams: string[] = Object.keys(teams)
            .filter(t =>  incorrectDivisions.has(teams[t]['division']));

        const correctDivisions: Set<string> = new Set(guesses
            .filter(g => g.divisionGuess === GuessType.CORRECT)
            .map(g => teams[g.teamNumber]['division']));

        const correctDivisionTeams: string[] = Object.keys(teams)
            .filter(t =>  correctDivisions.has(teams[t]['division']));

        // Set the options for each position depending on the other inputs
        setOptions1(optionsForPosition(rawInputs, 0, allOptions, partners, incorrectGuessedTeams, correctDivisionTeams, incorrectDivisionTeams));
        setOptions2(optionsForPosition(rawInputs, 1, allOptions, partners, incorrectGuessedTeams, correctDivisionTeams, incorrectDivisionTeams));
        setOptions3(optionsForPosition(rawInputs, 2, allOptions, partners, incorrectGuessedTeams, correctDivisionTeams, incorrectDivisionTeams));

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

      const guessForTypeKey = (teamGuesses: string[], correctTeams: string[], key: keyof TeamData ): GuessType[] => {
        const guesses: any[] = teamGuesses.map((t: string) => teams[t][key]);
        const correct: any[] = correctTeams.map((t: string) => teams[t][key]);

        return guessForType(guesses, correct);
    }

    const guessForType = (guesses: any[], correct: any[]): GuessType[] => {
        const output: GuessType[] = [GuessType.WRONG, GuessType.WRONG, GuessType.WRONG];

        const remainingCorrect = [...correct]

        // Case where guesses are correct
        guesses.forEach((g, i) => {
            if (g === correct[i]){
                output[i] = GuessType.CORRECT;
                remainingCorrect.splice(remainingCorrect.indexOf(g), 1);
            }
        });

        // Case where guesses are in a different position
        guesses.forEach((g, i) => {
            if (remainingCorrect.includes(g) && output[i] !== GuessType.CORRECT){
                output[i] = GuessType.CLOSE;
                remainingCorrect.splice(remainingCorrect.indexOf(g), 1);
            }
        });

        return output;
    }

    useEffect(() => {
        handleOptionsUpdate(null, 0);
        handleOptionsUpdate(null, 1);
        handleOptionsUpdate(null, 2);
    }, [guesses]);

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
        const correctTeams = grid['teams']

        // Initial conditions
        let fullyCorrect = true;

        // Find the district for all teams in the grid
        const currentGuessProps: GuessProps[] = [];

        const guessResultTeams: GuessType[] = guessForType(guessedTeams, correctTeams);
        const guessResultDistricts: GuessType[] = guessForTypeKey(guessedTeams, correctTeams, 'district_abbreviation');
        const guessResultStates: GuessType[] = guessForTypeKey(guessedTeams, correctTeams, 'state_prov');
        const guessResultDivisions: GuessType[] = guessForTypeKey(guessedTeams, correctTeams, 'division');


        guessedTeams.forEach((t, i) => {
            if (guessResultTeams[i] !== GuessType.CORRECT) {
                fullyCorrect = false;
            }

            const teamData = teams[t];
            const guessEpa = teamData['epa'];
            const actualEpa = teams[correctTeams[i]]['epa'];

            const epaDiff = actualEpa - guessEpa;
            let epaString = epaDiff > 0 ? "↑" : "↓";

            let epaGuessType: GuessType;
            if (Math.abs(epaDiff) < 0.1) {
                epaString = ""
                epaGuessType = GuessType.CORRECT;
            } else if (Math.abs(epaDiff) < 10) {
                epaGuessType = GuessType.CLOSE;
            } else if (Math.abs(epaDiff) < 20) {
                epaGuessType = GuessType.SOMEWHAT;
            } else {
                epaGuessType = GuessType.WRONG;
            }

            currentGuessProps.push({
                teamNumber: t,
                teamLabel: `${t}${divisionFormatter(teams[t]['division'])}`,
                showDistrict: props.eventKey === '2023cmptx',
                showDivision: teams[t]['division'] !== '',
                teamGuess: guessResultTeams[i],
                districtGuess: guessResultDistricts[i],
                divisionGuess: guessResultDivisions[i],
                stateGuess: guessResultStates[i],
                epaGuess: epaGuessType,
                epaSymbol: epaString,
            })

        });

        // Update guesses state
        const newGuessesValues = [...guesses, ...currentGuessProps];
        setGuesses(newGuessesValues);


        // Check end condition
        if (newGuessesValues.length >= 3 * NUM_GUESSES || fullyCorrect) {
            setShowEndCondition(true);
        }

        setInput1(null);
        setInput2(null);
        setInput3(null);
    }

    return (
        <div className="gridle-container">
            <a onClick={() => setShowHelp(true)}>
                <FontAwesomeIcon className="float-right" icon={faCircleQuestion} />
            </a>

            {/*
                Help modal.
            */}
            <h1 className="text-center content-center text-2xl font-semibold mb-2">Gridle</h1>
            {showHelp && <HelpModal closeCallback={() => setShowHelp(false)} />}

            {/*
                The grid itself.
            */}
            <div className="p-5 content-center">
                {!grid.grid.hasOwnProperty('B') && <p className="text-center mb-2">Check back later for more grids!</p>}
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
                        isClearable={true}
                        isSearchable={true}
                        value={input1}
                        onChange={(v) => {
                            handleOptionsUpdate(v as unknown as TeamInput, 0);
                        }}
                        name="team1"
                        placeholder="Team 1"
                        options={options1}
                        components={{ IndicatorsContainer }}
                        styles={dropdownStyles}
                    />
                    <Select
                        className="basic-single"
                        classNamePrefix="select"
                        isClearable={true}
                        isSearchable={true}
                        value={input2}
                        onChange={(v) => {
                            handleOptionsUpdate(v as unknown as TeamInput, 1);

                        }}
                        name="team2"
                        placeholder="Team 2"
                        options={options2}
                        components={{ IndicatorsContainer }}
                        styles={dropdownStyles}
                    />
                    <Select
                        className="basic-single"
                        classNamePrefix="select"
                        isClearable={true}
                        isSearchable={true}
                        value={input3}
                        onChange={(v) => {
                            handleOptionsUpdate(v as unknown as TeamInput, 2);

                        }}
                        name="team3"
                        placeholder="Team 3"
                        options={options3}
                        components={{ IndicatorsContainer }}
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
            */}
            {showEndCondition &&
                <EndScreen grid={grid} guesses={guesses} gridName={props.gridName} eventKey={props.eventKey} gridIndex={props.gridIndex}/>
            }

        </div>
    );
}

export default Gridle;
