
"use client";

import type { DayOfWeek, TimeSlot, ScheduledItem, Subject, DaySetting } from '@/lib/types';
import { TimeSlotCell } from './TimeSlotCell';

interface DayColumnProps {
  day: DaySetting; 
  timeSlots: TimeSlot[];
  scheduledItems: ScheduledItem[];
  subjects: Subject[];
  onDeleteItem: (itemId: string) => void;
  addScheduledItem: (item: Omit<ScheduledItem, 'id'>) => ScheduledItem | null;
  copiedItem: ScheduledItem | null;
  onCopyItem: (item: ScheduledItem) => void;
  onPasteItem: (day: DayOfWeek, timeSlotId: string) => void;
}

export function DayColumn({ 
  day, 
  timeSlots, 
  scheduledItems, 
  subjects, 
  onDeleteItem, 
  addScheduledItem,
  copiedItem,
  onCopyItem,
  onPasteItem 
}: DayColumnProps) {
  if (!day.isActive) return null;

  return (
    <div className={`flex-1 min-w-[150px] ${!day.isWorkingDay ? 'opacity-70 bg-muted/20' : ''}`}>
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm p-2 text-center border-b border-r font-semibold shadow-sm">
        {day.name}
      </div>
      <div className="border-r">
        {timeSlots.map((ts) => (
          <TimeSlotCell
            key={ts.id}
            day={day.name}
            timeSlot={ts}
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
    </div>
  );
}

    