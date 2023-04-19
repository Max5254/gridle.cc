import multiprocessing
import os
import random

from TBA.api.tba_api import TbaApi
import logging
import json
from os import environ
from collections import defaultdict
from datetime import datetime, timedelta, timezone
import time
import statbotics

from TBA.data_puller import DataPuller
from TBA.export import Exporter

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

if environ.get('LAMBDA_TASK_ROOT') is None:
    # Local
    exporter: Exporter = Exporter(True, True)
else:
    # In Lambda
    exporter: Exporter = Exporter(False, True)

sb = statbotics.Statbotics()


def team_data(key_division):
    key, division = key_division
    team = api.team(key)
    events = api.team_event_keys(key, '2023')
    districts = api.team_districts(key)
    district_abbreviation = ""
    district_name = ""
    for d in districts:
        if d['year'] == 2023:
            district_abbreviation = d['abbreviation']
            district_name = d['display_name']

    stats = sb.get_team_year(int(key[3:]), 2023)

    # avatar = ''
    # for media in api.team_media(key, '2023'):
    #     if media['type'] == 'avatar':
    #         avatar = media['details']['base64Image']

    return key[3:], {
        'name': team['nickname'],
        'country': team['country'],
        'school': team['school_name'],
        'state_prov': team['state_prov'],
        'rookie_year': team['rookie_year'],
        'events': events,
        'division': division,
        'epa': stats['epa_end'],
        'epa_max': stats['epa_max'],
        'district_abbreviation': district_abbreviation,
        'district_name': district_name,
        # 'avatar': avatar
    }


def save_teams(keys, event_key):
    pool = multiprocessing.Pool()

    teams = []
    teams.extend(pool.map(team_data, keys))

    # teams = [team_data(k) for k in keys]

    out = {k: v for (k, v) in teams}

    exporter.export(event_key, 'teams.json', out)

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


def save_grid_wrapper(wrapped_input):
    match, color = wrapped_input
    save_grid(match, color)


def save_grid(event_key, match, color):
    score = match['score_breakdown'][color]
    alliance = match['alliances'][color]
    event = api.event(match['event_key'])
    district_abbreviation = ""
    district_name = ""
    if 'district' in event and event['district'] is not None:
        district_abbreviation = event['district']['abbreviation']
        district_name = event['district']['display_name']
    out = {
        'matchKey': match['key'],
        'eventKey': match['event_key'],
        'eventName': event['name'],
        'compLevel': match['comp_level'],
        'setNumber': match['set_number'],
        'matchNumber': match['match_number'],
        'color': color,
        'teams': [t[3:] for t in alliance['team_keys']],
        'won': match['winning_alliance'] == color,
        'autoGrid': score['autoCommunity'],
        'grid': score['teleopCommunity'],
        'links': score['links'],
        'district_abbreviation': district_abbreviation,
        'district_name': district_name,
    }

    exporter.export(f'{event_key}/grids', f'{match["key"]}_{color}.json', out)

    return out


def get_all_grids(matches_dict):
    grid_occurrences = defaultdict(lambda: 0)
    qual_grids = []
    playoff_grids = []
    grids = []

    for m in matches_dict.values():
        for alliance, d in m['alliances'].items():
            if m['score_breakdown'] is None:
                continue
            score = m['score_breakdown'][alliance]

            grid_occurrences[json.dumps(score['teleopCommunity'])] += 1

            if score['teleopGamePieceCount'] > 0:
                grids.append((m, alliance))
                if m['comp_level'] == 'qm':
                    qual_grids.append((m, alliance))
                else:
                    playoff_grids.append((m, alliance))

    print(f'Found {len(qual_grids)} qual and {len(playoff_grids)} playoff grids.')

    return grids


def save_partners(team_keys, main_event_key, event_keys, _matches_dict):
    out = {
        'teams': {},
        'alliances': {},
    }

    for team_key in team_keys:
        out['teams'][team_key[0][3:]] = []

    for event_key in event_keys:
        match_keys = api.event_match_keys(event_key)
        for match_key in match_keys:
            match = _matches_dict[match_key]
            if match['score_breakdown'] is None:
                continue
            for color, alliance in match['alliances'].items():
                alliance_key = f"{match['key']}_{color}"
                out['alliances'][alliance_key] = [t[3:] for t in alliance['team_keys']]
                for t in alliance['team_keys']:
                    out['teams'][t[3:]].append(alliance_key)

    exporter.export(main_event_key, 'partners.json', out)

    return out


