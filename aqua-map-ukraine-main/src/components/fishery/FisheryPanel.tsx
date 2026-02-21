import React, { useEffect, useState } from 'react';
import { AggregatedFisheryData, Lot } from '@/types/fishery';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { MapPin } from 'lucide-react';

export interface LocationCoordinate {
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  note: string;
}

interface FisheryPanelProps {
  isActive: boolean;
  selectedLocation: string | null;
  winnerSearch: string | null;
}

const FisheryPanel: React.FC<FisheryPanelProps> = ({ isActive, selectedLocation, winnerSearch }) => {
  const [fisheryData, setFisheryData] = useState<AggregatedFisheryData | null>(null);
  const [filteredWinners, setFilteredWinners] = useState<string[]>([]);
  const [lotsByWinner, setLotsByWinner] = useState<{ [winner: string]: Lot[] }>({});

  useEffect(() => {
    if (isActive) {
      fetch('/json/aggregated_fishery_data.json')
        .then(response => response.json())
        .then((data: AggregatedFisheryData) => {
          setFisheryData(data);
        })
        .catch(error => console.error("Error loading fishery data:", error));
    }
  }, [isActive]);

  useEffect(() => {
    if (fisheryData) {
      let winners = Object.keys(fisheryData);

      if (selectedLocation) {
        winners = winners.filter(winner =>
          fisheryData[winner].some(lot => lot.location === selectedLocation)
        );
      }

      if (winnerSearch) {
        const lowercasedSearch = winnerSearch.toLowerCase();
        winners = winners.filter(winner =>
          winner.toLowerCase().includes(lowercasedSearch)
        );
      }
      
      const currentLots: { [winner: string]: Lot[] } = {};
      winners.forEach(winner => {
        if (winner && winner.trim() !== '') {
          const filteredLots = selectedLocation
            ? fisheryData[winner].filter(lot => lot.location === selectedLocation)
            : fisheryData[winner];
          
          if (filteredLots.length > 0) {
            currentLots[winner] = filteredLots;
          }
        }
      });

      setFilteredWinners(Object.keys(currentLots));
      setLotsByWinner(currentLots);
    } else {
      setFilteredWinners([]);
      setLotsByWinner({});
    }
  }, [fisheryData, selectedLocation, winnerSearch]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 text-blue-800">
        Промисел {selectedLocation ? `- ${selectedLocation}` : ''}
      </h2>
      
      {filteredWinners.length === 0 ? (
        <p className="text-gray-600">
          {selectedLocation ? `Немає даних про промисел для "${selectedLocation}".` : "Оберіть місцезнаходження, щоб побачити дані."}
        </p>
      ) : (
        <Accordion type="multiple" className="w-full">
          {filteredWinners.map((winnerName) => (
            <AccordionItem value={winnerName} key={winnerName}>
              <AccordionTrigger>
                <h4 className="font-semibold mb-2">{winnerName}</h4>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {lotsByWinner[winnerName]?.map((lot, index) => (
                    <div key={index} className="pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        <strong>Лот ID:</strong> {lot.lot_id}
                      </p>
                      <p className="text-sm text-gray-600">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {lot.location}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Тип:</strong> {lot.lot_type}
                      </p>
                       {lot.total_bioresource_limit && (
                        <p className="text-sm text-gray-600">
                          <strong>Загальний ліміт:</strong> {lot.total_bioresource_limit} кг
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default FisheryPanel;