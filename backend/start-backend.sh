#!/bin/bash

# Activate virtual environment
source .venv/bin/activate

# Start the backend server on port 8000
uvicorn main:app --host 0.0.0.0 --port 8000 --reload 