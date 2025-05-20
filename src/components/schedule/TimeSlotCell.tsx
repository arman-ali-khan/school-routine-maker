"use client";

import type { ScheduledItem, Subject, TimeSlot, DayOfWeek } from '@/lib/types';
import { Droppable } from 'react-beautiful-dnd';
import { ScheduledItemCard } from './ScheduledItemCard';

interface TimeSlotCellProps {
  day: DayOfWeek;
  timeSlot: TimeSlot;
  scheduledItems: ScheduledItem[]; // All scheduled items for lookup
  subjects: Subject[]; // All subjects for lookup
  onDeleteItem: (itemId: string) => void;
}

export function TimeSlotCell({ day, timeSlot, scheduledItems, subjects, onDeleteItem }: TimeSlotCellProps) {
  const itemInSlot = scheduledItems.find(
    si => si.day === day && si.timeSlotId === timeSlot.id
  );
  const subjectDetails = itemInSlot ? subjects.find(s => s.id === itemInSlot.subjectId) : undefined;

  return (
    <Droppable droppableId={`cell-${day}-${timeSlot.id}`} type="SCHEDULED_ITEM">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`h-20 border border-border/50 p-0.5 transition-colors relative group
            ${snapshot.isDraggingOver ? 'bg-primary/20' : timeSlot.isBreak ? 'bg-muted/40' : 'bg-card/50 hover:bg-muted/20'}
            ${timeSlot.isBreak && !itemInSlot ? 'flex items-center justify-center' : ''}`}
        >
          {itemInSlot && subjectDetails ? (
            <ScheduledItemCard 
              item={itemInSlot} 
              subject={subjectDetails} 
              timeSlot={timeSlot} 
              index={0} // Index is 0 as there's only one item per slot in this design
              onDelete={onDeleteItem}
            />
          ) : timeSlot.isBreak ? (
            <span className="text-xs text-muted-foreground select-none">Break</span>
          ) : (
            <div className="w-full h-full min-h-[1em]" /> // Ensure droppable area is available
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}
