from TBA.api.tba_api import TbaApi
from TBA.data_puller import DataPuller
import logging
import json
from os import environ
import multiprocessing


log = logging.getLogger()
log.setLevel(logging.INFO)
log.info = print
log.warning = print
log.warn = print
log.error = print

"""
    Must set environment variable AUTH_KEY with a valid TBAv3 API key. 
"""

api: TbaApi = TbaApi(environ.get('AUTH_KEY'), log)


def print_grid(grid):
    icons = {
        "Cube": "🟪",
        "Cone": "⚠️",
        "None": "⬜",
    }

    out = ""
    for k in ['T', 'M', 'B']:
        row = grid[k]
        out += "".join(icons[p] for p in row) + "\n"
        print("".join(icons[p] for p in row))
    return out


def team_data(key):
    team = api.team(key)
    events = api.team_event_keys(key, '2023')
    districts = api.team_districts(key)
    district_abbreviation = ""
    district_name = ""
    for d in districts:
        if d['year'] == 2023:
            district_abbreviation = d['abbreviation']
            district_name = d['display_name']

    return key[3:], {
        'name': team['nickname'],
        'country': team['country'],
        'school': team['school_name'],
        'state_prov': team['state_prov'],
        'rookie_year': team['rookie_year'],
        'events': events,
        'district_abbreviation': district_abbreviation,
        'district_name': district_name,
    }


def save_teams(keys):
    pool = multiprocessing.Pool()

    teams = []
    teams.extend(pool.map(team_data, keys))

    out = {k: v for (k, v) in teams}

    with open(f'../output/teams.json', 'w') as f:
        json.dump(out, f)

    return out


def save_team_matches(_team_key, _match_dict):
    out = {}

    event_keys = api.team_event_keys(_team_key, '2023')
    for event_key in event_keys:
        event_partners = set()
        match_keys = api.team_event_match_keys(_team_key, event_key)
        for match_key in match_keys:
            if match_key not in _match_dict:
                continue
            match = _match_dict[match_key]
            for alliance in match['alliances'].values():
                team_keys_in_match = alliance['team_keys']
                if _team_key in team_keys_in_match:
                    _team_keys_in_match = list(team_keys_in_match)
                    _team_keys_in_match.remove(_team_key)
                    _team_keys_in_match.sort()
                    event_partners.add(tuple([t[3:] for t in _team_keys_in_match]))
                    break

        out[event_key] = list(event_partners)

    return out


if __name__ == '__main__':
    team_keys = api.team_keys("2023")
    print(f'{len(team_keys)} matches')
    save_teams(team_keys)

    event_keys = api.event_keys('2023', week=[1, 2, 3, 4, 5, 6])
    puller: DataPuller = DataPuller()
    matches = puller.pull_matches(event_keys)
    print(f'{len(event_keys)} events')

    print(matches[0].keys())
    matches_dict = {m['key']: m for m in matches}

    partners = {}
    for team_key in team_keys:
        partners[team_key[3:]] = save_team_matches(team_key, matches_dict)

    with open(f'../output/partners.json', 'w') as f:
        json.dump(partners, f)

