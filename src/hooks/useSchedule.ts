
"use client";

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import type { DropResult } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';
import useLocalStorage from './useLocalStorage';
import type { ScheduleData, Subject, TimeSlot, DaySetting, DayOfWeek, ScheduledItem } from '@/lib/types';
import { INITIAL_SCHEDULE_DATA, LOCAL_STORAGE_KEY, DAYS_OF_WEEK as VALID_DAYS_OF_WEEK } from '@/lib/config';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function useSchedule() {
  const [data, setData] = useLocalStorage<ScheduleData>(LOCAL_STORAGE_KEY, INITIAL_SCHEDULE_DATA);
  const [isLoaded, setIsLoaded] = useState(false);
  const [copiedItem, setCopiedItem] = useState<ScheduledItem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoaded(true);
  }, []);
  

  const addSubject = (subject: Omit<Subject, 'id'>) => {
    const newSubject = { ...subject, id: uuidv4() };
    setData(prev => ({ 
      ...prev, 
      subjects: [...prev.subjects, newSubject],
      settings: prev.settings || { customDayOrder: [...INITIAL_SCHEDULE_DATA.settings.customDayOrder] },
    }));
    toast({ title: "Subject Added", description: `${newSubject.name} has been added.` });
  };

  const updateSubject = (updatedSubject: Subject) => {
    setData(prev => ({
      ...prev,
      subjects: prev.subjects.map(s => s.id === updatedSubject.id ? { ...updatedSubject } : { ...s }),
      settings: prev.settings || { customDayOrder: [...INITIAL_SCHEDULE_DATA.settings.customDayOrder] },
    }));
    toast({ title: "Subject Updated", description: `${updatedSubject.name} has been updated.` });
  };

  const deleteSubject = (subjectId: string) => {
    setData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s.id !== subjectId),
      scheduledItems: prev.scheduledItems.filter(si => si.subjectId !== subjectId),
      settings: prev.settings || { customDayOrder: [...INITIAL_SCHEDULE_DATA.settings.customDayOrder] },
    }));
    toast({ title: "Subject Deleted", description: "Subject and its scheduled occurrences have been removed." });
  };

  const addTimeSlot = (timeSlot: Omit<TimeSlot, 'id'>) => {
    const overlaps = (data.timeSlots || []).some(ts => 
      (timeSlot.startTime < ts.endTime && timeSlot.endTime > ts.startTime)
    );
    if (overlaps) {
      toast({ variant: "destructive", title: "Error", description: "Time slot overlaps with an existing one." });
      return;
    }
    const newTimeSlot = { ...timeSlot, id: uuidv4() };
    setData(prev => ({ 
      ...prev, 
      timeSlots: [...(prev.timeSlots || []), newTimeSlot].sort((a,b) => a.startTime.localeCompare(b.startTime)),
      settings: prev.settings || { customDayOrder: [...INITIAL_SCHEDULE_DATA.settings.customDayOrder] },
    }));
    toast({ title: "Time Slot Added" });
  };

  const updateTimeSlot = (updatedTimeSlot: TimeSlot) => {
    setData(prev => ({
      ...prev,
      timeSlots: (prev.timeSlots || []).map(ts => ts.id === updatedTimeSlot.id ? { ...updatedTimeSlot } : { ...ts }).sort((a,b) => a.startTime.localeCompare(b.startTime)),
      settings: prev.settings || { customDayOrder: [...INITIAL_SCHEDULE_DATA.settings.customDayOrder] },
    }));
     toast({ title: "Time Slot Updated" });
  };

  const deleteTimeSlot = (timeSlotId: string) => {
    setData(prev => ({
      ...prev,
      timeSlots: (prev.timeSlots || []).filter(ts => ts.id !== timeSlotId),
      scheduledItems: (prev.scheduledItems || []).filter(si => si.timeSlotId !== timeSlotId),
      settings: prev.settings || { customDayOrder: [...INITIAL_SCHEDULE_DATA.settings.customDayOrder] },
    }));
    toast({ title: "Time Slot Deleted", description: "Time slot and its scheduled items have been removed." });
  };
  
  const updateDaySettings = (updatedDaySettingsFromModal: DaySetting[]) => {
    setData(prevScheduleData => {
      // Ensure all existing parts of schedule data are carried over as new copies
      const currentSubjects = prevScheduleData.subjects?.map(s => ({ ...s })) || [];
      const currentTimeSlots = prevScheduleData.timeSlots?.map(ts => ({ ...ts })) || [];
      const currentScheduledItems = prevScheduleData.scheduledItems?.map(si => ({ ...si })) || [];
      const currentSettings = prevScheduleData.settings || { customDayOrder: [...INITIAL_SCHEDULE_DATA.settings.customDayOrder] };
      
      // Create a new array of new day setting objects
      const newDaySettings = updatedDaySettingsFromModal.map(setting => ({ ...setting }));

      return {
        subjects: currentSubjects,
        timeSlots: currentTimeSlots,
        daySettings: newDaySettings, // new array with new objects
        scheduledItems: currentScheduledItems,
        settings: {
          ...currentSettings, // spread existing settings
          customDayOrder: currentSettings.customDayOrder ? [...currentSettings.customDayOrder] : [...INITIAL_SCHEDULE_DATA.settings.customDayOrder] // ensure customDayOrder is a new array
        },
      };
    });
    toast({ title: "Day Settings Updated" });
  };


  const updateCustomDayOrder = (newOrderFromModal: DayOfWeek[]) => {
     setData(prevScheduleData => {
      // Filter out any invalid days that might have been passed, and ensure no duplicates
      const newCustomOrder = newOrderFromModal
        .filter(day => (VALID_DAYS_OF_WEEK as ReadonlyArray<DayOfWeek>).includes(day))
        .reduce((acc: DayOfWeek[], current: DayOfWeek) => {
            if (!acc.includes(current)) acc.push(current);
            return acc;
        }, []);

      // Ensure all valid days are present in the order, adding missing ones to the end
      VALID_DAYS_OF_WEEK.forEach(validDay => {
        if (!newCustomOrder.includes(validDay)) {
          newCustomOrder.push(validDay);
        }
      });
      
      const currentSubjects = prevScheduleData.subjects?.map(s => ({ ...s })) || [];
      const currentTimeSlots = prevScheduleData.timeSlots?.map(ts => ({ ...ts })) || [];
      const currentScheduledItems = prevScheduleData.scheduledItems?.map(si => ({ ...si })) || [];
      const currentDaySettings = (prevScheduleData.daySettings || INITIAL_SCHEDULE_DATA.daySettings).map(ds => ({...ds}));

      return {
        subjects: currentSubjects,
        timeSlots: currentTimeSlots,
        daySettings: currentDaySettings,
        scheduledItems: currentScheduledItems,
        settings: {
          customDayOrder: newCustomOrder, // This is a new array
        },
      };
    });
    toast({ title: "Day Order Updated" });
  };

  const addScheduledItem = (item: Omit<ScheduledItem, 'id'>) => {
    const isOccupied = (data.scheduledItems || []).some(si => si.day === item.day && si.timeSlotId === item.timeSlotId);
    if (isOccupied) {
      toast({ variant: "destructive", title: "Slot Occupied", description: "This time slot is already taken." });
      return null;
    }
    const newScheduledItem = { ...item, id: uuidv4() };
    setData(prev => ({ 
        ...prev, 
        scheduledItems: [...(prev.scheduledItems || []), newScheduledItem],
        settings: prev.settings || { customDayOrder: [...INITIAL_SCHEDULE_DATA.settings.customDayOrder] },
    }));
    const subject = (data.subjects || []).find(s => s.id === item.subjectId);
    const timeSlot = (data.timeSlots || []).find(ts => ts.id === item.timeSlotId);
    toast({ title: "Item Scheduled", description: `${subject?.name || 'Subject'} scheduled for ${item.day} at ${timeSlot?.startTime}.`});
    return newScheduledItem;
  };
  
  const deleteScheduledItem = (itemId: string) => {
    const itemToDelete = (data.scheduledItems || []).find(si => si.id === itemId);
    if (!itemToDelete) return;
    const subject = (data.subjects || []).find(s => s.id === itemToDelete.subjectId);
    setData(prev => ({
      ...prev,
      scheduledItems: (prev.scheduledItems || []).filter(si => si.id !== itemId),
      settings: prev.settings || { customDayOrder: [...INITIAL_SCHEDULE_DATA.settings.customDayOrder] },
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
    const isDestDeleteZone = destinationDroppableId === 'subject-bank-delete-zone';

    if (!isSourceBank && isDestDeleteZone) {
      const itemIdToDelete = draggableId.replace('scheduled-item-', '');
      deleteScheduledItem(itemIdToDelete);
      return;
    }

    if (destinationDroppableId.startsWith('cell-')) {
      const [, destDayStr, destTimeSlotId] = destinationDroppableId.split('-');
      const destDay = destDayStr as DayOfWeek;
      const targetTimeSlot = (data.timeSlots || []).find(ts => ts.id === destTimeSlotId);

      if (targetTimeSlot?.isBreak) {
        toast({ variant: "destructive", title: "Operation Failed", description: "Cannot place items in a break slot." });
        return;
      }
      
      const existingItemInDest = (data.scheduledItems || []).find(si => si.day === destDay && si.timeSlotId === destTimeSlotId);
      const subjectIdFromBank = isSourceBank ? draggableId.replace('bank-subject-', '') : null;
      const movingItemId = !isSourceBank ? draggableId.replace('scheduled-item-', '') : null;
      const movingItemDetails = movingItemId ? (data.scheduledItems || []).find(si => si.id === movingItemId) : null;

      if (isSourceBank && subjectIdFromBank) { 
        if (existingItemInDest) {
          toast({ variant: "destructive", title: "Slot Occupied", description: "Drag from bank to an empty slot or swap existing items." });
          return;
        }
        const subject = (data.subjects || []).find(s => s.id === subjectIdFromBank);
        const addedItem = addScheduledItem({ subjectId: subjectIdFromBank, day: destDay, timeSlotId: destTimeSlotId });
        if (addedItem) {
            // Toast is handled by addScheduledItem
        }
      } else if (movingItemDetails) { 
        if (existingItemInDest) { 
          if (existingItemInDest.id === movingItemDetails.id) return; 
          setData(prev => ({
            ...prev,
            scheduledItems: (prev.scheduledItems || []).map(si => {
              if (si.id === movingItemDetails.id) return { ...si, day: destDay, timeSlotId: destTimeSlotId };
              if (si.id === existingItemInDest.id) return { ...si, day: movingItemDetails.day, timeSlotId: movingItemDetails.timeSlotId };
              return si;
            }).map(item => ({...item})), // Ensure new array of new objects
            settings: prev.settings || { customDayOrder: [...INITIAL_SCHEDULE_DATA.settings.customDayOrder] },
          }));
          toast({ title: "Items Swapped" });
        } else { 
          setData(prev => ({
            ...prev,
            scheduledItems: (prev.scheduledItems || []).map(si =>
              si.id === movingItemDetails.id ? { ...si, day: destDay, timeSlotId: destTimeSlotId } : si
            ).map(item => ({...item})), // Ensure new array of new objects
            settings: prev.settings || { customDayOrder: [...INITIAL_SCHEDULE_DATA.settings.customDayOrder] },
          }));
          toast({ title: "Item Moved" });
        }
      }
      return;
    }
  };

  const handleCopyItem = (itemToCopy: ScheduledItem) => {
    setCopiedItem({ ...itemToCopy }); 
    const subject = (data.subjects || []).find(s => s.id === itemToCopy.subjectId);
    toast({ title: "Item Copied", description: `${subject?.name || 'Item'} on ${itemToCopy.day} copied.` });
  };

  const handlePasteItem = (targetDay: DayOfWeek, targetTimeSlotId: string) => {
    if (!copiedItem) {
      toast({ variant: "destructive", title: "Paste Error", description: "No item copied to paste." });
      return;
    }

    const targetTimeSlot = (data.timeSlots || []).find(ts => ts.id === targetTimeSlotId);
    if (targetTimeSlot?.isBreak) {
      toast({ variant: "destructive", title: "Paste Error", description: "Cannot paste into a break slot." });
      return;
    }

    const isTargetOccupied = (data.scheduledItems || []).some(si => si.day === targetDay && si.timeSlotId === targetTimeSlotId);
    if (isTargetOccupied) {
      toast({ variant: "destructive", title: "Paste Error", description: "Target slot is already occupied." });
      return;
    }

    addScheduledItem({
      subjectId: copiedItem.subjectId,
      day: targetDay,
      timeSlotId: targetTimeSlotId,
    });
  };

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
      toast({ title: "Data Exported", description: "Your schedule has been exported as JSON." });
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
        
        const validatedData = {
            subjects: importedData.subjects || INITIAL_SCHEDULE_DATA.subjects.map(s => ({...s})),
            timeSlots: importedData.timeSlots || INITIAL_SCHEDULE_DATA.timeSlots.map(ts => ({...ts})),
            daySettings: importedData.daySettings || INITIAL_SCHEDULE_DATA.daySettings.map(ds => ({...ds})),
            scheduledItems: importedData.scheduledItems || INITIAL_SCHEDULE_DATA.scheduledItems.map(si => ({...si})),
            settings: {
              customDayOrder: importedData.settings?.customDayOrder || [...INITIAL_SCHEDULE_DATA.settings.customDayOrder],
            },
          };
          setData(validatedData);
        toast({ title: "Data Imported", description: "Your schedule has been imported successfully." });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Invalid file or data format.";
        toast({ variant: "destructive", title: "Import Error", description: errorMessage });
        console.error("Import error:", error);
      } finally {
        if (event.target) { 
            event.target.value = ''; 
        }
      }
    };
    reader.readAsText(file);
  };

  const exportAsImage = async (element: HTMLElement | null) => {
    if (!element) {
      toast({ variant: "destructive", title: "Image Export Error", description: "Schedule element not found." });
      return;
    }
    try {
      const canvas = await html2canvas(element, {
        logging: false,
        useCORS: true,
        scale: 2, 
        backgroundColor: '#E3F2FD' 
      });
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = 'routinely-schedule.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Image Exported", description: "Schedule exported as PNG." });
    } catch (error) {
      console.error("Error exporting as image:", error);
      toast({ variant: "destructive", title: "Image Export Error", description: "Could not export schedule as image." });
    }
  };

  const exportAsPdf = async (element: HTMLElement | null) => {
    if (!element) {
      toast({ variant: "destructive", title: "PDF Export Error", description: "Schedule element not found." });
      return;
    }
    try {
      toast({ title: "Generating PDF...", description: "Please wait a moment." });
      const canvas = await html2canvas(element, {
        logging: false,
        useCORS: true,
        scale: 2, // Increase scale for better resolution in PDF
        backgroundColor: '#E3F2FD'
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'landscape', // 'portrait' or 'landscape'
        unit: 'pt', // points, pixels (px), inches (in), mm, cm
        format: 'a4' // common page sizes: a3, a4, a5, letter, legal
      });

      const imgProps= pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate image dimensions to fit within the PDF page while maintaining aspect ratio
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const newImgWidth = imgWidth * ratio;
      const newImgHeight = imgHeight * ratio;

      // Center the image on the page
      const xOffset = (pdfWidth - newImgWidth) / 2;
      const yOffset = (pdfHeight - newImgHeight) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, newImgWidth, newImgHeight);
      pdf.save('routinely-schedule.pdf');
      toast({ title: "PDF Exported", description: "Schedule exported as PDF. This PDF contains an image of the current view. For a full, selectable PDF, use your browser's Print to PDF option." });
    } catch (error) {
      console.error("Error exporting as PDF:", error);
      toast({ variant: "destructive", title: "PDF Export Error", description: "Could not export schedule as PDF." });
    }
  };
  
  const sortedTimeSlots = useMemo(() => {
    return (data.timeSlots || INITIAL_SCHEDULE_DATA.timeSlots).slice().sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [data.timeSlots]);
  
  // Deep clone initial settings to prevent unintended mutations
  const initialDaySettingsCloned = useMemo(() => JSON.parse(JSON.stringify(INITIAL_SCHEDULE_DATA.daySettings)), []);
  const initialCustomDayOrderCloned = useMemo(() => JSON.parse(JSON.stringify(INITIAL_SCHEDULE_DATA.settings.customDayOrder)), []);


  // Reconcile daySettings: ensure all VALID_DAYS_OF_WEEK are present, using user data or defaults.
  const reconciledDaySettings: DaySetting[] = useMemo(() => {
    const userDaySettings = data.daySettings && Array.isArray(data.daySettings) ? 
                            JSON.parse(JSON.stringify(data.daySettings)) : 
                            [];

    return VALID_DAYS_OF_WEEK.map(validDayName => {
      const userSettingForThisDay = userDaySettings.find((ds: DaySetting) => ds.name === validDayName);
      const initialSettingForThisDay = initialDaySettingsCloned.find((is: DaySetting) => is.name === validDayName);
      
      let isActiveStatus = false; // Default to false if not found anywhere
      if (initialSettingForThisDay) { // Prioritize initial default for existence
          isActiveStatus = initialSettingForThisDay.isActive;
      }
      if (userSettingForThisDay !== undefined && typeof userSettingForThisDay.isActive === 'boolean') {
        // User setting overrides initial default's active status
        isActiveStatus = userSettingForThisDay.isActive;
      }
      
      return { name: validDayName, isActive: isActiveStatus };
    });
  }, [data.daySettings, initialDaySettingsCloned]);


  // Reconcile customDayOrder: ensure all VALID_DAYS_OF_WEEK are present, using user order or defaults.
  const reconciledCustomDayOrder: DayOfWeek[] = useMemo(() => {
    let sourceOrder = data.settings?.customDayOrder && Array.isArray(data.settings.customDayOrder) && data.settings.customDayOrder.length > 0 ?
                      JSON.parse(JSON.stringify(data.settings.customDayOrder)) :
                      initialCustomDayOrderCloned;
    
    // Filter out any days no longer in VALID_DAYS_OF_WEEK and remove duplicates
    let validDaysInOrder = (Array.isArray(sourceOrder) ? sourceOrder : [])
      .filter((dayName: DayOfWeek) => (VALID_DAYS_OF_WEEK as ReadonlyArray<DayOfWeek>).includes(dayName))
      .reduce((acc: DayOfWeek[], current: DayOfWeek) => {
          if (!acc.includes(current)) {
              acc.push(current);
          }
          return acc;
      }, []);
    
    // Ensure all current VALID_DAYS_OF_WEEK are included, adding missing ones to the end
    const finalOrderSet = new Set(validDaysInOrder);
    VALID_DAYS_OF_WEEK.forEach(validDayName => {
      finalOrderSet.add(validDayName); 
    });
    return Array.from(finalOrderSet);
  }, [data.settings?.customDayOrder, initialCustomDayOrderCloned]);


  return {
    isLoaded,
    subjects: data.subjects || [],
    timeSlots: sortedTimeSlots,
    daySettings: reconciledDaySettings,
    scheduledItems: data.scheduledItems || [],
    customDayOrder: reconciledCustomDayOrder, 
    copiedItem,
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
      handleCopyItem,
      handlePasteItem,
      exportAsImage,
      exportAsPdf,
    },
  };
}
