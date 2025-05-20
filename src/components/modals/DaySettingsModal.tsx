
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
    if (isOpen) { // Only reset when modal opens or critical props change
      setCurrentDaySettings(JSON.parse(JSON.stringify(initialDaySettings))); // Deep copy
      setCurrentDayOrder([...initialCustomDayOrder]); // Shallow copy is fine for array of strings
    }
  }, [isOpen, initialDaySettings, initialCustomDayOrder]);


  const handleToggleActive = (dayName: DayOfWeek) => {
    setCurrentDaySettings(prev =>
      prev.map(day =>
        day.name === dayName ? { ...day, isActive: !day.isActive } : day
      )
    );
  };

  const handleToggleWorkingDay = (dayName: DayOfWeek) => {
    setCurrentDaySettings(prev =>
      prev.map(day =>
        day.name === dayName ? { ...day, isWorkingDay: !day.isWorkingDay } : day
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Days</DialogTitle>
          <DialogDescription>
            Activate/deactivate days, mark as working/non-working, and reorder their display.
          </DialogDescription>
        </DialogHeader>
        
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
                                <div>
                                  <Label htmlFor={`working-${dayName}`} className="text-xs mr-2">Working</Label>
                                  <Switch
                                    id={`working-${dayName}`}
                                    checked={daySetting.isWorkingDay}
                                    onCheckedChange={() => handleToggleWorkingDay(dayName)}
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

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

