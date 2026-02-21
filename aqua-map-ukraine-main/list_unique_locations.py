import json
import os

file_path = os.path.join('public', 'json', 'aggregated_fishery_data.json')
unique_locations = set()

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for lot_list in data.values():
        for lot in lot_list:
            if 'location' in lot:
                unique_locations.add(lot['location'])

    sorted_locations = sorted(list(unique_locations))
    for location in sorted_locations:
        print(location)

except FileNotFoundError:
    print(f"Error: The file '{file_path}' was not found.")
except json.JSONDecodeError:
    print(f"Error: Could not decode JSON from '{file_path}'. Check file format.")
except Exception as e:
    print(f"An unexpected error occurred: {e}")