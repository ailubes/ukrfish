import os
import json
import glob

def aggregate_fishery_data(input_dir, output_file):
    """
    Loads JSON files from a directory, aggregates 'lots' data,
    and structures it by 'contract.winner'.
    """
    aggregated_data = {}
    
    # Ensure the output directory exists
    output_dir = os.path.dirname(output_file)
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    json_files = glob.glob(os.path.join(input_dir, '*.json'))

    for file_path in json_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                location = data.get('location')
                lots = data.get('lots', [])

                for lot in lots:
                    # Add location to each lot
                    lot['location'] = location
                    
                    winner = lot.get('contract', {}).get('winner')
                    
                    # Exclude lots where contract.winner is null or empty
                    if winner and isinstance(winner, str) and winner.strip():
                        if winner not in aggregated_data:
                            aggregated_data[winner] = []
                        aggregated_data[winner].append(lot)
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON from {file_path}: {e}")
        except Exception as e:
            print(f"An unexpected error occurred while processing {file_path}: {e}")

    # Save the aggregated data to a single JSON file
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(aggregated_data, f, indent=4, ensure_ascii=False)
        print(f"Aggregated data successfully saved to {output_file}")
    except Exception as e:
        print(f"Error saving aggregated data to {output_file}: {e}")

if __name__ == "__main__":
    input_directory = 'public/json/'
    output_filename = 'public/json/aggregated_fishery_data.json'
    aggregate_fishery_data(input_directory, output_filename)
