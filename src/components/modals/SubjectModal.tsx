
"use client";

import React, { useEffect } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Subject } from '@/lib/types';
import { Trash2, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  teacher: z.string().min(1, "Teacher name is required"),
  code: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color hex code (e.g., #RRGGBB)"),
});

type SubjectFormData = z.infer<typeof subjectSchema>;

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  addSubject: (data: Omit<Subject, 'id'>) => void;
  updateSubject: (data: Subject) => void;
  deleteSubject: (id: string) => void;
}

export function SubjectModal({ isOpen, onClose, subjects, addSubject, updateSubject, deleteSubject }: SubjectModalProps) {
  const [editingSubject, setEditingSubject] = React.useState<Subject | null>(null);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { color: '#64B5F6' } // Default color
  });

  useEffect(() => {
    if (editingSubject) {
      setValue('name', editingSubject.name);
      setValue('teacher', editingSubject.teacher);
      setValue('code', editingSubject.code || '');
      setValue('color', editingSubject.color);
    } else {
      reset({ name: '', teacher: '', code: '', color: '#64B5F6' });
    }
  }, [editingSubject, setValue, reset]);

  const onSubmit: SubmitHandler<SubjectFormData> = (data) => {
    if (editingSubject) {
      updateSubject({ ...editingSubject, ...data });
    } else {
      addSubject(data);
    }
    setEditingSubject(null);
    reset({ name: '', teacher: '', code: '', color: '#64B5F6' });
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
  };

  const handleCancelEdit = () => {
    setEditingSubject(null);
    reset({ name: '', teacher: '', code: '', color: '#64B5F6' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) { onClose(); handleCancelEdit(); } }}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingSubject ? 'Edit Subject' : 'Manage Subjects'}</DialogTitle>
          <DialogDescription>
            {editingSubject ? 'Update the details of the subject.' : 'Add new subjects or edit existing ones.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Subject Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="teacher">Teacher Name</Label>
            <Input id="teacher" {...register('teacher')} />
            {errors.teacher && <p className="text-sm text-destructive">{errors.teacher.message}</p>}
          </div>
          <div>
            <Label htmlFor="code">Subject Code (Optional)</Label>
            <Input id="code" {...register('code')} />
          </div>
          <div>
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center gap-2">
              {/* Use a raw HTML input for color picker to avoid styling conflicts */}
              <input
                id="color-picker" // Different ID for the picker itself if Label points to text input
                type="color"
                {...register('color')}
                className={cn(
                  "w-12 h-10 rounded-md border border-input bg-background p-0", // p-0 is important
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
              />
              <Input 
                id="color" // Label should point to this for accessibility if it describes the hex code
                {...register('color')} 
                placeholder="#RRGGBB" 
                className="flex-1" 
                aria-label="Color hex code"
              />
            </div>
            {errors.color && <p className="text-sm text-destructive">{errors.color.message}</p>}
          </div>
          <DialogFooter>
            {editingSubject && <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel Edit</Button>}
            <Button type="submit">{editingSubject ? 'Update Subject' : 'Add Subject'}</Button>
          </DialogFooter>
        </form>

        {!editingSubject && subjects.length > 0 && (
          <>
            <h3 className="text-lg font-medium mt-6 mb-2">Existing Subjects</h3>
            <ScrollArea className="h-[200px] border rounded-md p-2">
              <ul className="space-y-2">
                {subjects.map((subject) => (
                  <li key={subject.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span style={{ backgroundColor: subject.color }} className="w-4 h-4 rounded-sm block border" />
                      <div>
                        <span className="font-medium">{subject.name}</span> ({subject.teacher})
                        {subject.code && <span className="text-xs text-muted-foreground ml-1">[{subject.code}]</span>}
                      </div>
                    </div>
                    <div className="space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(subject)} aria-label="Edit subject">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteSubject(subject.id)} aria-label="Delete subject">
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
