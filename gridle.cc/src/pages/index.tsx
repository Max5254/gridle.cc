import Gridle from "@/components/gridle";
import {useEffect} from "react";
import {loadDaily} from "@/lib/loader";
import * as React from "react";

export default function Home() {

    const [gridKey, setGridKey] = React.useState<string>("");

    /**
     * ComponentDidMount hook
     */
    useEffect(() => {
        const fetchData = async () => {
            const dailyGrids =  await loadDaily();
            const today = new Date().toISOString().slice(0, 10);
            setGridKey(dailyGrids[today] + ".json");
        }

        fetchData().catch(console.error);
    }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-12">

        <div className="m-auto">
            <Gridle gridKey={gridKey} gridName={new Date().toISOString().slice(0, 10)}/>
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
