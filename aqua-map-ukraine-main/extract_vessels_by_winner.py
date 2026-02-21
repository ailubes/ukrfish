import json
from collections import defaultdict

def extract_and_sort_vessels():
    """
    Reads fishery data, extracts vessel names for each winner,
    sorts them, and writes the result to a file.
    """
    input_filename = 'public/json/aggregated_fishery_data.json'
    output_filename = 'vessels_by_winner.txt'

    try:
        with open(input_filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: The file {input_filename} was not found.")
        return
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {input_filename}.")
        return

    winners_vessels = defaultdict(set)

    for winner_name, lots in data.items():
        for lot in lots:
            # Extract from 'vessel_names'
            vessel_names = lot.get('vessels', {}).get('vessel_names', [])
            if vessel_names:
                winners_vessels[winner_name].update(vessel_names)

            # Extract from 'tag_ids'
            tag_ids = lot.get('tag_ids', [])
            if tag_ids:
                winners_vessels[winner_name].update(tag_ids)

    # Sort winner names
    sorted_winners = sorted(winners_vessels.keys())

    with open(output_filename, 'w', encoding='utf-8') as f:
        for i, winner_name in enumerate(sorted_winners):
            if i > 0:
                f.write("\n")  # Add a blank line between winners

            f.write(f"{winner_name}\n")
            
            # Sort vessel names for the current winner
            sorted_vessels = sorted(list(winners_vessels[winner_name]))
            
            for vessel in sorted_vessels:
                f.write(f"- {vessel}\n")

    print(f"Successfully created {output_filename}")

if __name__ == "__main__":
    extract_and_sort_vessels()