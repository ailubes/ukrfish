import json

def calculate_total_vessels():
    """
    Calculates the total number of vessels from the aggregated fishery data.
    """
    total_vessels = 0
    with open('public/json/aggregated_fishery_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    for winner, lots in data.items():
        for lot in lots:
            if 'vessel_count' in lot and isinstance(lot['vessel_count'], int):
                total_vessels += lot['vessel_count']
            elif 'vessels' in lot and 'vessel_count' in lot['vessels'] and isinstance(lot['vessels']['vessel_count'], int):
                total_vessels += lot['vessels']['vessel_count']

    print(total_vessels)

if __name__ == "__main__":
    calculate_total_vessels()