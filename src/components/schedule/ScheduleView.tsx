
"use client";

import React from 'react';
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
  addScheduledItem: (item: Omit<ScheduledItem, 'id'>) => ScheduledItem | null;
  copiedItem: ScheduledItem | null;
  onCopyItem: (item: ScheduledItem) => void;
  onPasteItem: (day: DayOfWeek, timeSlotId: string) => void;
}

export const ScheduleView = React.forwardRef<HTMLDivElement, ScheduleViewProps>(({ 
  daySettings, 
  customDayOrder, 
  timeSlots, 
  scheduledItems, 
  subjects, 
  onDeleteItem,
  addScheduledItem,
  copiedItem,
  onCopyItem,
  onPasteItem,
}, ref) => {
  
  // Map all days from customDayOrder to their corresponding DaySetting.
  // Reconciliation in useSchedule ensures daySettings contains entries for all valid days.
  const orderedDays: DaySetting[] = customDayOrder.map(dayName => {
    const setting = daySettings.find(ds => ds.name === dayName);
    // Fallback in case of unexpected inconsistency, though useSchedule should prevent this.
    // This ensures DayColumn always receives a valid DaySetting object.
    return setting || { name: dayName, isActive: false };
  });
  
  const hasAnyActiveDays = orderedDays.some(day => day.isActive);

  if (!hasAnyActiveDays || !timeSlots.length) {
    return (
      <div ref={ref} className="flex-1 p-4 text-center text-muted-foreground">
        Please configure active days and time slots in the settings.
      </div>
    );
  }

  return (
    <div ref={ref} className="flex flex-col flex-1 h-full overflow-hidden border rounded-md bg-card shadow">
      <div className="flex flex-1 h-full overflow-hidden">
        <div className="w-24 border-r sticky left-0 bg-background z-20">
          <div className="h-[49px] border-b p-2 text-center font-semibold shadow-sm sticky top-0 bg-background/80 backdrop-blur-sm">Time</div>
          {timeSlots.map(ts => (
            <div key={`label-${ts.id}`} className={`h-20 border-b p-1 text-xs text-center flex flex-col justify-center items-center ${ts.isBreak ? 'bg-muted/40' : ''}`}>
              <span>{ts.startTime}</span>
              <span className="text-muted-foreground">-</span>
              <span>{ts.endTime}</span>
            </div>
          ))}
        </div>

        <ScrollArea className="flex-1 h-full">
          <div className="flex min-w-max"> 
            {/* Map over all orderedDays. DayColumn will hide itself if not active. */}
            {orderedDays.map(day => (
              <DayColumn
                key={day.name}
                day={day} // Pass the full DaySetting object
                timeSlots={timeSlots}
                scheduledItems={scheduledItems}
                subjects={subjects}
                onDeleteItem={onDeleteItem}
                addScheduledItem={addScheduledItem}
                copiedItem={copiedItem}
                onCopyItem={onCopyItem}
                onPasteItem={onPasteItem}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
});

ScheduleView.displayName = "ScheduleView";

