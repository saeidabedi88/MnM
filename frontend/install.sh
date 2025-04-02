#!/bin/bash

# Install dependencies
npm install

# Install type definitions
npm install --save-dev @types/react @types/react-dom @types/node @types/jest

# Install Material-UI dependencies
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material

# Install other dependencies
npm install axios react-router-dom date-fns 