from typing import List, Optional
from pydantic import BaseModel

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    message: str
    project_id: Optional[int] = None

class ChatResponse(BaseModel):
    message: str
    context: Optional[str] = None

class AIChat:
    def __init__(self):
        pass

    async def chat(self, request: ChatRequest) -> ChatResponse:
        # For now, just echo back the message
        return ChatResponse(
            message="Chat functionality is coming soon! Your message was: " + request.message,
            context=None
        )

# Create singleton instance
ai_chat = AIChat() 