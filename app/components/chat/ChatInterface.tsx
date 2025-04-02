'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Message } from '../../types';
import { chatService, taskService, projectService } from '../../services/api';
import { useAuth } from '../auth/AuthProvider';

// Extend the Message interface to include metadata
interface ExtendedMessage extends Message {
  metadata?: {
    projectId?: number;
    suggestedTasks?: ProjectTask[];
    deleteConfirmationRequired?: boolean;
    projectIdToDelete?: number;
  };
}

interface ChatInterfaceProps {
  onProjectCreated?: () => void;
  selectedProjectId?: number;
  onProjectSelect?: (projectId: number) => void;
}

// Define a Task interface for type safety
interface ProjectTask {
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
}

// Function to detect vague, open-ended inputs
const detectVagueInput = (input: string): string | null => {
  const lowercaseInput = input.toLowerCase().trim();
  
  // Detect starting something new
  if (
    lowercaseInput.includes('start something') || 
    lowercaseInput.includes('wanna start') || 
    lowercaseInput.includes('begin something') || 
    lowercaseInput.includes('create something') ||
    lowercaseInput.includes('new idea') ||
    lowercaseInput.includes('i want to start')
  ) {
    return 'new_start';
  }
  
  // Detect general help requests
  if (
    lowercaseInput === 'help' ||
    lowercaseInput === 'help me' ||
    lowercaseInput === 'i need help' ||
    lowercaseInput === 'assist me' ||
    lowercaseInput.includes('not sure what to do')
  ) {
    return 'general_help';
  }
  
  // Detect greeting without specific request
  if (
    (lowercaseInput === 'hi' || 
    lowercaseInput === 'hello' || 
    lowercaseInput === 'hey' ||
    lowercaseInput === 'yo' ||
    lowercaseInput === 'hi there' ||
    lowercaseInput === 'hello there') &&
    lowercaseInput.split(' ').length <= 2
  ) {
    return 'greeting';
  }
  
  return null; // Not a vague input
};

// Function to generate contextual, engaging responses
const generateContextualResponse = (inputType: string, userName: string = ''): string => {
  // Use userName if available for personalization
  const personalizedName = userName ? ` ${userName}` : '';
  
  // Arrays of response variations for each input type
  const responses: Record<string, string[]> = {
    'new_start': [
      `A new adventure, huh${personalizedName}? Are we talking about launching the next billion-dollar startup, planning a trip, or maybe starting a rock band? Give me a hint about what kind of project you're dreaming of!`,
      `I love that spark of inspiration${personalizedName}! What kind of project are you thinking about? A personal goal, a business idea, or maybe organizing an event?`,
      `Ready to start something exciting${personalizedName}? I'm here for it! Are you thinking about a business venture, a fitness challenge, or maybe a home improvement project?`,
      `That's the spirit${personalizedName}! Tell me more about what you want to create. Is it a work project, a creative endeavor, or maybe a personal development goal?`
    ],
    'general_help': [
      `I'd be happy to help${personalizedName}! What area would you like assistance with? Project planning, task management, or something else entirely?`,
      `Sure thing${personalizedName}! To point you in the right direction, could you share what you're working on or what kind of help you need?`,
      `Ready to assist${personalizedName}! Are you looking for help with organizing tasks, creating a new project, or managing an existing one?`,
      `At your service${personalizedName}! To provide the best help, could you tell me a bit more about what you're trying to accomplish?`
    ],
    'greeting': [
      `Hey there${personalizedName}! What's on your mind today? Need help with a project or want to start something new?`,
      `Hello${personalizedName}! Ready to be productive today? What would you like to work on?`,
      `Hi${personalizedName}! Great to see you. Would you like to continue with an existing project or start a fresh one?`,
      `Welcome back${personalizedName}! What can I help you with today? Need project ideas or help organizing your tasks?`
    ]
  };
  
  // Select a random response from the appropriate category
  const responseList = responses[inputType] || responses['general_help'];
  const randomIndex = Math.floor(Math.random() * responseList.length);
  return responseList[randomIndex];
};

