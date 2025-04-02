import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  Divider,
} from '@mui/material';
import axios from 'axios';
import ChatIcon from '@mui/icons-material/Chat';

interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  created_at: string;
}

const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [projectResponse, tasksResponse] = await Promise.all([
        axios.get(`http://localhost:8000/api/v1/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:8000/api/v1/projects/${projectId}/tasks`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setProject(projectResponse.data);
      setTasks(tasksResponse.data);
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!project) {
    return (
      <Container>
        <Typography variant="h5" color="error">Project not found</Typography>
        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">{project.name}</Typography>
          <Button
            variant="outlined"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </Box>

        <Typography variant="body1" paragraph>
          {project.description}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Project Details</Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Created"
                    secondary={new Date(project.created_at).toLocaleDateString()}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Last Updated"
                    secondary={new Date(project.updated_at).toLocaleDateString()}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Total Tasks"
                    secondary={tasks.length}
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Tasks</Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate(`/projects/${projectId}/tasks/new`)}
                >
                  New Task
                </Button>
              </Box>
              <List>
                {tasks.map((task) => (
                  <ListItem
                    key={task.id}
                    sx={{
                      mb: 1,
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'action.hover' },
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate(`/projects/${projectId}/tasks/${task.id}`)}
                  >
                    <ListItemText
                      primary={task.title}
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary">
                            {task.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Status: {task.status.replace('_', ' ')}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
                {tasks.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No tasks yet"
                      secondary="Create a new task to get started"
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ProjectView; 