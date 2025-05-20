
"use client";

import type { Subject, ScheduledItem, TimeSlot } from '@/lib/types';
import { Draggable } from 'react-beautiful-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Trash2, Copy as CopyIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type React from 'react';

interface ScheduledItemCardProps {
  item: ScheduledItem;
  subject?: Subject;
  timeSlot?: TimeSlot;
  index: number;
  onDelete: (itemId: string) => void;
  onCopy: (item: ScheduledItem) => void;
}

const tinycolor = (color: string) => {
    if (!color || typeof color !== 'string' || !color.startsWith('#')) return { isLight: () => true }; 
    const hex = color.replace('#', '');
    if (hex.length !== 6) return { isLight: () => true }; 
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return { isLight: () => brightness > 155 };
};


export function ScheduledItemCard({ item, subject, timeSlot, index, onDelete, onCopy }: ScheduledItemCardProps) {
  if (!subject || !timeSlot) {
    return ( 
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

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    // DropdownMenuTrigger will handle opening
  };

  return (
    <Draggable draggableId={`scheduled-item-${item.id}`} index={index} type="SCHEDULED_ITEM">
      {(provided, snapshot) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              className={`p-2 rounded-md shadow-sm text-xs h-full flex flex-col justify-between border cursor-grab
                ${snapshot.isDragging ? 'ring-2 ring-offset-2 ring-primary shadow-xl' : ''}`}
              style={{ ...provided.draggableProps.style, ...cardStyle }}
              onContextMenu={handleContextMenu} // Prevent default, trigger menu
            >
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full h-full"> {/* Tooltip content area */}
                      <div>
                        <p className="font-semibold">{subject.name}</p>
                        <p className="opacity-80">{subject.teacher}</p>
                        {subject.code && <p className="opacity-60 text-[0.65rem]">[{subject.code}]</p>}
                      </div>
                      <div className="mt-1 flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150" data-role="actions-container">
                        <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-black/20" onClick={(e) => { e.stopPropagation(); onCopy(item); }}>
                          <CopyIcon className="h-3 w-3" />
                        </Button>
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
                    <p className="text-xs text-muted-foreground mt-1">Right-click for more options</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopy(item); }}>
              <CopyIcon className="mr-2 h-4 w-4" />
              <span>Copy Subject</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete Item</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </Draggable>
  );
}

    
