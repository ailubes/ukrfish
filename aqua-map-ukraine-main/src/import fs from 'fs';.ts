import fs from 'fs';
import path from 'path';

// Define interfaces for better type safety
interface WaterBodyLocation {
    rawString: string | null;
    fullAddress: string | null;
    street: string | null;
    settlement: string | null;
    region: string | null;
    postalCode: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    geoDataSource: string | null;
}

interface WaterBody {
    id: string;
    lesseeName: string;
    waterBodyName: string;
    location: WaterBodyLocation;
    purpose: string;
    fishSpecies: string[] | null;
    leaseExpiry: string | null;
}

interface FishPort {
    '№': number;
    'Номер місця базування': string;
    'Адреса місця базування': string;
    'Google Maps Coordinates': string;
    'Власник місця базування': string;
    latitude?: number;
    longitude?: number;
}

const vodniObiektyPath = path.resolve(__dirname, '../src/data/vodni_obiekty_1748944527.json');
const fishPortsPath = path.resolve(__dirname, '../src/data/fish_ports.json');

function cleanVodniObiekty() {
    console.log(`Processing ${path.basename(vodniObiektyPath)}...`);
    const rawData = fs.readFileSync(vodniObiektyPath, 'utf-8');
    const waterBodies: WaterBody[] = JSON.parse(rawData);

    let updatedCount = 0;
    const coordRegex = /\b(\d{2}\.\d+)[, ]\s*(\d{2}\.\d+)/;

    const updatedWaterBodies = waterBodies.map(body => {
        const location = body.location;
        const isLatInvalid = location.latitude === null || location.latitude < 44 || location.latitude > 53;
        const isLonInvalid = location.longitude === null || location.longitude < 22 || location.longitude > 41;

        if ((isLatInvalid || isLonInvalid) && location.rawString) {
            const match = location.rawString.match(coordRegex);

            if (match && match[1] && match[2]) {
                const newBody = JSON.parse(JSON.stringify(body)); // Deep copy
                const lat = parseFloat(match[1]);
                const lon = parseFloat(match[2]);

                if (lat > 44 && lat < 53 && lon > 22 && lon < 41) {
                    newBody.location.latitude = lat;
                    newBody.location.longitude = lon;
                    newBody.location.geoDataSource = 'parsed_from_rawString_script';
                    updatedCount++;
                    return newBody;
                }
            }
        }
        return body;
    });

    if (updatedCount > 0) {
        fs.writeFileSync(vodniObiektyPath, JSON.stringify(updatedWaterBodies, null, 4));
        console.log(`Updated ${updatedCount} records in ${path.basename(vodniObiektyPath)}`);
    } else {
        console.log(`No records to update in ${path.basename(vodniObiektyPath)}`);
    }
}

function cleanFishPorts() {
    console.log(`Processing ${path.basename(fishPortsPath)}...`);
    const rawData = fs.readFileSync(fishPortsPath, 'utf-8');
    const fishPorts: FishPort[] = JSON.parse(rawData);

    let updatedCount = 0;

    const updatedFishPorts = fishPorts.map(port => {
        const coordsString = port['Google Maps Coordinates'];
        if (coordsString && (!port.latitude || !port.longitude)) {
            const [lat, lon] = coordsString.split(',').map(s => parseFloat(s.trim()));
            if (!isNaN(lat) && !isNaN(lon)) {
                const newPort = { ...port, latitude: lat, longitude: lon };
                updatedCount++;
                return newPort;
            }
        }
        return port;
    });

    if (updatedCount > 0) {
        fs.writeFileSync(fishPortsPath, JSON.stringify(updatedFishPorts, null, 2));
        console.log(`Updated ${updatedCount} records in ${path.basename(fishPortsPath)} by adding latitude and longitude properties.`);
    } else {
        console.log(`No records to update in ${path.basename(fishPortsPath)}.`);
    }
}

function main() {
    try {
        cleanVodniObiekty();
        cleanFishPorts();
        console.log('\nData cleaning complete. Your JSON files are now updated.');
    } catch (error) {
        console.error('An error occurred during data cleaning:', error);
    }
}

main();