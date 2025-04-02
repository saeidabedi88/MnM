from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
import os
import json
from dotenv import load_dotenv
from app.services.ai_service import AIService
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize AI service
ai_service = AIService()

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Database file paths
DB_DIR = "db"
USERS_FILE = os.path.join(DB_DIR, "users.json")
PROJECTS_FILE = os.path.join(DB_DIR, "projects.json")
TASKS_FILE = os.path.join(DB_DIR, "tasks.json")

# Ensure database directory exists
os.makedirs(DB_DIR, exist_ok=True)

def init_db_files():
    if not os.path.exists(USERS_FILE):
        logger.debug(f"Creating new users file at {USERS_FILE}")
        with open(USERS_FILE, 'w') as f:
            json.dump({}, f)
    if not os.path.exists(PROJECTS_FILE):
        with open(PROJECTS_FILE, 'w') as f:
            json.dump([], f)
    if not os.path.exists(TASKS_FILE):
        with open(TASKS_FILE, 'w') as f:
            json.dump([], f)

init_db_files()

def load_users() -> Dict:
    try:
        logger.debug(f"Loading users from {USERS_FILE}")
        with open(USERS_FILE, 'r') as f:
            users = json.load(f)
            logger.debug(f"Loaded users: {users}")
            return users
    except Exception as e:
        logger.error(f"Error loading users: {e}")
        return {}

