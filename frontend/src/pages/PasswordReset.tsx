import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const PasswordReset: React.FC = () => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('request'); // 'request' or 'reset'
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRequestReset = async () => {
    try {
      await axios.post('http://localhost:8000/api/v1/password-reset-request', {
        email,
      });
      setSuccess('If the email exists, you will receive reset instructions.');
      // In a real app, you would wait for user to click link in email
      // For this simple version, we'll just move to reset step
      setStep('reset');
    } catch (error) {
      setError('An error occurred. Please try again.');
    }
  };

  const handleResetPassword = async () => {
    try {
      await axios.post('http://localhost:8000/api/v1/password-reset', {
        email,
        new_password: newPassword,
      });
      setSuccess('Password has been reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Password Reset
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box component="form" sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            type="email"
          />

          {step === 'reset' && (
            <TextField
              fullWidth
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              margin="normal"
              type="password"
            />
          )}

          <Button
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3 }}
            onClick={step === 'request' ? handleRequestReset : handleResetPassword}
          >
            {step === 'request' ? 'Request Password Reset' : 'Reset Password'}
          </Button>

          <Button
            fullWidth
            sx={{ mt: 1 }}
            onClick={() => navigate('/login')}
          >
            Back to Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}; 