import fs from 'fs';
import path from 'path';

const inputPath = path.resolve(process.cwd(), 'src/data/fish_ports.json');
const outputPath = path.resolve(process.cwd(), 'src/data/fish-ports-data.json');

try {
  // 1. Read the raw data from src/data/fish_ports.json
  const rawData = fs.readFileSync(inputPath, 'utf8');
  const fishPorts = JSON.parse(rawData);

  // 2. Group the data by region
  const groupedByRegion = Object.values(fishPorts).flat().reduce((acc, port) => {
    const address = port['Адреса місця базування'];
    if (address) {
      // The region is the first part of the 'Адреса місця базування' field
      const region = address.split(',')[0].trim();
      if (!acc[region]) {
        acc[region] = [];
      }
      acc[region].push(port);
    }
    return acc;
  }, {});

  // 3. Write the processed data to public/fish-ports-data.json
  fs.writeFileSync(outputPath, JSON.stringify(groupedByRegion, null, 2), 'utf8');

  console.log(`Successfully processed data and saved to ${outputPath}`);

} catch (error) {
  console.error('Error processing data:', error);
  process.exit(1);
}