def load_projects() -> List:
    try:
        with open(PROJECTS_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

def load_tasks() -> List:
    try:
        with open(TASKS_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

# Save data to files
def save_users(users: Dict):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f)

def save_projects(projects: List):
    with open(PROJECTS_FILE, 'w') as f:
        json.dump(projects, f)

def save_tasks(tasks: List):
    with open(TASKS_FILE, 'w') as f:
        json.dump(tasks, f)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/token")

# Pydantic models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    disabled: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    owner_email: str
    created_at: datetime

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "TODO"

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: int
    project_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Models
class ChatRequest(BaseModel):
    message: str
    project_id: Optional[int] = None

class ChatResponse(BaseModel):
    message: str
    context: Optional[str] = None

# Create FastAPI app
app = FastAPI()

# Configure CORS with more permissive settings for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Load initial users
users_db = load_users()
projects_db = load_projects()
tasks_db = load_tasks()

def reload_users_db():
    global users_db
    users_db = load_users()
    logger.debug(f"Reloaded users_db: {users_db}")

# Helper function to get current user
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    user = users_db.get(token_data.email)
    if user is None:
        raise credentials_exception
    
    return UserInDB(
        email=user["email"],
        hashed_password=user["hashed_password"],
        disabled=user.get("disabled", False)
    )

# Routes
@app.post("/api/v1/users/register", response_model=User)
async def register_user(user: UserCreate):
    if user.email in users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = pwd_context.hash(user.password)
    db_user = UserInDB(
        email=user.email,
        hashed_password=hashed_password,
        disabled=False
    )
    users_db[user.email] = db_user.dict()
    save_users(users_db)
    return db_user

@app.post("/api/v1/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    logger.debug(f"Login attempt for user: {form_data.username}")
    reload_users_db()
    
    user = users_db.get(form_data.username)
    logger.debug(f"Found user in database: {user}")
    
    if not user:
        logger.warning(f"User not found: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    password_verified = verify_password(form_data.password, user["hashed_password"])
    logger.debug(f"Password verification result: {password_verified}")
    
    if not password_verified:
        logger.warning(f"Invalid password for user: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    logger.debug(f"Login successful for user: {form_data.username}")
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/v1/users/me", response_model=User)
async def read_users_me(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    user = users_db.get(token_data.email)
    if user is None:
        raise credentials_exception
    
    return UserInDB(
        email=user["email"],
        hashed_password=user["hashed_password"],
        disabled=user.get("disabled", False)
    )

@app.post("/api/v1/projects", response_model=Project)
async def create_project(project: ProjectCreate, current_user: User = Depends(get_current_user)):
    project_dict = project.dict()
    project_dict.update({
        "id": len(projects_db) + 1,
        "owner_email": current_user.email,
        "created_at": datetime.utcnow().isoformat()
    })
    new_project = Project(**project_dict)
    projects_db.append(project_dict)
    save_projects(projects_db)
    return new_project

@app.get("/api/v1/projects", response_model=list[Project])
async def list_projects(current_user: User = Depends(get_current_user)):
    return [project for project in projects_db if project["owner_email"] == current_user.email]

@app.get("/api/v1/projects/{project_id}", response_model=Project)
async def get_project(project_id: int, current_user: User = Depends(get_current_user)):
    project = next((p for p in projects_db if p["id"] == project_id and p["owner_email"] == current_user.email), None)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.get("/api/v1/projects/{project_id}/tasks", response_model=list[Task])
async def get_project_tasks(project_id: int, current_user: User = Depends(get_current_user)):
    # First check if the project exists and belongs to the user
    project = next((p for p in projects_db if p["id"] == project_id and p["owner_email"] == current_user.email), None)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return [task for task in tasks_db if task["project_id"] == project_id]

@app.post("/api/v1/projects/{project_id}/tasks", response_model=Task)
async def create_task(
    project_id: int,
    task: TaskCreate,
    current_user: User = Depends(get_current_user)
):
    # First check if the project exists and belongs to the user
    project = next((p for p in projects_db if p["id"] == project_id and p["owner_email"] == current_user.email), None)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    task_dict = task.dict()
    task_dict.update({
        "id": len(tasks_db) + 1,
        "project_id": project_id,
        "created_at": datetime.utcnow().isoformat()
    })
    new_task = Task(**task_dict)
    tasks_db.append(task_dict)
    save_tasks(tasks_db)
    return new_task

@app.get("/api/v1/projects/{project_id}/tasks/{task_id}", response_model=Task)
async def get_task(project_id: int, task_id: int, current_user: User = Depends(get_current_user)):
    # First check if the project exists and belongs to the user
    project = next((p for p in projects_db if p["id"] == project_id and p["owner_email"] == current_user.email), None)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Then get the task
    task = next((t for t in tasks_db if t["id"] == task_id and t["project_id"] == project_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return task

@app.put("/api/v1/projects/{project_id}/tasks/{task_id}", response_model=Task)
async def update_task(
    project_id: int,
    task_id: int,
    task_update: TaskCreate,
    current_user: User = Depends(get_current_user)
):
    # First check if the project exists and belongs to the user
    project = next((p for p in projects_db if p["id"] == project_id and p["owner_email"] == current_user.email), None)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Then get the task
    task_index = next((i for i, t in enumerate(tasks_db) if t["id"] == task_id and t["project_id"] == project_id), None)
    if task_index is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update the task
    task_dict = task_update.dict()
    task_dict.update({
        "id": task_id,
        "project_id": project_id,
        "created_at": tasks_db[task_index]["created_at"]
    })
    tasks_db[task_index] = task_dict
    save_tasks(tasks_db)
    return task_dict

@app.delete("/api/v1/projects/{project_id}/tasks/{task_id}")
async def delete_task(project_id: int, task_id: int, current_user: User = Depends(get_current_user)):
    # First check if the project exists and belongs to the user
    project = next((p for p in projects_db if p["id"] == project_id and p["owner_email"] == current_user.email), None)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Then get the task
    task_index = next((i for i, t in enumerate(tasks_db) if t["id"] == task_id and t["project_id"] == project_id), None)
    if task_index is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Delete the task
    tasks_db.pop(task_index)
    save_tasks(tasks_db)
    return {"message": "Task deleted successfully"}

@app.put("/api/v1/projects/{project_id}", response_model=Project)
async def update_project(
    project_id: int,
    project_update: ProjectCreate,
    current_user: User = Depends(get_current_user)
):
    project = None
    for p in projects_db:
        if p["id"] == project_id and p["owner_email"] == current_user.email:
            project = p
            break
    
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or you don't have permission"
        )
    
    project["title"] = project_update.title
    project["description"] = project_update.description
    save_projects(projects_db)
    return project

@app.delete("/api/v1/projects/{project_id}")
async def delete_project(project_id: int, current_user: User = Depends(get_current_user)):
    # Find the project and check ownership
    project_index = None
    for i, project in enumerate(projects_db):
        if project["id"] == project_id and project["owner_email"] == current_user.email:
            project_index = i
            break
    
    if project_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or you don't have permission"
        )
    
    # Remove the project
    deleted_project = projects_db.pop(project_index)
    save_projects(projects_db)
    
    # Delete all tasks associated with this project
    global tasks_db
    tasks_db = [task for task in tasks_db if task["project_id"] != project_id]
    save_tasks(tasks_db)
    
    return {"message": f"Project {project_id} successfully deleted"}

# Chat endpoints
@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        # Extract project name from message if mentioned
        message = request.message.lower()
        project_context = ""
        
        # Handle project creation
        if "create a new project" in message or "create project" in message:
            # Extract project name
            project_name = None
            if "named" in message:
                name_parts = message.split("named")
                if len(name_parts) > 1:
                    project_name = name_parts[1].split("with")[0].strip().strip('"\'')
            
            if project_name:
                # Create the project
                project_dict = {
                    "id": len(projects_db) + 1,
                    "title": project_name,
                    "description": "",
                    "owner_email": current_user.email,
                    "created_at": datetime.utcnow().isoformat()
                }
                projects_db.append(project_dict)
                save_projects(projects_db)
                
                # Check if there's a task to create
                initial_task = None
                if "with" in message and "as first task" in message:
                    task_name = message.split("with")[1].split("as first task")[0].strip()
                    if task_name:
                        task_dict = {
                            "id": len(tasks_db) + 1,
                            "project_id": project_dict["id"],
                            "title": task_name,
                            "description": "",
                            "status": "TODO",
                            "created_at": datetime.utcnow().isoformat()
                        }
                        tasks_db.append(task_dict)
                        save_tasks(tasks_db)
                        initial_task = task_dict
                
                # Create project context
                project_tasks = [t for t in tasks_db if t["project_id"] == project_dict["id"]]
                project_context = f"""
                Project: {project_dict['title']}
                Description: {project_dict['description']}
                Created: {project_dict['created_at']}
                Tasks ({len(project_tasks)}):
                """
                for task in project_tasks:
                    project_context += f"\n- {task['title']} ({task['status']})"
                
                return ChatResponse(
                    message=f"I've created a new project '{project_name}'" + 
                           (f" with the first task '{initial_task['title']}'" if initial_task else "") +
                           ".",
                    context=project_context
                )
        
        # Load all projects for the current user
        user_projects = [p for p in projects_db if p["owner_email"] == current_user.email]
        
        # Try to find mentioned project
        mentioned_project = None
        for project in user_projects:
            if project["title"].lower() in message:
                mentioned_project = project
                # Get tasks for this project
                project_tasks = [t for t in tasks_db if t["project_id"] == project["id"]]
                project_context = f"""
                Project: {project['title']}
                Description: {project['description']}
                Created: {project['created_at']}
                Tasks ({len(project_tasks)}):
                """
                for task in project_tasks:
                    project_context += f"\n- {task['title']} ({task['status']})"
                break

        # Handle task completion
        if mentioned_project and ("done" in message or "completed" in message or "finished" in message):
            # Find tasks that might be completed
            completed_tasks = []
            if "landing page" in message or "wireframe" in message:
                task_to_update = next((t for t in tasks_db if t["project_id"] == mentioned_project["id"] and "wireframe" in t["title"].lower()), None)
                if task_to_update:
                    completed_tasks.append(task_to_update)
            
            # Update tasks to DONE
            for task in completed_tasks:
                task_update = TaskCreate(
                    title=task["title"],
                    description=task.get("description", ""),
                    status="DONE"
                )
                await update_task(mentioned_project["id"], task["id"], task_update, current_user)
            
            if completed_tasks:
                # Update project context with the completed tasks
                project_tasks = [t for t in tasks_db if t["project_id"] == mentioned_project["id"]]
                project_context = f"""
                Project: {mentioned_project['title']}
                Description: {mentioned_project['description']}
                Created: {mentioned_project['created_at']}
                Tasks ({len(project_tasks)}):
                """
                for task in project_tasks:
                    project_context += f"\n- {task['title']} ({task['status']})"
                
                task_names = ", ".join([t["title"] for t in completed_tasks])
                return ChatResponse(
                    message=f"Great! I've marked the following tasks as done: {task_names}",
                    context=project_context
                )

        # Handle task status update if requested
        if mentioned_project and ("move" in message or "change" in message or "update" in message) and ("status" in message or "to doing" in message or "to done" in message or "to todo" in message):
            # Find the task to update
            task_name = None
            new_status = None
            
            # Extract task name and new status
            if "content calendar" in message.lower():
                task_name = "a content calendar for vyta"
            elif "wireframe" in message.lower():
                task_name = "wireframe"
            
            if "doing" in message.lower():
                new_status = "IN_PROGRESS"
            elif "done" in message.lower():
                new_status = "DONE"
            elif "todo" in message.lower():
                new_status = "TODO"
                
            if task_name and new_status:
                # Find the task
                task_to_update = next((t for t in tasks_db if t["project_id"] == mentioned_project["id"] and t["title"].lower() == task_name.lower()), None)
                if task_to_update:
                    # Update the task
                    task_update = TaskCreate(
                        title=task_to_update["title"],
                        description=task_to_update.get("description", ""),
                        status=new_status
                    )
                    updated_task = await update_task(mentioned_project["id"], task_to_update["id"], task_update, current_user)
                    
                    # Update project context with the updated task
                    project_tasks = [t for t in tasks_db if t["project_id"] == mentioned_project["id"]]
                    project_context = f"""
                    Project: {mentioned_project['title']}
                    Description: {mentioned_project['description']}
                    Created: {mentioned_project['created_at']}
                    Tasks ({len(project_tasks)}):
                    """
                    for task in project_tasks:
                        project_context += f"\n- {task['title']} ({task['status']})"
                    
                    return ChatResponse(
                        message=f"I've updated the task '{task_name}' status to {new_status}.",
                        context=project_context
                    )

        # Handle task creation if requested
        if mentioned_project and ("add a task" in message or "create a task" in message):
            # Extract task title from the message
            task_title = message.split("create")[-1].strip() if "create" in message else message.split("add")[-1].strip()
            if "task" in task_title:
                task_title = task_title.split("task")[-1].strip()
            if "to" in task_title:
                task_title = task_title.split("to")[0].strip()
            
            # Create the task
            task = TaskCreate(title=task_title, description="", status="TODO")
            new_task = await create_task(mentioned_project["id"], task, current_user)
            
            # Update project context with the new task
            project_tasks = [t for t in tasks_db if t["project_id"] == mentioned_project["id"]]
            project_context = f"""
            Project: {mentioned_project['title']}
            Description: {mentioned_project['description']}
            Created: {mentioned_project['created_at']}
            Tasks ({len(project_tasks)}):
            """
            for task in project_tasks:
                project_context += f"\n- {task['title']} ({task['status']})"
            
            return ChatResponse(
                message=f"I've added a new task '{task_title}' to the {mentioned_project['title']} project.",
                context=project_context
            )
        
        # Get response from AI service with project context
        response = await ai_service.get_response(
            str(mentioned_project["id"]) if mentioned_project else "general",
            request.message,
            project_context if mentioned_project else None
        )
        
        return ChatResponse(message=response, context=project_context if mentioned_project else None)
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Security functions
def verify_password(plain_password, hashed_password):
    logger.debug(f"Verifying password. Plain: {plain_password}, Hashed: {hashed_password}")
    result = pwd_context.verify(plain_password, hashed_password)
    logger.debug(f"Password verification result: {result}")
    return result

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    logger.debug(f"Created access token for user: {data.get('sub')}")
    return encoded_jwt

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 