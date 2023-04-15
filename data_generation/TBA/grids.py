import multiprocessing
import random

from TBA.api.tba_api import TbaApi
import logging
import json
from os import environ
from collections import defaultdict
from datetime import datetime, timedelta

from TBA.data_puller import DataPuller

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



def save_grid_wrapper(input):
    match, color = input
    save_grid(match, color)


def save_grid(match, color):
    score = match['score_breakdown'][color]
    alliance = match['alliances'][color]
    event = api.event(match['event_key'])
    district_abbreviation = ""
    district_name = ""
    if 'district' in event:
        district_abbreviation = event['district']['abbreviation']
        district_name = event['district']['display_name']
    out = {
        'matchKey': match['key'],
        'eventKey': match['event_key'],
        'teams': [t[3:] for t in alliance['team_keys']],
        'won': match['winning_alliance'] == color,
        'autoGrid': score['autoCommunity'],
        'grid': score['teleopCommunity'],
        'links': score['links'],
        'district_abbreviation': district_abbreviation,
        'district_name': district_name,
    }

    with open(f'../output/grids/{match["key"]}_{color}.json', 'w') as f:
        json.dump(out, f)

    return out


def get_all_grids():
    event_keys = api.event_keys('2023', week=[1, 2, 3, 4, 5, 6])
    puller: DataPuller = DataPuller()
    matches = puller.pull_matches(event_keys)
    print(f'{len(event_keys)} events')
    print(f'{len(matches)} matches')

    grid_occurrences = defaultdict(lambda: 0)
    qual_grids = []
    playoff_grids = []

    for m in matches:
        for alliance, d in m['alliances'].items():
            if m['score_breakdown'] is None:
                continue
            score = m['score_breakdown'][alliance]

            grid_occurrences[json.dumps(score['teleopCommunity'])] += 1

            if score['teleopGamePieceCount'] > 9:
                if m['comp_level'] == 'qm':
                    qual_grids.append((m, alliance))
                else:
                    playoff_grids.append((m, alliance))


    # Most common grids
    # most_common_grids = sorted(grid_occurrences.items(), key=lambda i: i[1], reverse=True)
    # for i, grid in enumerate(most_common_grids[:10]):
    #     print(f'{i + 1}: {grid[1]} occurrences')
    #     print_grid(json.loads(grid[0]))
    #     print()

    print(f'Found {len(qual_grids)} qual and {len(playoff_grids)} playoff grids.')

    return qual_grids, playoff_grids


def dev_grids(match_key1, color1, match_key2, color2):
    save_grid(api.match(match_key1), color1)
    save_grid(api.match(match_key2), color2)

    daily_map = {}
    date = datetime.today()
    for _ in range(365):
        daily_map[date.strftime('%Y-%m-%d')] = f'{match_key1}_{color1}'
        date += timedelta(days=1)

    with open(f'../output/daily.json', 'w') as f:
        json.dump(daily_map, f)

    endless_map = {}
    for i in range(365):
        endless_map[i] = f'{match_key2}_{color2}' if i % 2 == 0 else f'{match_key1}_{color1}'

    with open(f'../output/endless.json', 'w') as f:
        json.dump(endless_map, f)


if __name__ == '__main__':
    match = api.match("2023casj_f1m2")
    print(json.dumps(match, indent=3))
    print(match.keys())

    dev = False

    if dev:
        dev_grids('2023njfla_f1m1', 'red', '2023camb_f1m1', 'red')
    else:
        qual_grids, playoff_grids = get_all_grids()

        random.shuffle(qual_grids)
        random.shuffle(playoff_grids)

        daily_grids = playoff_grids[0:100]
        endless_grids = playoff_grids[200:300]

        daily_grids.extend(qual_grids[100:200])
        endless_grids.extend(qual_grids[500:600])

        random.shuffle(daily_grids)
        random.shuffle(endless_grids)

        daily_map = {}
        date = datetime.today()
        for m in daily_grids:
            daily_map[date.strftime('%Y-%m-%d')] = f'{m[0]["key"]}_{m[1]}'
            date += timedelta(days=1)

        with open(f'../output/daily.json', 'w') as f:
            json.dump(daily_map, f)

        endless_map = {}
        for i, m in enumerate(endless_grids):
            endless_map[i] = f'{m[0]["key"]}_{m[1]}'

        with open(f'../output/endless.json', 'w') as f:
            json.dump(endless_map, f)

        pool = multiprocessing.Pool()

        pool.map(save_grid_wrapper, daily_grids)
        pool.map(save_grid_wrapper, endless_grids)

        # used_grids = (daily_grids + endless_grids)
        # used_grids = playoff_grids
        #
        # matches_dict = {m['key']: m for m in [e[0] for e in used_grids]}
        #
        # team_key_set = set()
        #
        # for g, a in used_grids:
        #     for t in g['alliances'][a]['team_keys']:
        #         team_key_set.add(t)
        #
        # team_keys = list(team_key_set)
        #
        # save_teams(team_keys)
        #
        # partners = {}
        # for team_key in team_keys:
        #     partners[team_key[3:]] = save_team_matches(team_key, matches_dict)
        #
        # with open(f'../output/partners.json', 'w') as f:
        #     json.dump(partners, f)
