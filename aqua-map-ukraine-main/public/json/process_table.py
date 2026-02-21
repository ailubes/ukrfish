import pandas as pd
import json
import io
import re

def clean_value(value):
    """Cleans and converts string values to appropriate types."""
    if pd.isna(value) or str(value).strip() == '':
        return None
    s_value = str(value).strip().replace(',', '.')
    try:
        # Try converting to float first, then int if it's a whole number
        float_val = float(s_value)
        # Check if it's an integer value, convert to int
        if float_val == int(float_val):
            return int(float_val)
        return float_val
    except ValueError:
        return s_value

def parse_tag_ids(tag_string):
    """Parses tag IDs, separating potential notes."""
    if pd.isna(tag_string) or str(tag_string).strip() == '':
        return [], None

    tags = []
    notes = None
    # Split by newline and potentially quoted strings to get individual items/lines
    # Filter out empty strings that result from split
    raw_lines = [s.strip() for s in re.split(r'[\n"]+', str(tag_string)) if s.strip()]
    
    for line in raw_lines:
        # Heuristic to distinguish tags from notes: tags are typically alphanumeric codes
        # and not full sentences.
        # Check for patterns like XXXX NNNN, XXXX NNNN K, or pure numbers
        if re.match(r'^[A-Z]{3,4}\s?\d{3,4}[A-Z]?$', line) or re.match(r'^\d+(\.\d+)?$', line):
            tags.append(line)
        else:
            # If it doesn't look like a tag, treat it as a note
            if notes:
                notes += " " + line
            else:
                notes = line
    return tags, notes

