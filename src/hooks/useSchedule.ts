
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
      subjects: [...prev.subjects, newSubject].map(s => ({...s})),
      timeSlots: prev.timeSlots.map(ts => ({...ts})),
      daySettings: prev.daySettings.map(ds => ({...ds})),
      scheduledItems: prev.scheduledItems.map(si => ({...si})),
      settings: { 
        customDayOrder: prev.settings?.customDayOrder ? [...prev.settings.customDayOrder] : [...INITIAL_SCHEDULE_DATA.settings.customDayOrder],
      },
    }));
    toast({ title: "Subject Added", description: `${newSubject.name} has been added.` });
  };

  const updateSubject = (updatedSubject: Subject) => {
    setData(prev => ({
      subjects: prev.subjects.map(s => s.id === updatedSubject.id ? { ...updatedSubject } : { ...s }),
      timeSlots: prev.timeSlots.map(ts => ({...ts})),
      daySettings: prev.daySettings.map(ds => ({...ds})),
      scheduledItems: prev.scheduledItems.map(si => ({...si})),
      settings: { 
        customDayOrder: prev.settings?.customDayOrder ? [...prev.settings.customDayOrder] : [...INITIAL_SCHEDULE_DATA.settings.customDayOrder],
      },
    }));
    toast({ title: "Subject Updated", description: `${updatedSubject.name} has been updated.` });
  };

  const deleteSubject = (subjectId: string) => {
    setData(prev => ({
      subjects: prev.subjects.filter(s => s.id !== subjectId).map(s => ({...s})),
      timeSlots: prev.timeSlots.map(ts => ({...ts})),
      daySettings: prev.daySettings.map(ds => ({...ds})),
      scheduledItems: prev.scheduledItems.filter(si => si.subjectId !== subjectId).map(si => ({...si})),
      settings: { 
        customDayOrder: prev.settings?.customDayOrder ? [...prev.settings.customDayOrder] : [...INITIAL_SCHEDULE_DATA.settings.customDayOrder],
      },
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
      subjects: prev.subjects.map(s => ({...s})),
      timeSlots: [...(prev.timeSlots || []), newTimeSlot].sort((a,b) => a.startTime.localeCompare(b.startTime)).map(ts => ({...ts})),
      daySettings: prev.daySettings.map(ds => ({...ds})),
      scheduledItems: prev.scheduledItems.map(si => ({...si})),
      settings: { 
        customDayOrder: prev.settings?.customDayOrder ? [...prev.settings.customDayOrder] : [...INITIAL_SCHEDULE_DATA.settings.customDayOrder],
      },
    }));
    toast({ title: "Time Slot Added" });
  };

  const updateTimeSlot = (updatedTimeSlot: TimeSlot) => {
    setData(prev => ({
      subjects: prev.subjects.map(s => ({...s})),
      timeSlots: (prev.timeSlots || []).map(ts => ts.id === updatedTimeSlot.id ? { ...updatedTimeSlot } : { ...ts }).sort((a,b) => a.startTime.localeCompare(b.startTime)),
      daySettings: prev.daySettings.map(ds => ({...ds})),
      scheduledItems: prev.scheduledItems.map(si => ({...si})),
      settings: { 
        customDayOrder: prev.settings?.customDayOrder ? [...prev.settings.customDayOrder] : [...INITIAL_SCHEDULE_DATA.settings.customDayOrder],
      },
    }));
     toast({ title: "Time Slot Updated" });
  };

  const deleteTimeSlot = (timeSlotId: string) => {
    setData(prev => ({
      subjects: prev.subjects.map(s => ({...s})),
      timeSlots: (prev.timeSlots || []).filter(ts => ts.id !== timeSlotId).map(ts => ({...ts})),
      daySettings: prev.daySettings.map(ds => ({...ds})),
      scheduledItems: (prev.scheduledItems || []).filter(si => si.timeSlotId !== timeSlotId).map(si => ({...si})),
      settings: { 
        customDayOrder: prev.settings?.customDayOrder ? [...prev.settings.customDayOrder] : [...INITIAL_SCHEDULE_DATA.settings.customDayOrder],
      },
    }));
    toast({ title: "Time Slot Deleted", description: "Time slot and its scheduled items have been removed." });
  };
  
 const updateDaySettings = (updatedDaySettingsFromModal: DaySetting[]) => {
    setData(prevScheduleData => {
      const newDaySettings = updatedDaySettingsFromModal.map(setting => ({ ...setting }));
      return {
        subjects: prevScheduleData.subjects.map(s => ({ ...s })),
        timeSlots: prevScheduleData.timeSlots.map(ts => ({ ...ts })),
        daySettings: newDaySettings,
        scheduledItems: prevScheduleData.scheduledItems.map(si => ({ ...si })),
        settings: {
          customDayOrder: prevScheduleData.settings?.customDayOrder 
            ? [...prevScheduleData.settings.customDayOrder] 
            : [...INITIAL_SCHEDULE_DATA.settings.customDayOrder],
        },
      };
    });
    toast({ title: "Day Settings Updated" });
  };


  const updateCustomDayOrder = (newOrderFromModal: DayOfWeek[]) => {
     setData(prevScheduleData => {
      const currentValidDays = VALID_DAYS_OF_WEEK as ReadonlyArray<DayOfWeek>;
      
      const newCustomOrder = newOrderFromModal
        .filter(day => currentValidDays.includes(day))
        .reduce((acc: DayOfWeek[], current: DayOfWeek) => {
            if (!acc.includes(current)) acc.push(current);
            return acc;
        }, []);

      currentValidDays.forEach(validDay => {
        if (!newCustomOrder.includes(validDay)) {
          newCustomOrder.push(validDay);
        }
      });
      
      return {
        subjects: prevScheduleData.subjects.map(s => ({ ...s })),
        timeSlots: prevScheduleData.timeSlots.map(ts => ({ ...ts })),
        daySettings: prevScheduleData.daySettings.map(ds => ({...ds})),
        scheduledItems: prevScheduleData.scheduledItems.map(si => ({ ...si })),
        settings: {
          customDayOrder: newCustomOrder,
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
        subjects: prev.subjects.map(s => ({...s})),
        timeSlots: prev.timeSlots.map(ts => ({...ts})),
        daySettings: prev.daySettings.map(ds => ({...ds})),
        scheduledItems: [...(prev.scheduledItems || []), newScheduledItem].map(si => ({...si})),
        settings: { 
          customDayOrder: prev.settings?.customDayOrder ? [...prev.settings.customDayOrder] : [...INITIAL_SCHEDULE_DATA.settings.customDayOrder],
        },
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
      subjects: prev.subjects.map(s => ({...s})),
      timeSlots: prev.timeSlots.map(ts => ({...ts})),
      daySettings: prev.daySettings.map(ds => ({...ds})),
      scheduledItems: (prev.scheduledItems || []).filter(si => si.id !== itemId).map(si => ({...si})),
      settings: { 
        customDayOrder: prev.settings?.customDayOrder ? [...prev.settings.customDayOrder] : [...INITIAL_SCHEDULE_DATA.settings.customDayOrder],
      },
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
          toast({ variant: "destructive", title: "Slot Occupied", description: "Target slot is already occupied. Drag from bank to an empty slot." });
          return;
        }
        addScheduledItem({ subjectId: subjectIdFromBank, day: destDay, timeSlotId: destTimeSlotId });
      } else if (movingItemDetails) { 
        setData(prev => {
            const newScheduledItems = prev.scheduledItems.map(si => {
            if (si.id === movingItemDetails.id) { // Item being moved
              return { ...si, day: destDay, timeSlotId: destTimeSlotId };
            }
            if (existingItemInDest && si.id === existingItemInDest.id) { // Item currently in destination, needs to move to source
              return { ...si, day: movingItemDetails.day, timeSlotId: movingItemDetails.timeSlotId };
            }
            return si; // Unchanged item
          }).map(item => ({...item}));
          
          return {
            ...prev,
            scheduledItems: newScheduledItems,
            settings: { 
              customDayOrder: prev.settings?.customDayOrder ? [...prev.settings.customDayOrder] : [...INITIAL_SCHEDULE_DATA.settings.customDayOrder],
            },
          };
        });
        toast({ title: existingItemInDest ? "Items Swapped" : "Item Moved" });
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
        
        const currentValidDays = VALID_DAYS_OF_WEEK as ReadonlyArray<DayOfWeek>;

        const reconciledDaySettingsImport = currentValidDays.map(validDayName => {
          const importedSetting = (importedData.daySettings || []).find(ds => ds.name === validDayName);
          const initialSetting = INITIAL_SCHEDULE_DATA.daySettings.find(is => is.name === validDayName);
          return {
            name: validDayName,
            isActive: importedSetting?.isActive ?? initialSetting?.isActive ?? false,
          };
        }).map(ds => ({...ds}));

        const reconciledCustomDayOrderImport = (importedData.settings?.customDayOrder || INITIAL_SCHEDULE_DATA.settings.customDayOrder)
          .filter(day => currentValidDays.includes(day))
          .reduce((acc: DayOfWeek[], day) => acc.includes(day) ? acc : [...acc, day], []);
        currentValidDays.forEach(day => {
          if (!reconciledCustomDayOrderImport.includes(day)) reconciledCustomDayOrderImport.push(day);
        });
        
        const validatedData = {
            subjects: (importedData.subjects || INITIAL_SCHEDULE_DATA.subjects).map(s => ({...s})),
            timeSlots: (importedData.timeSlots || INITIAL_SCHEDULE_DATA.timeSlots).map(ts => ({...ts})),
            daySettings: reconciledDaySettingsImport,
            scheduledItems: (importedData.scheduledItems || INITIAL_SCHEDULE_DATA.scheduledItems).map(si => ({...si})).filter(si => currentValidDays.includes(si.day)),
            settings: {
              customDayOrder: reconciledCustomDayOrderImport,
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

  const exportAsImage = async (getElement: () => HTMLElement | null) => {
    const element = getElement();
    if (!element) {
      toast({ variant: "destructive", title: "Image Export Error", description: "Schedule element reference is null." });
      return;
    }
     if (!document.body.contains(element)) {
      toast({ variant: "destructive", title: "Image Export Error", description: "Schedule element not found in document. Please try again." });
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

  const exportAsPdf = async (getElement: () => HTMLElement | null) => {
    const element = getElement(); 

    if (!element) {
      toast({ variant: "destructive", title: "PDF Export Error", description: "Schedule element reference is null." });
      return;
    }
    
    try {
      toast({ title: "Generating PDF...", description: "Please wait a moment." });

      if (!document.body.contains(element)) {
          toast({ variant: "destructive", title: "PDF Export Error", description: "Schedule element became detached. Please try again." });
          return;
      }

      const canvas = await html2canvas(element, {
        logging: false,
        useCORS: true,
        scale: 2, 
        backgroundColor: '#E3F2FD'
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'landscape', 
        unit: 'pt', 
        format: 'a4' 
      });

      const imgProps= pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const newImgWidth = imgWidth * ratio;
      const newImgHeight = imgHeight * ratio;

      const xOffset = (pdfWidth - newImgWidth) / 2;
      const yOffset = (pdfHeight - newImgHeight) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, newImgWidth, newImgHeight);
      pdf.save('routinely-schedule.pdf');
      toast({ title: "PDF Exported", description: "Schedule exported as PDF." });
    } catch (error) {
      console.error("Error exporting as PDF:", error);
      toast({ variant: "destructive", title: "PDF Export Error", description: "Could not export schedule as PDF." });
    }
  };

  const exportAsSimplifiedPdf = async (getElement: () => HTMLElement | null) => {
    const element = getElement(); 

    if (!element) {
      toast({ variant: "destructive", title: "Simplified PDF Export Error", description: "Schedule element reference is null." });
      return;
    }
    
    try {
      toast({ title: "Generating Simplified PDF...", description: "Please wait a moment." });

      if (!document.body.contains(element)) {
          toast({ variant: "destructive", title: "Simplified PDF Export Error", description: "Schedule element became detached. Please try again." });
          return;
      }

      const canvas = await html2canvas(element, {
        logging: false,
        useCORS: true,
        scale: 2, 
        backgroundColor: '#FFFFFF' // Force white background
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'landscape', 
        unit: 'pt', 
        format: 'a4' 
      });

      const imgProps= pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const newImgWidth = imgWidth * ratio;
      const newImgHeight = imgHeight * ratio;

      const xOffset = (pdfWidth - newImgWidth) / 2;
      const yOffset = (pdfHeight - newImgHeight) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, newImgWidth, newImgHeight);
      pdf.save('routinely-schedule-simplified.pdf');
      toast({ title: "Simplified PDF Exported", description: "Schedule exported as a simplified PDF." });
    } catch (error) {
      console.error("Error exporting as simplified PDF:", error);
      toast({ variant: "destructive", title: "Simplified PDF Export Error", description: "Could not export schedule as simplified PDF." });
    }
  };
  
  const sortedTimeSlots = useMemo(() => {
    const timeSlotsToUse = data.timeSlots && data.timeSlots.length > 0 ? data.timeSlots : INITIAL_SCHEDULE_DATA.timeSlots;
    return [...timeSlotsToUse].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [data.timeSlots]);
  
  const initialDaySettingsCloned = useMemo(() => JSON.parse(JSON.stringify(INITIAL_SCHEDULE_DATA.daySettings)), []);
  const initialCustomDayOrderCloned = useMemo(() => JSON.parse(JSON.stringify(INITIAL_SCHEDULE_DATA.settings.customDayOrder)), []);


  const reconciledDaySettings: DaySetting[] = useMemo(() => {
    const currentValidDays = VALID_DAYS_OF_WEEK as ReadonlyArray<DayOfWeek>;
    const userDaySettings = data.daySettings && Array.isArray(data.daySettings) 
                            ? JSON.parse(JSON.stringify(data.daySettings)) 
                            : [];

    return currentValidDays.map(validDayName => {
      const userSettingForThisDay = userDaySettings.find((ds: DaySetting) => ds.name === validDayName);
      const initialSettingForThisDay = initialDaySettingsCloned.find((is: DaySetting) => is.name === validDayName);
      
      let isActiveStatus = initialSettingForThisDay?.isActive ?? false; 

      if (userSettingForThisDay !== undefined && typeof userSettingForThisDay.isActive === 'boolean') {
        isActiveStatus = userSettingForThisDay.isActive;
      }
      
      return { name: validDayName, isActive: isActiveStatus };
    });
  }, [data.daySettings, initialDaySettingsCloned]);


  const reconciledCustomDayOrder: DayOfWeek[] = useMemo(() => {
    const currentValidDays = VALID_DAYS_OF_WEEK as ReadonlyArray<DayOfWeek>;
    let sourceOrder = data.settings?.customDayOrder && Array.isArray(data.settings.customDayOrder) && data.settings.customDayOrder.length > 0 
                      ? JSON.parse(JSON.stringify(data.settings.customDayOrder)) 
                      : initialCustomDayOrderCloned;
    
    let validDaysInOrder = (Array.isArray(sourceOrder) ? sourceOrder : [])
      .filter((dayName: DayOfWeek) => currentValidDays.includes(dayName))
      .reduce((acc: DayOfWeek[], current: DayOfWeek) => {
          if (!acc.includes(current)) acc.push(current);
          return acc;
      }, []);
    
    const finalOrderSet = new Set<DayOfWeek>();
    validDaysInOrder.forEach(day => finalOrderSet.add(day)); 
    currentValidDays.forEach(validDayName => finalOrderSet.add(validDayName)); 

    return Array.from(finalOrderSet);
  }, [data.settings?.customDayOrder, initialCustomDayOrderCloned]);


  return {
    isLoaded,
    subjects: data.subjects || [],
    timeSlots: sortedTimeSlots,
    daySettings: reconciledDaySettings,
    scheduledItems: (data.scheduledItems || []).filter(si => (VALID_DAYS_OF_WEEK as ReadonlyArray<DayOfWeek>).includes(si.day)),
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
      exportAsSimplifiedPdf,
    },
  };
}
