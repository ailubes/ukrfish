'use client'; // Added a comment to trigger re-compilation

import React, { useState, useEffect, useRef } from 'react';
import { FixedSizeList, VariableSizeList } from 'react-window';
import { MapPin, Building2, Filter } from 'lucide-react';

import Layout from '@/components/layout/Layout';
import CustomCard from '@/components/ui/CustomCard';
import GoogleMap from '@/components/map/GoogleMap';
import { Button } from '@/components/ui/button';
import waterData from '@/data/vodni_obiekty_1748944527.json';
import processedFishPortsData from '@/data/fish-ports-data.json';
import { WaterBasin } from '@/types/waterBasin';
import FisheryPanel, { LocationCoordinate } from '@/components/fishery/FisheryPanel';

interface FishPort {
  '№': number;
  'Номер місця базування': string;
  'Адреса місця базування': string;
  'Google Maps Coordinates': string;
  'Власник місця базування': string;
  latitude: number;
  longitude: number;
  region: string;
  id: string;
}

const Objects = () => {
  const [dataType, setDataType] = useState<'waterBasins' | 'fishPorts' | 'fishery'>('waterBasins');
  const [waterBasins, setWaterBasins] = useState<WaterBasin[]>([]);
  const [filteredBasins, setFilteredBasins] = useState<WaterBasin[]>([]);
  const [selectedBasin, setSelectedBasin] = useState<WaterBasin | null>(null);
  const [fishPorts, setFishPorts] = useState<FishPort[]>([]);
  const [filteredFishPorts, setFilteredFishPorts] = useState<FishPort[]>([]);
  const [selectedFishPort, setSelectedFishPort] = useState<FishPort | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [mapData, setMapData] = useState<WaterBasin[]>([]);
  const [fisheryLocations, setFisheryLocations] = useState<LocationCoordinate[]>([]);
  const [fisheryData, setFisheryData] = useState<any>({});
  const [winnerCount, setWinnerCount] = useState<number>(0);
  const listRef = useRef<FixedSizeList | VariableSizeList>(null);
  const sizeMap = useRef<{ [key: number]: number }>({});
  const setSize = (index: number, size: number) => {
    sizeMap.current = { ...sizeMap.current, [index]: size };
    if (listRef.current) {
      listRef.current.resetAfterIndex(index);
    }
  };
  const getSize = (index: number) => sizeMap.current[index] || 150; // Default size

  // Фільтри
  const [filters, setFilters] = useState({
    search: '',
    region: '',
    purpose: '',
    lessee: '',
    fisheryLocation: '',
    winnerSearch: ''
  });

    useEffect(() => {
        // Load location coordinates for fishery filter
        fetch('/json/location_coordinates.json')
            .then(response => response.json())
            .then(data => setFisheryLocations(data.locations))
            .catch(error => console.error("Error loading location coordinates:", error));

       fetch('/json/aggregated_fishery_data.json')
           .then(response => response.json())
           .then(data => setFisheryData(data))
           .catch(error => console.error("Error loading aggregated fishery data:", error));

        const data = waterData as WaterBasin[];
        setWaterBasins(data);
        setFilteredBasins(data); // Initialize filtered data

        const allPorts: FishPort[] = [];
        let portIndex = 0;
        for (const region in processedFishPortsData) {
            if (Object.prototype.hasOwnProperty.call(processedFishPortsData, region)) {
                const portsInRegion = processedFishPortsData[region as keyof typeof processedFishPortsData];
                portsInRegion.forEach(port => {
                    if (port['Google Maps Coordinates']) {
                        const coords = port['Google Maps Coordinates'].split(',').map(s => parseFloat(s.trim()));
                        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                            const [lat, lon] = coords;
                            allPorts.push({
                                ...(port as any),
                                id: `fish-port-${port['№']}-${portIndex++}`,
                                region: region,
                                latitude: lat,
                                longitude: lon,
                            });
                        }
                    }
                });
            }
        }
        setFishPorts(allPorts);
        setFilteredFishPorts(allPorts); // Initialize filtered data
    }, []);

  useEffect(() => {
    setFilters({ search: '', region: '', purpose: '', lessee: '', fisheryLocation: '', winnerSearch: '' });
    setSelectedBasin(null);
    setSelectedFishPort(null);
  }, [dataType]);

    useEffect(() => {
        if (dataType !== 'waterBasins') return;

        if (!filters.search && !filters.region && !filters.purpose && !filters.lessee) {
          setFilteredBasins([]);
          return;
        }

        let filtered = waterBasins;

        if (filters.search) {
          filtered = filtered.filter(basin =>
            basin.waterBodyName.toLowerCase().includes(filters.search.toLowerCase()) ||
            (basin.lesseeName && basin.lesseeName.toLowerCase().includes(filters.search.toLowerCase())) ||
            basin.location.fullAddress.toLowerCase().includes(filters.search.toLowerCase())
          );
        }

        if (filters.region) {
          filtered = filtered.filter(basin =>
            basin.location.region?.toLowerCase().includes(filters.region.toLowerCase())
          );
        }

        if (filters.purpose) {
          filtered = filtered.filter(basin =>
            basin.purpose.toLowerCase().includes(filters.purpose.toLowerCase())
          );
        }

        if (filters.lessee) {
          filtered = filtered.filter(basin =>
            basin.lesseeName.toLowerCase().includes(filters.lessee.toLowerCase())
          );
        }

        setFilteredBasins(filtered);
    }, [filters, waterBasins, dataType]);

    useEffect(() => {
        if (dataType !== 'fishPorts') return;

        if (!filters.search && !filters.region) {
          setFilteredFishPorts([]);
          return;
        }

        let filtered = fishPorts;

        if (filters.search) {
          const lowercasedSearch = filters.search.toLowerCase();
          filtered = filtered.filter(port =>
            port['Адреса місця базування']?.toLowerCase().includes(lowercasedSearch) ||
            port['Власник місця базування']?.toLowerCase().includes(lowercasedSearch) ||
            port['Номер місця базування']?.toLowerCase().includes(lowercasedSearch)
          );
        }

        if (filters.region) {
          filtered = filtered.filter(port =>
            port.region?.toLowerCase().includes(filters.region.toLowerCase())
          );
        }

        setFilteredFishPorts(filtered);
    }, [filters, fishPorts, dataType]);

  const calculatedWinnerCount = React.useMemo(() => {
    if (dataType !== 'fishery' || !fisheryData) {
      return 0;
    }

    let winners = Object.keys(fisheryData);

    if (filters.fisheryLocation) {
      winners = winners.filter(winner =>
        (fisheryData[winner] as any[]).some(lot => lot.location === filters.fisheryLocation)
      );
    }

    if (filters.winnerSearch) {
      const lowercasedSearch = filters.winnerSearch.toLowerCase();
      winners = winners.filter(winner =>
        winner.toLowerCase().includes(lowercasedSearch)
      );
    }

    return winners.length;
  }, [dataType, filters.fisheryLocation, fisheryData]);

  useEffect(() => {
    setWinnerCount(calculatedWinnerCount);
  }, [calculatedWinnerCount]);

  useEffect(() => {
    if (dataType === 'waterBasins') {
      setMapData(selectedBasin ? [selectedBasin] : filteredBasins);
    } else if (dataType === 'fishPorts') {
      const portsToDisplay = selectedFishPort ? [selectedFishPort] : filteredFishPorts;
      const mappedPorts = portsToDisplay.map(p => ({
        id: p.id,
        lesseeName: p['Власник місця базування'],
        waterBodyName: `Місце базування № ${p['Номер місця базування']}`,
        location: {
          rawString: p['Адреса місця базування'],
          fullAddress: p['Адреса місця базування'],
          street: null,
          settlement: null,
          region: p.region,
          postalCode: null,
          country: 'Україна',
          latitude: p.latitude,
          longitude: p.longitude,
          geoDataSource: 'parsed_from_fish_ports'
        },
        purpose: 'Місце базування суден риболовецького флоту',
        fishSpecies: null,
        leaseExpiry: null,
      }));
      setMapData(mappedPorts);
    } else if (dataType === 'fishery') {
      const selectedLoc = fisheryLocations.find(l => l.name === filters.fisheryLocation);
      if (selectedLoc) {
          setMapData([{
              id: `fishery-location-${selectedLoc.name}`,
              lesseeName: '',
              waterBodyName: selectedLoc.name,
              location: {
                  latitude: selectedLoc.coordinates.latitude,
                  longitude: selectedLoc.coordinates.longitude,
                  fullAddress: selectedLoc.note,
                  rawString: '',
                  street: null,
                  settlement: null,
                  region: null,
                  postalCode: null,
                  country: 'Україна',
                  geoDataSource: 'parsed_from_fishery_locations'
              },
              purpose: '',
              fishSpecies: null,
              leaseExpiry: null,
          }]);
      } else {
          setMapData([]);
      }
    }
  }, [dataType, selectedBasin, filteredBasins, selectedFishPort, filteredFishPorts, filters.fisheryLocation, fisheryLocations]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setSelectedBasin(null);
    setSelectedFishPort(null);
  };

  const handleMarkerClick = (item: WaterBasin) => {
    if (dataType === 'waterBasins') {
      const basin = waterBasins.find(b => b.id === item.id);
      if (basin) {
        setSelectedBasin(basin);
        setSelectedFishPort(null);
        const index = filteredBasins.findIndex(b => b.id === basin.id);
        if (listRef.current && index !== -1) {
          listRef.current.scrollToItem(index, 'center');
        }
      }
    } else {
      const port = fishPorts.find(p => p.id === item.id);
      if (port) {
        setSelectedFishPort(port);
        setSelectedBasin(null);
        const index = filteredFishPorts.findIndex(p => p.id === port.id);
        if (listRef.current && index !== -1) {
          listRef.current.scrollToItem(index, 'center');
        }
      }
    }
  };

  const uniqueWaterBasinRegions = [...new Set(waterBasins.map(basin => basin.location.region).filter(Boolean))];
  const uniqueFishPortRegions = [...new Set(fishPorts.map(port => port.region).filter(Boolean))];
  const uniqueRegions = dataType === 'waterBasins' ? uniqueWaterBasinRegions : uniqueFishPortRegions;
  const uniquePurposes = [...new Set(waterBasins.map(basin => basin.purpose))];

  // Helper function to check if lease is expired
  const isLeaseExpired = (leaseExpiry: string | null) => {
    if (!leaseExpiry) return false;
    const expiryDate = new Date(leaseExpiry);
    const today = new Date();
    return expiryDate < today;
  };

  // Row component for FixedSizeList
  const BasinRow = ({ index, style, data }: { index: number; style: React.CSSProperties; data: WaterBasin[] }) => {
    const basin = data[index];
    if (!basin) return null; // Handle cases where basin might be undefined

    const expired = isLeaseExpired(basin.leaseExpiry);

    return (
      <div style={style} className="px-1 py-1"> {/* Add padding/margin here for spacing between cards */}
        <CustomCard 
          key={basin.id}
          className={`cursor-pointer transition-all duration-200 ${
            selectedBasin?.id === basin.id 
              ? 'ring-2 ring-blue-500 ring-inset shadow-lg' 
              : 'hover:shadow-md'
          } ${expired ? 'text-red-500 border-red-500' : ''}`}
        >
          <div 
            className="p-4"
            onClick={() => { setSelectedBasin(basin); setSelectedFishPort(null); }}
          >
            <h4 className="font-semibold mb-2">
              {basin.waterBodyName}
            </h4>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Орендар:</strong> {basin.lesseeName}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Призначення:</strong> {basin.purpose}
            </p>
            <p className="text-sm text-gray-600">
              <MapPin className="h-3 w-3 inline mr-1" />
              {basin.location.fullAddress === 'Unnamed Road' ? 'Без адреси' : 
                `${basin.location.settlement ? basin.location.settlement + ', ' : ''}${basin.location.region || ''}`.trim().replace(/,$/, '') || 'Невідоме місцезнаходження'}
            </p>
            {basin.fishSpecies && (
              <p className="text-sm text-blue-600 mt-2">
                <strong>Види риб:</strong> {
                  Array.isArray(basin.fishSpecies) 
                    ? basin.fishSpecies.join(', ') 
                    : basin.fishSpecies
                }
              </p>
            )}
          </div>
        </CustomCard>
      </div>
    );
  };

  interface FishPortRowProps {
    index: number;
    style: React.CSSProperties;
    data: {
      items: FishPort[];
      setSize: (index: number, size: number) => void;
      selectedFishPort: FishPort | null;
      setSelectedFishPort: (port: FishPort) => void;
      setSelectedBasin: (basin: null) => void;
    };
  }
  
  const FishPortRow = ({ index, style, data }: FishPortRowProps) => {
    const { items, setSize, selectedFishPort, setSelectedFishPort, setSelectedBasin } = data;
    const port = items[index];
    const rowRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      if (rowRef.current) {
        setSize(index, rowRef.current.offsetHeight);
      }
    }, [setSize, index]);
  
    if (!port) return null;
  
    return (
      <div style={style}>
        <div ref={rowRef} className="px-1 py-2">
          <CustomCard
            key={port.id}
            className={`cursor-pointer transition-all duration-200 ${
              selectedFishPort?.id === port.id
                ? 'ring-2 ring-blue-500 ring-inset shadow-lg'
                : 'hover:shadow-md'
            }`}
            onClick={() => {
              setSelectedFishPort(port);
              setSelectedBasin(null);
            }}
          >
            <div className="p-4">
              <h4 className="font-semibold mb-2">
                Місце базування № {port['Номер місця базування']}
              </h4>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Власник:</strong> {port['Власник місця базування']}
              </p>
              <p className="text-sm text-gray-600">
                <MapPin className="h-3 w-3 inline mr-1" />
                {port['Адреса місця базування']}
              </p>
            </div>
          </CustomCard>
        </div>
      </div>
    );
  };

  const getUkrainianPlural = (count: number): string => {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return 'користувачів';
    }
    if (lastDigit === 1) {
      return 'користувач';
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'користувачі';
    }
    return 'користувачів';
  };

  return (
    <Layout>
      <div className="py-8 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Водні горизонти України
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              {dataType === 'waterBasins'
                ? 'Інтерактивна мапа та каталог водних ресурсів для аквакультури'
                : dataType === 'fishery'
                  ? 'Інформація про користувачів, які здійснювали спеціальне використання водних біоресурсів у 2024 році'
                  : 'Інтерактивна мапа місць базування суден риболовецького флоту'}
            </p>
            <div className="flex justify-center items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <Building2 className="h-4 w-4 mr-1" />
                {dataType === 'fishery'
                  ? `${winnerCount} ${getUkrainianPlural(winnerCount)}`
                  : `${dataType === 'waterBasins' ? waterBasins.length : fishPorts.length} об'єктів`}
              </span>
              <span>•</span>
              <span>Оновлено: {new Date().toLocaleDateString('uk-UA')}</span>
            </div>
          </div>

          {/* Фільтри */}
          <div className="flex justify-center mb-6 space-x-4">
            <Button
              variant="outline"
              onClick={() => setDataType('waterBasins')}
              className={`text-lg px-6 py-3 ${dataType === 'waterBasins' ? 'bg-green-600 text-white' : ''}`}
            >
              Водні об'єкти
            </Button>
            <Button
              variant="outline"
              onClick={() => setDataType('fishPorts')}
              className={`text-lg px-6 py-3 ${dataType === 'fishPorts' ? 'bg-green-600 text-white' : ''}`}
            >
              Місця базування суден риболовецького флоту
            </Button>
            <Button
              variant="outline"
              onClick={() => setDataType('fishery')}
              className={`text-lg px-6 py-3 ${dataType === 'fishery' ? 'bg-green-600 text-white' : ''}`}
            >
              Промисел
            </Button>
          </div>

          <CustomCard className="mb-6 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Фільтри</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span>{showFilters ? 'Сховати' : 'Показати'} фільтри</span>
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                {dataType !== 'fishery' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Пошук
                    </label>
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder={dataType === 'waterBasins' ? "Назва об'єкта, орендар..." : "Адреса, власник, номер..."}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                {dataType !== 'fishery' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Область
                    </label>
                    <select
                      value={filters.region}
                      onChange={(e) => handleFilterChange('region', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Всі області</option>
                      {uniqueRegions.map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>
                )}

                {dataType === 'waterBasins' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Призначення
                      </label>
                      <select
                        value={filters.purpose}
                        onChange={(e) => handleFilterChange('purpose', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Всі типи</option>
                        {uniquePurposes.map(purpose => (
                          <option key={purpose} value={purpose}>{purpose}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Орендар
                      </label>
                      <input
                        type="text"
                        value={filters.lessee}
                        onChange={(e) => handleFilterChange('lessee', e.target.value)}
                        placeholder="Назва орендаря..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                {dataType === 'fishery' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Пошук по переможцю
                        </label>
                        <input
                          type="text"
                          value={filters.winnerSearch}
                          onChange={(e) => handleFilterChange('winnerSearch', e.target.value)}
                          placeholder="Назва переможця..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                              Місце видобування водних біоресурсів
                          </label>
                          <select
                              value={filters.fisheryLocation}
                              onChange={(e) => handleFilterChange('fisheryLocation', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                              <option value="">Всі місця</option>
                              {fisheryLocations.map(loc => (
                                  <option key={loc.name} value={loc.name}>{loc.name}</option>
                              ))}
                          </select>
                      </div>
                    </>
                )}
              </div>
            )}
          </CustomCard>

          {/* Мапа та список */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Мапа */}
            <div className="lg:col-span-2">
              <CustomCard className="h-96 lg:h-[600px] p-0 overflow-hidden rounded-xl">
                {mapData.length > 0 || dataType === 'fishery' ? (
                  <GoogleMap
                    key={dataType + filters.fisheryLocation}
                    waterBasins={mapData}
                    onMarkerClick={handleMarkerClick}
                    className="rounded-xl"
                    selectedFisheryLocation={fisheryLocations.find(l => l.name === filters.fisheryLocation) || null}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Застосуйте фільтри, щоб побачити об'єкти на мапі.
                  </div>
                )}
              </CustomCard>
            </div>

            {/* Список об'єктів */}
            <div className="space-y-4">
              {dataType === 'fishery' ? (
                <FisheryPanel
                  isActive={true}
                  selectedLocation={filters.fisheryLocation || null}
                  winnerSearch={filters.winnerSearch || null}
                />
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {dataType === 'waterBasins'
                      ? `Список об'єктів (${filteredBasins.length})`
                      : `Список місць базування риболовецького флоту (${filteredFishPorts.length})`
                    }
                  </h3>
                  {dataType === 'waterBasins' && (
                    filteredBasins.length > 0 ? (
                      <FixedSizeList
                        height={600} // Max height of the list container
                        itemCount={filteredBasins.length}
                        itemSize={180} // Estimated height of each card + spacing
                        width="100%"
                        ref={listRef}
                        itemData={filteredBasins}
                      >
                        {BasinRow}
                      </FixedSizeList>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        Застосуйте фільтри, щоб побачити список об'єктів.
                      </div>
                    )
                  )}
                  {dataType === 'fishPorts' && (
                    filteredFishPorts.length > 0 ? (
                      <VariableSizeList
                        ref={listRef}
                        height={600}
                        itemCount={filteredFishPorts.length}
                        itemSize={getSize}
                        width="100%"
                        itemData={{
                          items: filteredFishPorts,
                          setSize: setSize,
                          selectedFishPort: selectedFishPort,
                          setSelectedFishPort: setSelectedFishPort,
                          setSelectedBasin: setSelectedBasin,
                        }}
                      >
                        {FishPortRow}
                      </VariableSizeList>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        Застосуйте фільтри, щоб побачити список об'єктів.
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Objects;
