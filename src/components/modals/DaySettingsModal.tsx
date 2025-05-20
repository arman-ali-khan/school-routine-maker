
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { DaySetting, DayOfWeek } from '@/lib/types';
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';
import { GripVertical } from 'lucide-react';
import { ClientOnly } from '@/components/ClientOnly';
import { ScrollArea } from '@/components/ui/scroll-area';


interface DaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  daySettings: DaySetting[];
  customDayOrder: DayOfWeek[];
  updateDaySettings: (settings: DaySetting[]) => void;
  updateCustomDayOrder: (order: DayOfWeek[]) => void;
}

export function DaySettingsModal({ 
  isOpen, 
  onClose, 
  daySettings: initialDaySettings, 
  customDayOrder: initialCustomDayOrder,
  updateDaySettings, 
  updateCustomDayOrder 
}: DaySettingsModalProps) {
  const [currentDaySettings, setCurrentDaySettings] = useState<DaySetting[]>([]);
  const [currentDayOrder, setCurrentDayOrder] = useState<DayOfWeek[]>([]);

  useEffect(() => {
    if (isOpen) { 
      // Deep copy for daySettings to ensure the modal edits a true local copy
      setCurrentDaySettings(JSON.parse(JSON.stringify(initialDaySettings))); 
      setCurrentDayOrder([...initialCustomDayOrder]); 
    }
  }, [isOpen, initialDaySettings, initialCustomDayOrder]);


  const handleToggleActive = (dayName: DayOfWeek) => {
    setCurrentDaySettings(prev =>
      prev.map(day =>
        day.name === dayName ? { ...day, isActive: !day.isActive } : day
      )
    );
  };

  const handleSaveChanges = () => {
    updateDaySettings(currentDaySettings);
    updateCustomDayOrder(currentDayOrder);
    onClose();
  };
  
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(currentDayOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setCurrentDayOrder(items);
  };
  
  const getDaySetting = (dayName: DayOfWeek): DaySetting | undefined => {
    return currentDaySettings.find(ds => ds.name === dayName);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {if (!open) onClose();}}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Days</DialogTitle>
          <DialogDescription>
            Activate or deactivate days and reorder their display in the schedule.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow min-h-0"> 
          <div className="py-4">
            <ClientOnly fallback={<div className="p-4 text-center">Loading day settings...</div>}>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable 
                  droppableId="daysOrder" 
                  isDropDisabled={false} 
                  isCombineEnabled={false} 
                  ignoreContainerClipping={false}
                >
                  {(provided) => (
                    <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                      {currentDayOrder.map((dayName, index) => {
                        const daySetting = getDaySetting(dayName);
                        if (!daySetting) return null;
                        
                        return (
                          <Draggable key={dayName} draggableId={dayName} index={index}>
                            {(providedDraggable, snapshot) => (
                              <li
                                ref={providedDraggable.innerRef}
                                {...providedDraggable.draggableProps}
                                className={`flex items-center justify-between p-3 rounded-md border bg-card ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                              >
                                <div className="flex items-center gap-2">
                                  <button {...providedDraggable.dragHandleProps} className="p-1 cursor-grab active:cursor-grabbing">
                                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                                  </button>
                                  <span className="font-medium">{daySetting.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div>
                                    <Label htmlFor={`active-${dayName}`} className="text-xs mr-2">Active</Label>
                                    <Switch
                                      id={`active-${dayName}`}
                                      checked={daySetting.isActive}
                                      onCheckedChange={() => handleToggleActive(dayName)}
                                    />
                                  </div>
                                </div>
                              </li>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </ul>
                  )}
                </Droppable>
              </DragDropContext>
            </ClientOnly>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-auto pt-4"> 
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
