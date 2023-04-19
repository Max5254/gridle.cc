import Gridle from "@/components/gridle";
import {useEffect} from "react";
import {loadDaily, loadLive} from "@/lib/loader";
import * as React from "react";
import {router} from "next/client";
import {useRouter} from "next/router";
import {DecodeGrid} from "@/lib/gridEncoder";

export default function Home() {

    const router = useRouter();

    const [gridKey, setGridKey] = React.useState<string>();
    const [gridIndex, setGridIndex] = React.useState<string | undefined>();
    const [gridName, setGridName] = React.useState<string>("");
    const [eventKey, setEventKey] = React.useState<string>();

    /**
     * ComponentDidMount hook
     */
    useEffect(() => {
        const fetchData = async () => {
            onHashChange();

            if(!eventKey) {
                return;
            }

            const now = new Date();
            const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

            if (eventKey === '2023cmptx') {
                // gridle LIVE
                // Need to use UTC here to be consistent with lambda
                const currDateHour: string = gridIndex || `${now.toISOString().slice(0, 10)}_${now.getUTCHours().toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})}`
                console.log(currDateHour);
                const liveGrids: { [key: string]: string } =  await loadLive(eventKey, currDateHour);
                setGridIndex(currDateHour);
                setGridKey(liveGrids["0"] + ".json");
                setGridName(`gridle LIVE! ${currDateHour}`)
            } else {
                // Normal daily grids
                const dailyGrids =  await loadDaily(eventKey);
                const currDate = gridIndex || today.toISOString().slice(0, 10);
                setGridIndex(currDate);
                setGridKey(dailyGrids[currDate] + ".json");
                setGridName(`${eventKey} - ${currDate}`)
            }


        }

        window.addEventListener('hashchange', onHashChange);

        fetchData().catch(console.error);
    }, [eventKey]);

    const onHashChange = () => {
        const hash = window.location.hash;

        if (!hash) {
            setGridKey('');
            setGridIndex(undefined);
            setGridName('');
            setEventKey('');
            return;
        }

        const hashValue = hash.slice(1)

        console.log(hashValue)

        const [decodedEventKey, decodedGridIndex] = DecodeGrid(hashValue);

        console.log(decodedEventKey, decodedGridIndex)

        if (decodedEventKey && decodedGridIndex) {
            setEventKey(decodedEventKey);
            setGridIndex(decodedGridIndex);
        } else {
            setEventKey(hashValue);
        }
    }

    const setEventKeyAndHash = (key: string) => {
        window.location.hash = key;
        setEventKey(key);
    }

  return (
      <>
      <head>
          <meta charSet="UTF-8" />
          <meta name="description" content="gridle - can you guess that grid?" />
          <title>gridle</title>
      </head>
    <main className="flex min-h-screen flex-col items-center justify-between p-12">
        <div className="m-auto">
            {(gridKey && eventKey) && <Gridle gridKey={gridKey} gridIndex={gridIndex || ""} eventKey={eventKey} gridName={gridName}/>}
            {/*{(eventKey === '2023cmptx') && <>*/}
            {/*    <br/>*/}
            {/*    <div className="grid grid-cols-3">*/}
            {/*        <div className="mt-1 col-span-1">*/}
            {/*            <button*/}
            {/*                type="submit"*/}
            {/*                className="block w-full rounded-md bg-gray-400 px-3.5 py-1 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"*/}
            {/*                onClick={() => {*/}
            {/*                    const { gid } = router.query;*/}
            {/*                    if (typeof gid === "string" && parseInt(gid) > 0) {*/}
            {/*                        router.push(`?gid=${parseInt(gid) - 1}`)*/}
            {/*                    }*/}
            {/*                }}*/}
            {/*            >*/}
            {/*                ←Back*/}
            {/*            </button>*/}
            {/*        </div>*/}
            {/*        <div className="mt-1 col-start-3 col-span-1">*/}
            {/*            <button*/}
            {/*                type="submit"*/}
            {/*                className="block w-full rounded-md bg-gray-400 px-3.5 py-1 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"*/}
            {/*                onClick={() => {*/}
            {/*                    const { gid } = router.query;*/}
            {/*                    if (typeof gid === "string") {*/}
            {/*                        router.push(`?gid=${parseInt(gid) + 1}`)*/}
            {/*                    }*/}
            {/*                }}*/}
            {/*            >*/}
            {/*                Next→*/}
            {/*            </button>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*</>}*/}
            {!(gridKey && eventKey) && <div>
                <h1 className="text-center content-center text-2xl font-semibold mb-2">Gridle</h1>
                <p className="text-center">
                    Select an event to play!
                </p>
                <button
                    className="block w-full rounded-md bg-blue-500 px-3.5 py-1 my-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    onClick={() => setEventKeyAndHash('2023cmptx')}
                >
                    gridle LIVE! @ World Championship
                </button>
                <button
                    className="block w-full rounded-md bg-blue-400 px-3.5 py-1 my-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    onClick={() => setEventKeyAndHash('2023necmp')}
                >
                    New England District Championship
                </button>
                <button
                    className="block w-full rounded-md bg-blue-400 px-3.5 py-1 my-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    onClick={() => setEventKeyAndHash('2023oncmp')}
                >
                    Ontario Provincial Championship
                </button>
                <button
                    className="block w-full rounded-md bg-blue-400 px-3.5 py-1 my-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    onClick={() => setEventKeyAndHash('2023txcmp')}
                >
                    FIRST In Texas District Championship
                </button>
                <button
                    className="block w-full rounded-md bg-blue-400 px-3.5 py-1 my-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    onClick={() => setEventKeyAndHash('2023micmp')}
                >
                    FIRST In Michigan State Championship
                </button>
                <button
                    className="block w-full rounded-md bg-blue-400 px-3.5 py-1 my-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    onClick={() => setEventKeyAndHash('2023chcmp')}
                >
                    Chesapeake District Championship
                </button>
                <button
                    className="block w-full rounded-md bg-blue-400 px-3.5 py-1 my-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    onClick={() => setEventKeyAndHash('2023gacmp')}
                >
                    Peachtree District Championship
                </button>
                <button
                    className="block w-full rounded-md bg-blue-400 px-3.5 py-1 my-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    onClick={() => setEventKeyAndHash('2023mrcmp')}
                >
                    Mid-Atlantic District Championship
                </button>
                <button
                    className="block w-full rounded-md bg-blue-400 px-3.5 py-1 my-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    onClick={() => setEventKeyAndHash('2023pncmp')}
                >
                    PNW District Championship
                </button>
            </div>}
        </div>

        {/*<footer className="h-1">*/}
        {/*    <p>Created by <a*/}
        {/*        href="https://www.chiefdelphi.com/u/Maximillian/summary"*/}
        {/*        target="_blank"*/}
        {/*        rel="noopener noreferrer"*/}
        {/*    >Max</a>*/}
        {/*    </p>*/}
        {/*</footer>*/}
    </main>
      </>
  )
}
