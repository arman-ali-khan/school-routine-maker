
"use client";

import type React from 'react';
import { Button } from "@/components/ui/button";
import { FileDown, FileUp, Users, Clock, CalendarDays, Settings, Image as ImageIcon, FileText as PdfIcon, FileArchive } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppHeaderProps {
  onOpenSubjectModal: () => void;
  onOpenTimeSlotModal: () => void;
  onOpenDaySettingsModal: () => void;
  onExport: () => void;
  onImportClick: () => void; 
  onExportAsImage: () => void;
  onExportAsPdf: () => void;
  onExportAsSimplifiedPdf: () => void;
}

export function AppHeader({
  onOpenSubjectModal,
  onOpenTimeSlotModal,
  onOpenDaySettingsModal,
  onExport,
  onImportClick,
  onExportAsImage,
  onExportAsPdf,
  onExportAsSimplifiedPdf,
}: AppHeaderProps) {
  return (
    <header className="bg-card p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Routinely</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onOpenSubjectModal}><Users className="mr-2 h-4 w-4" />Subjects</Button>
          <Button variant="outline" onClick={onOpenTimeSlotModal}><Clock className="mr-2 h-4 w-4" />Time Slots</Button>
          <Button variant="outline" onClick={onOpenDaySettingsModal}><CalendarDays className="mr-2 h-4 w-4" />Days</Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><Settings className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Data Management</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onExport}>
                <FileDown className="mr-2 h-4 w-4" />
                Export Schedule (JSON)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onImportClick}>
                <FileUp className="mr-2 h-4 w-4" />
                Import Schedule (JSON)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Advanced Export</DropdownMenuLabel>
              <DropdownMenuItem onClick={onExportAsImage}>
                <ImageIcon className="mr-2 h-4 w-4" />
                Export as Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportAsPdf}>
                <PdfIcon className="mr-2 h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportAsSimplifiedPdf}>
                <FileArchive className="mr-2 h-4 w-4" />
                Export Simplified PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
