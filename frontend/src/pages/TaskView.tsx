import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

const TaskView: React.FC = () => {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [projectId, taskId]);

  const fetchTask = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8000/api/v1/projects/${projectId}/tasks/${taskId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const taskData = response.data;
      setTask(taskData);
      setTitle(taskData.title);
      setDescription(taskData.description || '');
      setStatus(taskData.status);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching task:', error);
      setError('Failed to load task');
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8000/api/v1/projects/${projectId}/tasks/${taskId}`,
        {
          title,
          description,
          status,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setIsEditing(false);
      fetchTask();
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:8000/api/v1/projects/${projectId}/tasks/${taskId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      navigate(`/projects/${projectId}`);
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography variant="h5" color="error">{error}</Typography>
        <Button onClick={() => navigate(`/projects/${projectId}`)}>Back to Project</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        {isEditing ? (
          <>
            <Typography variant="h4" gutterBottom>
              Edit Task
            </Typography>
            <Box component="form">
              <TextField
                label="Title"
                fullWidth
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <MenuItem value="TODO">To Do</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="DONE">Done</MenuItem>
                </Select>
              </FormControl>
              <Box display="flex" justifyContent="space-between">
                <Button
                  variant="outlined"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleUpdate}
                >
                  Save Changes
                </Button>
              </Box>
            </Box>
          </>
        ) : (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h4">{task?.title}</Typography>
              <Box>
                <Button
                  variant="outlined"
                  onClick={() => setIsEditing(true)}
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </Box>
            </Box>
            <Typography variant="body1" paragraph>
              {task?.description || 'No description'}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Status: {task?.status.replace('_', ' ')}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Created: {new Date(task?.created_at || '').toLocaleDateString()}
            </Typography>
            <Box mt={3}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/projects/${projectId}`)}
              >
                Back to Project
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default TaskView; 