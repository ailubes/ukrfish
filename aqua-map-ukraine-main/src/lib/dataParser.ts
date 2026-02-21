
import { WaterBasin, Location } from '@/types/waterBasin';

export function parseLocationString(locationStr: string): Location {
  // Handle coordinates extraction
  let latitude = 0;
  let longitude = 0;
  let addressPart = locationStr;

  // Check for "Геодані:" pattern
  const geoDataMatch = locationStr.match(/Геодані:\s*([\d.-]+),\s*([\d.-]+)/);
  if (geoDataMatch) {
    latitude = parseFloat(geoDataMatch[1]);
    longitude = parseFloat(geoDataMatch[2]);
    addressPart = locationStr.replace(/\s*Геодані:.*$/, '').trim();
  } else {
    // Extract coordinates from the end of the string
    const coordsMatch = locationStr.match(/([\d.-]+),\s*([\d.-]+)$/);
    if (coordsMatch) {
      latitude = parseFloat(coordsMatch[1]);
      longitude = parseFloat(coordsMatch[2]);
      addressPart = locationStr.replace(/,?\s*[\d.-]+,\s*[\d.-]+$/, '').trim();
    }
  }

  // Parse address components
  const parts = addressPart.split(',').map(part => part.trim());
  
  let street = '';
  let settlement = '';
  let region = '';
  let country = '';
  let postalCode = '';

  // Extract postal code (5 digits)
  const postalMatch = addressPart.match(/\b\d{5}\b/);
  if (postalMatch) {
    postalCode = postalMatch[0];
  }

  // Basic parsing logic
  if (parts.length >= 2) {
    street = parts[0];
    if (street === 'Unnamed Road') {
      street = 'Невідома вулиця';
    }
    
    settlement = parts[1];
    
    if (parts.length >= 3) {
      // Look for region (containing "область")
      const regionPart = parts.find(part => part.includes('область'));
      if (regionPart) {
        region = regionPart;
      }
      
      // Look for country
      const countryPart = parts.find(part => part === 'Україна');
      if (countryPart) {
        country = countryPart;
      }
    }
  }

  return {
    fullAddress: addressPart,
    street,
    settlement,
    region,
    country,
    postalCode,
    latitude,
    longitude
  };
}

export function parseLeaseExpiry(expiryStr: string): string | null {
  if (!expiryStr || expiryStr === '-' || expiryStr === '') {
    return null;
  }
  
  if (expiryStr === 'Акт на право постійного користування') {
    return expiryStr;
  }
  
  // Check if it's already an ISO date
  if (expiryStr.includes('T') && expiryStr.includes('Z')) {
    return expiryStr;
  }
  
  // Parse DD.MM.YYYY format
  const dateMatch = expiryStr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    return new Date(`${year}-${month}-${day}`).toISOString();
  }
  
  return expiryStr;
}
