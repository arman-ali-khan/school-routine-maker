"use client";

import type { Subject } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Lightbulb } from 'lucide-react'; // Or another suitable icon

interface SubjectBankItemProps {
  subject: Subject;
  index: number;
}

function SubjectBankItem({ subject, index }: SubjectBankItemProps) {
  return (
    <Draggable draggableId={`bank-subject-${subject.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-3 mb-2 rounded-md shadow-sm border transition-shadow ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : 'bg-card hover:shadow-md'}`}
          style={{
            ...provided.draggableProps.style,
            backgroundColor: snapshot.isDragging ? 'hsl(var(--primary-foreground))' : subject.color,
            color: snapshot.isDragging ||tinycolor(subject.color).isLight() ? 'hsl(var(--card-foreground))' : 'hsl(var(--primary-foreground))', // Adjust text color for visibility
          }}
        >
          <p className="font-medium text-sm">{subject.name}</p>
          <p className="text-xs opacity-80">{subject.teacher}</p>
          {subject.code && <p className="text-xs opacity-60">[{subject.code}]</p>}
        </div>
      )}
    </Draggable>
  );
}
// Helper for text color, you might want a more robust library like tinycolor2 if available
// npm install tinycolor2 @types/tinycolor2
// For now, a simple heuristic:
const tinycolor = (color: string) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return { isLight: () => brightness > 155 };
};


interface SubjectBankProps {
  subjects: Subject[];
}

export function SubjectBank({ subjects }: SubjectBankProps) {
  return (
    <Card className="w-full h-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Lightbulb className="h-6 w-6 text-primary" />
          Subject Bank
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Droppable droppableId="subject-bank" isDropDisabled={true}>
          {(provided, snapshot) => (
            <ScrollArea 
              className="h-[calc(100vh-250px)] pr-3" // Adjust height as needed
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {subjects.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No subjects available. Add subjects using the "Subjects" button above.
                </p>
              )}
              {subjects.map((subject, index) => (
                <SubjectBankItem key={subject.id} subject={subject} index={index} />
              ))}
              {provided.placeholder}
            </ScrollArea>
          )}
        </Droppable>
         {/* A droppable zone for deleting items dragged from the schedule */}
        <Droppable droppableId="subject-bank-delete-zone">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`mt-4 p-4 text-center border-2 border-dashed rounded-md transition-colors
                ${snapshot.isDraggingOver ? 'border-destructive bg-destructive/10' : 'border-muted-foreground/30'}
                ${subjects.length === 0 ? 'hidden' : ''} `} // Hide if subject bank is empty. Reconsider if this is the best place.
            >
              <p className={`text-sm ${snapshot.isDraggingOver ? 'text-destructive' : 'text-muted-foreground'}`}>
                {snapshot.isDraggingOver ? 'Drop here to remove from schedule' : 'Drag item here to remove'}
              </p>
            </div>
          )}
        </Droppable>
      </CardContent>
    </Card>
  );
}
