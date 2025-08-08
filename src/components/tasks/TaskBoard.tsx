import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreHorizontal, Clock, User, Flag } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { TaskForm } from './TaskForm';
import { Task, User as UserType } from '../../types';
import * as api from '../../lib/api';

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Design user authentication flow',
    description: 'Create wireframes and mockups for the login and registration process',
    status: 'todo',
    priority: 'high',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    dueDate: new Date('2024-01-25'),
    tags: ['design', 'ui/ux'],
    project: {
      id: '1',
      name: 'Website Redesign',
      description: '',
      color: 'bg-blue-100',
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [],
      tasksCount: 0,
      completedTasks: 0
    },
    assignee: {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'designer',
      lastActive: new Date()
    },
    comments: []
  },
  {
    id: '2',
    title: 'Implement JWT authentication',
    description: 'Set up JWT tokens for secure user authentication',
    status: 'in-progress',
    priority: 'high',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-18'),
    dueDate: new Date('2024-01-22'),
    tags: ['backend', 'security'],
    project: {
      id: '1',
      name: 'Website Redesign',
      description: '',
      color: 'bg-blue-100',
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [],
      tasksCount: 0,
      completedTasks: 0
    },
    assignee: {
      id: '2',
      name: 'Bob Smith',
      email: 'bob@example.com',
      role: 'developer',
      lastActive: new Date()
    },
    comments: []
  },
  {
    id: '3',
    title: 'Database migration script',
    description: 'Create migration script for user table updates',
    status: 'review',
    priority: 'medium',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-19'),
    tags: ['database'],
    project: {
      id: '1',
      name: 'Website Redesign',
      description: '',
      color: 'bg-blue-100',
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [],
      tasksCount: 0,
      completedTasks: 0
    },
    comments: []
  },
  {
    id: '4',
    title: 'Update documentation',
    description: 'Update API documentation with new endpoints',
    status: 'done',
    priority: 'low',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-17'),
    tags: ['documentation'],
    project: {
      id: '1',
      name: 'Website Redesign',
      description: '',
      color: 'bg-blue-100',
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [],
      tasksCount: 0,
      completedTasks: 0
    },
    comments: []
  }
];

const columns = [
  { id: 'todo', title: 'To Do', color: 'border-gray-300' },
  { id: 'in-progress', title: 'In Progress', color: 'border-yellow-300' },
  { id: 'review', title: 'Review', color: 'border-blue-300' },
  { id: 'done', title: 'Done', color: 'border-green-300' }
];

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load tasks from API
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      try {
        const apiTasks = await api.fetchTasks();
        const convertedTasks: Task[] = apiTasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status.replace('_', '-') as Task['status'],
          priority: task.priority,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          tags: task.tags,
          project: {
            id: task.projectId,
            name: 'General',
            description: '',
            color: 'bg-blue-100',
            createdAt: new Date(),
            updatedAt: new Date(),
            members: [],
            tasksCount: 0,
            completedTasks: 0
          },
          comments: []
        }));
        setTasks(convertedTasks);
      } catch (error) {
        console.error('Failed to load tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTasks();
  }, []);

  const handleTaskCreate = async (taskData: Partial<Task>) => {
    try {
      const createData = {
        title: taskData.title || '',
        description: taskData.description || '',
        priority: taskData.priority || 'medium',
        status: 'todo',
        tags: taskData.tags || [],
        dueDate: taskData.dueDate?.toISOString()
      };

      const apiTask = await api.createTask(createData);
      
      const newTask: Task = {
        id: apiTask.id,
        title: apiTask.title,
        description: apiTask.description,
        status: apiTask.status.replace('_', '-') as Task['status'],
        priority: apiTask.priority,
        createdAt: new Date(apiTask.createdAt),
        updatedAt: new Date(apiTask.updatedAt),
        dueDate: apiTask.dueDate ? new Date(apiTask.dueDate) : undefined,
        tags: apiTask.tags,
        project: {
          id: apiTask.projectId,
          name: 'General',
          description: '',
          color: 'bg-blue-100',
          createdAt: new Date(),
          updatedAt: new Date(),
          members: [],
          tasksCount: 0,
          completedTasks: 0
        },
        comments: []
      };
      
      setTasks(prev => [...prev, newTask]);
      setIsTaskFormOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleTaskUpdate = async (updatedTask: Task) => {
    try {
      const updateData = {
        title: updatedTask.title,
        description: updatedTask.description,
        priority: updatedTask.priority,
        status: updatedTask.status.replace('-', '_'),
        tags: updatedTask.tags,
        dueDate: updatedTask.dueDate?.toISOString()
      };

      await api.updateTask(updatedTask.id, updateData);
      setTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      try {
        const updatedTask = { 
          ...draggedTask, 
          status: newStatus as Task['status'], 
          updatedAt: new Date() 
        };

        const updateData = {
          status: newStatus.replace('-', '_')
        };

        await api.updateTask(draggedTask.id, updateData);
        
        setTasks(prev => 
          prev.map(task => 
            task.id === draggedTask.id ? updatedTask : task
          )
        );
      } catch (error) {
        console.error('Failed to update task status:', error);
      }
    }
    setDraggedTask(null);
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading tasks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Board</h1>
          <p className="text-gray-600 mt-1">Manage and track your team's progress</p>
        </div>
        <Button onClick={() => setIsTaskFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </motion.div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column, columnIndex) => (
          <motion.div
            key={column.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: columnIndex * 0.1 }}
            className="space-y-4"
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className={`border-t-4 ${column.color} bg-white rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">{column.title}</h2>
                <span className="text-sm text-gray-500">
                  {tasks.filter(task => task.status === column.id).length}
                </span>
              </div>
              
              <AnimatePresence>
                {tasks
                  .filter(task => task.status === column.id)
                  .map((task, taskIndex) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: taskIndex * 0.05 }}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      onClick={() => setSelectedTask(task)}
                      className="cursor-pointer mb-3"
                    >
                      <Card hover className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-medium text-gray-900 text-sm leading-5">
                            {task.title}
                          </h3>
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {task.description && (
                          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        
                        {task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {task.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {task.tags.length > 2 && (
                              <span className="text-xs text-gray-500">+{task.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full flex items-center ${getPriorityColor(task.priority)}`}>
                              <Flag className="w-3 h-3 mr-1" />
                              {task.priority}
                            </span>
                            {task.dueDate && (
                              <span className="text-gray-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {task.dueDate.toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          
                          {task.assignee && (
                            <div className="flex items-center space-x-1">
                              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                <User className="w-3 h-3 text-gray-600" />
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Task Form Modal */}
      <Modal
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        title="Create New Task"
        size="lg"
      >
        <TaskForm
          onSubmit={handleTaskCreate}
          onCancel={() => setIsTaskFormOpen(false)}
        />
      </Modal>

      {/* Task Detail Modal */}
      {selectedTask && (
        <Modal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title="Task Details"
          size="lg"
        >
          <TaskForm
            task={selectedTask}
            onSubmit={handleTaskUpdate}
            onCancel={() => setSelectedTask(null)}
          />
        </Modal>
      )}
    </div>
  );
}