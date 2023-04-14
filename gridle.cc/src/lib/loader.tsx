


export const loadGrid = async (key: string) => {
    const data = await fetch(`/data/grids/${key}`)
    console.log(data);
    return await data.json();
}

export const loadTeams = async () => {
    const data = await fetch("/data/teams.json")
    console.log(data);
    return await data.json();
}

export const loadPartners = async () => {
    const data = await fetch("/data/partners.json")
    console.log(data);
    return await data.json();
}

export const loadDaily = async () => {
    const data = await fetch("/data/daily.json")
    console.log(data);
    return await data.json();
}

export const loadEndless = async () => {
    const data = await fetch("/data/endless.json")
    console.log(data);
    return await data.json();
}

