import React, { useState } from 'react';
import {
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragOverlay, 
  DragStartEvent, 
  DragOverEvent, 
  DragEndEvent, 
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskStatus } from '../types';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskUpdate: (id: string, updates: Partial<Task>) => void;
  onTasksReorder: (newTasks: Task[]) => void;
  onTaskClick: (task: Task) => void;
}

const SortableTaskCard: React.FC<{ task: Task; onClick: () => void }> = ({ task, onClick }) => {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  const priorityColors = {
    high: { bg: 'bg-danger', text: 'text-danger' },
    medium: { bg: 'bg-warning', text: 'text-warning' },
    low: { bg: 'bg-info', text: 'text-info' },
  };

  const color = priorityColors[task.priority] || priorityColors.medium;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card mb-3 p-3 border-0 shadow-sm hover-shadow transition bg-white ${isDragging ? 'border border-primary' : ''}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mb-2">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <span className={`small fw-bold text-uppercase d-flex align-items-center ${color.text}`} style={{ fontSize: '0.65rem' }}>
            <i className="bi bi-circle-fill me-2" style={{ fontSize: '0.4rem' }}></i>
            {task.priority}
          </span>
          <span className="smaller text-muted fw-medium opacity-50">#{task.id}</span>
        </div>
      </div>
      
      <div onClick={onClick} className="cursor-pointer">
        <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '0.9rem' }}>{task.title}</h6>
        <p className="small text-secondary mb-3 lh-sm" style={{ fontSize: '0.8rem' }}>
          {task.description.substring(0, 60)}{task.description.length > 60 ? '...' : ''}
        </p>
      </div>

      <div className="d-flex justify-content-between align-items-center border-top pt-2">
        <div className="avatar-group">
          <img 
            src={`https://i.pravatar.cc/24?u=${task.assignees[0] || 'default'}`} 
            className="rounded-circle border border-white shadow-sm" 
            alt="assignee" 
            style={{ width: '24px', height: '24px' }}
          />
        </div>
        <div className="smaller text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>
          <i className="bi bi-calendar3 me-1"></i> {task.dueDate}
        </div>
      </div>
    </div>
  );
};

const KanbanColumn: React.FC<{ status: TaskStatus; tasks: Task[]; title: string; onTaskClick: (task: Task) => void }> = ({ status, tasks, title, onTaskClick }) => {
  const { setNodeRef } = useSortable({ id: status });

  return (
    <div className="kanban-col flex-grow-1 mx-2 d-flex flex-column shadow-sm" style={{ backgroundColor: '#eff2f5', minWidth: '300px', borderRadius: '1rem', padding: '1.25rem', minHeight: '70vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-3 px-1">
        <div className="d-flex align-items-center gap-2">
          <h6 className="fw-bold mb-0 text-dark text-uppercase small tracking-wide" style={{ fontSize: '0.8rem' }}>{title}</h6>
          <span className="badge bg-white text-secondary border rounded-pill px-2 py-1 fw-bold" style={{ fontSize: '0.7rem' }}>{tasks.length}</span>
        </div>
      </div>
      
      <div ref={setNodeRef} className="flex-grow-1" style={{ minHeight: '400px' }}>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="h-100 d-flex align-items-center justify-content-center text-muted small opacity-50 border border-dashed rounded-3 p-4 text-center">
              Drop tasks here
            </div>
          ) : (
            tasks.map(task => <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />)
          )}
        </SortableContext>
      </div>
    </div>
  );
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onTaskUpdate, onTasksReorder, onTaskClick }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Check if dropping over a column or another task
    const isOverAColumn = Object.values(TaskStatus).includes(overId as TaskStatus);

    if (isOverAColumn) {
      if (activeTask.status !== (overId as TaskStatus)) {
        onTaskUpdate(activeId, { status: overId as TaskStatus });
      }
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask && activeTask.status !== overTask.status) {
        onTaskUpdate(activeId, { status: overTask.status });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);

      if (newIndex !== -1) {
        onTasksReorder(arrayMove(tasks, oldIndex, newIndex));
      }
    }

    setActiveId(null);
  };

  const columns = [
    { status: TaskStatus.TODO, title: 'To Do' },
    { status: TaskStatus.IN_PROGRESS, title: 'In Progress' },
    { status: TaskStatus.BLOCKED, title: 'Blocked' },
    { status: TaskStatus.DONE, title: 'Completed' },
  ];

  const activeTask = tasks.find(t => t.id === activeId);

  return (
    <div className="kanban-wrapper" style={{ overflowX: 'auto', paddingBottom: '20px' }}>
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart} 
        onDragOver={handleDragOver} 
        onDragEnd={handleDragEnd}
      >
        <div className="d-flex flex-nowrap" style={{ minWidth: '100%', gap: '1rem' }}>
          {columns.map(col => (
            <KanbanColumn 
              key={col.status} 
              status={col.status} 
              title={col.title} 
              tasks={tasks.filter(t => t.status === col.status)} 
              onTaskClick={onTaskClick} 
            />
          ))}
        </div>
        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
          {activeId && activeTask ? (
            <div className="card p-3 shadow-lg border-primary cursor-grabbing bg-white" style={{ width: '300px', transform: 'rotate(2deg)' }}>
              <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>{activeTask.title}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;