"""
CrewAI Content Generation Service
FastAPI service for generating content using CrewAI multi-agent system
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import logging
import os

from crew.content_crew import ContentCrew

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CrewAI Content Generation Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize CrewAI crew
_crew_instance: Optional[ContentCrew] = None


def get_crew() -> ContentCrew:
    """Get or create CrewAI crew instance"""
    global _crew_instance
    if _crew_instance is None:
        _crew_instance = ContentCrew()
    return _crew_instance


# Request/Response Models
class GenerateRequest(BaseModel):
    """Request model for content generation"""
    type: str = Field(..., description="Content type: marketing, agent-prompt, documentation, report")
    topic: str = Field(..., description="Topic or subject for the content")
    context: Dict[str, Any] = Field(default_factory=dict, description="Additional context")
    format: str = Field(..., description="Content format: blog-post, system-prompt, social-media, etc.")
    language: Optional[str] = Field(default="de-CH", description="Language code")


class GenerateResponse(BaseModel):
    """Response model for content generation"""
    content: str = Field(..., description="Generated content")
    metadata: Dict[str, Any] = Field(..., description="Generation metadata")


class ContentType(BaseModel):
    """Content type definition"""
    id: str
    name: str
    description: str
    formats: List[str]


# Available content types
CONTENT_TYPES = [
    {
        "id": "marketing",
        "name": "Marketing Content",
        "description": "Blog posts, social media posts, email campaigns, landing page copy",
        "formats": ["blog-post", "social-media", "email", "landing-page"]
    },
    {
        "id": "agent-prompt",
        "name": "Agent Prompts",
        "description": "System prompts, greeting templates, conversation scripts, FAQ responses",
        "formats": ["system-prompt", "greeting", "conversation-script", "faq"]
    },
    {
        "id": "documentation",
        "name": "Documentation",
        "description": "User guides, API documentation, help articles, tutorials",
        "formats": ["user-guide", "api-docs", "help-article", "tutorial"]
    },
    {
        "id": "report",
        "name": "Reports",
        "description": "Call analysis summaries, business insights, performance reports, lead summaries",
        "formats": ["summary", "analysis", "insights", "performance-report"]
    }
]


@app.get("/health")
async def health():
    """Health check endpoint"""
    try:
        # Try to initialize crew to verify configuration
        crew = get_crew()
        return {
            "status": "healthy",
            "service": "crewai-service",
            "llm_provider": os.getenv("CREWAI_LLM_PROVIDER", "openai"),
            "llm_model": os.getenv("CREWAI_MODEL", "gpt-4o")
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "degraded",
            "service": "crewai-service",
            "error": str(e)
        }


@app.get("/types", response_model=List[ContentType])
async def get_content_types():
    """List available content types and formats"""
    return [ContentType(**ct) for ct in CONTENT_TYPES]


@app.post("/generate", response_model=GenerateResponse)
async def generate_content(request: GenerateRequest):
    """
    Generate content using CrewAI multi-agent system
    
    Args:
        request: GenerateRequest with type, topic, context, format, and language
        
    Returns:
        GenerateResponse with generated content and metadata
    """
    try:
        # Validate content type
        content_type_info = next(
            (ct for ct in CONTENT_TYPES if ct["id"] == request.type),
            None
        )
        if not content_type_info:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid content type: {request.type}. Available types: {[ct['id'] for ct in CONTENT_TYPES]}"
            )
        
        # Validate format
        if request.format not in content_type_info["formats"]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid format '{request.format}' for type '{request.type}'. Available formats: {content_type_info['formats']}"
            )
        
        logger.info(f"Generating {request.type} content: '{request.topic[:50]}...' in format '{request.format}'")
        
        # Get crew instance
        crew = get_crew()
        
        # Generate content
        result = crew.generate_content(
            topic=request.topic,
            content_type=request.type,
            format=request.format,
            context=request.context,
            language=request.language or "de-CH"
        )
        
        logger.info(f"Content generation completed successfully")
        
        return GenerateResponse(
            content=result["content"],
            metadata=result["metadata"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Content generation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Content generation failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
