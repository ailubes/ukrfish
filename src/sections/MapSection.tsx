import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Anchor,
  BarChart3,
  CheckCircle,
  Clock,
  Droplets,
  Fish,
  Filter,
  Map as MapIcon,
  MapPin,
  Search,
  Users,
  X,
} from 'lucide-react'
import GoogleMap, { type GoogleMapItem } from '../components/map/GoogleMap'

type SourceType = 'waterBasins' | 'fishPorts' | 'fishery'
type ItemStatus = 'active' | 'inactive' | 'pending'

interface WaterBasin {
  id: string
  lesseeName: string
  waterBodyName: string
  location: {
    fullAddress: string
    settlement: string | null
    region: string | null
    latitude: number | null
    longitude: number | null
  }
  purpose: string
  leaseExpiry: string | null
}

interface FishPortItem {
  '№': number
  'Номер місця базування': string
  'Адреса місця базування': string
  'Google Maps Coordinates': string
  'Власник місця базування': string
}

interface DataBundle {
  waterBasins: WaterBasin[]
  fishPortsRaw: Record<string, unknown>
  fisheryLocations: FisheryLocation[]
  fisheryAggregated: Record<string, FisheryDataPoint[]>
}

function readStringField(source: Record<string, unknown>, key: string): string | null {
  const value = source[key]
  return typeof value === 'string' ? value : null
}

interface FisheryLocation {
  name: string
  coordinates: {
    latitude: number
    longitude: number
  }
  note: string
}

interface FisheryDataPoint {
  location?: string
  lot_id?: string
  permit?: {
    number?: string
    date?: string
  }
  vessel_count?: number
  vessels?: {
    vessel_count?: number
  }
}

interface MapItem {
  id: string
  source: SourceType
  name: string
  region: string
  latitude: number
  longitude: number
  owner?: string
  details?: string
  leaseExpiry?: string | null
  locationLabel: string
  status: ItemStatus
}

interface StatCardProps {
  icon: React.ElementType
  value: string
  label: string
  trend?: string
  color: string
}

function StatCard({ icon: Icon, value, label, trend, color }: StatCardProps) {
  return (
    <div className="blueprint-panel p-5 hover:scale-[1.02] transition-transform duration-300">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 ${color} rounded-sm flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend ? <span className="text-xs font-mono text-[#facc15]">{trend}</span> : null}
      </div>
      <div className="mt-4">
        <div className="text-3xl font-bold text-[#002d6e]">{value}</div>
        <div className="text-sm text-[#002d6e]/60 mt-1">{label}</div>
      </div>
    </div>
  )
}

interface SourceChipProps {
  label: string
  active: boolean
  count: number
  onClick: () => void
}

function SourceChip({ label, active, count, onClick }: SourceChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-sm text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
        active
          ? 'bg-[#002d6e] text-white'
          : 'bg-white border-2 border-[#002d6e]/20 text-[#002d6e] hover:border-[#002d6e]'
      }`}
    >
      {label}
      <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-[#002d6e]/10'}`}>{count}</span>
    </button>
  )
}

const EMPTY_WATER_BASINS: WaterBasin[] = []
const EMPTY_FISHERY_LOCATIONS: FisheryLocation[] = []
const EMPTY_FISHERY_DATA: Record<string, FisheryDataPoint[]> = {}

