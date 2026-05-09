export type ReportPeriod = 'day' | 'month' | 'year' | 'custom';

export const periodOptions: { value: ReportPeriod; label: string }[] = [
  { value: 'day', label: 'รายวัน' },
  { value: 'month', label: 'รายเดือน' },
  { value: 'year', label: 'รายปี' },
];

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getPeriodRange = (period: Exclude<ReportPeriod, 'custom'>, baseDate = new Date()) => {
  const start = new Date(baseDate);
  const end = new Date(baseDate);

  if (period === 'day') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }

  if (period === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  }

  if (period === 'year') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(11, 31);
    end.setHours(23, 59, 59, 999);
  }

  return {
    start,
    end,
    startInput: toDateInputValue(start),
    endInput: toDateInputValue(end),
  };
};

export const getInclusiveDateRange = (startDate: string, endDate: string) => {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (start) start.setHours(0, 0, 0, 0);
  if (end) end.setHours(23, 59, 59, 999);

  return { start, end };
};

export const isWithinDateRange = (value: string, startDate: string, endDate: string) => {
  const date = new Date(value);
  const { start, end } = getInclusiveDateRange(startDate, endDate);
  return (!start || date >= start) && (!end || date <= end);
};

export const getPeriodLabel = (period: ReportPeriod, startDate: string, endDate: string) => {
  if (period === 'day') return 'ข้อมูลของวันนี้';
  if (period === 'month') return 'ข้อมูลของเดือนนี้';
  if (period === 'year') return 'ข้อมูลของปีนี้';
  if (startDate && endDate) return `${new Date(startDate).toLocaleDateString('th-TH')} - ${new Date(endDate).toLocaleDateString('th-TH')}`;
  if (startDate) return `ตั้งแต่ ${new Date(startDate).toLocaleDateString('th-TH')}`;
  if (endDate) return `ถึง ${new Date(endDate).toLocaleDateString('th-TH')}`;
  return 'ข้อมูลทั้งหมด';
};
