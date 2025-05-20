
import type { DayOfWeek, DaySetting, ScheduleData } from './types';

// Defines the available days of the week for the application.
// Order here determines the default order in customDayOrder.
export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Saturday',
];

// Explicitly defines the default active status for each day.
export const DEFAULT_DAY_SETTINGS: DaySetting[] = [
  { name: 'Sunday',    isActive: true },
  { name: 'Monday',    isActive: true },
  { name: 'Tuesday',   isActive: true },
  { name: 'Wednesday', isActive: true },
  { name: 'Thursday',  isActive: true },
  { name: 'Saturday',  isActive: false }, // Saturday is available but inactive by default
];

export const DEFAULT_TIME_SLOTS_PRESET: { startTime: string, endTime: string, isBreak?: boolean }[] = [
  { startTime: "08:00", endTime: "08:45" },
  { startTime: "08:45", endTime: "09:30" },
  { startTime: "09:30", endTime: "09:45", isBreak: true }, // Break
  { startTime: "09:45", endTime: "10:30" },
  { startTime: "10:30", endTime: "11:15" },
  { startTime: "11:15", endTime: "12:00" },
  { startTime: "12:00", endTime: "13:00", isBreak: true }, // Lunch Break
  { startTime: "13:00", endTime: "13:45" },
  { startTime: "13:45", endTime: "14:30" },
];


export const INITIAL_SCHEDULE_DATA: ScheduleData = {
  subjects: [],
  timeSlots: DEFAULT_TIME_SLOTS_PRESET.map((ts, index) => ({ ...ts, id: `default-slot-${index}`})),
  // Ensure daySettings uses the explicitly defined defaults and only includes days present in DAYS_OF_WEEK.
  daySettings: DEFAULT_DAY_SETTINGS.filter(ds => DAYS_OF_WEEK.includes(ds.name)),
  scheduledItems: [],
  settings: {
    // customDayOrder is derived directly from the defined DAYS_OF_WEEK array.
    customDayOrder: [...DAYS_OF_WEEK],
  },
};

export const LOCAL_STORAGE_KEY = 'routinelyScheduleData';
