import { WaterBasin } from '@/types/waterBasin';

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

export interface PieChartData {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

// Helper to generate consistent colors
const generateColors = (count: number) => {
  const colors = [
    'rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)',
    'rgba(255, 206, 86, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)',
    'rgba(199, 199, 199, 0.6)', 'rgba(83, 102, 255, 0.6)', 'rgba(255, 99, 71, 0.6)',
    'rgba(60, 179, 113, 0.6)'
  ];
  return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
};

// 1. Розподіл водних об'єктів за областями (Distribution of Water Bodies by Region)
export const getWaterBodiesByRegion = (data: WaterBasin[]): ChartData => {
  const counts: { [key: string]: number } = {};
  data.forEach(item => {
    const region = item.location?.region || 'Невідомо';
    counts[region] = (counts[region] || 0) + 1;
  });

  const sortedCounts = Object.entries(counts).sort(([, countA], [, countB]) => countB - countA);

  const labels = sortedCounts.map(([region]) => region);
  const datasetData = sortedCounts.map(([, count]) => count);
  const backgroundColors = generateColors(labels.length);

  return {
    labels: labels,
    datasets: [
      {
        label: 'Кількість водних об\'єктів',
        data: datasetData,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color.replace('0.6', '1')),
        borderWidth: 1,
      },
    ],
  };
};

// 2. Кількість об'єктів аквакультури за областями (Number of Aquaculture Objects by Region)
export const getAquacultureObjectsByRegion = (data: WaterBasin[]): ChartData => {
  const counts: { [key: string]: number } = {};
  data.forEach(item => {
    if (item.purpose === 'Аквакультура') {
      const region = item.location?.region || 'Невідомо';
      counts[region] = (counts[region] || 0) + 1;
    }
  });

  const sortedCounts = Object.entries(counts).sort(([, countA], [, countB]) => countB - countA);

  const labels = sortedCounts.map(([region]) => region);
  const datasetData = sortedCounts.map(([, count]) => count);
  const backgroundColors = generateColors(labels.length);

  return {
    labels: labels,
    datasets: [
      {
        label: 'Кількість об\'єктів з цільовим використанням "Аквакультура"',
        data: datasetData,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color.replace('0.6', '1')),
        borderWidth: 1,
      },
    ],
  };
};

// 3. ТОП-5 Орендарів за кількістю водних об'єктів (Top 5 Lessees by Number of Water Bodies)
export const getTop5Lessees = (data: WaterBasin[]): ChartData => {
  const counts: { [key: string]: number } = {};
  data.forEach(item => {
    const lessee = item.lesseeName || 'Невідомо';
    counts[lessee] = (counts[lessee] || 0) + 1;
  });

  const sortedLessees = Object.entries(counts)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 5);

  const labels = sortedLessees.map(([lessee]) => lessee);
  const datasetData = sortedLessees.map(([, count]) => count);
  const backgroundColors = generateColors(labels.length);

  return {
    labels: labels.reverse(), // Reverse for horizontal bar chart to show largest at top
    datasets: [
      {
        label: 'Кількість об\'єктів',
        data: datasetData.reverse(), // Reverse data accordingly
        backgroundColor: backgroundColors.reverse(),
        borderColor: backgroundColors.map(color => color.replace('0.6', '1')),
        borderWidth: 1,
      },
    ],
  };
};

