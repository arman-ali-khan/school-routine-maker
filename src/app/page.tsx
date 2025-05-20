
"use client";

import React, { useState, useRef } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { useSchedule } from '@/hooks/useSchedule';
import { AppHeader } from '@/components/layout/AppHeader';
import { SubjectBank } from '@/components/subjects/SubjectBank';
import { ScheduleView } from '@/components/schedule/ScheduleView';
import { SubjectModal } from '@/components/modals/SubjectModal';
import { TimeSlotModal } from '@/components/modals/TimeSlotModal';
import { DaySettingsModal } from '@/components/modals/DaySettingsModal';
import { ClientOnly } from '@/components/ClientOnly';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from '@/components/ui/toaster';

export default function HomePage() {
  const {
    isLoaded,
    subjects,
    timeSlots,
    daySettings,
    scheduledItems,
    customDayOrder,
    copiedItem,
    actions,
  } = useSchedule();

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isTimeSlotModalOpen, setIsTimeSlotModalOpen] = useState(false);
  const [isDaySettingsModalOpen, setIsDaySettingsModalOpen] = useState(false);
  
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const scheduleViewRef = useRef<HTMLDivElement>(null); 

  const handleImportClick = () => {
    importFileInputRef.current?.click();
  };

  if (!isLoaded) {
    return (
      <div className="flex flex-col h-screen">
        <header className="bg-card p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-3xl font-bold text-primary">Routinely</h1>
            <div className="flex space-x-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>
        </header>
        <main className="flex flex-1 p-4 gap-4 overflow-hidden bg-background">
          <div className="w-1/4"> <Skeleton className="h-full w-full" /></div>
          <div className="flex-1"><Skeleton className="h-full w-full" /></div>
        </main>
        <Toaster />
      </div>
    );
  }
  
  return (
    <ClientOnly>
      <DragDropContext onDragEnd={actions.handleDragEnd}>
        <div className="flex flex-col h-screen bg-background">
          <AppHeader
            onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
            onOpenTimeSlotModal={() => setIsTimeSlotModalOpen(true)}
            onOpenDaySettingsModal={() => setIsDaySettingsModalOpen(true)}
            onExport={actions.exportData}
            onImportClick={handleImportClick}
            onExportAsImage={() => actions.exportAsImage(() => scheduleViewRef.current)}
            onExportAsPdf={() => actions.exportAsPdf(() => scheduleViewRef.current)}
          />
          <input
            type="file"
            accept=".json"
            ref={importFileInputRef}
            onChange={actions.importData}
            className="hidden"
          />
          
          <main className="flex flex-1 p-4 gap-6 overflow-hidden">
            <aside className="w-64 md:w-72 lg:w-80 flex-shrink-0 h-full">
              <SubjectBank subjects={subjects} />
            </aside>
            <section className="flex-1 flex flex-col h-full min-w-0">
              <ScheduleView
                ref={scheduleViewRef} 
                daySettings={daySettings}
                customDayOrder={customDayOrder}
                timeSlots={timeSlots}
                scheduledItems={scheduledItems}
                subjects={subjects}
                onDeleteItem={actions.deleteScheduledItem}
                addScheduledItem={actions.addScheduledItem}
                copiedItem={copiedItem}
                onCopyItem={actions.handleCopyItem}
                onPasteItem={actions.handlePasteItem}
              />
            </section>
          </main>

          <SubjectModal
            isOpen={isSubjectModalOpen}
            onClose={() => setIsSubjectModalOpen(false)}
            subjects={subjects}
            addSubject={actions.addSubject}
            updateSubject={actions.updateSubject}
            deleteSubject={actions.deleteSubject}
          />
          <TimeSlotModal
            isOpen={isTimeSlotModalOpen}
            onClose={() => setIsTimeSlotModalOpen(false)}
            timeSlots={timeSlots}
            addTimeSlot={actions.addTimeSlot}
            updateTimeSlot={actions.updateTimeSlot}
            deleteTimeSlot={actions.deleteTimeSlot}
          />
          <DaySettingsModal
            isOpen={isDaySettingsModalOpen}
            onClose={() => setIsDaySettingsModalOpen(false)}
            daySettings={daySettings}
            customDayOrder={customDayOrder}
            updateDaySettings={actions.updateDaySettings}
            updateCustomDayOrder={actions.updateCustomDayOrder}
          />
        </div>
      </DragDropContext>
      <Toaster />
    </ClientOnly>
  );
}

