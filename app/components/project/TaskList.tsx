'use client';

import { useEffect, useState } from 'react';
import { Task, Project } from '../../types';
import { taskService, projectService } from '../../services/api';

interface TaskListProps {
  projectId: number;
  refreshTrigger?: number;
}

export function TaskList({ projectId, refreshTrigger }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);

  // Load tasks for current project
  useEffect(() => {
    if (projectId) {
      loadTasks();
    }
  }, [projectId, refreshTrigger, localRefreshTrigger]);

  // Load all projects for project dropdown
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await projectService.getProjects();
        setProjects(data);
      } catch (err) {
        console.error('Failed to load projects:', err);
      }
    };
    
    loadProjects();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getProjectTasks(projectId);
      setTasks(data);
      setError(null);
    } catch (err) {
      setError('Failed to load tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: number, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    try {
      await taskService.updateTask(projectId, taskId, { status: newStatus });
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
      setLocalRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask({
      ...task,
      importance: task.importance || 50,
      due_date: task.due_date || '',
      is_recurring: task.is_recurring || false,
      ai_context: task.ai_context || ''
    });
    setExpandedTaskId(task.id);
  };

  const handleSave = async (task: Task) => {
    try {
      await taskService.updateTask(projectId, task.id, {
        title: task.title,
        description: task.description,
        status: task.status,
        importance: task.importance,
        due_date: task.due_date,
        is_recurring: task.is_recurring,
        ai_context: task.ai_context
      });
      setTasks(tasks.map(t => t.id === task.id ? task : t));
      setEditingTask(null);
      setExpandedTaskId(null);
      setLocalRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Failed to update task:', err);
      setError('Failed to update task');
    }
  };

  const handleCancel = () => {
    setEditingTask(null);
    setExpandedTaskId(null);
  };

  const handleDelete = async (taskId: number) => {
    if (confirm('Are you sure you want to delete this task? This cannot be undone.')) {
      try {
        await taskService.deleteTask(projectId, taskId);
        setTasks(tasks.filter(task => task.id !== taskId));
        setEditingTask(null);
        setExpandedTaskId(null);
      } catch (err) {
        console.error('Failed to delete task:', err);
        setError('Failed to delete task');
      }
    }
  };

  const handleTaskClick = (task: Task) => {
    if (expandedTaskId === task.id) {
      setExpandedTaskId(null);
    } else {
      setExpandedTaskId(task.id);
      if (!editingTask) {
        setEditingTask({
          ...task,
          importance: task.importance || 50,
          due_date: task.due_date || '',
          is_recurring: task.is_recurring || false,
          ai_context: task.ai_context || ''
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 bg-[#4B4B4B] rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-400">
        {error}
        <div className="flex items-center mt-2">
          <button 
            onClick={() => setLocalRefreshTrigger(prev => prev + 1)} 
            className="w-8 h-8 flex items-center justify-center bg-[#272727] text-white rounded-full hover:bg-[#1D1D1D] transition-colors"
            title="Retry loading tasks"
            aria-label="Retry loading tasks"
          >
            <span>↻</span>
          </button>
          <span className="ml-2 text-white text-sm">Retry</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-[#7B7C7B]">
        <h2 className="text-xl font-semibold text-white">Tasks</h2>
        <button 
          onClick={() => setLocalRefreshTrigger(prev => prev + 1)}
          className="w-7 h-7 flex items-center justify-center bg-[#272727] text-white rounded-full hover:bg-[#1D1D1D] transition-colors"
          title="Refresh tasks"
          aria-label="Refresh tasks"
        >
          <span className="text-sm">↻</span>
        </button>
      </div>
      <div className="overflow-y-auto flex-1 p-4">
        {tasks.length === 0 ? (
          <div className="text-white text-center">
            No tasks yet. Use the AI assistant to create tasks!
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className={`bg-[#7B7C7B] rounded-lg shadow transition-all duration-200 ${
                  expandedTaskId === task.id ? 'border-l-4 border-[#4B4B4B]' : 'border-l-4 border-[#272727] hover:bg-[#5B5C5B] cursor-pointer'
                }`}
              >
                {/* Task Header - Always visible */}
                <div 
                  className="p-4 flex items-center justify-between"
                  onClick={() => expandedTaskId !== task.id && handleTaskClick(task)}
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={task.status === 'DONE'}
                        onChange={(e) => updateTaskStatus(task.id, e.target.checked ? 'DONE' : 'TODO')}
                        className="w-4 h-4 bg-[#4B4B4B] border border-[#272727] rounded mr-3"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <h3 className={`font-medium text-white ${task.status === 'DONE' ? 'line-through opacity-70' : ''}`}>
                        {task.title}
                      </h3>
                    </div>
                    {task.importance && (
                      <div 
                        className="text-xs px-2 py-0.5 rounded-full bg-[#272727] text-white"
                        title="Task importance"
                      >
                        {task.importance}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {task.due_date && (
                      <div className="text-xs text-white mr-2">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                    {expandedTaskId !== task.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(task);
                        }}
                        className="w-6 h-6 flex items-center justify-center bg-[#272727] text-white rounded-full hover:bg-[#1D1D1D] transition-colors"
                        title="Edit task"
                        aria-label="Edit task"
                      >
                        <span className="text-xs">✎</span>
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Expanded Task View */}
                {expandedTaskId === task.id && editingTask && (
                  <div className="p-4 pt-0 border-t border-[#4B4B4B]">
                    <div className="space-y-4">
                      {/* Task Name */}
                      <div>
                        <label className="block text-xs text-white mb-1">Task Name</label>
                        <input
                          type="text"
                          value={editingTask.title}
                          onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                          className="w-full p-2 rounded bg-[#4B4B4B] text-white border border-[#272727]"
                        />
                      </div>
                      
                      {/* Importance Slider */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs text-white">Importance</label>
                          <span className="text-xs text-white">{editingTask.importance}</span>
                        </div>
                        <input
                          type="range"
                          min="0" 
                          max="100" 
                          value={editingTask.importance}
                          onChange={(e) => setEditingTask({ ...editingTask, importance: parseInt(e.target.value) })}
                          className="w-full h-2 bg-[#272727] rounded-full appearance-none cursor-pointer"
                        />
                      </div>
                      
                      {/* Project Assignment */}
                      <div>
                        <label className="block text-xs text-white mb-1">Project</label>
                        <select
                          value={editingTask.project_id}
                          onChange={(e) => setEditingTask({ ...editingTask, project_id: parseInt(e.target.value) })}
                          className="w-full p-2 rounded bg-[#4B4B4B] text-white border border-[#272727]"
                        >
                          {projects.map(project => (
                            <option key={project.id} value={project.id}>
                              {project.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Description */}
                      <div>
                        <label className="block text-xs text-white mb-1">Description</label>
                        <textarea
                          value={editingTask.description}
                          onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                          className="w-full p-2 rounded bg-[#4B4B4B] text-white border border-[#272727]"
                          rows={3}
                        />
                      </div>
                      
                      {/* Due Date */}
                      <div>
                        <label className="block text-xs text-white mb-1">Due Date</label>
                        <input
                          type="date"
                          value={editingTask.due_date}
                          onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                          className="w-full p-2 rounded bg-[#4B4B4B] text-white border border-[#272727]"
                        />
                      </div>
                      
                      {/* Status */}
                      <div>
                        <label className="block text-xs text-white mb-1">Status</label>
                        <select
                          value={editingTask.status}
                          onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as 'TODO' | 'IN_PROGRESS' | 'DONE' })}
                          className="w-full p-2 rounded bg-[#4B4B4B] text-white border border-[#272727]"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="DONE">Done</option>
                        </select>
                      </div>
                      
                      {/* Recurring Toggle */}
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-white">Recurring Task</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={editingTask.is_recurring}
                            onChange={(e) => setEditingTask({ ...editingTask, is_recurring: e.target.checked })}
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-[#272727] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4B4B4B]"></div>
                        </label>
                      </div>
                      
                      {/* Buttons */}
                      <div className="flex justify-end space-x-3 pt-2">
                        <button
                          onClick={() => handleDelete(editingTask.id)}
                          className="w-8 h-8 flex items-center justify-center bg-[#8B2E2E] text-white rounded-full hover:bg-[#6E2424]"
                          title="Delete task"
                          aria-label="Delete task"
                        >
                          <span>🗑</span>
                        </button>
                        <button
                          onClick={handleCancel}
                          className="w-8 h-8 flex items-center justify-center bg-[#4B4B4B] text-white rounded-full hover:bg-[#5B5C5B]"
                          title="Cancel editing"
                          aria-label="Cancel editing"
                        >
                          <span>✕</span>
                        </button>
                        <button
                          onClick={() => handleSave(editingTask)}
                          className="w-8 h-8 flex items-center justify-center bg-[#272727] text-white rounded-full hover:bg-[#1D1D1D]"
                          title="Save changes"
                          aria-label="Save changes"
                        >
                          <span>✓</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Collapsed Task Description Preview */}
                {expandedTaskId !== task.id && task.description && (
                  <div 
                    className="px-4 pb-3 pt-0"
                    onClick={() => handleTaskClick(task)}
                  >
                    <p className="text-sm text-white opacity-80 line-clamp-2">{task.description}</p>
                    <div className="text-xs text-white opacity-70 mt-2">
                      Created: {new Date(task.created_at).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 