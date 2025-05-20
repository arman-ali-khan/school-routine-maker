"use client";

import type { DayOfWeek, TimeSlot, ScheduledItem, Subject, DaySetting } from '@/lib/types';
import { DayColumn } from './DayColumn';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ScheduleViewProps {
  daySettings: DaySetting[];
  customDayOrder: DayOfWeek[];
  timeSlots: TimeSlot[];
  scheduledItems: ScheduledItem[];
  subjects: Subject[];
  onDeleteItem: (itemId: string) => void;
}

export function ScheduleView({ daySettings, customDayOrder, timeSlots, scheduledItems, subjects, onDeleteItem }: ScheduleViewProps) {
  
  const orderedDays = customDayOrder
    .map(dayName => daySettings.find(ds => ds.name === dayName))
    .filter(ds => ds !== undefined) as DaySetting[];
  
  const activeOrderedDays = orderedDays.filter(day => day.isActive);

  if (!activeOrderedDays.length || !timeSlots.length) {
    return (
      <div className="flex-1 p-4 text-center text-muted-foreground">
        Please configure active days and time slots in the settings.
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Time Slot Labels Column */}
      <div className="w-24 border-r sticky left-0 bg-background z-20">
        <div className="h-[49px] border-b p-2 text-center font-semibold shadow-sm sticky top-0 bg-background/80 backdrop-blur-sm">Time</div> {/* Matches DayColumn header height */}
        {timeSlots.map(ts => (
          <div key={`label-${ts.id}`} className={`h-20 border-b p-1 text-xs text-center flex flex-col justify-center items-center ${ts.isBreak ? 'bg-muted/40' : ''}`}>
            <span>{ts.startTime}</span>
            <span className="text-muted-foreground">-</span>
            <span>{ts.endTime}</span>
          </div>
        ))}
      </div>

      {/* Schedule Grid */}
      <ScrollArea className="flex-1 h-full">
        <div className="flex min-w-max"> {/* min-w-max to ensure horizontal scroll for many days */}
          {activeOrderedDays.map(day => (
            <DayColumn
              key={day.name}
              day={day}
              timeSlots={timeSlots}
              scheduledItems={scheduledItems}
              subjects={subjects}
              onDeleteItem={onDeleteItem}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
