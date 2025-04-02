"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChatInterface } from './components/chat/ChatInterface';
import { ProjectList } from './components/project/ProjectList';
import { TaskList } from './components/project/TaskList';
import { useAuth } from './components/auth/AuthProvider';

export default function Home() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>();
  const [projectRefreshCount, setProjectRefreshCount] = useState(0);
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // If still loading or not authenticated, show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#272727]">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  // If not authenticated, don't render anything (redirect happens in useEffect)
  if (!user) {
    return null;
  }

  const handleProjectSelect = (projectId: number) => {
    setSelectedProjectId(projectId);
  };

  const handleProjectCreated = () => {
    // Trigger project list refresh
    setProjectRefreshCount(prev => prev + 1);
  };

  return (
    <main className="flex h-screen bg-[#272727] overflow-hidden">
      {/* Sidebar - Projects */}
      <div className="w-80 bg-[#4B4B4B] border-r border-[#7B7C7B] flex-shrink-0">
        <ProjectList 
          onProjectSelect={handleProjectSelect}
          selectedProjectId={selectedProjectId}
          refreshTrigger={projectRefreshCount}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Interface */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatInterface 
            onProjectCreated={handleProjectCreated}
            selectedProjectId={selectedProjectId}
            onProjectSelect={handleProjectSelect}
          />
        </div>

        {/* Task Panel */}
        {selectedProjectId && (
          <div className="w-80 bg-[#4B4B4B] border-l border-[#7B7C7B] flex-shrink-0">
            <TaskList 
              projectId={selectedProjectId}
              refreshTrigger={projectRefreshCount}
            />
          </div>
        )}
      </div>
    </main>
  );
} 