// Helper function to extract project type and user-specified tasks from input
const extractProjectInfo = (input: string): { projectType: string; userTasks: string[] } => {
  input = input.toLowerCase();
  
  // Extract project type
  let projectType = 'generic';
  
  if (input.includes('home decoration') || input.includes('interior') || input.includes('decorat')) {
    projectType = 'home-decoration';
  } else if (input.includes('trip') || input.includes('travel') || input.includes('vacation')) {
    // Check for specific destinations
    if (input.includes('paris')) projectType = 'paris-trip';
    if (input.includes('japan')) projectType = 'japan-trip';
    if (input.includes('beach')) projectType = 'beach-trip';
    projectType = 'travel';
  } else if (input.includes('wedding') || input.includes('marry')) {
    projectType = 'wedding';
  } else if (input.includes('app') || input.includes('software') || input.includes('development')) {
    projectType = 'app-development';
  } else if (input.includes('workout') || input.includes('fitness') || input.includes('exercise')) {
    projectType = 'fitness';
  } else if (input.includes('diet') || input.includes('nutrition') || input.includes('food')) {
    projectType = 'diet';
  } else if (input.includes('financial') || input.includes('finance') || input.includes('money') || input.includes('budget')) {
    projectType = 'finance';
  }
  
  // Extract user tasks
  const userTasks: string[] = [];
  
  // Look for task-like structures in the input
  // 1. Check for task lists with numbering (1. Task, 2. Task)
  const numberedTasks = input.match(/\d+\.\s*([^.,!?]+)/g);
  if (numberedTasks) {
    numberedTasks.forEach(task => {
      const cleanTask = task.replace(/^\d+\.\s*/, '').trim();
      if (cleanTask) userTasks.push(cleanTask);
    });
  }
  
  // 2. Check for task lists with bullets (• Task, - Task)
  const bulletedTasks = input.match(/[•\-\*]\s*([^.,!?]+)/g);
  if (bulletedTasks) {
    bulletedTasks.forEach(task => {
      const cleanTask = task.replace(/^[•\-\*]\s*/, '').trim();
      if (cleanTask) userTasks.push(cleanTask);
    });
  }
  
  // 3. Check for "I need to" or "tasks:" patterns
  if (input.includes('tasks:') || input.includes('to-do:') || input.includes('todo:')) {
    const afterTasksColon = input.split(/tasks:|to-do:|todo:/i)[1];
    if (afterTasksColon) {
      const taskItems = afterTasksColon.split(/,|;|\n/).map(item => item.trim());
      taskItems.forEach(task => {
        if (task && !task.includes('project') && task.length > 3) userTasks.push(task);
      });
    }
  }
  
  // 4. Look for "I need to" or "have to" patterns
  const needToPatterns = input.match(/(need to|have to|want to) ([^.,!?]+)/g);
  if (needToPatterns) {
    needToPatterns.forEach(phrase => {
      const cleanPhrase = phrase.replace(/(need to|have to|want to) /i, '').trim();
      if (cleanPhrase && !userTasks.includes(cleanPhrase)) userTasks.push(cleanPhrase);
    });
  }
  
  return { projectType, userTasks };
};