def process_table_data(table_text):
    """
    Processes the raw table text into a structured JSON format.
    """
    lines = table_text.strip().split('\n')

    # Identify general metadata (title, location)
    location = lines[0].strip()
    title = "Інформація про користувачів, які здійснюють спеціальне використання водних біоресурсів у 2024 році"

    # Find header rows (by looking for keywords)
    header_start_line = -1
    for i, line in enumerate(lines):
        if "Вид лоту" in line and "ДОГОВІР" in line:
            header_start_line = i
            break
    
    if header_start_line == -1:
        raise ValueError("Could not find table headers. Please ensure 'Вид лоту' and 'ДОГОВІР' are in the expected header row.")

    # Parse header rows ensuring they all have the same effective number of columns
    # Split by single tab and then clean up to preserve structure
    header_row_1_raw = lines[header_start_line].split('\t')
    header_row_2_raw = lines[header_start_line + 1].split('\t')
    header_row_3_raw = lines[header_start_line + 2].split('\t')

    # Determine max columns to pad shorter header rows
    max_cols = max(len(header_row_1_raw), len(header_row_2_raw), len(header_row_3_raw))

    # Pad shorter header rows with empty strings and then strip each element
    header_row_1 = [h.strip() for h in header_row_1_raw + [''] * (max_cols - len(header_row_1_raw))]
    header_row_2 = [h.strip() for h in header_row_2_raw + [''] * (max_cols - len(header_row_2_raw))]
    header_row_3 = [h.strip() for h in header_row_3_raw + [''] * (max_cols - len(header_row_3_raw))]
    
    # Create a new flattened header for pandas
    final_pandas_column_names = []

    # Keep track of current main headers from the top row for multi-level columns
    current_h1_group = ""
    
    for i in range(max_cols): # Iterate over max_cols to ensure all columns are processed
        h1 = header_row_1[i]
        h2 = header_row_2[i]
        h3 = header_row_3[i]

        # Update current top-level header group if h1 is not empty
        if h1:
            current_h1_group = h1
        
        final_col_name = ""

        # Specific mapping for the initial columns (which are not truly nested under a parent like "ДОГОВІР")
        if i == 0: # Column 'Вид лоту' (e.g., MIN, MID, MAX)
            final_col_name = 'lot_type'
        elif i == 1: # Column 'Кількість лотів' (e.g., '1' for each lot type in the raw table)
            final_col_name = 'num_lots_in_category_placeholder' # This column is often redundant for individual lots
        elif i == 2: # This is the 'Номер договору' column acting as lot_id (third physical column)
            final_col_name = 'lot_id'
        elif current_h1_group == 'ДОГОВІР':
            # These are the actual contract details, use h2 as key
            cleaned_h2 = h2.replace(' ', '_').lower().strip()
            if cleaned_h2: # Ensure h2 is not empty after cleaning
                final_col_name = f"contract_{cleaned_h2}"
            else: # Fallback for empty h2 under a main group
                final_col_name = f"contract_col_{i}" # Use unique ID for empty (shouldn't happen with correct headers)
        elif current_h1_group == 'Дозвіл':
            # These are permit details, use h2 as key
            cleaned_h2 = h2.replace('/', '_').lower().strip()
            if cleaned_h2:
                final_col_name = f"permit_{cleaned_h2}"
            else:
                final_col_name = f"permit_col_{i}" # Use unique ID for empty (shouldn't happen with correct headers)
        elif current_h1_group == '% від загального ліміту':
            final_col_name = 'lot_share_percentage'
        elif current_h1_group == 'Загальний обсяг лімітованих і прогнозних видів водного біоресурсу':
            final_col_name = 'total_bioresource_limit'
        elif current_h1_group == 'Види водних біоресурсів, які включені до договору':
            # Clean up species names: remove scientific names in parentheses and specific numbers
            species_name = h2.strip()
            species_name = re.sub(r'\s+\(.*\)$', '', species_name).strip() # Remove (scientific name)
            species_name = species_name.replace('4 Gobiidae', '').strip() # Remove "4 Gobiidae" specific to Бички
            species_name = species_name.replace('Hypophthalmichthys molitrix, Hypophthalmichthys nobilis, Ctenopharyngodon idella', '').strip() # Remove long scientific name for Рослиноїдні
            
            if species_name: # Ensure species_name is not empty
                final_col_name = f"species_{species_name.replace(' ', '_').replace(',', '_').replace('.', '_').lower()}"
            else: # Fallback for empty species name in a block
                final_col_name = f"species_col_{i}" # Use unique ID for empty
        elif current_h1_group == 'Знаряддя лову, які включені до договору':
            gear_name_raw = h2.strip()
            location_spec_raw = h3.strip()

            # Clean and standardize gear name
            cleaned_gear_name = re.sub(r'\[.*?\]', '', gear_name_raw).strip() # Remove existing brackets if any

            # Determine specific location suffix if applicable, using more robust regex if necessary
            location_suffix = ""
            if "Для використання у Дніпровсько-Бузькому лимані" in location_spec_raw:
                location_suffix = " [Дніпровсько-Бузький лиман]"
            elif "Для використання у придатковій системі пониззя річки Дніпро" in location_spec_raw:
                location_suffix = " [придаткова система понизся річки Дніпро]"
            elif "у Бузькому лимані" in location_spec_raw:
                location_suffix = " [Бузький лиман]"
            elif "у Дніпровському лимані" in location_spec_raw:
                location_suffix = " [Дніпровський лиман]"
            elif "в акваторії понизся річки Дніпро" in location_spec_raw:
                location_suffix = " [акваторія понизся річки Дніпро]"
            elif "в річці Дніпро від греблі Каховської ГЕС вниз за течією впродовж 10 кілометрової забороненої зони" in location_spec_raw:
                location_suffix = " [р. Дніпро від Каховської ГЕС (заборонена зона)]"
            elif location_spec_raw: # Any other specific h3 location mentioned, use it directly
                location_suffix = f" [{location_spec_raw}]"

            # Form the final column name for fishing gear
            if cleaned_gear_name or location_suffix: # Only create if there's actual content
                final_col_name = f"fishing_gear_{cleaned_gear_name}{location_suffix}".strip()
            else: # Fallback if both gear name and location are empty for some reason
                 final_col_name = f"fishing_gear_col_{i}" # Use unique ID for empty

        elif current_h1_group == 'Ідентифікаційні номера бирок':
            final_col_name = 'tag_ids'
        elif current_h1_group == 'Кількість риболовних суден':
            final_col_name = 'vessel_count'
        elif current_h1_group == 'Назва судна/Бортовий номер судна':
            final_col_name = 'vessel_details'
        else: # Fallback for any unmapped columns, ensure uniqueness
            final_col_name = f"unmapped_col_{i}"


        # --- ABSOLUTE UNIQUENESS CHECK AND ENFORCEMENT FOR PANDAS ---
        # This is the crucial part to fix the "Duplicate names are not allowed." error
        original_final_col_name_base = final_col_name
        counter = 1
        while final_col_name in final_pandas_column_names:
            final_col_name = f"{original_final_col_name_base}_{counter}"
            counter += 1
        final_pandas_column_names.append(final_col_name)
    
    # Identify data rows (exclude headers, totals, and other non-data lines)
    data_lines = []
    # Start data processing after the three header rows
    for i in range(header_start_line + 3, len(lines)):
        line = lines[i].strip()
        if not line: # Skip empty lines
            continue
        # Skip lines that are clearly summary/total rows or year info
        if line.startswith("Всього") or line.startswith("Разом") or line.startswith("У 2023 році") or line.startswith("Усього"):
            continue
        # Heuristic to check if a line is a data row: starts with "MIN", "MID", "MAX", "MACRO", "SPEC" or a number followed by lot_id
        # And has enough columns (simplified check)
        parts = line.split('\t')
        # Check for specific lot type or a number in the first column, AND a lot_id pattern in one of the first few columns
        if (len(parts) > 1 and re.match(r'^(MIN|MID|MAX|MACRO|SPEC)$', parts[0].strip()) or re.match(r'^\d+$', parts[0].strip())) and \
           any(re.match(r'^[A-Z]{3,4}\d{1,2}[A-Z]{3,5}\d{4}$', p.strip()) for p in parts[1:4]): # Check lot_id in columns 2-4
            data_lines.append(line)
        
    # Convert to pandas DataFrame
    data_io = io.StringIO("\n".join(data_lines))
    
    # Read with multiple tabs as separator, no header as we'll set names manually
    df = pd.read_csv(data_io, sep=r'\t+', header=None, names=final_pandas_column_names, engine='python', keep_default_na=False)

    # Final data transformation into JSON objects
    final_json_lots = []

    for index, row in df.iterrows():
        lot_id_val = clean_value(row.get('lot_id'))
        
        # Only process rows that look like proper lot entries (have a valid lot_id)
        if lot_id_val and re.match(r'^[A-Z]{3,4}\d{1,2}[A-Z]{3,5}\d{4}$', str(lot_id_val).strip()):
            
            lot_obj = {
                "lot_type": clean_value(row.get('lot_type')),
                "lot_id": lot_id_val,
                "contract": {
                    "winner": clean_value(row.get('contract_переможець')),
                    "publication_date": clean_value(row.get('contract_дата_опублікування_договору_в_електронній_системі'))
                },
                "permit": {
                    "date": clean_value(row.get('permit_дата')),
                    "number": clean_value(row.get('permit_номер'))
                },
                "lot_share_percentage": clean_value(row.get('lot_share_percentage')),
                "total_bioresource_limit": clean_value(row.get('total_bioresource_limit'))
            }

            # Species limits
            species_limits = {}
            for col_name in final_pandas_column_names:
                if col_name.startswith('species_'):
                    original_species_name = col_name.replace('species_', '').replace('_', ' ').strip()
                    species_limits[original_species_name] = clean_value(row.get(col_name))
            lot_obj["species_limits"] = species_limits

            # Fishing gear
            fishing_gear = {}
            for col_name in final_pandas_column_names:
                if col_name.startswith('fishing_gear_'):
                    original_gear_name = col_name.replace('fishing_gear_', '').strip()
                    fishing_gear[original_gear_name] = clean_value(row.get(col_name))
            lot_obj["fishing_gear"] = fishing_gear

            # Tag IDs and potential notes from tag_ids column
            raw_tag_data = row.get('tag_ids')
            parsed_tags, tag_notes = parse_tag_ids(raw_tag_data)
            lot_obj["tag_ids"] = parsed_tags
            if tag_notes:
                lot_obj["notes"] = tag_notes # Add notes if any were extracted

            lot_obj["vessel_count"] = clean_value(row.get('vessel_count'))
            lot_obj["vessel_details"] = clean_value(row.get('vessel_details'))

            final_json_lots.append(lot_obj)
            
    return {
        "title": title,
        "location": location,
        "lots": final_json_lots
    }

