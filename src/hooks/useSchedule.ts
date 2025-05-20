"use client";

import { useCallback, useEffect, useState } from 'react';
import type { DropResult } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid'; // Needs: npm install uuid && npm install --save-dev @types/uuid
import useLocalStorage from './useLocalStorage';
import type { ScheduleData, Subject, TimeSlot, DaySetting, ScheduledItem, DayOfWeek } from '@/lib/types';
import { INITIAL_SCHEDULE_DATA, LOCAL_STORAGE_KEY } from '@/lib/config';
import { useToast } from '@/hooks/use-toast';

// Ensure uuid is installed: npm install uuid @types/uuid
// If not, replace uuidv4() with a simpler unique ID generator for now.
// For simplicity, a basic ID generator if uuid is not available:
// const generateId = () => Math.random().toString(36).substr(2, 9);


export function useSchedule() {
  const [data, setData] = useLocalStorage<ScheduleData>(LOCAL_STORAGE_KEY, INITIAL_SCHEDULE_DATA);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // This ensures that the hook uses the data from localStorage after initial mount
    // and helps avoid hydration issues with server-rendered initial state vs client localStorage state.
    setIsLoaded(true); 
  }, []);
  
  const updateData = useCallback((newData: Partial<ScheduleData> | ((prev: ScheduleData) => ScheduleData)) => {
    if (typeof newData === 'function') {
      setData(prev => ({ ...prev, ...newData(prev) }));
    } else {
      setData(prev => ({ ...prev, ...newData }));
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
      scheduledItems: prev.scheduledItems.filter(si => si.subjectId !== subjectId), // Also remove from schedule
    }));
    toast({ title: "Subject Deleted", description: "Subject and its scheduled occurrences have been removed." });
  };

  // Time Slot Management
  const addTimeSlot = (timeSlot: Omit<TimeSlot, 'id'>) => {
    // Basic overlap validation (can be more sophisticated)
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
      scheduledItems: prev.scheduledItems.filter(si => si.timeSlotId !== timeSlotId), // Also remove from schedule
    }));
    toast({ title: "Time Slot Deleted", description: "Time slot and its scheduled items have been removed." });
  };
  
  // Day Settings Management
  const updateDaySettings = (updatedDaySettings: DaySetting[]) => {
    updateData({ daySettings: updatedDaySettings });
  };

  const updateCustomDayOrder = (newOrder: DayOfWeek[]) => {
    updateData(prev => ({...prev, settings: { ...prev.settings, customDayOrder: newOrder }}));
  };

  // Scheduled Item Management
  const addScheduledItem = (item: Omit<ScheduledItem, 'id'>) => {
    // Check if slot is already occupied
    const isOccupied = data.scheduledItems.some(si => si.day === item.day && si.timeSlotId === item.timeSlotId);
    if (isOccupied) {
      toast({ variant: "destructive", title: "Slot Occupied", description: "This time slot is already taken." });
      return null;
    }
    const newScheduledItem = { ...item, id: uuidv4() };
    updateData(prev => ({ ...prev, scheduledItems: [...prev.scheduledItems, newScheduledItem] }));
    return newScheduledItem;
  };
  
  const deleteScheduledItem = (itemId: string) => {
    updateData(prev => ({
      ...prev,
      scheduledItems: prev.scheduledItems.filter(si => si.id !== itemId),
    }));
    toast({ title: "Item Removed", description: "Scheduled item removed." });
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    const sourceIsBank = source.droppableId === 'subject-bank';
    const [type, day, timeSlotId] = destination.droppableId.split('-'); // e.g., "cell-Monday-slot1"
    
    if (sourceIsBank && type === 'cell') { // Dragging from bank to schedule
      const subjectId = draggableId.replace('bank-subject-', '');
      addScheduledItem({ subjectId, day: day as DayOfWeek, timeSlotId });
    } else if (!sourceIsBank && type === 'cell') { // Moving within schedule
      const itemIdToMove = draggableId.replace('scheduled-item-', '');
      const currentItem = data.scheduledItems.find(si => si.id === itemIdToMove);
      if (!currentItem) return;

      // Check if destination is occupied by another item (excluding itself)
      const isDestinationOccupied = data.scheduledItems.some(
        si => si.id !== itemIdToMove && si.day === (day as DayOfWeek) && si.timeSlotId === timeSlotId
      );

      if (isDestinationOccupied) {
        toast({ variant: "destructive", title: "Slot Occupied", description: "Cannot move to an occupied slot." });
        return;
      }
      
      updateData(prev => ({
        ...prev,
        scheduledItems: prev.scheduledItems.map(si => 
          si.id === itemIdToMove ? { ...si, day: day as DayOfWeek, timeSlotId } : si
        ),
      }));
    } else if (!sourceIsBank && destination.droppableId === 'subject-bank-delete-zone') { // Dragging from schedule to delete zone (simulated)
        const itemIdToDelete = draggableId.replace('scheduled-item-', '');
        deleteScheduledItem(itemIdToDelete);
    }
    // Potentially handle reordering days in DaySettingsModal if using dnd there too
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
        // TODO: Add validation for importedData structure using Zod or similar
        setData(importedData);
        toast({ title: "Data Imported", description: "Your schedule has been imported successfully." });
      } catch (error) {
        toast({ variant: "destructive", title: "Import Error", description: "Invalid file or data format." });
        console.error("Import error:", error);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };
  
  // Provide sorted time slots for rendering
  const sortedTimeSlots = [...data.timeSlots].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const activeDays = data.settings.customDayOrder.filter(dayName => data.daySettings.find(ds => ds.name === dayName)?.isActive);


  return {
    isLoaded,
    data,
    subjects: data.subjects,
    timeSlots: sortedTimeSlots,
    daySettings: data.daySettings,
    scheduledItems: data.scheduledItems,
    customDayOrder: data.settings.customDayOrder,
    activeDays,
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
