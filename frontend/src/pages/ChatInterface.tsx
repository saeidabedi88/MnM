import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  CircularProgress,
  Container,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { colors } from '../theme/theme';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  message: string;
  context?: string;
}

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();

  useEffect(() => {
    // Add welcome message when chat is first opened
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: 'Hello! I\'m your AI project management assistant. I can help you with:\n\n' +
                  '• Creating and managing projects\n' +
                  '• Adding and updating tasks\n' +
                  '• Viewing project and task details\n' +
                  '• Answering questions about your projects\n\n' +
                  'What would you like to do?'
        }
      ]);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await axios.post<ChatResponse>(
        'http://localhost:8000/api/v1/chat',
        {
          message: userMessage,
          project_id: null // The backend will parse the message to determine project context
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: response.data.message }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <Container maxWidth="md" sx={{ height: '100vh', py: 2 }}>
      <Paper
        elevation={3}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: colors.background.paper,
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: colors.primary.main }}>
          <Typography variant="h6" sx={{ color: colors.text.light }}>AI Project Assistant</Typography>
        </Box>

        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: colors.background.default }}>
          <List>
            {messages.map((message, index) => (
              <ListItem
                key={index}
                sx={{
                  flexDirection: 'column',
                  alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2,
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    bgcolor: message.role === 'user' ? colors.primary.main : colors.background.paper,
                    maxWidth: '70%',
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: message.role === 'user' ? colors.text.light : colors.text.primary,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {message.content}
                  </Typography>
                </Paper>
              </ListItem>
            ))}
            {isLoading && (
              <ListItem sx={{ justifyContent: 'flex-start' }}>
                <CircularProgress size={20} sx={{ color: colors.secondary.main }} />
              </ListItem>
            )}
          </List>
          <div ref={messagesEndRef} />
        </Box>

        <Box sx={{ p: 2, bgcolor: colors.background.paper, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your projects..."
              variant="outlined"
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: colors.primary.main,
                  },
                },
              }}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              sx={{
                bgcolor: colors.primary.main,
                color: colors.text.light,
                '&:hover': {
                  bgcolor: colors.primary.dark,
                },
                '&.Mui-disabled': {
                  bgcolor: colors.primary.light,
                  color: colors.text.light,
                },
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}; 