// Helper function to generate personalized project details based on type
const generateProjectDetails = (projectType: string, userName: string, userTasks: string[]): { 
  description: string; 
  userTasks: ProjectTask[];
  suggestedTasks: ProjectTask[]; 
} => {
  // Convert user-specified tasks to ProjectTask format
  const formattedUserTasks: ProjectTask[] = userTasks.map(task => ({
    title: task,
    description: '',  // No description for user-specified tasks
    status: 'TODO'
  }));
  
  let description = '';
  let suggestedTasks: ProjectTask[] = [];
  
  switch (projectType) {
    case 'home-decoration':
      description = `Transform your living space with style and personality.`;
      suggestedTasks = [
        {
          title: 'Choose a color scheme',
          description: 'Select primary and accent colors for each room',
          status: 'TODO'
        },
        {
          title: 'Create a shopping list',
          description: 'List furniture, decorations, and materials needed',
          status: 'TODO'
        },
        {
          title: 'Set a budget',
          description: 'Determine how much to spend on each area',
          status: 'TODO'
        }
      ];
      break;
      
    case 'paris-trip':
      description = `Exploring the City of Lights with style!`;
      suggestedTasks = [
        {
          title: 'Book flights',
          description: 'Find and reserve round-trip flights to Paris',
          status: 'TODO'
        },
        {
          title: 'Reserve accommodations',
          description: 'Book hotel or Airbnb in a central location',
          status: 'TODO'
        },
        {
          title: 'Create itinerary',
          description: 'Plan daily activities and must-see attractions',
          status: 'TODO'
        }
      ];
      break;
      
    case 'travel':
      description = `Your next adventure awaits!`;
      suggestedTasks = [
        {
          title: 'Choose destination',
          description: 'Research and select final destination',
          status: 'TODO'
        },
        {
          title: 'Book transportation',
          description: 'Reserve flights, train tickets, or plan road trip',
          status: 'TODO'
        },
        {
          title: 'Plan accommodations',
          description: 'Book hotels or other lodging options',
          status: 'TODO'
        }
      ];
      break;
      
    case 'wedding':
      description = `Planning for the perfect special day.`;
      suggestedTasks = [
        {
          title: 'Set date and venue',
          description: 'Choose and book wedding date and location',
          status: 'TODO'
        },
        {
          title: 'Create guest list',
          description: 'Compile names and contact info for invitations',
          status: 'TODO'
        },
        {
          title: 'Book vendors',
          description: 'Reserve photographer, caterer, and other services',
          status: 'TODO'
        }
      ];
      break;
      
    case 'app-development':
      description = `Building the next big digital solution.`;
      suggestedTasks = [
        {
          title: 'Define requirements',
          description: 'Document core features and user stories',
          status: 'TODO'
        },
        {
          title: 'Create mockups',
          description: 'Design key screens and user flows',
          status: 'TODO'
        },
        {
          title: 'Set up development environment',
          description: 'Install necessary tools and frameworks',
          status: 'TODO'
        }
      ];
      break;
      
    case 'fitness':
      description = `Achieving health and wellness goals step by step.`;
      suggestedTasks = [
        {
          title: 'Set fitness goals',
          description: 'Define specific, measurable fitness objectives',
          status: 'TODO'
        },
        {
          title: 'Create workout schedule',
          description: 'Plan weekly exercise routines',
          status: 'TODO'
        },
        {
          title: 'Track progress',
          description: 'Set up a system to monitor improvements',
          status: 'TODO'
        }
      ];
      break;
      
    default:
      description = `A well-organized plan to achieve your goals.`;
      suggestedTasks = [
        {
          title: 'Define objectives',
          description: 'Clarify what you want to accomplish',
          status: 'TODO'
        },
        {
          title: 'Create timeline',
          description: 'Set deadlines for major milestones',
          status: 'TODO'
        },
        {
          title: 'Assign resources',
          description: 'Determine what you need to complete the project',
          status: 'TODO'
        }
      ];
  }
  
  // Filter out suggested tasks that are already covered by user tasks
  suggestedTasks = suggestedTasks.filter(suggestedTask => 
    !formattedUserTasks.some(userTask => 
      userTask.title.toLowerCase().includes(suggestedTask.title.toLowerCase()) || 
      suggestedTask.title.toLowerCase().includes(userTask.title.toLowerCase())
    )
  );
  
  return {
    description,
    userTasks: formattedUserTasks,
    suggestedTasks
  };
};