function toNumber(value: string): number | null {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

function getStatusByLeaseDate(leaseExpiry: string | null | undefined): ItemStatus {
  if (!leaseExpiry) {
    return 'pending'
  }
  const expiryDate = new Date(leaseExpiry)
  if (Number.isNaN(expiryDate.getTime())) {
    return 'pending'
  }
  return expiryDate < new Date() ? 'inactive' : 'active'
}

function statusColor(status: ItemStatus): string {
  if (status === 'active') {
    return '#22c55e'
  }
  if (status === 'inactive') {
    return '#ef4444'
  }
  return '#facc15'
}

function statusLabel(status: ItemStatus): string {
  if (status === 'active') {
    return 'Діючий'
  }
  if (status === 'inactive') {
    return 'Завершений'
  }
  return 'Уточнюється'
}

function sourceLabel(source: SourceType): string {
  if (source === 'waterBasins') {
    return 'Водний об\'єкт'
  }
  if (source === 'fishPorts') {
    return 'Місце базування'
  }
  return 'Промислова ділянка'
}

function formatValue(value: number): string {
  return value.toLocaleString('uk-UA')
}

function ensureUniqueMapItemIds(items: MapItem[]): MapItem[] {
  const seen = new globalThis.Map<string, number>()

  return items.map((item) => {
    const currentCount = seen.get(item.id) || 0
    seen.set(item.id, currentCount + 1)

    if (currentCount === 0) {
      return item
    }

    return {
      ...item,
      id: `${item.id}--${currentCount + 1}`,
    }
  })
}

function normalizeRegion(region: string | null | undefined): string {
  const value = (region || '').trim()
  if (!value) {
    return 'Невідомий регіон'
  }

  const cleaned = value
    .toLowerCase()
    .replaceAll('.', ' ')
    .replaceAll(',', ' ')
    .replaceAll('область', ' ')
    .replaceAll('обл', ' ')
    .replaceAll('район', ' ')
    .replaceAll('р н', ' ')
    .replaceAll('`', "'")
    .replace(/\s+/g, ' ')
    .trim()

  const regionAliases: Array<{ canonical: string; aliases: string[] }> = [
    { canonical: 'Вінницька область', aliases: ['він', 'виі', 'винниц'] },
    { canonical: 'Волинська область', aliases: ['волин', 'волын'] },
    { canonical: 'Дніпропетровська область', aliases: ['дніпроп', 'днепроп'] },
    { canonical: 'Донецька область', aliases: ['донец', 'донец'] },
    { canonical: 'Житомирська область', aliases: ['житомир', 'житомирс'] },
    { canonical: 'Закарпатська область', aliases: ['закарпат', 'закарп'] },
    { canonical: 'Запорізька область', aliases: ['запоріз', 'запорож'] },
    { canonical: 'Івано-Франківська область', aliases: ['івано франк', 'ивано франк', 'франків'] },
    { canonical: 'Київська область', aliases: ['київ', 'киевск', 'київськ'] },
    { canonical: 'Кіровоградська область', aliases: ['кіровоград', 'кировоград'] },
    { canonical: 'Луганська область', aliases: ['луган', 'луганс'] },
    { canonical: 'Львівська область', aliases: ['львів', 'львов'] },
    { canonical: 'Миколаївська область', aliases: ['микола', 'николаев'] },
    { canonical: 'Одеська область', aliases: ['одес', 'одесс'] },
    { canonical: 'Полтавська область', aliases: ['полтав'] },
    { canonical: 'Рівненська область', aliases: ['рівнен', 'ровен'] },
    { canonical: 'Сумська область', aliases: ['сумс', 'сумск'] },
    { canonical: 'Тернопільська область', aliases: ['терноп', 'тернопол'] },
    { canonical: 'Харківська область', aliases: ['харків', 'харьков', 'харьк'] },
    { canonical: 'Херсонська область', aliases: ['херсон'] },
    { canonical: 'Хмельницька область', aliases: ['хмельниц', 'хмельницк'] },
    { canonical: 'Черкаська область', aliases: ['черкас', 'черкасс'] },
    { canonical: 'Чернівецька область', aliases: ['чернів', 'черновиц'] },
    { canonical: 'Чернігівська область', aliases: ['черніг', 'черниг'] },
  ]

  const matched = regionAliases.find((item) => item.aliases.some((alias) => cleaned.startsWith(alias)))
  if (matched) {
    return matched.canonical
  }

  return value
}

export default function MapSection() {
  const [activeTab, setActiveTab] = useState<'map' | 'stats'>('map')
  const [activeSource, setActiveSource] = useState<SourceType>('waterBasins')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('Всі області')
  const [selectedObject, setSelectedObject] = useState<MapItem | null>(null)
  const [dataBundle, setDataBundle] = useState<DataBundle | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      setIsLoadingData(true)
      setDataError(null)

      try {
        const [waterBasinsModule, fishPortsModule, fisheryLocationsModule, fisheryAggregatedModule] = await Promise.all([
          import('../data/vodni_obiekty_1748944527.json'),
          import('../data/fish-ports-data.json'),
          import('../data/location_coordinates.json'),
          import('../data/aggregated_fishery_data.json'),
        ])

        if (cancelled) {
          return
        }

        const fisheryLocationsPayload = fisheryLocationsModule.default as { locations?: FisheryLocation[] }

        setDataBundle({
          waterBasins: (waterBasinsModule.default || []) as WaterBasin[],
          fishPortsRaw: (fishPortsModule.default || {}) as Record<string, unknown>,
          fisheryLocations: fisheryLocationsPayload.locations || [],
          fisheryAggregated: (fisheryAggregatedModule.default || {}) as Record<string, FisheryDataPoint[]>,
        })
      } catch {
        if (!cancelled) {
          setDataError('Не вдалося завантажити дані карти. Оновіть сторінку ще раз.')
        }
      } finally {
        if (!cancelled) {
          setIsLoadingData(false)
        }
      }
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [])

  const waterBasins = useMemo(
    () => dataBundle?.waterBasins || EMPTY_WATER_BASINS,
    [dataBundle?.waterBasins],
  )

  const fishPorts = useMemo(() => {
    const regionsMap = dataBundle?.fishPortsRaw || {}
    const flattened: Array<FishPortItem & { region: string; latitude: number; longitude: number; id: string }> = []
    let index = 0

    Object.entries(regionsMap).forEach(([region, ports]) => {
      if (!Array.isArray(ports)) {
        return
      }

      ports.forEach((rawPort) => {
        if (!rawPort || typeof rawPort !== 'object') {
          return
        }

        const portRecord = rawPort as Record<string, unknown>
        const baseNumber = typeof portRecord['№'] === 'number' ? portRecord['№'] : index + 1
        const placeNumber = readStringField(portRecord, 'Номер місця базування')
        const address = readStringField(portRecord, 'Адреса місця базування')
        const owner = readStringField(portRecord, 'Власник місця базування')
        const coordinates = readStringField(portRecord, 'Google Maps Coordinates')

        if (!placeNumber || !address || !owner || !coordinates) {
          return
        }

        const rawCoordinates = coordinates.split(',').map((item) => item.trim())
        if (rawCoordinates.length !== 2) {
          return
        }
        const latitude = toNumber(rawCoordinates[0])
        const longitude = toNumber(rawCoordinates[1])
        if (latitude === null || longitude === null) {
          return
        }
        flattened.push({
          '№': baseNumber,
          'Номер місця базування': placeNumber,
          'Адреса місця базування': address,
          'Google Maps Coordinates': coordinates,
          'Власник місця базування': owner,
          region,
          latitude,
          longitude,
          id: `fish-port-${baseNumber}-${index}`,
        })
        index += 1
      })
    })

    return flattened
  }, [dataBundle?.fishPortsRaw])

  const fisheryLocations = useMemo(
    () => dataBundle?.fisheryLocations || EMPTY_FISHERY_LOCATIONS,
    [dataBundle?.fisheryLocations],
  )

  const fisheryData = useMemo(
    () => dataBundle?.fisheryAggregated || EMPTY_FISHERY_DATA,
    [dataBundle?.fisheryAggregated],
  )

  const mapItems = useMemo<Record<SourceType, MapItem[]>>(() => {
    const basinItems: MapItem[] = waterBasins
      .filter((item) => item.location.latitude !== null && item.location.longitude !== null)
      .map((item, index) => ({
        id: `basin-${item.id}-${index}`,
        source: 'waterBasins',
        name: item.waterBodyName,
        region: normalizeRegion(item.location.region),
        latitude: item.location.latitude as number,
        longitude: item.location.longitude as number,
        owner: item.lesseeName,
        details: item.purpose,
        leaseExpiry: item.leaseExpiry,
        locationLabel: item.location.fullAddress,
        status: getStatusByLeaseDate(item.leaseExpiry),
      }))

    const fishPortItems: MapItem[] = fishPorts.map((item) => ({
      id: item.id,
      source: 'fishPorts',
      name: `Місце базування №${item['Номер місця базування']}`,
      region: normalizeRegion(item.region),
      latitude: item.latitude,
      longitude: item.longitude,
      owner: item['Власник місця базування'],
      details: item['Номер місця базування'],
      locationLabel: item['Адреса місця базування'],
      status: 'active',
    }))

    const fisheryLocationLots = new globalThis.Map<string, number>()
    Object.values(fisheryData).forEach((lots) => {
      lots.forEach((lot) => {
        if (!lot.location) {
          return
        }
        fisheryLocationLots.set(lot.location, (fisheryLocationLots.get(lot.location) || 0) + 1)
      })
    })

    const fisheryLocationMap = new globalThis.Map(
      fisheryLocations.map((location) => [location.name, location]),
    )

    const fisheryWinnerLocationCounter = new globalThis.Map<string, number>()
    Object.entries(fisheryData).forEach(([winnerName, lots]) => {
      const byLocation = new globalThis.Map<string, number>()
      lots.forEach((lot) => {
        if (!lot.location) {
          return
        }
        byLocation.set(lot.location, (byLocation.get(lot.location) || 0) + 1)
      })

      byLocation.forEach((lotCount, locationName) => {
        const key = `${winnerName}|${locationName}`
        fisheryWinnerLocationCounter.set(key, lotCount)
      })
    })

    const fisheryItems: MapItem[] = []
    Array.from(fisheryWinnerLocationCounter.entries()).forEach(([winnerLocationKey, lotCount], index) => {
      const [winnerName, locationName] = winnerLocationKey.split('|')
      const location = fisheryLocationMap.get(locationName)
      if (!location) {
        return
      }

      const baseLat = location.coordinates.latitude
      const baseLng = location.coordinates.longitude
      const jitterSeed = winnerLocationKey
        .split('')
        .reduce((acc, char, charIndex) => acc + char.charCodeAt(0) * (charIndex + 1), 0)
      const angle = (jitterSeed % 360) * (Math.PI / 180)
      const distance = 0.03 + (jitterSeed % 7) * 0.004

      fisheryItems.push({
        id: `fishery-user-${winnerName}-${locationName}-${index}`,
        source: 'fishery',
        name: winnerName,
        region: locationName,
        latitude: baseLat + Math.sin(angle) * distance,
        longitude: baseLng + Math.cos(angle) * distance,
        owner: winnerName,
        details: `${lotCount} лотів у локації ${locationName}`,
        locationLabel: location.note,
        status: 'active',
      })
    })

    if (fisheryItems.length === 0) {
      fisheryLocations.forEach((item, index) => {
        const relatedLotsCount = fisheryLocationLots.get(item.name) || 0
        fisheryItems.push({
          id: `fishery-${item.name}-${index}`,
          source: 'fishery',
          name: item.name,
          region: item.name,
          latitude: item.coordinates.latitude,
          longitude: item.coordinates.longitude,
          details: `${relatedLotsCount} лотів у вибірці`,
          locationLabel: item.note,
          status: 'pending',
        })
      })
    }

    return {
      waterBasins: ensureUniqueMapItemIds(basinItems),
      fishPorts: ensureUniqueMapItemIds(fishPortItems),
      fishery: ensureUniqueMapItemIds(fisheryItems),
    }
  }, [fishPorts, fisheryData, fisheryLocations, waterBasins])

  const sourceItems = mapItems[activeSource]

  const regions = useMemo(() => {
    const unique = new Set<string>()
    sourceItems.forEach((item) => unique.add(item.region))
    return ['Всі області', ...Array.from(unique).sort((a, b) => a.localeCompare(b, 'uk-UA'))]
  }, [sourceItems])

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return sourceItems.filter((item) => {
      const matchesRegion = selectedRegion === 'Всі області' || item.region === selectedRegion
      const matchesQuery =
        query.length === 0 ||
        item.name.toLowerCase().includes(query) ||
        item.region.toLowerCase().includes(query) ||
        (item.owner || '').toLowerCase().includes(query) ||
        item.locationLabel.toLowerCase().includes(query)
      return matchesRegion && matchesQuery
    })
  }, [searchQuery, selectedRegion, sourceItems])

  const mapMarkerItems = useMemo<GoogleMapItem[]>(() => {
    return filteredItems.slice(0, 1200).map((item) => ({
      id: item.id,
      title: item.name,
      lat: item.latitude,
      lng: item.longitude,
      color: statusColor(item.status),
      infoHtml: `
        <div style="padding:8px;max-width:260px;">
          <h3 style="margin:0 0 8px 0;color:#1e40af;font-size:15px;font-weight:700;">${item.name}</h3>
          <p style="margin:4px 0;color:#374151;font-size:13px;"><strong>Тип:</strong> ${sourceLabel(item.source)}</p>
          ${item.owner ? `<p style="margin:4px 0;color:#374151;font-size:13px;"><strong>Користувач:</strong> ${item.owner}</p>` : ''}
          <p style="margin:4px 0;color:#374151;font-size:13px;"><strong>Регіон:</strong> ${item.region}</p>
          ${item.details ? `<p style="margin:4px 0;color:#374151;font-size:13px;"><strong>Деталі:</strong> ${item.details}</p>` : ''}
          <p style="margin:4px 0;color:#374151;font-size:13px;"><strong>Статус:</strong> ${statusLabel(item.status)}</p>
        </div>
      `,
    }))
  }, [filteredItems])

  const topRegions = useMemo(() => {
    const regionCounter = new globalThis.Map<string, number>()
    ;(['waterBasins', 'fishPorts', 'fishery'] as SourceType[]).forEach((sourceKey) => {
      mapItems[sourceKey].forEach((item) => {
        regionCounter.set(item.region, (regionCounter.get(item.region) || 0) + 1)
      })
    })
    return Array.from(regionCounter.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
  }, [mapItems])

  const leaseStatus = useMemo(() => {
    const counter = {
      active: 0,
      inactive: 0,
      pending: 0,
    }
    mapItems.waterBasins.forEach((item) => {
      counter[item.status] += 1
    })
    return counter
  }, [mapItems.waterBasins])

  const topLessees = useMemo(() => {
    const counter = new globalThis.Map<string, number>()
    mapItems.waterBasins.forEach((item) => {
      if (!item.owner) {
        return
      }
      counter.set(item.owner, (counter.get(item.owner) || 0) + 1)
    })
    return Array.from(counter.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
  }, [mapItems.waterBasins])

  const fisheryUsersCount = useMemo(() => Object.keys(fisheryData).length, [fisheryData])

  const updatedAt = useMemo(() => new Date().toLocaleDateString('uk-UA'), [])

  useEffect(() => {
    setSearchQuery('')
    setSelectedRegion('Всі області')
    setSelectedObject(null)
  }, [activeSource])

  const maxRegionCount = topRegions.length > 0 ? topRegions[0][1] : 1

  if (isLoadingData) {
    return (
      <div className="p-6 lg:p-8">
        <div className="blueprint-panel p-6">
          <p className="text-[#002d6e]">Завантаження даних карти...</p>
        </div>
      </div>
    )
  }

  if (dataError) {
    return (
      <div className="p-6 lg:p-8">
        <div className="blueprint-panel p-6">
          <p className="text-red-600 font-medium">{dataError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-[#002d6e] rounded-sm flex items-center justify-center">
            <MapIcon className="w-5 h-5 text-[#facc15]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#002d6e]">Водні горизонти України</h2>
            <p className="text-sm text-[#002d6e]/60 font-mono">AQUA DATA INTEGRATION</p>
          </div>
        </div>
        <p className="text-[#002d6e]/70 max-w-3xl">
          Дані інтегровані з каталогу aqua-map-ukraine: водні об&apos;єкти, місця базування риболовецького флоту та промислові локації.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Droplets} value={formatValue(mapItems.waterBasins.length)} label="Водних об'єктів" trend={`Станом на ${updatedAt}`} color="bg-blue-500" />
        <StatCard icon={Anchor} value={formatValue(mapItems.fishPorts.length)} label="Місць базування" trend="Риболовецький флот" color="bg-amber-500" />
        <StatCard icon={Fish} value={formatValue(fisheryLocations.length)} label="Промислових локацій" trend="Публічні координати" color="bg-cyan-600" />
        <StatCard icon={Users} value={formatValue(fisheryUsersCount)} label="Користувачів промислу" trend="Дані 2024" color="bg-emerald-500" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab('map')}
          className={`px-6 py-3 rounded-sm font-medium transition-all duration-300 flex items-center gap-2 ${
            activeTab === 'map'
              ? 'bg-[#002d6e] text-white'
              : 'bg-white border-2 border-[#002d6e]/20 text-[#002d6e] hover:border-[#002d6e]'
          }`}
        >
          <MapIcon className="w-4 h-4" />
          Карта
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-6 py-3 rounded-sm font-medium transition-all duration-300 flex items-center gap-2 ${
            activeTab === 'stats'
              ? 'bg-[#002d6e] text-white'
              : 'bg-white border-2 border-[#002d6e]/20 text-[#002d6e] hover:border-[#002d6e]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Статистика
        </button>
      </div>

      {activeTab === 'map' ? (
        <div className="space-y-6">
          <div className="blueprint-panel p-4">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-[#002d6e]">
                <Filter className="w-4 h-4" />
                <span className="font-medium">Джерело даних:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <SourceChip label="Водні об'єкти" active={activeSource === 'waterBasins'} count={mapItems.waterBasins.length} onClick={() => setActiveSource('waterBasins')} />
                <SourceChip label="Місця базування" active={activeSource === 'fishPorts'} count={mapItems.fishPorts.length} onClick={() => setActiveSource('fishPorts')} />
                <SourceChip label="Промисел" active={activeSource === 'fishery'} count={mapItems.fishery.length} onClick={() => setActiveSource('fishery')} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[250px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002d6e]/40" />
                  <input
                    type="text"
                    placeholder="Пошук за назвою, регіоном або власником..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-[#002d6e]/20 rounded-sm focus:border-[#002d6e] focus:outline-none text-[#002d6e]"
                  />
                </div>
              </div>
              <select
                value={selectedRegion}
                onChange={(event) => setSelectedRegion(event.target.value)}
                className="px-4 py-2 border-2 border-[#002d6e]/20 rounded-sm focus:border-[#002d6e] focus:outline-none text-[#002d6e] bg-white min-w-[240px]"
              >
                {regions.map((region, index) => (
                  <option key={`${region}-${index}`} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 blueprint-panel p-0 overflow-hidden">
              <div className="relative h-[500px] bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
                <GoogleMap
                  items={mapMarkerItems}
                  selectedId={selectedObject?.id || null}
                  onMarkerClick={(id) => {
                    const selectedItem = filteredItems.find((item) => item.id === id)
                    if (selectedItem) {
                      setSelectedObject(selectedItem)
                    }
                  }}
                />

                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-sm border border-[#002d6e]/20">
                  <div className="text-xs font-medium text-[#002d6e] mb-2">Легенда</div>
                  <div className="space-y-1 text-xs text-[#002d6e]/80">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      Діючий
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      Уточнюється
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      Завершений
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="blueprint-panel p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#002d6e]">Список об&apos;єктів</h3>
                <span className="text-xs text-[#002d6e]/60">{filteredItems.length} знайдено</span>
              </div>
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {filteredItems.slice(0, 250).map((item, index) => (
                  <button
                    key={`${item.id}-${index}`}
                    onClick={() => setSelectedObject(item)}
                    className="w-full p-3 text-left bg-white border border-[#002d6e]/10 rounded-sm hover:border-[#002d6e]/30 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-medium text-[#002d6e] text-sm">{item.name}</h4>
                        <p className="text-xs text-[#002d6e]/60 mt-1">{item.region}</p>
                      </div>
                      {item.status === 'active' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : item.status === 'inactive' ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-[#002d6e]/50">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {sourceLabel(item.source)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="blueprint-panel p-6">
            <h3 className="text-lg font-bold text-[#002d6e] mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Регіональний розподіл (всі джерела)
            </h3>
            <div className="space-y-3">
              {topRegions.map(([region, count]) => (
                <div key={region} className="flex items-center gap-4">
                  <div className="w-44 text-sm text-[#002d6e] truncate">{region}</div>
                  <div className="flex-1 h-7 bg-[#002d6e]/10 rounded-sm overflow-hidden">
                    <div className="h-full bg-[#002d6e] rounded-sm" style={{ width: `${Math.max(2, (count / maxRegionCount) * 100)}%` }} />
                  </div>
                  <div className="w-16 text-right font-bold text-[#002d6e]">{count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="blueprint-panel p-6">
              <h3 className="text-lg font-bold text-[#002d6e] mb-6">Статус договорів оренди</h3>
              <div className="space-y-4">
                {[
                  { key: 'active', label: 'Діючі', value: leaseStatus.active, color: '#22c55e' },
                  { key: 'inactive', label: 'Завершені', value: leaseStatus.inactive, color: '#ef4444' },
                  { key: 'pending', label: 'Без дати/уточнюється', value: leaseStatus.pending, color: '#facc15' },
                ].map((item) => {
                  const total = Math.max(1, mapItems.waterBasins.length)
                  const percent = Math.round((item.value / total) * 100)
                  return (
                    <div key={item.key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-[#002d6e]">{item.label}</span>
                        <span className="font-semibold text-[#002d6e]">{item.value} ({percent}%)</span>
                      </div>
                      <div className="h-2 w-full rounded bg-[#002d6e]/10 overflow-hidden">
                        <div className="h-full rounded" style={{ width: `${percent}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="blueprint-panel p-6">
              <h3 className="text-lg font-bold text-[#002d6e] mb-6">ТОП орендарів за кількістю об&apos;єктів</h3>
              <div className="space-y-3">
                {topLessees.map(([lessee, count]) => (
                  <div key={lessee} className="flex items-center justify-between p-2 bg-[#002d6e]/5 rounded-sm">
                    <div className="text-sm text-[#002d6e] truncate max-w-[80%]">{lessee}</div>
                    <div className="font-bold text-[#002d6e]">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedObject ? (
        <div className="fixed inset-0 bg-black/50 z-[1200] flex items-center justify-center p-4">
          <div className="bg-white rounded-sm max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-[#002d6e]">{selectedObject.name}</h3>
                  <p className="text-sm text-[#002d6e]/60">{selectedObject.region}</p>
                </div>
                <button onClick={() => setSelectedObject(null)} className="p-2 hover:bg-[#002d6e]/10 rounded-sm transition-colors">
                  <X className="w-5 h-5 text-[#002d6e]" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-sm text-sm font-medium bg-[#002d6e]/10 text-[#002d6e]">{sourceLabel(selectedObject.source)}</span>
                  <span
                    className={`px-3 py-1 rounded-sm text-sm font-medium ${
                      selectedObject.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : selectedObject.status === 'inactive'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {statusLabel(selectedObject.status)}
                  </span>
                </div>

                <div className="p-3 bg-[#002d6e]/5 rounded-sm text-sm text-[#002d6e]">
                  <div className="font-medium mb-1">Локація</div>
                  <div>{selectedObject.locationLabel}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#002d6e]/5 rounded-sm">
                    <div className="text-xs text-[#002d6e]/60 mb-1">Широта</div>
                    <div className="font-bold text-[#002d6e]">{selectedObject.latitude.toFixed(5)}</div>
                  </div>
                  <div className="p-3 bg-[#002d6e]/5 rounded-sm">
                    <div className="text-xs text-[#002d6e]/60 mb-1">Довгота</div>
                    <div className="font-bold text-[#002d6e]">{selectedObject.longitude.toFixed(5)}</div>
                  </div>
                </div>

                {selectedObject.owner ? (
                  <div className="p-3 bg-[#002d6e]/5 rounded-sm text-sm text-[#002d6e]">
                    <div className="font-medium mb-1">Користувач / власник</div>
                    <div>{selectedObject.owner}</div>
                  </div>
                ) : null}

                {selectedObject.details ? (
                  <div className="p-3 bg-[#002d6e]/5 rounded-sm text-sm text-[#002d6e]">
                    <div className="font-medium mb-1">Додаткова інформація</div>
                    <div>{selectedObject.details}</div>
                  </div>
                ) : null}

                {selectedObject.leaseExpiry ? (
                  <div className="p-3 bg-[#002d6e]/5 rounded-sm text-sm text-[#002d6e]">
                    <div className="font-medium mb-1">Дата завершення оренди</div>
                    <div>{selectedObject.leaseExpiry.slice(0, 10)}</div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
