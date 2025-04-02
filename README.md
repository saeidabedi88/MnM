# AI Project Assistant

A modern web application that helps manage projects and tasks using natural language processing and AI assistance.

## Features

### 1. Authentication
- Secure login and registration system
- JWT-based authentication
- Protected routes and API endpoints
- Admin user support

### 2. Project Management
- Create and manage projects through natural language
- View project details and status
- Track project creation dates
- Organize multiple projects in a clean interface

### 3. Task Management
- Create tasks within projects
- Track task status (TODO, IN_PROGRESS, DONE)
- Task descriptions and creation dates
- Automatic task creation through AI understanding

### 4. AI Chat Interface
- Natural language interaction
- Project-aware context
- Automatic project and task creation from chat
- Real-time responses
- Message threading and history

### 5. User Interface
- Modern, responsive design
- Dark mode support for chat interface
- Grid layout for projects
- Clean task organization
- Loading states and error handling

## Tech Stack

### Frontend
- Next.js 14 (React)
- TypeScript
- Tailwind CSS for styling
- Axios for API calls

### Backend
- FastAPI (Python)
- JWT Authentication
- JSON file-based storage
- Natural Language Processing

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Access the application at:
   - Frontend: http://localhost:3000 (or available port)
   - Backend: http://localhost:8000

## Project Structure

```
├── app/
│   ├── components/
│   ├── lib/
│   ├── login/
│   ├── register/
│   └── page.tsx
├── backend/
│   ├── db/
│   ├── app/
│   └── main.py
├── public/
└── package.json
```

## Features in Development

1. Enhanced Project Management
   - Project categories
   - Priority levels
   - Due dates
   - Team member assignments

2. Advanced Task Features
   - Task dependencies
   - Progress tracking
   - Time estimates
   - Task comments

3. AI Improvements
   - Better context understanding
   - Project suggestions
   - Task optimization
   - Timeline predictions

## Recent Updates

### Latest Version
- Added authentication system with login/register pages
- Implemented project creation through natural language
- Added automatic task creation
- Fixed chat interface styling
- Improved error handling
- Added admin user support
- Enhanced project creation with personalized titles and descriptions
- Implemented suggested tasks with user approval system
- Added scrollable project and task lists to improve UI with many items
- Fixed layout issues to better separate project list, chat and task panels

### Next Steps
1. Add project analytics
2. Implement user settings
3. Add visual distinction for suggested tasks (different color)
4. Implement task prioritization
5. Add project categories and filtering
6. Enhance AI response quality
7. Add team member assignment features

## Monitoring

- Set up AWS CloudWatch for backend monitoring
- Use Vercel Analytics for frontend monitoring
- Configure error tracking with Sentry (optional) 

## Brand Guidelines

Our application follows a monochromatic gray color palette to create a modern, clean interface.

### Color Palette

#### Primary Colors
- **Raisin Black**: `#272727` - Main backgrounds, primary content areas
- **Gray**: `#7B7C7B` - Secondary elements, message backgrounds, inactive states
- **Davys Gray**: `#4B4B4B` - Interactive elements, form controls, panel backgrounds

#### Extended Shades
- **Darker Black**: `#1D1D1D` - Headers, footers, deeper accents
- **Middle Gray**: `#5B5C5B` - Hover states, intermediate elements

For detailed implementation guidelines, component examples, and accessibility requirements, see:
- [Full Brand Guidelines Document](docs/BRAND_GUIDELINES.md)
- [Visual Color Palette Reference](docs/COLOR_PALETTE.html) (Open in browser to see interactive color cards)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Deployment

### AWS Deployment

#### Prerequisites
- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Docker installed (optional, for container deployment)

#### Backend Deployment (EC2)

1. Launch an EC2 instance:
   - Ubuntu Server 22.04 LTS
   - t2.micro (free tier) or larger
   - Configure security group to allow:
     - HTTP (80)
     - HTTPS (443)
     - Custom TCP (8000) for API

2. SSH into your instance:
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

3. Install dependencies:
   ```bash
   sudo apt update
   sudo apt install python3-pip python3-venv nginx
   ```

4. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ai-project-assistant
   ```

5. Set up Python environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r backend/requirements.txt
   ```

6. Configure environment variables:
   ```bash
   cd backend
   cp .env.example .env
   nano .env
   ```
   Update with production values:
   ```
   SECRET_KEY=<your-secure-key>
   BACKEND_CORS_ORIGINS=["https://your-frontend-domain.com"]
   RELOAD=False
   ```

7. Set up systemd service:
   ```bash
   sudo nano /etc/systemd/system/ai-project-assistant.service
   ```
   Add:
   ```ini
   [Unit]
   Description=AI Project Assistant API
   After=network.target

   [Service]
   User=ubuntu
   WorkingDirectory=/home/ubuntu/ai-project-assistant/backend
   Environment="PATH=/home/ubuntu/ai-project-assistant/.venv/bin"
   ExecStart=/home/ubuntu/ai-project-assistant/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000

   [Install]
   WantedBy=multi-user.target
   ```

8. Start the service:
   ```bash
   sudo systemctl start ai-project-assistant
   sudo systemctl enable ai-project-assistant
   ```

9. Configure Nginx:
   ```bash
   sudo nano /etc/nginx/sites-available/ai-project-assistant
   ```
   Add:
   ```nginx
   server {
       listen 80;
       server_name api.your-domain.com;

       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

10. Enable the site:
    ```bash
    sudo ln -s /etc/nginx/sites-available/ai-project-assistant /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

#### Frontend Deployment (Vercel)

1. Push your code to GitHub

2. Connect your GitHub repository to Vercel:
   - Go to vercel.com and sign in
   - Click "New Project"
   - Import your repository
   - Configure build settings:
     - Framework Preset: Next.js
     - Root Directory: ./
     - Build Command: `npm run build`
     - Output Directory: .next

3. Add environment variables:
   - Go to Project Settings > Environment Variables
   - Add `NEXT_PUBLIC_API_URL=https://api.your-domain.com`

4. Deploy:
   - Vercel will automatically build and deploy your application
   - Each push to main will trigger a new deployment

#### Domain Configuration

1. Register a domain (if you haven't already)

2. Configure DNS:
   - Point api.your-domain.com to your EC2 instance
   - Point your-domain.com to Vercel

3. Set up SSL:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.your-domain.com
   ``` 