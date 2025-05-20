
export interface Subject {
  id: string;
  name: string;
  teacher: string;
  code?: string;
  color: string; // hex color string e.g., "#FF5733"
}

export interface TimeSlot {
  id: string;
  startTime: string; // "HH:mm" format, e.g., "09:00"
  endTime: string; // "HH:mm" format, e.g., "09:45"
  isBreak?: boolean;
}

export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Saturday';

export interface DaySetting {
  name: DayOfWeek;
  isActive: boolean;
}

export interface ScheduledItem {
  id: string; // Unique ID for this instance of a scheduled subject
  subjectId: string;
  day: DayOfWeek;
  timeSlotId: string;
}

export interface ScheduleData {
  subjects: Subject[];
  timeSlots: TimeSlot[];
  daySettings: DaySetting[]; // Order matters for display
  scheduledItems: ScheduledItem[];
  settings: {
    customDayOrder: DayOfWeek[]; // Stores the user-defined order of days
  };
}

export interface AppState extends ScheduleData {} // Might expand later

// For react-beautiful-dnd
export interface DraggableSubject extends Subject {
  isBankDraggable?: boolean; // To differentiate source (bank) from scheduled item
}

export interface DraggableScheduledItem extends ScheduledItem {
  // any additional properties for draggable scheduled items
}
