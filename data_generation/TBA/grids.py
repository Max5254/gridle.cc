from TBA.api.tba_api import TbaApi
import logging
import json
from os import environ

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


def save_grid(match, color):
    score = match['score_breakdown'][color]
    alliance = match['alliances'][color]
    event = api.event(match['event_key'])
    district_abbreviation = ""
    district_name = ""
    if event['district']:
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

    with open(f'../output/grids/{match["event_key"]}_{color}.json', 'w') as f:
        json.dump(out, f)

    return out


if __name__ == '__main__':
    match = api.match("2023casj_f1m2")
    print(json.dumps(match, indent=3))
    print(match.keys())

    print(save_grid(match, "blue"))

    print(save_grid(api.match("2023necmp2_f1m2"), "blue"))
    print(save_grid(api.match("2023necmp2_f1m2"), "red"))
    print(save_grid(api.match("2023marea_f1m3"), "blue"))
    print(save_grid(api.match("2023njfla_f1m1"), "red"))

