#!/bin/bash

# Start both frontend and backend servers
echo "Starting backend server..."
cd backend && ./start-backend.sh &
BACKEND_PID=$!

echo "Starting frontend server..."
cd .. && ./start-frontend.sh &
FRONTEND_PID=$!

# Setup trap to kill both servers when the script is interrupted
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM EXIT

# Wait for both processes
wait 