
"use client";

import type { ScheduledItem, Subject, TimeSlot, DayOfWeek } from '@/lib/types';
import { Droppable } from 'react-beautiful-dnd';
import { ScheduledItemCard } from './ScheduledItemCard';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import React from 'react';
import { ClipboardPaste } from 'lucide-react'; // For paste icon

interface TimeSlotCellProps {
  day: DayOfWeek;
  timeSlot: TimeSlot;
  scheduledItems: ScheduledItem[];
  subjects: Subject[];
  onDeleteItem: (itemId: string) => void;
  addScheduledItem: (item: Omit<ScheduledItem, 'id'>) => ScheduledItem | null;
  copiedItem: ScheduledItem | null; // For paste functionality
  onCopyItem: (item: ScheduledItem) => void; // For copying from card
  onPasteItem: (day: DayOfWeek, timeSlotId: string) => void; // For pasting into cell
}

export function TimeSlotCell({ 
  day, 
  timeSlot, 
  scheduledItems, 
  subjects, 
  onDeleteItem, 
  addScheduledItem,
  copiedItem,
  onCopyItem,
  onPasteItem
}: TimeSlotCellProps) {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  const itemInSlot = scheduledItems.find(
    si => si.day === day && si.timeSlotId === timeSlot.id
  );
  const subjectDetails = itemInSlot ? subjects.find(s => s.id === itemInSlot.subjectId) : undefined;

  const handleCellContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    // DropdownMenuTrigger will handle opening if conditions met
  };

  return (
    <Droppable 
      droppableId={`cell-${day}-${timeSlot.id}`} 
      type="SCHEDULED_ITEM"
      isDropDisabled={false} 
      isCombineEnabled={false}
      ignoreContainerClipping={false} 
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`h-20 border border-border/50 p-0.5 transition-colors relative group
            ${snapshot.isDraggingOver ? 'bg-primary/20' : timeSlot.isBreak ? 'bg-muted/40' : 'bg-card/50'}
            ${timeSlot.isBreak && !itemInSlot ? 'flex items-center justify-center' : ''}`}
          onContextMenu={handleCellContextMenu}
        >
          {itemInSlot && subjectDetails ? (
            <ScheduledItemCard 
              item={itemInSlot} 
              subject={subjectDetails} 
              timeSlot={timeSlot} 
              index={0} 
              onDelete={onDeleteItem}
              onCopy={onCopyItem} // Pass onCopyItem for card's context menu
            />
          ) : timeSlot.isBreak ? (
            <span className="text-xs text-muted-foreground select-none">Break</span>
          ) : (
            // Empty, non-break cell: Popover for left-click, ContextMenu for right-click paste
            <DropdownMenu>
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                   <DropdownMenuTrigger asChild> 
                    <div 
                      className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-primary/10 transition-colors" 
                      aria-label={`Add subject to ${day} at ${timeSlot.startTime}`}
                      // onContextMenu is handled by the parent div for DropdownMenuTrigger
                    >
                      {/* Cell itself is trigger */}
                    </div>
                  </DropdownMenuTrigger>
                </PopoverTrigger>
                <PopoverContent className="w-64" side="bottom" align="start" sideOffset={5}>
                  <h4 className="font-medium text-sm mb-2 px-1 pt-1">Add Subject</h4>
                  {subjects.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-1 pb-1">No subjects. Create one first.</p>
                  ) : (
                    <ScrollArea className="h-[160px] w-full">
                      <div className="p-1">
                      {subjects.map((subject) => (
                        <Button
                          key={subject.id}
                          variant="ghost"
                          className="w-full justify-start mb-1 h-auto py-1.5 px-2 text-left"
                          onClick={() => {
                            addScheduledItem({ subjectId: subject.id, day, timeSlotId: timeSlot.id });
                            setIsPopoverOpen(false); 
                          }}
                        >
                          <span style={{ backgroundColor: subject.color }} className="w-3 h-3 rounded-sm mr-2 border shrink-0" />
                          <span className="flex-1 truncate" title={subject.name}>{subject.name}</span>
                        </Button>
                      ))}
                      </div>
                    </ScrollArea>
                  )}
                </PopoverContent>
              </Popover>
               {copiedItem && !timeSlot.isBreak && ( // Only show paste option if item is copied and not a break
                <DropdownMenuContent className="w-48">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPasteItem(day, timeSlot.id); }}>
                    <ClipboardPaste className="mr-2 h-4 w-4" />
                    <span>Paste Subject</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              )}
            </DropdownMenu>
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}

    