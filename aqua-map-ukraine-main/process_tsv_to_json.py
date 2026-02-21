import os
import csv
import json
import re

def process_tsv_to_json(input_dir, output_dir):
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)

    tsv_files = [f for f in os.listdir(input_dir) if f.endswith('.tsv')]

    for tsv_file in tsv_files:
        input_filepath = os.path.join(input_dir, tsv_file)
        output_filename = os.path.splitext(tsv_file)[0] + '.json'
        output_filepath = os.path.join(output_dir, output_filename)

        print(f"Processing {tsv_file}...")

        with open(input_filepath, 'r', encoding='utf-8') as f:
            reader = csv.reader(f, delimiter='\t')
            lines = list(reader)

            if not lines:
                print(f"Skipping empty file: {tsv_file}")
                continue

            # Extract location from the first line
            location = lines[0][0].strip() if lines[0] else ""

            # Static title
            title = "Інформація про користувачів, які здійснюють спеціальне використання водних біоресурсів у 2024 році"

            # Parse headers
            # Row 2: Primary headers
            primary_headers = [h.strip() for h in lines[1]]
            # Row 3: Sub-headers for species and fishing gear
            species_gear_headers = [h.strip() for h in lines[2]]
            # Row 4: Sub-headers for contract
            contract_sub_headers = [h.strip() for h in lines[3]]
            # Row 5: Sub-headers for permit
            permit_sub_headers = [h.strip() for h in lines[4]]

            # Combine headers to create a single effective header row
            max_cols = max(len(lines[1]), len(lines[2]), len(lines[3]), len(lines[4]))
            effective_headers = [''] * max_cols

            # Prioritize more specific headers (lower rows)
            for i, h in enumerate(lines[4]): # Permit sub-headers
                if h.strip():
                    effective_headers[i] = h.strip()
            for i, h in enumerate(lines[3]): # Contract sub-headers
                if h.strip() and not effective_headers[i]:
                    effective_headers[i] = h.strip()
            for i, h in enumerate(lines[2]): # Species/Gear/Vessel headers
                if h.strip() and not effective_headers[i]:
                    effective_headers[i] = h.strip()
            for i, h in enumerate(lines[1]): # Primary headers
                if h.strip() and not effective_headers[i]:
                    effective_headers[i] = h.strip()

            # Create a mapping from desired JSON key to its column index
            json_field_to_col_idx = {}

            # Fixed columns mapping
            mapping_definitions = {
                "lot_type": "Вид лоту",
                "lot_id": "Номер договору",
                "contract_winner": "Переможець",
                "contract_publication_date": "Дата опублікування договору в електронній системі",
                "permit_date": "Дата", # This is the 'Дата' under 'Дозвіл'
                "permit_number": "Номер", # This is the 'Номер' under 'Дозвіл'
                "lot_share_percentage": "Частка лоту (%)",
                "total_bioresource_limit": "Загальний ліміт вилучення водних біоресурсів (тонн)",
                "tag_ids": "Ідентифікатори міток",
                "vessel_count": "Кількість риболовних суден",
                "vessel_names_raw": "Назва судна/Бортовий номер судна"
            }

            for json_key, tsv_header in mapping_definitions.items():
                try:
                    json_field_to_col_idx[json_key] = effective_headers.index(tsv_header)
                except ValueError:
                    print(f"Warning: '{tsv_header}' not found in effective headers. Skipping mapping for {json_key}.")

            # Dynamic Species Limits and Fishing Gear
            species_names = []
            fishing_gear_names = []

            # Find the start and end indices for dynamic sections based on primary headers
            species_section_start_idx = -1
            fishing_gear_section_start_idx = -1
            tag_ids_section_start_idx = -1

            for i, h in enumerate(lines[1]):
                if "Види водних біоресурсів" in h:
                    species_section_start_idx = i
                elif "Знаряддя лову" in h:
                    fishing_gear_section_start_idx = i
                elif "Ідентифікатори міток" in h:
                    tag_ids_section_start_idx = i
                    break # Found the end of dynamic sections

            # If sections are found, extract dynamic headers from lines[2]
            if species_section_start_idx != -1 and fishing_gear_section_start_idx != -1:
                for i in range(species_section_start_idx, fishing_gear_section_start_idx):
                    if i < len(lines[2]) and lines[2][i].strip():
                        species_name = lines[2][i].strip()
                        species_names.append(species_name)
                        json_field_to_col_idx[f'species_{species_name}'] = i

            # Extract fishing gear names more robustly
            if fishing_gear_section_start_idx != -1:
                # Iterate from the start of the fishing gear section up to the tag_ids section or end of headers
                for i in range(fishing_gear_section_start_idx, len(lines[2])):
                    if tag_ids_section_start_idx != -1 and i >= tag_ids_section_start_idx:
                        break # Stop if we reach the tag_ids section
                    
                    gear_name = lines[2][i].strip()
                    if gear_name: # Only add non-empty gear names
                        fishing_gear_names.append(gear_name)
                        json_field_to_col_idx[f'gear_{gear_name}'] = i


            lots = []
            # Data rows start from index 5 (Row 6)
            for row_idx in range(5, len(lines)): # Iterate through all potential data rows
                row_data = lines[row_idx]

                # Get the index for 'Вид лоту'
                lot_type_col_idx = json_field_to_col_idx.get("lot_type")

                # Check if the row should be skipped (if 'Вид лоту' starts with "Всього")
                if lot_type_col_idx is not None and lot_type_col_idx < len(row_data):
                    first_cell_content = row_data[lot_type_col_idx].strip()
                    if first_cell_content.startswith("Всього"):
                        print(f"Skipping summary row: {first_cell_content}")
                        continue # Skip this row

                lot = {}

                # Helper to convert string to float, handling comma decimal and empty strings
                def to_float(value):
                    if value is None or value.strip() == '':
                        return None
                    try:
                        return float(value.replace(',', '.'))
                    except ValueError:
                        return None

                # Helper to convert string to int, handling empty strings
                def to_int(value):
                    if value is None or value.strip() == '':
                        return 0
                    try:
                        return int(value)
                    except ValueError:
                        return 0

                # Helper to parse vessel names
                def parse_vessel_names(names_str):
                    if not names_str:
                        return []
                    
                    cleaned_str = names_str.strip()
                    if not cleaned_str:
                        return []

                    # Special case: if the only content is "судна перейшли на Дунай", return empty array
                    if cleaned_str.lower() == "судна перейшли на дунай":
                        return []

                    # Regex pattern for vessel names
                    vessel_name_pattern = re.compile(r'[A-ZА-Я]{2,4}\s+\d+[KM]?')

                    # Use findall to extract all occurrences of the vessel name pattern from the string.
                    # This is more robust than splitting and then fullmatching, as it handles
                    # various delimiters (or lack thereof) between vessel names.
                    found_names = vessel_name_pattern.findall(cleaned_str)
                    
                    # Filter out any empty strings that might result from findall (though unlikely with this pattern)
                    # and ensure uniqueness and sorting.
                    filtered_names = [name.strip() for name in found_names if name.strip()]
                    
                    return sorted(list(set(filtered_names))) # Remove duplicates and sort for consistency

                # Map data using the determined column indices
                for json_key, col_idx in json_field_to_col_idx.items():
                    if col_idx < len(row_data):
                        value = row_data[col_idx].strip()
                        
                        if json_key == 'lot_type':
                            lot['lot_type'] = value if value else None
                        elif json_key == 'lot_id':
                            lot['lot_id'] = value if value else None
                        elif json_key == 'contract_winner':
                            lot.setdefault('contract', {})['winner'] = value if value else None
                        elif json_key == 'contract_publication_date':
                            lot.setdefault('contract', {})['publication_date'] = value if value else None
                        elif json_key == 'permit_date':
                            lot.setdefault('permit', {})['date'] = value if value else None
                        elif json_key == 'permit_number':
                            lot.setdefault('permit', {})['number'] = value if value else None
                        elif json_key == 'lot_share_percentage':
                            lot['lot_share_percentage'] = to_float(value)
                        elif json_key == 'total_bioresource_limit':
                            lot['total_bioresource_limit'] = to_float(value)
                        elif json_key.startswith('species_'):
                            species_name = json_key[len('species_'):]
                            lot.setdefault('species_limits', {})[species_name] = to_float(value)
                        elif json_key.startswith('gear_'):
                            gear_name = json_key[len('gear_'):]
                            lot.setdefault('fishing_gear', {})[gear_name] = to_int(value)
                        elif json_key == 'tag_ids':
                            lot['tag_ids'] = value.split(' ') if value else []
                        elif json_key == 'vessel_count':
                            lot['vessel_count_raw'] = value # Store raw value for later processing
                        elif json_key == 'vessel_names_raw':
                            lot['vessel_names_raw'] = value # Store raw value for later processing
                    else:
                        # Handle cases where a column might be missing in a row (e.g., trailing empty cells)
                        pass

                # Process vessel information and nest it
                vessel_count = to_int(lot.pop('vessel_count_raw', None))
                vessel_names_raw = lot.pop('vessel_names_raw', None)
                
                lot['vessels'] = {
                    'vessel_count': vessel_count,
                    'vessel_names': parse_vessel_names(vessel_names_raw)
                }

                # Ensure all required fields are present, even if null
                lot.setdefault('contract', {})
                lot['contract'].setdefault('winner', None)
                lot['contract'].setdefault('publication_date', None)
                lot.setdefault('permit', {})
                lot['permit'].setdefault('date', None)
                lot['permit'].setdefault('number', None)
                lot.setdefault('species_limits', {})
                lot.setdefault('fishing_gear', {})
                lot.setdefault('tag_ids', []) # tag_ids is still a direct key, not nested under vessels


                lots.append(lot)

            json_output = {
                "title": title,
                "location": location,
                "lots": lots
            }

            with open(output_filepath, 'w', encoding='utf-8') as outfile:
                json.dump(json_output, outfile, ensure_ascii=False, indent=2)
            print(f"Successfully converted {tsv_file} to {output_filename}")

if __name__ == "__main__":
    input_directory = 'data'
    output_directory = 'public/json'
    process_tsv_to_json(input_directory, output_directory)