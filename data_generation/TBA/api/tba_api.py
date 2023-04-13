import requests as r
import json
import os
import time
import re


"""
    Basic wrapper around TBA API calls which supports local caching. Calls will be saved locally into the /data/ 
    directory and cached for future calls. This can either be a hard cache or respect the cache-control values to check
    if new data is available. 

    https://www.thebluealliance.com/apidocs/v3
"""
class TbaApi:
    _base_url = 'https://www.thebluealliance.com/api/v3/'
    _root = '../data'

    def __init__(self, auth_key, log, always_cache=True):
        self.headers = {'X-TBA-Auth-Key': auth_key}
        self.log = log
        self.always_cache = always_cache

    def save(self, data, path):
        full_path = f'{self._root}/{path}'
        if not os.path.exists(full_path):
            os.makedirs(full_path)

        with open(f'{full_path}/data.json', 'w') as f:
            json.dump(data, f)

    def load(self, path):
        full_path = f'{self._root}/{path}'
        with open(f'{full_path}/data.json', 'r') as f:
            return json.load(f)

    def exists(self, path):
        return os.path.exists(f'{self._root}/{path}/data.json')

    def _get(self, endpoint, always_cache=True):
        old_data = None
        if self.exists(endpoint):
            old_data = self.load(endpoint)

        modified_headers = self.headers

        if old_data and 'cache' in old_data:
            old_data_cache = old_data['cache']
            if ('expire' in old_data_cache and old_data_cache['expire'] >= time.time()) or (self.always_cache and always_cache):
                return old_data['content']

            if 'ETag' in old_data_cache:
                modified_headers['If-None-Match'] = old_data['cache']['ETag']

        res = r.get(self._base_url + endpoint, headers=self.headers)

        cache_data = {}

        if 'ETag' in res.headers:
            cache_data['ETag'] = res.headers['ETag']

        if 'Cache-Control' in res.headers:
            cache_control = res.headers['Cache-Control']
            max_age = re.findall('max-age=(\\d+)', cache_control)
            max_age = int(max_age[0]) if len(max_age) == 1 else 0
            cache_data['expire'] = time.time() + int(max_age)
            cache_data['max-age'] = max_age

        if res.status_code == 304:
            self.log.debug('Data has not been modified, returning locally cached content')
            old_data['cache'] = cache_data
            self.save(old_data, endpoint)
            return old_data['content']

        if res.status_code == 200:
            data = {
                'content': json.loads(res.text),
                'cache': cache_data
            }
            self.save(data, endpoint)

        return json.loads(res.text)

    def status(self):
        return self._get('status')

    """
        EVENTS
    """
    def events(self, year, week=None, simple=False):
        events = self._get(f'events/{year}' + ('/simple' if simple else ''))
        if week is None:
            return events

        return [event for event in events if (week - 1 if isinstance(week, int) else week) == event['week']]

    def event_keys(self, year, week=None):
        if week is None:
            return self._get(f'events/{year}/keys').remove('2023zhha')
        elif isinstance(week, list):
            keys = []
            [keys.extend(self.event_keys(year, w)) for w in week]
            return keys
        else:
            return [event['key'] for event in self.events(year, week) if event['key'] != '2023zhha']

    def event(self, event_key, simple=False):
        return self._get(f'event/{event_key}' + ('/simple' if simple else ''))

    def event_teams(self, event_key, simple=False):
        return self._get(f'event/{event_key}/teams' + ('/simple' if simple else ''))

    def event_team_keys(self, event_key):
        return self._get(f'event/{event_key}/teams/keys')

    def event_team_statuses(self, event_key):
        return self._get(f'event/{event_key}/teams/statuses')

    def event_district_points(self, event_key):
        return self._get(f'event/{event_key}/district_points')

    def event_rankings(self, event_key):
        return self._get(f'event/{event_key}/rankings')

    def event_awards(self, event_key):
        return self._get(f'event/{event_key}/awards')

    def event_matches(self, event_key, simple=False):
        return self._get(f'event/{event_key}/matches{"/simple" if simple else ""}')

    def event_match_keys(self, event_key):
        return self._get(f'event/{event_key}/matches/keys')

    """
        DISTRICTS
    """
    def districts(self, year):
        return self._get(f'districts/{year}')

    def district_events(self, district_key, simple=False):
        return self._get(f'district/{district_key}/events' + ('/simple' if simple else ''))

    def district_event_keys(self, district_key):
        return self._get(f'district/{district_key}/events/keys')

    def district_teams(self, district_key, simple=False):
        return self._get(f'district/{district_key}/teams' + ('/simple' if simple else ''))

    def district_team_keys(self, district_key):
        return self._get(f'district/{district_key}/teams/keys')

    def district_rankings(self, district_key):
        return self._get(f'district/{district_key}/rankings')

    """
        TEAMS
    """
    def teams(self, year=None, page_number=None, simple=False):
        if page_number is not None:
            return self._get(f'teams/{f"{year}/" if year else ""}{page_number}' + ('/simple' if simple else ''))
        else:
            current_num = 0
            team_list = []
            while True:
                res = self.teams(year, current_num, simple)
                if len(res) == 0:
                    break

                team_list.extend(res)
                current_num += 1

            return team_list

    def team_keys(self, year=None, page_number=None):
        if page_number is not None:
            return self._get(f'teams/{f"{year}/" if year else ""}{page_number}/keys')
        else:
            current_num = 0
            team_list = []
            while True:
                res = self.team_keys(year, current_num)
                if len(res) == 0:
                    break

                team_list.extend(res)
                current_num += 1

            return team_list

    def team(self, team_key, simple=False):
        return self._get(f'team/{team_key}{"/simple" if simple else ""}')

    def team_media(self, team_key, year):
        return self._get(f'team/{team_key}/media/{year}')

    def team_years_participated(self, team_key):
        return self._get(f'team/{team_key}/years_participated')

    def team_districts(self, team_key):
        return self._get(f'team/{team_key}/districts')

    def team_robots(self, team_key):
        return self._get(f'team/{team_key}/robots')

    def team_events(self, team_key, simple=False, year=None):
        return self._get(f'team/{team_key}/events{f"/{year}" if year else ""}{"/simple" if simple else ""}')

    def team_event_keys(self, team_key, year=None):
        return self._get(f'team/{team_key}/events/{f"{year}/" if year else ""}keys')

    def team_event_matches(self, team_key, event_key, simple=False):
        return self._get(f'team/{team_key}/event/{event_key}/matches{"/simple" if simple else ""}')

    def team_event_match_keys(self, team_key, event_key):
        return self._get(f'team/{team_key}/event/{event_key}/matches/keys')

    def team_event_awards(self, team_key, event_key):
        return self._get(f'team/{team_key}/event/{event_key}/awards')

    def team_event_status(self, team_key, event_key):
        return self._get(f'team/{team_key}/event/{event_key}/status')

    """
        MATCHES
    """
    def match(self, match_key, simple=False):
        return self._get(f'match/{match_key}{"/simple" if simple else ""}')