// 4. Динаміка закінчення термінів дії договорів оренди (Lease Expiry Dynamics)
export const getLeaseExpiryDynamics = (data: WaterBasin[]): ChartData => {
  const expiryCounts: { [year: string]: number } = {};
  const currentYear = new Date().getFullYear();
  const maxFutureYear = currentYear + 10; // Look 10 years into the future

  data.forEach(item => {
    if (item.leaseExpiry && typeof item.leaseExpiry === 'string') {
      const leaseExpiryLower = item.leaseExpiry.toLowerCase();
      if (
        leaseExpiryLower.includes('акт на право постійного користування') ||
        leaseExpiryLower.includes('припинено') ||
        leaseExpiryLower.includes('договір оренди не продовжено')
      ) {
        return; // Exclude these statuses
      }

      try {
        const expiryDate = new Date(item.leaseExpiry);
        const expiryYear = expiryDate.getFullYear();

        if (!isNaN(expiryYear)) {
          if (expiryDate < new Date()) {
            // Group expired leases into an "Прострочені" category for past years
            expiryCounts['Прострочені'] = (expiryCounts['Прострочені'] || 0) + 1;
          } else if (expiryYear >= currentYear && expiryYear <= maxFutureYear) {
            expiryCounts[expiryYear.toString()] = (expiryCounts[expiryYear.toString()] || 0) + 1;
          }
        }
      } catch (e) {
        // Handle invalid date strings gracefully
        console.warn(`Invalid leaseExpiry date for item ${item.id}: ${item.leaseExpiry}`);
      }
    }
  });

  const labels: string[] = [];
  // Add "Прострочені" if it exists
  if (expiryCounts['Прострочені']) {
    labels.push('Прострочені');
  }
  // Add years from current to maxFutureYear
  for (let year = currentYear; year <= maxFutureYear; year++) {
    labels.push(year.toString());
  }

  const datasetData = labels.map(label => {
    if (label === 'Прострочені') {
      return expiryCounts['Прострочені'] || 0;
    }
    return expiryCounts[label] || 0;
  });

  return {
    labels: labels,
    datasets: [
      {
        label: 'Кількість договорів, що закінчуються',
        data: datasetData,
        borderColor: ['rgba(75, 192, 192, 1)'],
        backgroundColor: ['rgba(75, 192, 192, 0.2)'],
        borderWidth: 2,
      },
    ],
  };
};

// 5. Статус договорів оренди (Lease Agreement Status)
export const getLeaseAgreementStatus = (data: WaterBasin[]): PieChartData => {
  const statusCounts: { [key: string]: number } = {
    'Діючі': 0,
    'Прострочені': 0,
    'Безстрокові': 0,
    'Не вказано/Інше': 0,
  };
  const currentDate = new Date();

  data.forEach(item => {
    if (item.leaseExpiry && typeof item.leaseExpiry === 'string') {
      const leaseExpiryLower = item.leaseExpiry.toLowerCase();
      if (leaseExpiryLower.includes('акт на право постійного користування')) {
        statusCounts['Безстрокові']++;
      } else {
        try {
          const expiryDate = new Date(item.leaseExpiry);
          if (!isNaN(expiryDate.getTime())) {
            if (expiryDate > currentDate) {
              statusCounts['Діючі']++;
            } else {
              statusCounts['Прострочені']++;
            }
          } else {
            statusCounts['Не вказано/Інше']++;
          }
        } catch (e) {
          statusCounts['Не вказано/Інше']++;
        }
      }
    } else {
      statusCounts['Не вказано/Інше']++;
    }
  });

  const labels = Object.keys(statusCounts);
  const datasetData = Object.values(statusCounts);
  const backgroundColors = generateColors(labels.length);

  return {
    labels: labels,
    datasets: [
      {
        data: datasetData,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color.replace('0.6', '1')),
        borderWidth: 1,
      },
    ],
  };
};

// 6. Розподіл за цільовим використанням (Distribution by Purpose)
export const getDistributionByPurpose = (data: WaterBasin[]): PieChartData => {
  const purposeCounts: { [key: string]: number } = {};
  data.forEach(item => {
    const purpose = item.purpose || 'Не вказано';
    purposeCounts[purpose] = (purposeCounts[purpose] || 0) + 1;
  });

  const labels = Object.keys(purposeCounts);
  const datasetData = Object.values(purposeCounts);
  const backgroundColors = generateColors(labels.length);

  return {
    labels: labels,
    datasets: [
      {
        data: datasetData,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color.replace('0.6', '1')),
        borderWidth: 1,
      },
    ],
  };
};

// 7. Кількість об'єктів за типом (Number of Objects by Type)
export const getObjectsByType = (data: WaterBasin[]): ChartData => {
  const typeCounts: { [key: string]: number } = {};
  data.forEach(item => {
    let waterBodyType = item.waterBodyName || 'Невідомо';
    // Normalize names like "Ставок № 1" to just "Ставок"
    waterBodyType = waterBodyType.replace(/ № \d+/g, '').trim();
    typeCounts[waterBodyType] = (typeCounts[waterBodyType] || 0) + 1;
  });

  const labels = Object.keys(typeCounts).sort();
  const datasetData = labels.map(label => typeCounts[label]);
  const backgroundColors = generateColors(labels.length);

  return {
    labels: labels,
    datasets: [
      {
        label: 'Кількість',
        data: datasetData,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color.replace('0.6', '1')),
        borderWidth: 1,
      },
    ],
  };
};
