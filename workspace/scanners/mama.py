import os
from dotenv import load_dotenv
import requests
load_dotenv()

from supabase import create_client
supabase = create_client(os.getenv("DB_URL"), os.getenv("DB_KEY"))


def get_files(path):
    files = {}
    try:
        response = supabase.storage.from_('temp_scans').list(path)
        for r in response:
            if r['id'] is None:  # It's a folder
                # Use forward slash for storage paths (platform independent)
                folder_path = f"{path}/{r['name']}" if path else r['name']
                files.update(get_files(folder_path))
            else:  # It's a file
                file_path = f"{path}/{r['name']}" if path else r['name']
                public_url = supabase.storage.from_('temp_scans').get_public_url(file_path)
                files[file_path] = public_url
    except Exception as e:
        print(f"Error accessing path '{path}': {e}")
    return files

names = get_files("ff77220c-fac4-4494-b540-4dfcc26b7e43_80a599bc-c763-43df-9a6a-7d0396efdd7b")
for name in names:
    print(name, names[name])

# print(requests.get('https://olgucfpgkjzaukghumtq.supabase.co/storage/v1/object/public/temp_scans/ff77220c-fac4-4494-b540-4dfcc26b7e43_80a599bc-c763-43df-9a6a-7d0396efdd7b/workspace/scanners/orchestrator.py?').text)