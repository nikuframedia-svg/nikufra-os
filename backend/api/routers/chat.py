"""Chat router."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Literal

router = APIRouter()

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    mode: Literal["planeamento", "resumo", "inventario", "gargalos"] = "planeamento"

@router.post("")
def chat(request: ChatRequest):
    """Chat endpoint."""
    try:
        # Placeholder - return basic response
        last_message = request.messages[-1] if request.messages else None
        return {
            "response": f"Chat mode: {request.mode}. Message: {last_message.content if last_message else 'No message'}",
            "mode": request.mode,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