export function ChatInterface({ onProjectCreated, selectedProjectId, onProjectSelect }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ExtendedMessage[]>([
    {
      id: '1',
      content: "Hi there! I'm your AI Project Assistant. How can I help you today?",
      role: "assistant"
    }
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [projectNamingDetails, setProjectNamingDetails] = useState<{
    projectType: string;
    userTasks: string[];
  } | null>(null);
  const router = useRouter();
  const { user, logout } = useAuth();

  // State for storing projects
  const [projects, setProjects] = useState<{ id: number; title: string }[]>([]);
  
  // Add a refreshTrigger state
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Load projects for the selector
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projectsData = await projectService.getProjects();
        setProjects(projectsData);
      } catch (err) {
        console.error('Failed to load projects for selector:', err);
      }
    };
    
    loadProjects();
  }, [selectedProjectId, refreshTrigger]);
  
  // Refresh project list when a new project is created
  useEffect(() => {
    if (onProjectCreated) {
      setRefreshTrigger(prev => prev + 1);
    }
  }, [onProjectCreated]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const newMessage: ExtendedMessage = {
      id: Date.now().toString(),
      content: input,
      role: 'user'
    };

    setInput("");
    setMessages(prev => [...prev, newMessage]);
    setIsThinking(true);

    try {
      if (!user) {
        throw new Error('Authentication required');
      }

      // Check for vague or ambiguous inputs first
      const vagueInputType = detectVagueInput(input);
      if (vagueInputType) {
        // Get user's first name from email for personalization
        const userName = user?.email ? user.email.split('@')[0] : '';
        const formattedName = userName ? userName.charAt(0).toUpperCase() + userName.slice(1) : '';
        
        // Generate a contextual, engaging response
        const contextualResponse = generateContextualResponse(vagueInputType, formattedName);
        
        const aiResponse: ExtendedMessage = {
          id: (Date.now() + 1).toString(),
          content: contextualResponse,
          role: 'assistant'
        };
        
        setMessages(prev => [...prev, aiResponse]);
        setIsThinking(false);
        return;
      }

      // Check if the message is about deleting the current project
      const isDeleteProject = input.toLowerCase().includes('remove this project') || 
                             input.toLowerCase().includes('delete this project') || 
                             input.toLowerCase().includes('remove the project') ||
                             input.toLowerCase().includes('delete the project');

      if (isDeleteProject && selectedProjectId) {
        // Ask for confirmation
        const confirmMessage: ExtendedMessage = {
          id: (Date.now() + 1).toString(),
          content: `Are you sure you want to delete this project? This will also delete all tasks associated with it. This action cannot be undone. Reply "confirm delete" to proceed.`,
          role: 'assistant',
          metadata: {
            deleteConfirmationRequired: true,
            projectIdToDelete: selectedProjectId
          }
        };
        
        setMessages(prev => [...prev, confirmMessage]);
        setIsThinking(false);
        return;
      } 
      // Check if this is a confirmation for project deletion
      else if (input.toLowerCase().includes('confirm delete') && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.metadata?.deleteConfirmationRequired && lastMessage.metadata.projectIdToDelete) {
          const projectIdToDelete = lastMessage.metadata.projectIdToDelete as number;
          
          try {
            await projectService.deleteProject(projectIdToDelete);
            
            const successMessage: ExtendedMessage = {
              id: (Date.now() + 1).toString(),
              content: `Project successfully deleted.`,
              role: 'assistant'
            };
            
            setMessages(prev => [...prev, successMessage]);
            
            // Notify parent that project list should be refreshed
            if (onProjectCreated) {
              onProjectCreated();
            }
            
            // If there was a project selector callback, reset selection
            if (onProjectSelect) {
              onProjectSelect(0);
            }
            
            setIsThinking(false);
            return;
          } catch (error) {
            console.error('Failed to delete project:', error);
            const errorMessage: ExtendedMessage = {
              id: (Date.now() + 1).toString(),
              content: `Sorry, I couldn't delete the project. Please try again later.`,
              role: 'assistant'
            };
            
            setMessages(prev => [...prev, errorMessage]);
            setIsThinking(false);
            return;
          }
        }
      }

      // Check if the message is about creating a project
      const isProjectCreation = input.toLowerCase().includes('make a project') || 
                               input.toLowerCase().includes('create a project') ||
                               input.toLowerCase().includes('new project');

      if (isProjectCreation) {
        // Extract project type and user-specified tasks from the message
        const { projectType, userTasks } = extractProjectInfo(input);
        
        // Get user's first name from email
        const userName = user?.email ? user.email.split('@')[0] : '';
        const formattedName = userName ? userName.charAt(0).toUpperCase() + userName.slice(1) : '';
        
        // Ask for a specific project name instead of auto-generating one
        setProjectNamingDetails({ projectType, userTasks });
        
        const promptMessage: ExtendedMessage = {
          id: (Date.now() + 1).toString(),
          content: `I'd be happy to create a new project for you! To make it easier to find later, what would you like to name this project?`,
          role: 'assistant'
        };
        
        setMessages(prev => [...prev, promptMessage]);
        setIsThinking(false);
        return;
      } 
      // Check if this is a response with a project name
      else if (projectNamingDetails) {
        // Use the user's input directly as the project title
        const projectTitle = input.trim();
        
        // Get user's first name from email
        const userName = user?.email ? user.email.split('@')[0] : '';
        const formattedName = userName ? userName.charAt(0).toUpperCase() + userName.slice(1) : '';
        
        // Generate project details using the specified project type
        const { description, userTasks: formattedUserTasks, suggestedTasks } = 
          generateProjectDetails(projectNamingDetails.projectType, formattedName, projectNamingDetails.userTasks);
        
        // Start with user tasks
        const initialTasks = formattedUserTasks;

        // Create and save the project with initial user tasks
        const response = await chatService.sendMessage(input, selectedProjectId, {
          createProject: true,
          projectDetails: {
            title: projectTitle,
            description,
            tasks: initialTasks
          }
        });

        const projectId = response.projectId;

        // Format task lists for display
        let userTaskList = '';
        if (formattedUserTasks.length > 0) {
          userTaskList = formattedUserTasks.map((task, index) => `${index + 1}. ${task.title}`).join('\n');
        }

        let suggestedTaskList = '';
        if (suggestedTasks.length > 0) {
          suggestedTaskList = suggestedTasks.map((task, index) => `${index + 1}. ${task.title}`).join('\n');
        }

        let responseContent = `I've created your new project "${projectTitle}"`;
        
        if (formattedUserTasks.length > 0) {
          responseContent += ` with the following tasks:\n\n${userTaskList}`;
        } else {
          responseContent += `.`;
        }

        if (suggestedTasks.length > 0) {
          responseContent += `\n\nI also have some suggested tasks that might help. Would you like me to add any of these?\n\n${suggestedTaskList}\n\nLet me know which ones you'd like to add, or say "add all" to include all of them.`;
        }

        const aiResponse: ExtendedMessage = {
          id: (Date.now() + 1).toString(),
          content: responseContent,
          role: 'assistant',
          metadata: {
            projectId,
            suggestedTasks
          }
        };
        
        setMessages(prev => [...prev, aiResponse]);
        
        // Reset project naming state
        setProjectNamingDetails(null);
        
        // Notify parent that a project was created
        if (onProjectCreated) {
          console.log("Triggering project created callback");
          onProjectCreated();
        }
        
        return;
      } else if (messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].metadata?.suggestedTasks) {
        // This is a response to suggested tasks
        const lastMessage = messages[messages.length - 1];
        const projectId = lastMessage.metadata?.projectId;
        const suggestedTasks = lastMessage.metadata?.suggestedTasks || [];
        
        // Check what the user wants to do with suggested tasks
        const userInput = input.toLowerCase();
        
        if (userInput.includes('add all') || userInput.includes('add everything') || userInput.includes('add them all')) {
          // Add all suggested tasks
          if (projectId) {
            for (const task of suggestedTasks) {
              await taskService.createTask(projectId, task.title, task.description);
            }
          
            const aiResponse: ExtendedMessage = {
              id: (Date.now() + 1).toString(),
              content: `Great! I've added all the suggested tasks to your project. You can see them in the task panel.`,
              role: 'assistant'
            };
            
            setMessages(prev => [...prev, aiResponse]);
            
            // Refresh the project list
            if (onProjectCreated) {
              onProjectCreated();
            }
          }
        } else if (userInput.includes('add') || userInput.includes('yes')) {
          // Try to figure out which tasks to add
          const tasksToAdd: ProjectTask[] = [];
          
          // Check for task numbers (e.g., "add 1, 2")
          const taskNumbers = userInput.match(/\d+/g);
          if (taskNumbers) {
            for (const numStr of taskNumbers) {
              const num = parseInt(numStr);
              if (num > 0 && num <= suggestedTasks.length) {
                tasksToAdd.push(suggestedTasks[num - 1]);
              }
            }
          }
          
          // Check for task names
          if (tasksToAdd.length === 0) {
            for (const task of suggestedTasks) {
              if (userInput.includes(task.title.toLowerCase())) {
                tasksToAdd.push(task);
              }
            }
          }
          
          // If we still couldn't figure out which tasks to add, add all
          if (tasksToAdd.length === 0 && (userInput.includes('add') || userInput === 'yes')) {
            tasksToAdd.push(...suggestedTasks);
          }
          
          if (projectId) {
            // Add the selected tasks
            for (const task of tasksToAdd) {
              await taskService.createTask(projectId, task.title, task.description);
            }
            
            let responseContent = '';
            if (tasksToAdd.length > 0) {
              const addedTasksList = tasksToAdd.map(task => task.title).join(', ');
              responseContent = `Great! I've added the following tasks to your project: ${addedTasksList}`;
            } else {
              responseContent = `I'm not sure which tasks you'd like to add. Please specify by task number (e.g., "add 1, 3") or name.`;
            }
            
            const aiResponse: ExtendedMessage = {
              id: (Date.now() + 1).toString(),
              content: responseContent,
              role: 'assistant'
            };
            
            setMessages(prev => [...prev, aiResponse]);
            
            // Refresh the project list
            if (onProjectCreated) {
              onProjectCreated();
            }
          }
        } else if (userInput.includes('no') || userInput.includes("don't") || userInput.includes("dont")) {
          // User doesn't want to add any tasks
          const aiResponse: ExtendedMessage = {
            id: (Date.now() + 1).toString(),
            content: `No problem! You can always add more tasks later if you need to.`,
            role: 'assistant'
          };
          
          setMessages(prev => [...prev, aiResponse]);
        } else {
          // Regular chat message
          const response = await chatService.sendMessage(input, selectedProjectId);
          
          // If no specific response from backend, use a more varied default response
          let defaultResponse = response.response;
          if (!defaultResponse) {
            // Get user's first name from email for personalization
            const userName = user?.email ? user.email.split('@')[0] : '';
            const formattedName = userName ? userName.charAt(0).toUpperCase() + userName.slice(1) : '';
            
            // Array of more interesting default responses
            const defaultResponses = [
              `I see what you're saying${formattedName ? ', ' + formattedName : ''}. How can I help move this forward?`,
              `Thanks for sharing that. What specific aspect would you like assistance with?`,
              `Got it. Is there anything else you'd like to add or explain?`,
              `I understand. Would you like some suggestions related to this?`,
              `Interesting! Do you want me to help brainstorm some next steps?`
            ];
            
            // Select a random response
            defaultResponse = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
          }
          
          const aiResponse: ExtendedMessage = {
            id: (Date.now() + 1).toString(),
            content: defaultResponse,
            role: 'assistant'
          };
          
          setMessages(prev => [...prev, aiResponse]);
          
          if (response.projectCreated && onProjectCreated) {
            console.log("Project created during regular chat - triggering refresh");
            onProjectCreated();
          }
        }
      } else {
        // Regular chat message
        const response = await chatService.sendMessage(input, selectedProjectId);
        
        // If no specific response from backend, use a more varied default response
        let defaultResponse = response.response;
        if (!defaultResponse) {
          // Get user's first name from email for personalization
          const userName = user?.email ? user.email.split('@')[0] : '';
          const formattedName = userName ? userName.charAt(0).toUpperCase() + userName.slice(1) : '';
          
          // Array of more interesting default responses
          const defaultResponses = [
            `I see what you're saying${formattedName ? ', ' + formattedName : ''}. How can I help move this forward?`,
            `Thanks for sharing that. What specific aspect would you like assistance with?`,
            `Got it. Is there anything else you'd like to add or explain?`,
            `I understand. Would you like some suggestions related to this?`,
            `Interesting! Do you want me to help brainstorm some next steps?`
          ];
          
          // Select a random response
          defaultResponse = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
        }
        
        const aiResponse: ExtendedMessage = {
          id: (Date.now() + 1).toString(),
          content: defaultResponse,
          role: 'assistant'
        };
        
        setMessages(prev => [...prev, aiResponse]);
        
        if (response.projectCreated && onProjectCreated) {
          console.log("Project created during regular chat - triggering refresh");
          onProjectCreated();
        }
      }
    } catch (error) {
      console.error('Error:', error);
      let errorMessage = "Sorry, I encountered an error. Please try again.";
      
      if (error instanceof Error) {
        if (error.message === 'Authentication required') {
          errorMessage = "Please log in to continue.";
          router.push('/login');
        }
      }

      const errorResponse: ExtendedMessage = {
        id: (Date.now() + 1).toString(),
        content: errorMessage,
        role: 'assistant'
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };
  
  // Function to handle changing the selected project
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = parseInt(e.target.value);
    if (projectId && !isNaN(projectId)) {
      // If we have a valid project ID, update it
      if (onProjectSelect) {
        onProjectSelect(projectId);
      }
      
      // Add a system message indicating project change
      const projectName = projects.find(p => p.id === projectId)?.title || 'Unknown project';
      const systemMessage: ExtendedMessage = {
        id: Date.now().toString(),
        content: `Switched to project: ${projectName}`,
        role: 'assistant'
      };
      setMessages(prev => [...prev, systemMessage]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="bg-[#1D1D1D] text-white px-4 py-3 flex justify-between items-center border-b border-[#7B7C7B]">
        <h1 className="text-lg font-medium">AI Project Assistant</h1>
        <button 
          onClick={handleLogout}
          className="w-8 h-8 flex items-center justify-center bg-[#4B4B4B] text-white rounded-full hover:bg-[#5B5C5B] transition-colors"
          title="Sign Out"
          aria-label="Sign Out"
        >
          <span className="text-sm">↪</span>
        </button>
      </header>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#4B4B4B] rounded-lg p-6 max-w-sm w-full mx-4 border border-[#7B7C7B] shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Confirm Logout</h2>
            <p className="text-white mb-6">Are you sure you want to sign out?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelLogout}
                className="w-10 h-10 flex items-center justify-center bg-[#7B7C7B] text-white rounded-full hover:bg-[#5B5C5B] transition-colors"
                title="Cancel"
                aria-label="Cancel logout"
              >
                <span>✕</span>
              </button>
              <button
                onClick={confirmLogout}
                className="w-10 h-10 flex items-center justify-center bg-[#272727] text-white rounded-full hover:bg-[#1D1D1D] transition-colors"
                title="Confirm Sign Out"
                aria-label="Confirm sign out"
              >
                <span>✓</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#272727]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`rounded-lg px-4 py-2 max-w-[80%] shadow-md ${
              message.role === 'user' 
                ? 'bg-[#4B4B4B] text-white border-r-2 border-[#272727]' 
                : 'bg-[#7B7C7B] text-white border-l-2 border-[#272727]'
            }`}>
              <div className="whitespace-pre-wrap">
                {message.content}
              </div>
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="rounded-lg px-4 py-2 max-w-[80%] bg-[#7B7C7B] border-l-2 border-[#272727] shadow-md">
              <div className="animate-pulse text-white">...</div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#7B7C7B] bg-[#1D1D1D]">
        {/* Project selector */}
        <div className="mb-3">
          <div className="flex gap-2">
            <select
              value={selectedProjectId || ''}
              onChange={handleProjectChange}
              className="flex-1 px-4 py-2 bg-[#4B4B4B] border border-[#7B7C7B] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#1D1D1D] transition-colors"
            >
              <option value="">Select a project (optional)</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
            {selectedProjectId ? (
              <button
                onClick={() => {
                  // Trigger the delete project message flow
                  setInput("remove this project");
                  handleSend(new Event('submit') as any);
                }}
                className="w-10 h-10 flex items-center justify-center bg-[#8B2E2E] text-white rounded-full hover:bg-[#6E2424] transition-colors"
                title="Delete project"
                aria-label="Delete project"
              >
                <span>🗑</span>
              </button>
            ) : null}
          </div>
        </div>
        
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-2 bg-[#4B4B4B] border border-[#7B7C7B] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#1D1D1D] shadow-inner"
            placeholder="Type your message..."
            disabled={isThinking}
          />
          <button
            type="submit"
            disabled={isThinking || !input.trim()}
            className={`w-10 h-10 flex items-center justify-center bg-[#272727] text-white rounded-full shadow ${
              isThinking || !input.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#1D1D1D]'
            } transition-colors`}
            title="Send message"
            aria-label="Send message"
          >
            <span>↑</span>
          </button>
        </form>
      </div>
    </div>
  );
}