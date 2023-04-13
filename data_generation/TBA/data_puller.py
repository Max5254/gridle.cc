from TBA.api.tba_api import TbaApi
import logging
from os import environ
import multiprocessing

log = logging.getLogger()
log.setLevel(logging.INFO)
log.info = print
log.warning = print
log.warn = print
log.error = print

api: TbaApi = TbaApi(environ.get('AUTH_KEY'), log)


class DataPuller:

    def __init__(self):
        self.pool = multiprocessing.Pool()

    def parallelize(self, keys, function):
        return self.pool.map(function, keys)

    def pull_matches(self, event_keys):
        out = []
        for event_key in event_keys:
            out.extend(self.parallelize(api.event_match_keys(event_key), api.match))
        return out

    def pull_events(self, year):
        return {e['key']: e for e in api.events(year)}

    def dump_events(self, year, weeks):
        event_keys = api.event_keys(year, week=weeks)
        log.info(f'Pulling {year} event data for weeks {weeks} with {len(event_keys)} events.')
        for key in event_keys:
            api.event_awards(key)
            api.event_rankings(key)

        self.pull_matches(event_keys)


if __name__ == '__main__':
    puller = DataPuller()

    event_keys = api.event_keys('2023', week=[1, 2, 3])
    print(event_keys)

    matches = puller.pull_matches(event_keys)

    print(len(matches))

    district = api.team_districts('frc3467')
    print(district)

    puller.dump_events('2023', [1, 2, 3])

    teams = api.team_keys('2023')
    puller.parallelize(teams, api.team_districts)

    districts = api.districts('2023')
    print(districts)

    for d in districts:
        print(api.district_team_keys(d['key']))
