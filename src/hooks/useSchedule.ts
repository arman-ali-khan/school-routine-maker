
"use client";

import { useCallback, useEffect, useState } from 'react';
import type { DropResult } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';
import useLocalStorage from './useLocalStorage';
import type { ScheduleData, Subject, TimeSlot, DaySetting, ScheduledItem, DayOfWeek } from '@/lib/types';
import { INITIAL_SCHEDULE_DATA, LOCAL_STORAGE_KEY } from '@/lib/config';
import { useToast } from '@/hooks/use-toast';

export function useSchedule() {
  const [data, setData] = useLocalStorage<ScheduleData>(LOCAL_STORAGE_KEY, INITIAL_SCHEDULE_DATA);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoaded(true); 
  }, []);
  
  const updateData = useCallback((newData: Partial<ScheduleData> | ((prev: ScheduleData) => ScheduleData)) => {
    if (typeof newData === 'function') {
      setData(prevData => {
        const updated = newData(prevData);
        // Ensure customDayOrder is always present in settings
        if (updated.settings && !updated.settings.customDayOrder) {
          updated.settings.customDayOrder = prevData.settings?.customDayOrder || INITIAL_SCHEDULE_DATA.settings.customDayOrder;
        } else if (!updated.settings) {
          updated.settings = { customDayOrder: prevData.settings?.customDayOrder || INITIAL_SCHEDULE_DATA.settings.customDayOrder };
        }
        return { ...prevData, ...updated };
      });
    } else {
      setData(prevData => {
        const updated = { ...prevData, ...newData };
         // Ensure customDayOrder is always present in settings
        if (updated.settings && !updated.settings.customDayOrder) {
          updated.settings.customDayOrder = prevData.settings?.customDayOrder || INITIAL_SCHEDULE_DATA.settings.customDayOrder;
        } else if (!updated.settings) {
          updated.settings = { customDayOrder: prevData.settings?.customDayOrder || INITIAL_SCHEDULE_DATA.settings.customDayOrder };
        }
        return updated;
      });
    }
  }, [setData]);

  // Subject Management
  const addSubject = (subject: Omit<Subject, 'id'>) => {
    const newSubject = { ...subject, id: uuidv4() };
    updateData(prev => ({ ...prev, subjects: [...prev.subjects, newSubject] }));
    toast({ title: "Subject Added", description: `${newSubject.name} has been added.` });
  };

  const updateSubject = (updatedSubject: Subject) => {
    updateData(prev => ({
      ...prev,
      subjects: prev.subjects.map(s => s.id === updatedSubject.id ? updatedSubject : s),
    }));
    toast({ title: "Subject Updated", description: `${updatedSubject.name} has been updated.` });
  };

  const deleteSubject = (subjectId: string) => {
    updateData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s.id !== subjectId),
      scheduledItems: prev.scheduledItems.filter(si => si.subjectId !== subjectId),
    }));
    toast({ title: "Subject Deleted", description: "Subject and its scheduled occurrences have been removed." });
  };

  // Time Slot Management
  const addTimeSlot = (timeSlot: Omit<TimeSlot, 'id'>) => {
    const overlaps = data.timeSlots.some(ts => 
      (timeSlot.startTime < ts.endTime && timeSlot.endTime > ts.startTime)
    );
    if (overlaps) {
      toast({ variant: "destructive", title: "Error", description: "Time slot overlaps with an existing one." });
      return;
    }
    const newTimeSlot = { ...timeSlot, id: uuidv4() };
    updateData(prev => ({ ...prev, timeSlots: [...prev.timeSlots, newTimeSlot].sort((a,b) => a.startTime.localeCompare(b.startTime)) }));
    toast({ title: "Time Slot Added" });
  };

  const updateTimeSlot = (updatedTimeSlot: TimeSlot) => {
    updateData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map(ts => ts.id === updatedTimeSlot.id ? updatedTimeSlot : ts).sort((a,b) => a.startTime.localeCompare(b.startTime)),
    }));
     toast({ title: "Time Slot Updated" });
  };

  const deleteTimeSlot = (timeSlotId: string) => {
    updateData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter(ts => ts.id !== timeSlotId),
      scheduledItems: prev.scheduledItems.filter(si => si.timeSlotId !== timeSlotId),
    }));
    toast({ title: "Time Slot Deleted", description: "Time slot and its scheduled items have been removed." });
  };
  
  // Day Settings Management
  const updateDaySettings = (updatedDaySettings: DaySetting[]) => {
    updateData(prev => ({ ...prev, daySettings: updatedDaySettings }));
  };

  const updateCustomDayOrder = (newOrder: DayOfWeek[]) => {
    updateData(prev => ({...prev, settings: { ...prev.settings, customDayOrder: newOrder }}));
  };

  // Scheduled Item Management
  const addScheduledItem = (item: Omit<ScheduledItem, 'id'>) => {
    const isOccupied = data.scheduledItems.some(si => si.day === item.day && si.timeSlotId === item.timeSlotId);
    if (isOccupied) {
      toast({ variant: "destructive", title: "Slot Occupied", description: "This time slot is already taken." });
      return null;
    }
    const newScheduledItem = { ...item, id: uuidv4() };
    updateData(prev => ({ ...prev, scheduledItems: [...prev.scheduledItems, newScheduledItem] }));
    const subject = data.subjects.find(s => s.id === item.subjectId);
    toast({ title: "Item Scheduled", description: `${subject?.name || 'Subject'} scheduled for ${item.day} at ${data.timeSlots.find(ts=>ts.id === item.timeSlotId)?.startTime}.`});
    return newScheduledItem;
  };
  
  const deleteScheduledItem = (itemId: string) => {
    const itemToDelete = data.scheduledItems.find(si => si.id === itemId);
    if (!itemToDelete) return;
    const subject = data.subjects.find(s => s.id === itemToDelete.subjectId);
    updateData(prev => ({
      ...prev,
      scheduledItems: prev.scheduledItems.filter(si => si.id !== itemId),
    }));
    toast({ title: "Item Removed", description: `${subject?.name || 'Item'} on ${itemToDelete.day} removed from schedule.` });
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return; 

    const sourceDroppableId = source.droppableId;
    const destinationDroppableId = destination.droppableId;

    if (sourceDroppableId === destinationDroppableId && source.index === destination.index) {
      return; 
    }

    const isSourceBank = sourceDroppableId === 'subject-bank';
    
    if (destinationDroppableId.startsWith('cell-')) {
      const [, destDayStr, destTimeSlotId] = destinationDroppableId.split('-');
      const destDay = destDayStr as DayOfWeek;

      const targetTimeSlot = data.timeSlots.find(ts => ts.id === destTimeSlotId);
      if (targetTimeSlot?.isBreak) {
        toast({ variant: "destructive", title: "Operation Failed", description: "Cannot place items in a break slot." });
        return;
      }

      if (isSourceBank) { 
        const subjectId = draggableId.replace('bank-subject-', '');
        addScheduledItem({ subjectId, day: destDay, timeSlotId: destTimeSlotId }); 
      } else { 
        const itemIdToMove = draggableId.replace('scheduled-item-', '');
        const itemToMoveDetails = data.scheduledItems.find(si => si.id === itemIdToMove);

        if (!itemToMoveDetails) return; 

        const occupyingItem = data.scheduledItems.find(
          si => si.day === destDay && si.timeSlotId === destTimeSlotId
        );

        if (occupyingItem) { 
          if (occupyingItem.id === itemIdToMove) return; 

          updateData(prev => ({
            ...prev,
            scheduledItems: prev.scheduledItems.map(si => {
              if (si.id === itemIdToMove) {
                return { ...si, day: destDay, timeSlotId: destTimeSlotId };
              }
              if (si.id === occupyingItem.id) {
                return { ...si, day: itemToMoveDetails.day, timeSlotId: itemToMoveDetails.timeSlotId };
              }
              return si;
            }),
          }));
          toast({ title: "Items Swapped", description: "Scheduled items have been swapped." });
        } else { 
          updateData(prev => ({
            ...prev,
            scheduledItems: prev.scheduledItems.map(si =>
              si.id === itemIdToMove ? { ...si, day: destDay, timeSlotId: destTimeSlotId } : si
            ),
          }));
          toast({ title: "Item Moved", description: "Scheduled item moved to new slot." });
        }
      }
    } else if (destinationDroppableId === 'subject-bank-delete-zone') { 
      if (!isSourceBank) { 
        const itemIdToDelete = draggableId.replace('scheduled-item-', '');
        deleteScheduledItem(itemIdToDelete); 
      }
    }
  };

  // Export/Import
  const exportData = () => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'routinely-schedule.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Data Exported", description: "Your schedule has been exported." });
    } catch (error) {
      toast({ variant: "destructive", title: "Export Error", description: "Could not export data." });
      console.error("Export error:", error);
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const importedData = JSON.parse(jsonString) as ScheduleData;
        // Basic validation: Check for essential keys
        if (
          typeof importedData.subjects === 'undefined' ||
          typeof importedData.timeSlots === 'undefined' ||
          typeof importedData.daySettings === 'undefined' ||
          typeof importedData.scheduledItems === 'undefined' ||
          typeof importedData.settings?.customDayOrder === 'undefined'
        ) {
          throw new Error("Invalid data structure: Missing essential properties.");
        }
        // Further validation with Zod would be ideal here
        setData(importedData);
        toast({ title: "Data Imported", description: "Your schedule has been imported successfully." });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Invalid file or data format.";
        toast({ variant: "destructive", title: "Import Error", description: errorMessage });
        console.error("Import error:", error);
      }
    };
    reader.readAsText(file);
    if (event.target) { // Ensure event.target is not null
        event.target.value = ''; 
    }
  };
  
  const sortedTimeSlots = data.timeSlots ? [...data.timeSlots].sort((a, b) => a.startTime.localeCompare(b.startTime)) : [];
  const customDayOrder = data.settings?.customDayOrder || INITIAL_SCHEDULE_DATA.settings.customDayOrder;
  const daySettings = data.daySettings || INITIAL_SCHEDULE_DATA.daySettings;
  const activeDays = customDayOrder.filter(dayName => daySettings.find(ds => ds.name === dayName)?.isActive);


  return {
    isLoaded,
    // Ensure all parts of data are available even if localStorage is empty or corrupted initially
    subjects: data.subjects || [],
    timeSlots: sortedTimeSlots,
    daySettings: daySettings,
    scheduledItems: data.scheduledItems || [],
    customDayOrder: customDayOrder,
    activeDays, // This will be an empty array if customDayOrder or daySettings are not loaded
    actions: {
      addSubject,
      updateSubject,
      deleteSubject,
      addTimeSlot,
      updateTimeSlot,
      deleteTimeSlot,
      updateDaySettings,
      updateCustomDayOrder,
      addScheduledItem,
      deleteScheduledItem,
      handleDragEnd,
      exportData,
      importData,
    },
  };
}

