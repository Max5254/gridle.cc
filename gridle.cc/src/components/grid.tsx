import * as React from 'react'

/**
 * Grid props, following the TBA response format
 *
 * {'T': ['Cone', 'None', ...], 'M': [...], 'B': [...]}
 */
interface GridProps {
    grid: {
        [key: string]: string[];
    };

    autoGrid: {
        [key: string]: string[];
    };
}

/**
 * Renders the GRID made up of cones, cubes, and empty nodes. Highlighted to indicate an auto score.
 *
 * Graciously stolen from https://www.thebluealliance.com/
 */
const Grid: React.FunctionComponent<GridProps> = (props: GridProps): JSX.Element => {

    const empty = ["None", "None", "None", "None", "None", "None", "None", "None", "None"];

    const word2Icon = (input: string): JSX.Element => {
        if (input === "Cone") {
            return (
                <>
                    <svg width="24px" height="24px">
                        <polygon points="12,5 8,20 5,20 19,20 16,20" style={{fill: "rgb(255,200,0)", strokeWidth: 1, stroke: "rgb(255,255,255)"}}></polygon>
                    </svg>
                </>
            );
        } else if (input === "Cube") {
            return (
                <>
                    <svg width="24px" height="24px">
                        <polygon points="6,6 6,18 18,18, 18,6" style={{fill: "rgb(150,0,255)", strokeWidth: 1, stroke: "rgb(255,255,255)"}}></polygon>
                    </svg>
                </>
            );
        } else {
            return (
                <>
                    <svg width="24px" height="24px">
                        <rect x="1" y="1" width="22" height="22" rx="4" style={{fill: "rgb(0, 0, 0, 0)", strokeWidth: 1, stroke: "rgb(0, 0, 0, 0.2)"}}></rect>
                    </svg>
                </>
            );
        }
    }

    return (
        <div className="bg-gray-400 p-5">
            <table className="content-center ml-auto mr-auto">
                {['T', 'M', 'B'].map((k, gridIndex) => {
                    return (<tr key={gridIndex}>
                        {(props.grid.hasOwnProperty(k) ? props.grid[k] : empty)
                            .map((s: string, i: number, v: string[]): JSX.Element => (
                                <td className={``} key={i}>
                                    <div className={`mt-1 ${(props.autoGrid && props.autoGrid.hasOwnProperty(k) && props.autoGrid[k][i] != "None") ? "bg-green-400" : ""}`}>
                                        {word2Icon(s)}
                                    </div>
                                </td>
                            ))}
                    </tr>);
                })}
            </table>
        </div>
    );
}

export default Grid;
