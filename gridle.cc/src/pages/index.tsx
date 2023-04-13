import Image from 'next/image'
import { Inter } from 'next/font/google'
import Gridle from "@/components/gridle";
const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-12">

        <div className="m-auto">
            <Gridle gridKey={'2023njfla_red.json'} />
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
