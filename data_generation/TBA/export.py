import json
import os
import boto3

client = boto3.client('s3')

class Exporter:
    local_export_location = '../output/'
    s3_export_location = 'data/'
    s3_bucket = 'gridle-data'

    def __init__(self, file, s3):
        self.exporters = []

        if file:
            self.exporters.append(self._export_file)

        if s3:
            self.exporters.append(self._export_s3)

    def export(self, path, filename, data):
        print(f'Saving {path}/{filename}')
        for e in self.exporters:
            e(path, filename, data)

    def _export_file(self, path, filename, data):
        full_path = f'{self.local_export_location}/{path}/'
        if not os.path.exists(full_path):
            os.makedirs(full_path)
        with open(full_path + filename, 'w') as f:
            json.dump(data, f)

    def _export_s3(self, path, filename, data):
        object_key = f'{self.s3_export_location}{path}/{filename}'
        client.put_object(Body=json.dumps(data).encode(), Bucket=self.s3_bucket, Key=object_key)
