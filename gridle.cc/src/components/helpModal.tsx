import * as React from "react";
import {NUM_GUESSES} from "@/lib/constants";

interface HelpModalProps {
    closeCallback: () => void;
}

const HelpModal: React.FunctionComponent<HelpModalProps> = ({closeCallback}: HelpModalProps): JSX.Element => {

    return (
        <>
            <div
                className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none m-10"
            >
                <div className="relative w-auto my-6 mx-auto max-w-3xl">
                    {/*content*/}
                    <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                        {/*header*/}
                        <div className="flex items-start justify-between p-5 border-b border-solid border-slate-200 rounded-t">
                            <h3 className="text-3xl font-semibold">
                                Help
                            </h3>
                            <button
                                className="p-1 ml-auto bg-transparent border-0 text-black opacity-90 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                                onClick={() => closeCallback()}
                            >
                    <span className="bg-transparent text-black h-6 w-6 text-2xl block outline-none focus:outline-none">
                      ×
                    </span>
                            </button>
                        </div>
                        {/*body*/}
                        <div className="relative p-6 flex-auto">
                            <p>
                                A random grid will be displayed with the ending condition of a match. Any auto scores will be highlighted in green.
                                You will have {NUM_GUESSES} guesses to get all teams in the match in the correct order.
                            </p>
                            <br />
                            <p>
                                When selecting teams you will be given hints about the validity of the combination based on the teams color.
                            </p>
                            <br />
                            <ul className="list-disc ml-10">
                                <li><strong>Green:</strong> Was in a match with the selected teams in this order.</li>
                                <li><strong>Yellow:</strong> Was in a match with the selected teams NOT in this order.</li>
                                <li><strong>Orange:</strong> Was in a match with all of the selected teams but not in the same match.</li>
                            </ul>
                            <br />
                            <p>
                                After making a guess the results of that guess will be shown. For each category it will show <strong>green</strong> if
                                if correct and in the correct position and <strong>yellow</strong> if correct for some team in another position. The
                                EPA category is a color scale based on how close the EPA is for the team in the given category.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </>
    );
}


export default HelpModal;
