
import type { DayOfWeek, DaySetting, ScheduleData } from './types';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const DEFAULT_DAY_SETTINGS: DaySetting[] = DAYS_OF_WEEK.map(day => ({
  name: day,
  isActive: !['Sunday', 'Saturday'].includes(day), // Monday-Friday active by default
  // isWorkingDay: !['Sunday', 'Saturday'].includes(day), // Removed
}));

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
  daySettings: DEFAULT_DAY_SETTINGS,
  scheduledItems: [],
  settings: {
    customDayOrder: [...DAYS_OF_WEEK], // Default order
  },
};

export const LOCAL_STORAGE_KEY = 'routinelyScheduleData';
