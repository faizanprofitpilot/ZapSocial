// US Holidays calculation utilities

export interface Holiday {
  id: string;
  title: string;
  start: string;
  isHoliday: true;
}

/**
 * Get the nth occurrence of a weekday in a month
 * @param year - The year
 * @param month - Month (0-11, where 0 = January)
 * @param dayOfWeek - Day of week (0-6, where 0 = Sunday)
 * @param n - Which occurrence (1 = first, 2 = second, etc.)
 */
function getNthWeekday(year: number, month: number, dayOfWeek: number, n: number): Date {
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay();
  
  // Calculate the date of the nth occurrence
  let date = 1;
  if (firstDayOfWeek <= dayOfWeek) {
    date = 1 + (dayOfWeek - firstDayOfWeek) + (n - 1) * 7;
  } else {
    date = 1 + (7 - firstDayOfWeek) + dayOfWeek + (n - 1) * 7;
  }
  
  return new Date(year, month, date);
}

/**
 * Get the last occurrence of a weekday in a month
 */
function getLastWeekday(year: number, month: number, dayOfWeek: number): Date {
  const lastDay = new Date(year, month + 1, 0); // Last day of month
  const lastDayOfWeek = lastDay.getDay();
  
  let date = lastDay.getDate();
  if (lastDayOfWeek > dayOfWeek) {
    date -= (lastDayOfWeek - dayOfWeek);
  } else if (lastDayOfWeek < dayOfWeek) {
    date -= (7 - (dayOfWeek - lastDayOfWeek));
  }
  
  return new Date(year, month, date);
}

/**
 * Get major US holidays for a given year
 */
export function getUSHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = [];

  // Fixed date holidays
  holidays.push({
    id: `new-years-${year}`,
    title: "New Year's Day",
    start: `${year}-01-01`,
    isHoliday: true,
  });

  holidays.push({
    id: `independence-${year}`,
    title: "Independence Day",
    start: `${year}-07-04`,
    isHoliday: true,
  });

  holidays.push({
    id: `veterans-${year}`,
    title: "Veterans Day",
    start: `${year}-11-11`,
    isHoliday: true,
  });

  holidays.push({
    id: `christmas-${year}`,
    title: "Christmas",
    start: `${year}-12-25`,
    isHoliday: true,
  });

  // Variable date holidays (calculated)
  
  // Martin Luther King Jr. Day - 3rd Monday in January
  const mlkDay = getNthWeekday(year, 0, 1, 3);
  holidays.push({
    id: `mlk-${year}`,
    title: "Martin Luther King Jr. Day",
    start: mlkDay.toISOString().split('T')[0],
    isHoliday: true,
  });

  // Presidents' Day - 3rd Monday in February
  const presidentsDay = getNthWeekday(year, 1, 1, 3);
  holidays.push({
    id: `presidents-${year}`,
    title: "Presidents' Day",
    start: presidentsDay.toISOString().split('T')[0],
    isHoliday: true,
  });

  // Memorial Day - Last Monday in May
  const memorialDay = getLastWeekday(year, 4, 1);
  holidays.push({
    id: `memorial-${year}`,
    title: "Memorial Day",
    start: memorialDay.toISOString().split('T')[0],
    isHoliday: true,
  });

  // Labor Day - 1st Monday in September
  const laborDay = getNthWeekday(year, 8, 1, 1);
  holidays.push({
    id: `labor-${year}`,
    title: "Labor Day",
    start: laborDay.toISOString().split('T')[0],
    isHoliday: true,
  });

  // Columbus Day - 2nd Monday in October
  const columbusDay = getNthWeekday(year, 9, 1, 2);
  holidays.push({
    id: `columbus-${year}`,
    title: "Columbus Day",
    start: columbusDay.toISOString().split('T')[0],
    isHoliday: true,
  });

  // Thanksgiving - 4th Thursday in November
  const thanksgiving = getNthWeekday(year, 10, 4, 4);
  holidays.push({
    id: `thanksgiving-${year}`,
    title: "Thanksgiving",
    start: thanksgiving.toISOString().split('T')[0],
    isHoliday: true,
  });

  return holidays;
}

/**
 * Get holidays for current year and next year (for calendar display)
 */
export function getCurrentAndNextYearHolidays(): Holiday[] {
  const currentYear = new Date().getFullYear();
  const currentYearHolidays = getUSHolidays(currentYear);
  const nextYearHolidays = getUSHolidays(currentYear + 1);
  
  return [...currentYearHolidays, ...nextYearHolidays];
}

