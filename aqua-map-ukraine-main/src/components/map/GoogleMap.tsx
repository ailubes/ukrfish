import React, { useEffect, useRef, useState } from 'react';
import { WaterBasin } from '@/types/waterBasin';
import FisheryPanel, { LocationCoordinate } from '@/components/fishery/FisheryPanel';
import { Button } from '@/components/ui/button';

interface GoogleMapProps {
  waterBasins: WaterBasin[];
  onMarkerClick?: (basin: WaterBasin) => void;
  className?: string;
  fisheryLocations?: LocationCoordinate[];
  selectedFisheryLocation?: LocationCoordinate | null;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyCFwzgEMWxjKX3NNmyQsXyciOGV1M6A_4s'; // Replace with your actual API key

// Define global types for Google Maps API
declare global {
  interface Window {
    initMap: () => Promise<void>;
    google: typeof google;
  }
}

interface MapComponentProps {
  waterBasins: WaterBasin[];
  onMarkerClick?: (basin: WaterBasin) => void;
  Map: typeof google.maps.Map;
  AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement;
  InfoWindow: typeof google.maps.InfoWindow;
  fisheryLocations?: LocationCoordinate[];
  selectedFisheryLocation?: LocationCoordinate | null;
}

// Компонент мапи
const MapComponent: React.FC<MapComponentProps> = ({
  waterBasins,
  onMarkerClick,
  Map,
  AdvancedMarkerElement,
  InfoWindow,
  fisheryLocations,
  selectedFisheryLocation
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new Map(mapRef.current, {
      center: selectedFisheryLocation ?
        { lat: selectedFisheryLocation.coordinates.latitude, lng: selectedFisheryLocation.coordinates.longitude } :
        { lat: 49.0, lng: 32.0 }, // Center of Ukraine
      zoom: selectedFisheryLocation ? 9 : 6,
      mapTypeId: google.maps.MapTypeId.TERRAIN,
      mapId: "DEMO_MAP_ID", // Required for Advanced Markers
    });

    mapInstanceRef.current = map;

    markersRef.current.forEach(marker => marker.map = null);
    markersRef.current = [];

    // Create markers for water basins (existing functionality)
    waterBasins.forEach((basin) => {
      if (basin.location.latitude && basin.location.longitude) {
        const marker = new AdvancedMarkerElement({
          position: {
            lat: basin.location.latitude,
            lng: basin.location.longitude
          },
          map: map,
          title: basin.waterBodyName,
          content: new (window as any).google.maps.marker.PinElement({
            background: "#1e40af",
            borderColor: "#1e40af",
            glyphColor: "white",
          }).element,
        });

        const infoWindow = new InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; color: #1e40af; font-size: 16px; font-weight: bold;">
                ${basin.waterBodyName}
              </h3>
              <p style="margin: 4px 0; color: #374151; font-size: 14px;">
                <strong>Орендар:</strong> ${basin.lesseeName}
              </p>
              <p style="margin: 4px 0; color: #374151; font-size: 14px;">
                <strong>Призначення:</strong> ${basin.purpose}
              </p>
              <p style="margin: 4px 0; color: #374151; font-size: 14px;">
                <strong>Адреса:</strong> ${basin.location.fullAddress === 'Unnamed Road' ? 'Без адреси' : basin.location.fullAddress}
              </p>
              ${basin.fishSpecies ? `
                <p style="margin: 4px 0; color: #374151; font-size: 14px;">
                  <strong>Види риб:</strong> ${Array.isArray(basin.fishSpecies) ? basin.fishSpecies.join(', ') : basin.fishSpecies}
                </p>
              ` : ''}
            </div>
          `
        });

        marker.addListener('gmp-click', () => {
          infoWindow.open(map, marker);
          if (onMarkerClick) {
            onMarkerClick(basin);
          }
        });

        markersRef.current.push(marker);
      }
    });

    // Create markers for fishery locations
    if (selectedFisheryLocation) {
      const marker = new AdvancedMarkerElement({
        position: {
          lat: selectedFisheryLocation.coordinates.latitude,
          lng: selectedFisheryLocation.coordinates.longitude
        },
        map: map,
        title: selectedFisheryLocation.name,
        content: new (window as any).google.maps.marker.PinElement({
          background: "#FF0000", // Red color for fishery locations
          borderColor: "#FF0000",
          glyphColor: "white",
        }).element,
      });

      const infoWindow = new InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; color: #FF0000; font-size: 16px; font-weight: bold;">
              ${selectedFisheryLocation.name}
            </h3>
            <p style="margin: 4px 0; color: #374151; font-size: 14px;">
              ${selectedFisheryLocation.note}
            </p>
          </div>
        `
      });

      marker.addListener('gmp-click', () => {
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
    }

  }, [waterBasins, onMarkerClick, Map, AdvancedMarkerElement, InfoWindow, fisheryLocations, selectedFisheryLocation]);

  return <div ref={mapRef} className="w-full h-full" />;
};

const GoogleMap: React.FC<GoogleMapProps> = ({
  waterBasins,
  onMarkerClick,
  className = '',
  fisheryLocations,
  selectedFisheryLocation
}) => {
  const [mapLibraries, setMapLibraries] = useState<{
    Map?: typeof google.maps.Map;
    AdvancedMarkerElement?: typeof google.maps.marker.AdvancedMarkerElement;
    InfoWindow?: typeof google.maps.InfoWindow;
  }>({});
  const [loadError, setLoadError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        if (window.google && window.google.maps) {
          window.initMap();
        }
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap&loading=async&libraries=marker`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        setLoadError(true);
      };
      document.head.appendChild(script);
    };

    window.initMap = async () => {
      try {
        const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
        const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
        const { InfoWindow } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;

        setMapLibraries({ Map, AdvancedMarkerElement, InfoWindow });
        setIsLoaded(true);
      } catch (e) {
        console.error("Error loading Google Maps libraries:", e);
        setLoadError(true);
      }
    };

    loadGoogleMapsScript();

    return () => {
      // The initMap function and the script should not be removed
      // as other map instances might still need them.
    };
  }, []);

  if (loadError) {
    return (
      <div className={`w-full h-full ${className}`}>
        <div className="flex items-center justify-center h-full bg-red-50">
          <div className="text-center">
            <p className="text-red-600">Помилка завантаження мапи</p>
            <p className="text-red-500 text-sm mt-2">Перевірте підключення до інтернету</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded || !mapLibraries.Map || !mapLibraries.AdvancedMarkerElement || !mapLibraries.InfoWindow) {
    return (
      <div className={`w-full h-full ${className}`}>
        <div className="flex items-center justify-center h-full bg-blue-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-blue-600">Завантаження мапи...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full relative ${className}`}>
      <MapComponent
        waterBasins={waterBasins}
        onMarkerClick={onMarkerClick}
        Map={mapLibraries.Map}
        AdvancedMarkerElement={mapLibraries.AdvancedMarkerElement}
        InfoWindow={mapLibraries.InfoWindow}
        fisheryLocations={fisheryLocations}
        selectedFisheryLocation={selectedFisheryLocation}
      />
    </div>
  );
};

export default GoogleMap;
