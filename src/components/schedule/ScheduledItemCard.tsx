
"use client";

import type { Subject, ScheduledItem, TimeSlot } from '@/lib/types';
import { Draggable } from 'react-beautiful-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Trash2, Edit3, Copy, Move } from 'lucide-react'; // Move might be implicit via DND

interface ScheduledItemCardProps {
  item: ScheduledItem;
  subject?: Subject;
  timeSlot?: TimeSlot;
  index: number;
  onDelete: (itemId: string) => void;
  // onEdit: (item: ScheduledItem) => void; // Future
  // onCopy: (item: ScheduledItem) => void; // Future
}

// Helper for text color for better contrast, similar to SubjectBankItem
const tinycolor = (color: string) => {
    if (!color || typeof color !== 'string' || !color.startsWith('#')) return { isLight: () => true }; // Default to light if color is invalid
    const hex = color.replace('#', '');
    if (hex.length !== 6) return { isLight: () => true }; // Default if hex is not 6 chars
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return { isLight: () => brightness > 155 };
};


export function ScheduledItemCard({ item, subject, timeSlot, index, onDelete }: ScheduledItemCardProps) {
  if (!subject || !timeSlot) {
    return ( // Fallback for missing data, though ideally this shouldn't happen
        <Draggable draggableId={`scheduled-item-${item.id}`} index={index} type="SCHEDULED_ITEM">
        {(provided) => (
            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                className="p-2 m-1 border rounded bg-destructive text-destructive-foreground text-xs">
                Error: Data missing
            </div>
        )}
        </Draggable>
    );
  }

  const cardStyle = {
    backgroundColor: subject.color,
    color: tinycolor(subject.color).isLight() ? 'hsl(var(--card-foreground))' : 'hsl(var(--primary-foreground))',
  };

  return (
    <Draggable draggableId={`scheduled-item-${item.id}`} index={index} type="SCHEDULED_ITEM">
      {(provided, snapshot) => (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={`p-2 rounded-md shadow-sm text-xs h-full flex flex-col justify-between border
                  ${snapshot.isDragging ? 'ring-2 ring-offset-2 ring-primary shadow-xl' : ''}`}
                style={{ ...provided.draggableProps.style, ...cardStyle }}
              >
                <div>
                  <p className="font-semibold truncate">{subject.name}</p>
                  <p className="opacity-80 truncate">{subject.teacher}</p>
                  {subject.code && <p className="opacity-60 text-[0.65rem]">[{subject.code}]</p>}
                </div>
                <div className="mt-1 flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150" data-role="actions-container">
                  {/* Add Edit/Copy buttons here in future */}
                  <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-black/20" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" align="center" className="bg-popover text-popover-foreground p-2 rounded shadow-lg">
              <p className="font-bold">{subject.name}</p>
              <p>Teacher: {subject.teacher}</p>
              {subject.code && <p>Code: {subject.code}</p>}
              <p>Time: {timeSlot.startTime} - {timeSlot.endTime}</p>
              <p>Day: {item.day}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </Draggable>
  );
}

