from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..services.ai_service import AIService
from ..models import ChatHistory, Project
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()
ai_service = AIService()

class ChatMessage(BaseModel):
    message: str
    project_id: int

class ChatResponse(BaseModel):
    message: str
    timestamp: datetime
    project_id: int

class ChatHistoryResponse(BaseModel):
    id: int
    user_message: str
    assistant_message: str
    created_at: datetime
    project_id: int

    class Config:
        from_attributes = True

@router.post("/chat", response_model=ChatResponse)
async def chat(
    chat_message: ChatMessage,
    db: Session = Depends(get_db)
):
    """Handle a chat message and return the AI assistant's response."""
    # Verify project exists
    project = db.query(Project).filter(Project.id == chat_message.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get AI response
    response = await ai_service.get_response(
        str(chat_message.project_id),
        chat_message.message
    )

    # Store in database
    chat_history = ChatHistory(
        project_id=chat_message.project_id,
        user_message=chat_message.message,
        assistant_message=response
    )
    db.add(chat_history)
    db.commit()
    db.refresh(chat_history)

    return ChatResponse(
        message=response,
        timestamp=chat_history.created_at,
        project_id=chat_message.project_id
    )

@router.get("/history/{project_id}", response_model=List[ChatHistoryResponse])
async def get_chat_history(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Retrieve chat history for a specific project."""
    # Verify project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get chat history
    history = db.query(ChatHistory).filter(
        ChatHistory.project_id == project_id
    ).order_by(ChatHistory.created_at.desc()).all()

    return history

@router.get("/search/{project_id}")
async def search_chat_history(
    project_id: int,
    query: str,
    db: Session = Depends(get_db)
):
    """Search through chat history for relevant information."""
    # Verify project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Search through vector store
    results = await ai_service.search_project_history(
        str(project_id),
        query
    )

    return results 