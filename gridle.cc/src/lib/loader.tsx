


export const loadGrid = async (event: string, key: string) => {
    const data = await fetch(`/data/${event}/grids/${key}`)
    return await data.json();
}

export const loadTeams = async (event: string) => {
    const data = await fetch(`/data/${event}/teams.json`)
    return await data.json();
}

export const loadPartners = async (event: string) => {
    const data = await fetch(`/data/${event}/partners.json`)
    return await data.json();
}

export const loadDaily = async (event: string) => {
    const data = await fetch(`/data/${event}/daily.json`)
    return await data.json();
}

export const loadLive = async (event: string, timestamp: string) => {
    const data = await fetch(`/data/${event}/${timestamp}.json`)
    if (data.ok) {
        return await data.json();
    } else {
        return {"0": "error"};
    }
}

export const loadEndless = async () => {
    const data = await fetch("/data/endless.json")
    return await data.json();
}