def gridle(event_key=environ.get('EVENT_KEY'), s_teams=True, s_daily=0, s_endless=0):
    event = api.event(event_key)
    print(json.dumps(event))

    division_keys = event['division_keys']
    all_event_keys = [event_key]
    all_event_keys.extend(division_keys)
    print(f'{len(all_event_keys)} events')

    team_keys = [] if len(division_keys) > 0 else [(t, '') for t in api.event_team_keys(event_key)]
    match_keys = api.event_match_keys(event_key)
    print(match_keys)
    matches = api.event_matches(event_key)

    for division_key in division_keys:
        team_keys.extend([(t, division_key) for t in api.event_team_keys(division_key)])
        match_keys.extend(api.event_match_keys(division_key))
        matches.extend(api.event_matches(division_key))

    print(len(team_keys))
    print(team_keys)
    print(len(match_keys))
    print(match_keys)

    if s_teams:
        save_teams(team_keys, event_key)

    matches_dict = {m['key']: m for m in matches}

    save_partners(team_keys, event_key, all_event_keys, matches_dict)

    grids = get_all_grids(matches_dict)

    random.shuffle(grids)

    if s_daily > 0:
        daily_map = {}
        date = datetime.today()
        for m in grids[0:s_daily]:
            daily_map[date.strftime('%Y-%m-%d')] = f'{m[0]["key"]}_{m[1]}'
            save_grid(event_key, m[0], m[1])
            date += timedelta(days=1)

        exporter.export(event_key, 'daily.json', daily_map)

    if s_endless > 0:
        daily_map = {}
        for i, m in enumerate(grids[s_daily:s_daily+s_endless]):
            daily_map[i] = f'{m[0]["key"]}_{m[1]}'
            save_grid(event_key, m[0], m[1])

        exporter.export(event_key, 'endless.json', daily_map)

    return matches_dict


def handler(event, context):
    print(f'Got event: {event}')
    event_key = environ.get('EVENT_KEY')
    matches_dict = gridle(event_key=event_key, s_teams=False)

    epoch_time = int(time.time())
    # epoch_time = 1680982989
    start_time = epoch_time - (60 * 60)

    filtered_match_dict = {k: v for (k, v) in matches_dict.items() if ('post_result_time' in v and v['post_result_time'] > start_time)}

    print(filtered_match_dict.keys())

    if len(filtered_match_dict.keys()) == 0:
        grids = get_all_grids(matches_dict)
    else:
        grids = get_all_grids(filtered_match_dict)

    random.shuffle(grids)

    daily_map = {}
    for i, m in enumerate(grids[0:2]):
        daily_map[i] = f'{m[0]["key"]}_{m[1]}'
        save_grid(event_key, m[0], m[1])

    now = datetime.now(timezone.utc)

    if now.minute > 50:
        now += timedelta(hours=1)

    exporter.export(event_key, f"{now.strftime('%Y-%m-%d_%H')}.json", daily_map)

    return "Success"


if __name__ == '__main__':
    gridle('2023necmp', s_teams=True, s_daily=30)
    gridle('2023txcmp', s_teams=True, s_daily=30)
    gridle('2023oncmp', s_teams=True, s_daily=30)
    gridle('2023micmp', s_teams=True, s_daily=30)
    gridle('2023chcmp', s_teams=True, s_daily=30)
    gridle('2023gacmp', s_teams=True, s_daily=30)
    gridle('2023mrcmp', s_teams=True, s_daily=30)
    gridle('2023pncmp', s_teams=True, s_daily=30)
    #
    # gridle('2023cmptx', s_teams=True)

    # gridle('2023necmp', s_teams=True, s_endless=0, s_daily=10)

    # print(sb.get_team_year(581, 2023))
    # print(sb.get_team(581))

    # print(json.dumps(api.match('2023necmp_f1m1'), indent=3))
    # print(len(api.event_matches('2023dal')))

    # handler(None, None)


