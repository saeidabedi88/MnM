'use client';

import { useEffect, useState } from 'react';
import { Project } from '../../types';
import { projectService } from '../../services/api';

interface ProjectListProps {
  onProjectSelect: (projectId: number) => void;
  selectedProjectId?: number;
  refreshTrigger?: number;
}

export function ProjectList({ onProjectSelect, selectedProjectId, refreshTrigger }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);

  useEffect(() => {
    loadProjects();
  }, [selectedProjectId, localRefreshTrigger, refreshTrigger]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getProjects();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError('Failed to load projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (project: Project) => {
    setEditingProject(project);
  };

  const handleSave = async (project: Project) => {
    try {
      await projectService.updateProject(project.id, {
        title: project.title,
        description: project.description
      });
      setProjects(projects.map(p => p.id === project.id ? project : p));
      setEditingProject(null);
      // Refresh the project list after updating
      setLocalRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Failed to update project:', err);
      setError('Failed to update project');
    }
  };

  const handleCancel = () => {
    setEditingProject(null);
  };

  const handleDelete = async (projectId: number) => {
    if (confirm('Are you sure you want to delete this project? This will also delete all tasks in this project. This action cannot be undone.')) {
      try {
        await projectService.deleteProject(projectId);
        setProjects(projects.filter(project => project.id !== projectId));
        setEditingProject(null);
        
        // If the deleted project was selected, clear the selection
        if (selectedProjectId === projectId) {
          onProjectSelect(0); // Assuming 0 is used to indicate no selection
        }
      } catch (err) {
        console.error('Failed to delete project:', err);
        setError('Failed to delete project');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-[#4B4B4B] rounded-lg"></div>
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
            title="Retry loading projects"
            aria-label="Retry loading projects"
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
        <h2 className="text-xl font-bold text-white">Projects</h2>
        <button 
          onClick={() => setLocalRefreshTrigger(prev => prev + 1)}
          className="w-7 h-7 flex items-center justify-center bg-[#272727] text-white rounded-full hover:bg-[#1D1D1D] transition-colors"
          title="Refresh projects"
          aria-label="Refresh projects"
        >
          <span className="text-sm">↻</span>
        </button>
      </div>
      
      <div className="overflow-y-auto flex-1 p-4">
        {projects.length === 0 ? (
          <div className="text-white text-center">
            No projects yet. Start a conversation to create one!
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`p-4 rounded-lg transition-colors ${
                  selectedProjectId === project.id
                    ? 'bg-[#272727] text-white border border-[#7B7C7B]'
                    : 'bg-[#7B7C7B] hover:bg-[#5B5C5B] text-white'
                }`}
              >
                {editingProject?.id === project.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingProject.title}
                      onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                      className="w-full p-2 rounded bg-[#4B4B4B] text-white border border-[#7B7C7B]"
                    />
                    <textarea
                      value={editingProject.description}
                      onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                      className="w-full p-2 rounded bg-[#4B4B4B] text-white border border-[#7B7C7B]"
                      rows={2}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDelete(editingProject.id)}
                        className="w-8 h-8 flex items-center justify-center bg-[#8B2E2E] text-white rounded-full hover:bg-[#6E2424]"
                        title="Delete project"
                        aria-label="Delete project"
                      >
                        <span>🗑</span>
                      </button>
                      <button
                        onClick={() => handleSave(editingProject)}
                        className="w-8 h-8 flex items-center justify-center bg-[#272727] text-white rounded-full hover:bg-[#1D1D1D]"
                        title="Save changes"
                        aria-label="Save changes"
                      >
                        <span>✓</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        className="w-8 h-8 flex items-center justify-center bg-[#7B7C7B] text-white rounded-full hover:bg-[#5B5C5B]"
                        title="Cancel editing"
                        aria-label="Cancel editing"
                      >
                        <span>✕</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => onProjectSelect(project.id)}>
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{project.title}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(project);
                        }}
                        className="w-6 h-6 flex items-center justify-center bg-[#272727] text-white rounded-full hover:bg-[#1D1D1D] transition-colors"
                        title="Edit project"
                        aria-label="Edit project"
                      >
                        <span className="text-xs">✎</span>
                      </button>
                    </div>
                    <p className="text-sm mt-1 text-white">
                      {project.description}
                    </p>
                    <div className="text-xs mt-2 text-white opacity-70">
                      Created: {new Date(project.created_at).toLocaleDateString()}
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