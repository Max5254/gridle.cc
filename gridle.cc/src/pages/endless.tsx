import Gridle from "@/components/gridle";
import {useEffect} from "react";
import { useRouter } from 'next/router'
import {loadEndless} from "@/lib/loader";
import * as React from "react";

export default function Home() {

    const router = useRouter();

    const [gridKey, setGridKey] = React.useState<string>("");
    const [gridId, setGridId] = React.useState<string>("X");

    /**
     * ComponentDidMount hook
     */
    useEffect(() => {
        const fetchData = async () => {
            const endlessGrids =  await loadEndless();
            const { gid } = router.query;
            console.log("Grid ID: " + gid)
            if (typeof gid === "string") {
                setGridId(gid);
                setGridKey(endlessGrids[gid] + ".json");
            }
        }

        fetchData().catch(console.error);
    }, [router]);

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-12">

            <div className="m-auto">
                <Gridle gridKey={gridKey} gridName={`Endless ${gridId}`} />
                <br/>
                <div className="grid grid-cols-3">
                    <div className="mt-1 col-span-1">
                        <button
                            type="submit"
                            className="block w-full rounded-md bg-gray-400 px-3.5 py-1 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            onClick={() => {
                                const { gid } = router.query;
                                if (typeof gid === "string" && parseInt(gid) > 0) {
                                    router.push(`?gid=${parseInt(gid) - 1}`)
                                }
                            }}
                        >
                            ←Back
                        </button>
                    </div>
                    <div className="mt-1 col-start-3 col-span-1">
                        <button
                            type="submit"
                            className="block w-full rounded-md bg-gray-400 px-3.5 py-1 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            onClick={() => {
                                const { gid } = router.query;
                                if (typeof gid === "string") {
                                    router.push(`?gid=${parseInt(gid) + 1}`)
                                }
                            }}
                        >
                            Next→
                        </button>
                    </div>
                </div>
            </div>


            <footer className="h-1">
                <p>Created by <a
                    href="https://www.chiefdelphi.com/u/Maximillian/summary"
                    target="_blank"
                    rel="noopener noreferrer"
                >Max</a>
                </p>
            </footer>
        </main>
    )
}
