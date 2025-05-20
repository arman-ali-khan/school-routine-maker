"use client";

import React, { useEffect, useMemo } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TimeSlot } from '@/lib/types';
import { Trash2, Edit3, PlusCircle } from 'lucide-react';

const timeFormatRegex = /^(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/; // HH:MM format

const timeSlotSchema = z.object({
  startTime: z.string().regex(timeFormatRegex, "Invalid start time (HH:MM)"),
  endTime: z.string().regex(timeFormatRegex, "Invalid end time (HH:MM)"),
  isBreak: z.boolean().optional(),
}).refine(data => data.startTime < data.endTime, {
  message: "End time must be after start time",
  path: ["endTime"],
});

type TimeSlotFormData = z.infer<typeof timeSlotSchema>;

interface TimeSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeSlots: TimeSlot[];
  addTimeSlot: (data: Omit<TimeSlot, 'id'>) => void;
  updateTimeSlot: (data: TimeSlot) => void;
  deleteTimeSlot: (id: string) => void;
}

export function TimeSlotModal({ isOpen, onClose, timeSlots, addTimeSlot, updateTimeSlot, deleteTimeSlot }: TimeSlotModalProps) {
  const [editingSlot, setEditingSlot] = React.useState<TimeSlot | null>(null);
  
  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<TimeSlotFormData>({
    resolver: zodResolver(timeSlotSchema),
    defaultValues: { isBreak: false, startTime: "08:00", endTime: "08:45" }
  });

  useEffect(() => {
    if (editingSlot) {
      setValue('startTime', editingSlot.startTime);
      setValue('endTime', editingSlot.endTime);
      setValue('isBreak', !!editingSlot.isBreak);
    } else {
      reset({ isBreak: false, startTime: "08:00", endTime: "08:45" });
    }
  }, [editingSlot, setValue, reset]);

  const onSubmit: SubmitHandler<TimeSlotFormData> = (data) => {
    if (editingSlot) {
      updateTimeSlot({ ...editingSlot, ...data });
    } else {
      addTimeSlot(data);
    }
    setEditingSlot(null);
    reset({ isBreak: false, startTime: "08:00", endTime: "08:45" });
  };

  const handleEdit = (slot: TimeSlot) => {
    setEditingSlot(slot);
  };
  
  const handleCancelEdit = () => {
    setEditingSlot(null);
    reset({ isBreak: false, startTime: "08:00", endTime: "08:45" });
  };

  // Generate time options for 15-minute increments
  const timeOptions = useMemo(() => {
    const options: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        options.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return options;
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) { onClose(); handleCancelEdit(); } }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{editingSlot ? 'Edit Time Slot' : 'Manage Time Slots'}</DialogTitle>
          <DialogDescription>
            {editingSlot ? 'Update the details of the time slot.' : 'Add new time slots or edit existing ones. Use 15-min increments.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input type="time" id="startTime" {...register('startTime')} step="900" /> {/* 900 seconds = 15 minutes */}
              {errors.startTime && <p className="text-sm text-destructive">{errors.startTime.message}</p>}
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input type="time" id="endTime" {...register('endTime')} step="900"/>
              {errors.endTime && <p className="text-sm text-destructive">{errors.endTime.message}</p>}
            </div>
          </div>
           {errors.root?.endTime && <p className="text-sm text-destructive">{errors.root.endTime.message}</p>}
          <div className="flex items-center space-x-2">
            <Checkbox id="isBreak" {...register('isBreak')} />
            <Label htmlFor="isBreak" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Mark as Break
            </Label>
          </div>
          <DialogFooter>
             {editingSlot && <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel Edit</Button>}
            <Button type="submit">{editingSlot ? 'Update Slot' : 'Add Slot'}</Button>
          </DialogFooter>
        </form>

        {!editingSlot && timeSlots.length > 0 && (
           <>
            <h3 className="text-lg font-medium mt-6 mb-2">Existing Time Slots</h3>
            <ScrollArea className="h-[200px] border rounded-md p-2">
              <ul className="space-y-2">
                {timeSlots.map((slot) => (
                  <li key={slot.id} className={`flex items-center justify-between p-2 rounded-md hover:bg-muted/50 ${slot.isBreak ? 'bg-muted/30' : ''}`}>
                    <div>
                      <span className="font-medium">{slot.startTime} - {slot.endTime}</span>
                      {slot.isBreak && <span className="text-xs text-accent-foreground bg-accent px-1.5 py-0.5 rounded-full ml-2">Break</span>}
                    </div>
                    <div className="space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(slot)} aria-label="Edit time slot">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteTimeSlot(slot.id)} aria-label="Delete time slot">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </>
        )}
        <DialogClose asChild>
            <Button type="button" variant="outline" className="mt-4 w-full" onClick={handleCancelEdit}>Close</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