# Your provided data for "Дніпровсько-Бузька гирлова система"
dnieper_bug_data = """
Дніпровсько-Бузька гирлова система																																																										
Вид лоту	Кількість лотів	ДОГОВІР			Дозвіл		% від загального ліміту	Загальний обсяг лімітованих і прогнозних видів водного біоресурсу	Види водних біоресурсів, які включені до договору																										Знаряддя лову, які включені до договору																					Ідентифікаційні номера бирок	Кількість риболовних суден	Назва судна/Бортовий номер судна
									Пузанок Alosa tanaica	Оселедець чорноморський Alosa immaculata	Лящ Abramis brama	Судак звичайний Sander lucioperca	Сазан Cyprinus carpio	Щука звичайна Esox lucius	Тараня (плітка звичайна) Rutilus heckelii (Rutilus rutilus)	Плоскирка Blicca bjoerkna	Бички (крім видів, занесених до Червоної книги України)4 Gobiidae	Сом європейський Silurus glanis	Головень європейський Squalius cephalus	Білизна звичайна Aspius aspius	Піленгас Liza haematocheilus	Окунь звичайний Perca fluviatilis	Краснопірка Scardinius, erythrophthalmus	Лин Tinca tinca	Чехоня Pelecus cultratus	Окунь сонячний Lepomis gibbosus	Рибець звичайний Vimba vimba	Карась сріблястий Carassius gibelio	Тюлька звичайна Clupeonella cultriventris	Верховодка звичайна Alburnus alburnus	Рослиноїдні (білий, строкатий товстолоби, їх гібрид, білий амур) Hypophthalmichthys molitrix, Hypophthalmichthys nobilis, Ctenopharyngodon idella	Атерина піщана Atherina boyeri	Хамса (чорноморська) Engraulis encrasicolus ponticus	Рак вузькопалий Astacus leptodactylus	Ятір (крок вічка 30 – 40 мм)		Невід закидний частиковий (крок вічка 30-36-40 мм)		Волок (крок вічка в матні – 30 мм, приводах – 36 мм, крилах – 40 мм)	Сітка (крок вічка 22 – 24 мм)	Сітка (крок вічка 38-40 мм)	Сітка (крок вічка  50 мм)	Сітка (крок  вічка 75 мм і більше)	Сітка плавна (крок вічка 30 мм –32 мм)	Сітка ставна (крок вічка 28 мм -30 мм)	Сітка плавна (крок вічка 22 мм - 24 мм)	Сітка плавна (крок вічка 90 мм-120 мм)	Бурило (крок вічка в матні 5 мм (але не більше 7 мм), у приводах 6 мм (але не більше 14 мм), у крилах 6 мм (але не більше 18 мм))	Конусна пастка (площа вхідного отвору до 10 кв.м., крок вічка сіткового полотна 4 мм – 6,5 мм)			Закидний невід (волок) (крок вічка в матні 18 мм, приводах 22 мм., крилах – 26 мм)	Ятір (крок вічка 16 мм)	Раколовка  (крок вічка 16 мм)	Волок (крок вічка 5 мм - 6,5 мм) (в річці Дніпро від греблі Каховської ГЕС вниз за течією впродовж 10 кілометрової забороненої зони )			
		Номер договору	Переможець	Дата опублікування договору в електронній системі																																																						
					Дата	Номер																													Для використання у Дніпровсько-Бузькому лимані	Для використання у придатковій системі пониззя річки Дніпро 	Для використання у Дніпровсько-Бузькому лимані	Для використання у р. Інгулець, Дніпро, Південний Буг											у Бузькому лимані 	у Дніпровському лимані 	в акваторії понизся річки Дніпро 							
MIN	1	DBL1MIN2024					0,57	29,999	0,395	0,143	1,226	0,183	0,149	0,057	0,791	0,201	0,011	0,057	0,003	0,003	0,011	0,155	0,132	0,003	0,003	0,002	0,006	7,243	15,937	0,315	2,418	0,430	0,115	0,010	5	5	0	0	0	8	5	10	15	0	0	0	0	1	0	0	0	0	0	0	0		3	
	1	DBL2MIN2024					0,57	29,999	0,395	0,143	1,226	0,183	0,149	0,057	0,791	0,201	0,011	0,057	0,003	0,003	0,011	0,155	0,132	0,003	0,003	0,002	0,006	7,243	15,937	0,315	2,418	0,430	0,115	0,010	5	5	0	0	0	8	5	10	15	0	0	0	0	1	0	0	0	0	0	0	0		3	
	1	DBL3MIN2024					0,57	29,999	0,395	0,143	1,226	0,183	0,149	0,057	0,791	0,201	0,011	0,057	0,003	0,003	0,011	0,155	0,132	0,003	0,003	0,002	0,006	7,243	15,937	0,315	2,418	0,430	0,115	0,010	5	5	0	0	0	8	5	10	15	0	0	0	0	1	0	0	0	0	0	0	0		3	
	1	DBL4MIN2024					0,57	29,999	0,395	0,143	1,226	0,183	0,149	0,057	0,791	0,201	0,011	0,057	0,003	0,003	0,011	0,155	0,132	0,003	0,003	0,002	0,006	7,243	15,937	0,315	2,418	0,430	0,115	0,010	5	5	0	0	0	8	5	10	15	0	0	0	0	1	0	0	0	0	0	0	0		3	
	1	DBL5MIN2024					0,57	29,999	0,395	0,143	1,226	0,183	0,149	0,057	0,791	0,201	0,011	0,057	0,003	0,003	0,011	0,155	0,132	0,003	0,003	0,002	0,006	7,243	15,937	0,315	2,418	0,430	0,115	0,010	5	5	0	0	0	8	5	10	15	0	0	0	0	1	0	0	0	0	0	0	0		3	
	1	DBL6MIN2024					0,57	29,999	0,395	0,143	1,226	0,183	0,149	0,057	0,791	0,201	0,011	0,057	0,003	0,003	0,011	0,155	0,132	0,003	0,003	0,002	0,006	7,243	15,937	0,315	2,418	0,430	0,115	0,010	5	5	0	0	0	8	5	10	15	0	0	0	0	1	0	0	0	0	0	0	0		3	
	1	DBL7MIN2024					0,57	29,999	0,395	0,143	1,226	0,183	0,149	0,057	0,791	0,201	0,011	0,057	0,003	0,003	0,011	0,155	0,132	0,003	0,003	0,002	0,006	7,243	15,937	0,315	2,418	0,430	0,115	0,010	4	5	0	0	0	8	5	10	15	0	0	0	0	1	0	0	0	0	0	0	0		3	
	1	DBL8MIN2024					0,57	29,999	0,395	0,143	1,226	0,183	0,149	0,057	0,791	0,201	0,011	0,057	0,003	0,003	0,011	0,155	0,132	0,003	0,003	0,002	0,006	7,243	15,937	0,315	2,418	0,430	0,115	0,010	4	5	0	0	0	8	5	10	15	0	0	0	0	1	0	0	0	0	0	0	0		3	
	1	DBL9MIN2024					0,57	29,999	0,395	0,143	1,226	0,183	0,149	0,057	0,791	0,201	0,011	0,057	0,003	0,003	0,011	0,155	0,132	0,003	0,003	0,002	0,006	7,243	15,937	0,315	2,418	0,430	0,115	0,010	4	5	0	0	0	8	5	10	15	0	0	0	0	1	0	0	0	0	0	0	0		3	
	1	DBL10MIN2024					0,57	29,999	0,395	0,143	1,226	0,183	0,149	0,057	0,791	0,201	0,011	0,057	0,003	0,003	0,011	0,155	0,132	0,003	0,003	0,002	0,006	7,243	15,937	0,315	2,418	0,430	0,115	0,010	4	5	0	0	0	8	5	10	15	0	0	0	0	1	0	0	0	0	0	0	0		3	
	1	DBL11MIN2024					0,57	29,999	0,395	0,143	1,226	0,183	0,149	0,057	0,791	0,201	0,011	0,057	0,003	0,003	0,011	0,155	0,132	0,003	0,003	0,002	0,006	7,243	15,937	0,315	2,418	0,430	0,115	0,010	3	5	0	0	0	8	5	10	15	1	0	1	0	0	0	0	0	0	0	0	0		3	
	1	DBL12MIN2024					0,57	29,999	0,395	0,143	1,226	0,183	0,149	0,057	0,791	0,201	0,011	0,057	0,003	0,003	0,011	0,155	0,132	0,003	0,003	0,002	0,006	7,243	15,937	0,315	2,418	0,430	0,115	0,010	3	5	0	0	0	8	5	10	15	1	0	1	0	0	0	0	0	0	0	0	0		3	
	1	DBL13MIN2024					0,57	29,999	0,395	0,143	1,226	0,183	0,149	0,057	0,791	0,201	0,011	0,057	0,003	0,003	0,011	0,155	0,132	0,003	0,003	0,002	0,006	7,243	15,937	0,315	2,418	0,430	0,115	0,010	3	5	0	0	0	8	5	10	15	1	0	1	0	0	0	0	0	0	0	0	0		3	
	1	DBL14MIN2024					0,57	29,999	0,395	0,143	1,226	0,183	0,149	0,057	0,791	0,201	0,011	0,057	0,003	0,003	0,011	0,155	0,132	0,003	0,003	0,002	0,006	7,243	15,937	0,315	2,418	0,430	0,115	0,010	3	5	0	0	0	8	5	10	15	1	0	1	0	0	0	0	0	0	0	0	0		3	
	1	DBL15MIN2024					0,57	29,999	0,395	0,143	1,226	0,183	0,149	0,057	0,791	0,201	0,011	0,057	0,003	0,003	0,011	0,155	0,132	0,003	0,003	0,002	0,006	7,243	15,937	0,315	2,418	0,430	0,115	0,010	3	5	0	0	0	8	5	10	15	1	0	1	0	0	0	0	0	0	0	0	0		3	
	1	DBL16MIN2024					0,57	29,999	0,395	0,143	1,226	0,183	0,149	0,057	0,791	0,201	0,011	0,057	0,003	0,003	0,011	0,155	0,132	0,003	0,003	0,002	0,006	7,243	15,937	0,315	2,418	0,430	0,115	0,010	3	5	0	0	0	8	5	10	15	1	0	1	0	0	0	0	0	0	0	0	0		3	
	1	DBL17MIN2024					0,57	29,999	0,395	0,143	1,226	0,183	0,149	0,057	0,791	0,201	0,011	0,057	0,003	0,003	0,011	0,155	0,132	0,003	0,003	0,002	0,006	7,243	15,937	0,315	2,418	0,430	0,115	0,010	3	5	0	0	0	8	5	10	15	1	0	1	0	0	0	0	0	0	0	0	0		3	
	1	DBL18MIN2024					0,57	29,999	0,395	0,143	1,226	0,183	0,149	0,057	0,791	0,201	0,011	0,057	0,003	0,003	0,011	0,155	0,132	0,003	0,003	0,002	0,006	7,243	15,937	0,315	2,418	0,430	0,115	0,010	3	5	0	0	0	8	5	10	15	0	0	0	0	0	0	0	0	0	0	0	0		3	
	1	DBL19MIN2024					0,57	29,999	0,395	0,143	1,226	0,183	0,149	0,057	0,791	0,201	0,011	0,057	0,003	0,003	0,011	0,155	0,132	0,003	0,003	0,002	0,006	7,243	15,937	0,315	2,418	0,430	0,115	0,010	3	5	0	0	0	8	5	10	15	0	0	0	0	0	0	0	0	0	0	0	0		3	
	1	DBL20MIN2024					0,57	29,999	0,395	0,143	1,226	0,183	0,149	0,057	0,791	0,201	0,011	0,057	0,003	0,003	0,011	0,155	0,132	0,003	0,003	0,002	0,006	7,243	15,937	0,315	2,418	0,430	0,115	0,010	3	5	0	0	0	8	5	10	15	0	0	0	0	0	0	0	0	0	0	0	0		3	
Всього	20						11,46	599,980	7,900	2,860	24,520	3,660	2,980	1,140	15,820	4,020	0,220	1,140	0,060	0,060	0,220	3,100	2,640	0,060	0,060	0,040	0,120	144,860	318,740	6,300	48,360	8,600	2,300	0,200	76	100	0	0	0	160	100	200	300	7	0	7	0	10	0	0	0	0	0	0	0		60	
MID	1	DBL1MID2024	ФОП АЛЄКСЄЄВ СЕРГІЙ ГРИГОРОВИЧ	31.01.2024	10/8/2024	DBL1MID2024-2	1,15	60,002	0,791	0,287	2,453	0,367	0,298	0,115	1,582	0,401	0,023	0,115	0,006	0,006	0,023	0,309	0,264	0,007	0,006	0,003	0,011	14,487	31,873	0,630	4,837	0,860	0,229	0,019	7	8	0	0	0	20	10	22	32	0	0	0	0	2	2	0	0	0	3	4	0		4	ЯМК 0323
	1	DBL2MID2024	ТОВАРИСТВО З ОБМЕЖЕНОЮ ВІДПОВІДАЛЬНІСТЮ "АФОЛІНА", ЄДРПОУ: 31772172	02.02.2024	2/20/2024	ДД-17/3	1,15	60,002	0,791	0,287	2,453	0,367	0,298	0,115	1,582	0,401	0,023	0,115	0,006	0,006	0,023	0,309	0,264	0,007	0,006	0,003	0,011	14,487	31,873	0,630	4,837	0,860	0,229	0,019	7	8	0	0	0	20	10	22	32	0	0	0	0	2	2	0	0	0	0	4	0		4	ЯМК 0291
	1	DBL3MID2024	ФОП ТАРАН ІВАН ВОЛОДИМИРОВИЧ	31.01.2024	10/7/2024	DBL3MID2024-2	1,15	60,002	0,791	0,287	2,453	0,367	0,298	0,115	1,582	0,401	0,023	0,115	0,006	0,006	0,023	0,309	0,264	0,007	0,006	0,003	0,011	14,487	31,873	0,630	4,837	0,860	0,229	0,019	7	8	0	0	0	20	10	22	32	0	0	0	0	2	2	0	0	0	3	4	0		4	ЯМК 0111
	1	DBL4MID2024	ПРИВАТНЕ ПІДПРИЄМСТВО ІМ. ЛЕЙТЕНАНТА ШМІДТА, ЄДРПОУ: 00466879	31.01.2024	9/11/2024	DBL4MID2024-2	1,15	60,002	0,791	0,287	2,453	0,367	0,298	0,115	1,582	0,401	0,023	0,115	0,006	0,006	0,023	0,309	0,264	0,007	0,006	0,003	0,011	14,487	31,873	0,630	4,837	0,860	0,229	0,019	7	8	0	0	0	20	10	22	32	0	0	0	0	2	2	0	0	0	0	4	0		4	"ЯЗП 0410М
ЯМК 0315
ЯМК 0256
ЯМК 0058"
	1	DBL5MID2024	ПРИВАТНЕ ПІДПРИЄМСТВО "РИБОЛОВНЕ ПІДПРИЄМСТВО ВИРІШАЛЬНИЙ", ЄДРПОУ: 32143995		4/23/2024	ДД-42/3	1,15	60,002	0,791	0,287	2,453	0,367	0,298	0,115	1,582	0,401	0,023	0,115	0,006	0,006	0,023	0,309	0,264	0,007	0,006	0,003	0,011	14,487	31,873	0,630	4,837	0,860	0,229	0,019	7	8	0	0	0	20	10	22	32	0	0	0	0	2	2	0	0	0	2	4	0		4	"ЯМК 0163
ЯМК 4904
ЯМК 0165
ЯМК 0285"
	1	DBL6MID2024					1,15	60,002	0,791	0,287	2,453	0,367	0,298	0,115	1,582	0,401	0,023	0,115	0,006	0,006	0,023	0,309	0,264	0,007	0,006	0,003	0,011	14,487	31,873	0,630	4,837	0,860	0,229	0,019	7	8	0	0	0	20	10	22	31	0	0	0	0	2	1	0	0	0	2	4	0		4	"ЯМК 0125
ЯДО 0700"
	1	DBL7MID2024	ФОП ШЕПЕЛЬ СЕРГІЙ ДМИТРОВИЧ	05.02.2024	4/2/2024	ДД-35/3	1,15	60,002	0,791	0,287	2,453	0,367	0,298	0,115	1,582	0,401	0,023	0,115	0,006	0,006	0,023	0,309	0,264	0,007	0,006	0,003	0,011	14,487	31,873	0,630	4,837	0,860	0,229	0,019	7	8	0	0	0	20	10	22	31	0	0	0	0	2	1	0	0	0	0	4	0		4	ЯМК 0223
	1	DBL8MID2024	ФЕРМЕРСЬКЕ ГОСПОДАРСТВО "ГРИН ПАРК" ВІДОКРЕМЛЕНА САДИБА, ЄДРПОУ: 39439949	19.02.2024	4/2/2024	ДД-32/3	1,15	60,002	0,791	0,287	2,453	0,367	0,298	0,115	1,582	0,401	0,023	0,115	0,006	0,006	0,023	0,309	0,264	0,007	0,006	0,003	0,011	14,487	31,873	0,630	4,837	0,860	0,229	0,019	7	8	0	0	0	20	10	22	31	0	0	0	0	2	0	1	0	0	0	4	0		4	
	1	DBL9MID2024					1,15	60,002	0,791	0,287	2,453	0,367	0,298	0,115	1,582	0,401	0,023	0,115	0,006	0,006	0,023	0,309	0,264	0,007	0,006	0,003	0,011	14,487	31,873	0,630	4,837	0,860	0,229	0,019	7	8	0	0	0	20	10	22	31	0	0	0	0	2	0	0	0	0	0	4	0		4	
	1	DBL10MID2024					1,15	60,002	0,791	0,287	2,453	0,367	0,298	0,115	1,582	0,401	0,023	0,115	0,006	0,006	0,023	0,309	0,264	0,007	0,006	0,003	0,011	14,487	31,873	0,630	4,837	0,860	0,229	0,019	6	8	0	0	0	20	10	22	31	0	0	0	0	2	0	1	0	0	0	4	0		4	
	1	DBL11MID2024					1,15	60,002	0,791	0,287	2,453	0,367	0,298	0,115	1,582	0,401	0,023	0,115	0,006	0,006	0,023	0,309	0,264	0,007	0,006	0,003	0,011	14,487	31,873	0,630	4,837	0,860	0,229	0,019	6	8	0	0	0	20	10	22	31	0	0	0	0	0	0	0	0	0	0	4	0		4	
	1	DBL12MID2024					1,15	60,002	0,791	0,287	2,453	0,367	0,298	0,115	1,582	0,401	0,023	0,115	0,006	0,006	0,023	0,309	0,264	0,007	0,006	0,003	0,011	14,487	31,873	0,630	4,837	0,860	0,229	0,019	6	8	0	0	0	20	10	22	31	0	0	0	0	0	0	0	0	0	0	4	0		4	
	1	DBL13MID2024					1,15	60,002	0,791	0,287	2,453	0,367	0,298	0,115	1,582	0,401	0,023	0,115	0,006	0,006	0,023	0,309	0,264	0,007	0,006	0,003	0,011	14,487	31,873	0,630	4,837	0,860	0,229	0,019	6	8	0	0	0	20	10	22	31	2	0	1	2	0	0	1	0	0	0	4	0		4	
	1	DBL14MID2024					1,15	60,002	0,791	0,287	2,453	0,367	0,298	0,115	1,582	0,401	0,023	0,115	0,006	0,006	0,023	0,309	0,264	0,007	0,006	0,003	0,011	14,487	31,873	0,630	4,837	0,860	0,229	0,019	6	8	0	0	0	20	10	22	31	2	0	1	2	0	0	0	0	0	0	4	0		4	
	1	DBL15MID2024					1,15	60,002	0,791	0,287	2,453	0,367	0,298	0,115	1,582	0,401	0,023	0,115	0,006	0,006	0,023	0,309	0,264	0,007	0,006	0,003	0,011	14,487	31,873	0,630	4,837	0,860	0,229	0,019	6	8	0	0	0	20	10	22	31	2	0	0	2	0	0	0	0	0	0	4	0		4	
	1	DBL16MID2024					1,15	60,002	0,791	0,287	2,453	0,367	0,298	0,115	1,582	0,401	0,023	0,115	0,006	0,006	0,023	0,309	0,264	0,007	0,006	0,003	0,011	14,487	31,873	0,630	4,837	0,860	0,229	0,019	6	8	0	0	0	20	10	22	31	0	0	0	2	0	0	1	0	0	0	4	0		4	
	1	DBL17MID2024					1,15	60,002	0,791	0,287	2,453	0,367	0,298	0,115	1,582	0,401	0,023	0,115	0,006	0,006	0,023	0,309	0,264	0,007	0,006	0,003	0,011	14,487	31,873	0,630	4,837	0,860	0,229	0,019	6	8	0	0	0	20	10	22	31	0	0	0	2	0	0	0	0	0	0	4	0		4	
	1	DBL18MID2024					1,15	60,002	0,791	0,287	2,453	0,367	0,298	0,115	1,582	0,401	0,023	0,115	0,006	0,006	0,023	0,309	0,264	0,007	0,006	0,003	0,011	14,487	31,873	0,630	4,837	0,860	0,229	0,019	6	8	0	0	0	20	10	22	31	2	0	1	2	0	0	1	0	0	0	4	0		4	
	1	DBL19MID2024					1,15	60,002	0,791	0,287	2,453	0,367	0,298	0,115	1,582	0,401	0,023	0,115	0,006	0,006	0,023	0,309	0,264	0,007	0,006	0,003	0,011	14,487	31,873	0,630	4,837	0,860	0,229	0,019	6	8	0	0	0	20	10	22	31	0	0	0	2	0	0	0	0	0	0	4	0		4	
	1	DBL20MID2024					1,15	60,002	0,791	0,287	2,453	0,367	0,298	0,115	1,582	0,401	0,023	0,115	0,006	0,006	0,023	0,309	0,264	0,007	0,006	0,003	0,011	14,487	31,873	0,630	4,837	0,860	0,229	0,019	6	8	0		0	20	10	22	31	0	0	0	1	0	0	0	0	0	0	4	0		4	
Всього	20						22,92	1200,040	15,820	5,740	49,060	7,340	5,960	2,300	31,640	8,020	0,460	2,300	0,120	0,120	0,460	6,180	5,280	0,140	0,120	0,060	0,220	289,740	637,460	12,600	96,740	17,200	4,580	0,380	129	160	0	0	0	400	200	440	625	8	0	3	15	20	12	5	0	0	10	80	0		80	
MAX	1	DBL1MAX2024	ТОВАРИСТВО З ОБМЕЖЕНОЮ ВІДПОВІДАЛЬНІСТЮ "МЕРЛАНГ", ЄДРПОУ: 45119364	31.01.2024	09.12.2024	DBL1MAX2024-3	1,91	100,002	1,318	0,478	4,088	0,611	0,497	0,191	2,636	0,669	0,038	0,191	0,010	0,010	0,038	0,516	0,439	0,011	0,010	0,006	0,019	24,145	53,122	1,051	8,061	1,433	0,382	0,032	8	10	0	0	0	30	18	30	45	0	0	0	0	2	3	0	0	0	0	6	0		5	"ЯВН 0208
ЯВН 0209
ЯЗП 0891
ЯМК 0292
ЯМК 0260"
	1	DBL2MAX2024	ПРИВАТНЕ ПІДПРИЄМСТВО "РИБОЛОВНЕ ПІДПРИЄМСТВО ВИРІШАЛЬНИЙ", ЄДРПОУ: 32143995	31.01.2024	4/23/2024	ДД-43/3	1,91	100,002	1,318	0,478	4,088	0,611	0,497	0,191	2,636	0,669	0,038	0,191	0,010	0,010	0,038	0,516	0,439	0,011	0,010	0,006	0,019	24,145	53,122	1,051	8,061	1,433	0,382	0,032	8	10	0	1	0	30	18	30	45	0	0	0	0	2	3	0	0	0	0	6	0		7	"ЯЗП 1113
ЯМК 0284
ЯМК 0329 
ЯДО 0057 
ЯДО 0474
ЯМК 0158"
	1	DBL3MAX2024	Фізична особа-підприємець Нестерук Олександр Володимирович	29.01.2024	3/14/2024	ДД-24/3	1,91	100,002	1,318	0,478	4,088	0,611	0,497	0,191	2,636	0,669	0,038	0,191	0,010	0,010	0,038	0,516	0,439	0,011	0,010	0,006	0,019	24,145	53,122	1,051	8,061	1,433	0,382	0,032	8	10	0	1	0	25	18	30	45	0	0	0	0	2	3	0	0	0	6	6	0		7	"ЯМК 4896
ЯМК 0266
ЯМК 0288
ЯХР 0113
ЯХР 0098
ЯДО 0534
ЯДО 0537"
	1	DBL4MAX2024	ТОВАРИСТВО З ОБМЕЖЕНОЮ ВІДПОВІДАЛЬНІСТЮ "МЕРЛАНГ", ЄДРПОУ: 45119364	29.01.2024	09.12.2024	DBL4MAX2024-3	1,91	100,002	1,318	0,478	4,088	0,611	0,497	0,191	2,636	0,669	0,038	0,191	0,010	0,010	0,038	0,516	0,439	0,011	0,010	0,006	0,019	24,145	53,122	1,051	8,061	1,433	0,382	0,032	8	10	0	0	0	25	18	30	45	0	8	0	0	2	3	0	0	0	6	6	0		5	"ЯМК 0221
ЯМК 0237
ЯМК 0320
ЯЗП 1107
ЯДО 0603"
	1	DBL5MAX2024	ПРИВАТНЕ ПІДПРИЄМСТВО "РИБОЛОВНЕ ПІДПРИЄМСТВО ВИРІШАЛЬНИЙ", ЄДРПОУ: 32143995	31.01.2024	31.10.2024	DBL5MAX2024-3	1,91	100,002	1,318	0,478	4,088	0,611	0,497	0,191	2,636	0,669	0,038	0,191	0,010	0,010	0,038	0,516	0,439	0,011	0,010	0,006	0,019	24,145	53,122	1,051	8,061	1,433	0,382	0,032	8	10	0	0	0	25	18	30	45	0	7	0	0	2	3	0	0	1	6	6	0		7	"ЯДО 0643
ЯМК 0281
ЯМК 0049
ЯДО 2279
ЯЗП 1091
ЯМК 0327
ЯОД 0858"
	1	DBL6MAX2024	Приватне Підприємство "Громовий О.М.", ЄДРПОУ: 32895467	31.01.2024	2/16/2024	ДД-14/3	1,91	100,002	1,318	0,478	4,088	0,611	0,497	0,191	2,636	0,669	0,038	0,191	0,010	0,010	0,038	0,516	0,439	0,011	0,010	0,006	0,019	24,145	53,122	1,051	8,061	1,433	0,382	0,032	8	10	0	0	0	25	18	30	45	0	0	0	0	2	3	0	0	0	6	6	0		5	"ЯМК 0037
ЯМК 0010"
	1	DBL7MAX2024	Фізична особа-підприємець Дикасов Антон Олександрович	31.01.2024	04.11.2024	DBL7MAX2024-3	1,91	100,002	1,318	0,478	4,088	0,611	0,497	0,191	2,636	0,669	0,038	0,191	0,010	0,010	0,038	0,516	0,439	0,011	0,010	0,006	0,019	24,145	53,122	1,051	8,061	1,433	0,382	0,032	8	10	0	0	0	25	18	30	45	0	8	0	0	2	0	0	0	0	0	6	0		5	"ЯМК 0125
ЯДО 0700"
	1	DBL8MAX2024	Фізична особа-підприємець Кривенко Ігор Олександрович	31.01.2024	6/6/2024	ДД-51/3	1,91	100,002	1,318	0,478	4,088	0,611	0,497	0,191	2,636	0,669	0,038	0,191	0,010	0,010	0,038	0,516	0,439	0,011	0,010	0,006	0,019	24,145	53,122	1,051	8,061	1,433	0,382	0,032	8	10	0	0	0	25	18	30	45	0	0	0	0	2	0	0	0	1	6	6	0		7	"ЯЗП 1104
ЯМК 0316
ЯМК 0308
UAFK 0010"
	1	DBL9MAX2024					1,91	100,002	1,318	0,478	4,088	0,611	0,497	0,191	2,636	0,669	0,038	0,191	0,010	0,010	0,038	0,516	0,439	0,011	0,010	0,006	0,019	24,145	53,122	1,051	8,061	1,433	0,382	0,032	8	10	0	0	0	25	18	30	45	0	0	0	0	2	0	0	0	0	0	6	0		5	
	1	DBL10MAX2024	Фізична особа-підприємець Дикасов Антон Олександрович	31.01.2024	11.12.2024	DBL10MAX2024-2	1,91	100,002	1,318	0,478	4,088	0,611	0,497	0,191	2,636	0,669	0,038	0,191	0,010	0,010	0,038	0,516	0,439	0,011	0,010	0,006	0,019	24,145	53,122	1,051	8,061	1,433	0,382	0,032	8	10	0	0	0	25	18	30	45	0	8	0	0	2	0	0	0	0	0	6	0		5	ЯМК 0128
	1	DBL11MAX2024					1,91	100,002	1,318	0,478	4,088	0,611	0,497	0,191	2,636	0,669	0,038	0,191	0,010	0,010	0,038	0,516	0,439	0,011	0,010	0,006	0,019	24,145	53,122	1,051	8,061	1,433	0,382	0,032	5	10	0	0	0	25	18	30	45	0	7	0	0	0	0	0	0	0	0	6	0		5	
	1	DBL12MAX2024					1,91	100,002	1,318	0,478	4,088	0,611	0,497	0,191	2,636	0,669	0,038	0,191	0,010	0,010	0,038	0,516	0,439	0,011	0,010	0,006	0,019	24,145	53,122	1,051	8,061	1,433	0,382	0,032	5	10	0	0	0	25	18	30	45	0	0	0	0	0	0	1	0	0	0	6	0		5	
	1	DBL13MAX2024					1,91	100,002	1,318	0,478	4,088	0,611	0,497	0,191	2,636	0,669	0,038	0,191	0,010	0,010	0,038	0,516	0,439	0,011	0,010	0,006	0,019	24,145	53,122	1,051	8,061	1,433	0,382	0,032	5	10	0	0	0	25	18	30	45	0	0	0	0	0	0	1	0	0	0	6	0		7	
	1	DBL14MAX2024					1,91	100,002	1,318	0,478	4,088	0,611	0,497	0,191	2,636	0,669	0,038	0,191	0,010	0,010	0,038	0,516	0,439	0,011	0,010	0,006	0,019	24,145	53,122	1,051	8,061	1,433	0,382	0,032	5	10	0	1	0	25	18	30	45	0	0	0	0	0	0	0	0	0	0	6	0		7	
	1	DBL15MAX2024					1,91	100,002	1,318	0,478	4,088	0,611	0,497	0,191	2,636	0,669	0,038	0,191	0,010	0,010	0,038	0,516	0,439	0,011	0,010	0,006	0,019	24,145	53,122	1,051	8,061	1,433	0,382	0,032	5	10	0	1	1	25	18	30	45	0	8	0	0	0	0	1	0	0	0	6	0		7	
	1	DBL16MAX2024					1,91	100,002	1,318	0,478	4,088	0,611	0,497	0,191	2,636	0,669	0,038	0,191	0,010	0,010	0,038	0,516	0,439	0,011	0,010	0,006	0,019	24,145	53,122	1,051	8,061	1,433	0,382	0,032	5	10	0	1	0	25	18	30	45	0	0	0	0	0	0	0	0	0	0	6	0		7	
	1	DBL17MAX2024					1,91	100,002	1,318	0,478	4,088	0,611	0,497	0,191	2,636	0,669	0,038	0,191	0,010	0,010	0,038	0,516	0,439	0,011	0,010	0,006	0,019	24,145	53,122	1,051	8,061	1,433	0,382	0,032	5	10	0	1	0	25	18	30	45	0	0	0	0	0	0	1	0	0	0	6	0		7	
	1	DBL18MAX2024					1,91	100,002	1,318	0,478	4,088	0,611	0,497	0,191	2,636	0,669	0,038	0,191	0,010	0,010	0,038	0,516	0,439	0,011	0,010	0,006	0,019	24,145	53,122	1,051	8,061	1,433	0,382	0,032	5	10	1	0	1	25	18	30	45	0	0	0	0	0	0	0	1	0	0	6	0		7	
	1	DBL19MAX2024					1,91	100,002	1,318	0,478	4,088	0,611	0,497	0,191	2,636	0,669	0,038	0,191	0,010	0,010	0,038	0,516	0,439	0,011	0,010	0,006	0,019	24,145	53,122	1,051	8,061	1,433	0,382	0,032	5	10	1	0	1	25	18	30	45	0	0	0	0	0	0	0	1	0	0	6	0		7	
	1	DBL20MAX2024					1,91	100,002	1,318	0,478	4,088	0,611	0,497	0,191	2,636	0,669	0,038	0,191	0,010	0,010	0,038	0,516	0,439	0,011	0,010	0,006	0,019	24,145	53,122	1,051	8,061	1,433	0,382	0,032	5	10	1	0	1	25	18	30	45	0	0	0	0	0	0	1	0	0	0	6	0		7	
Всього	20						38,20	2000,040	26,360	9,560	81,760	12,220	9,940	3,820	52,720	13,380	0,760	3,820	0,200	0,200	0,760	10,320	8,780	0,220	0,200	0,120	0,380	482,900	1062,440	21,020	161,220	28,660	7,640	0,640	130	200	3	6	4	510	360	600	900	0	46	0	0	20	18	5	2	2	30	120	0		124	
MACRO	1	DBL1MACRO2024					5,48	287,018	3,783	1,371	11,733	1,754	1,425	0,548	7,566	1,919	0,110	0,548	0,027	0,027	0,110	1,480	1,261	0,033	0,027	0,016	0,055	69,300	152,471	3,015	23,137	4,112	1,097	0,093	9	6	1	0	0	46	20	40	55	0	10	0	0	4	0	0	0	0	10	20	0		8	
	1	DBL2MACRO2024	Фізична особа-підприємець Дикасов Антон Олександрович	20.03.2024	11.12.2024	DBL2MACRO2024-3	5,48	287,018	3,783	1,371	11,733	1,754	1,425	0,548	7,566	1,919	0,110	0,548	0,027	0,027	0,110	1,480	1,261	0,033	0,027	0,016	0,055	69,300	152,471	3,015	23,137	4,112	1,097	0,093	9	6	0	0	0	46	20	40	55	0	12	0	0	4	0	0	0	0	10	20	0		8	ЯЗП 1075
	1	DBL3MACRO2024					5,48	287,018	3,783	1,371	11,733	1,754	1,425	0,548	7,566	1,919	0,110	0,548	0,027	0,027	0,110	1,480	1,261	0,033	0,027	0,016	0,055	69,300	152,471	3,015	23,137	4,112	1,097	0,093	9	6	0	1	0	46	20	40	55	0	10	0	0	4	0	2	0	0	10	20	0		8	
	1	DBL4MACRO2024	Фізична особа-підприємець Кривенко Ігор Олександрович	31.01.2024	6/6/2024	ДД-52/3	5,48	287,018	3,783	1,371	11,733	1,754	1,425	0,548	7,566	1,919	0,110	0,548	0,027	0,027	0,110	1,480	1,261	0,033	0,027	0,016	0,055	69,300	152,471	3,015	23,137	4,112	1,097	0,093	9	6	1	1	1	46	20	40	55	0	12	0	0	3	0	0	1	0	10	20	1	8	"ЯМК 0192
ЯМК 0146
ЯМК 0050
ЯМК 0325
ЯДО 0724
ЯДО 0725
ЯДО 0726"
	1	DBL5MACRO2024	ФОП ТАРАН ІВАН ВОЛОДИМИРОВИЧ	20.03.2024	21.10.2024	DBL5MACRO2024-2	5,48	286,968	3,788	1,356	11,728	1,764	1,420	0,548	7,556	1,904	0,120	0,548	0,012	0,012	0,120	1,480	1,256	0,048	0,012	0,016	0,060	69,300	152,476	3,020	23,132	4,092	1,092	0,108	9	6	1	1	1	46	20	40	55	0	10	0	0	3	0	0	1	0	10	20	0		8	ЯМК 0295
"""

# Читаємо дані з файлу (якщо ви вже зберегли їх у input_table.txt)
# Якщо ви запускаєте скрипт як є, він обробить вбудовані дані `dnieper_bug_data`
try:
    # Закоментуйте наступні 4 рядки, якщо ви використовуєте вбудовані дані `dnieper_bug_data`
    # з мого прикладу, а не окремий файл input_table.txt
    # with open('input_table.txt', 'r', encoding='utf-8') as f:
    #     raw_table_data = f.read()
    raw_table_data = dnieper_bug_data # Використовуємо вбудовані дані для тестування

except FileNotFoundError:
    print("Помилка: Файл 'input_table.txt' не знайдено. Переконайтеся, що він у тій самій папці, що й скрипт.")
    exit()
except Exception as e:
    print(f"Помилка при читанні файлу: {e}")
    exit()

json_output = process_table_data(raw_table_data)
print(json.dumps(json_output, indent=2, ensure_ascii=False))
