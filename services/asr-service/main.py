"""
ASR Service - Faster Whisper
FastAPI service for speech-to-text transcription using faster-whisper
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import io
import logging
from typing import Optional, List
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ASR Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model cache
_model_cache = {}
_device = os.getenv("ASR_DEVICE", "cpu")  # 'cpu' or 'cuda'
_model_size = os.getenv("ASR_MODEL_SIZE", "large-v3")  # tiny, base, small, medium, large-v3


class TranscribeRequest(BaseModel):
    audio: str  # base64 encoded WAV audio
    language: Optional[str] = "de"  # Language hint


class TranscriptionSegment(BaseModel):
    start: float
    end: float
    text: str
    confidence: Optional[float] = None


class TranscribeResponse(BaseModel):
    text: str
    segments: Optional[List[TranscriptionSegment]] = None
    confidence: Optional[float] = None
    language: Optional[str] = None


def load_model():
    """Load faster-whisper model (cached)"""
    global _model_cache
    
    if _model_size not in _model_cache:
        try:
            from faster_whisper import WhisperModel
            
            logger.info(f"Loading Whisper model: {_model_size} on {_device}")
            model = WhisperModel(
                _model_size,
                device=_device,
                compute_type="float16" if _device == "cuda" else "int8",
                download_root="/app/models" if os.path.exists("/app/models") else None,
            )
            _model_cache[_model_size] = model
            logger.info("Model loaded successfully")
        except ImportError:
            logger.error("faster-whisper not installed. Install with: pip install faster-whisper")
            raise
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise
    
    return _model_cache[_model_size]


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "asr-service"}


@app.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(request: TranscribeRequest):
    """
    Transcribe audio to text using faster-whisper
    
    Args:
        request: TranscribeRequest with base64 audio and optional language hint
        
    Returns:
        TranscribeResponse with text, segments, and confidence
    """
    try:
        # Decode base64 audio
        audio_bytes = base64.b64decode(request.audio)
        
        # Load model
        model = load_model()
        
        # Transcribe
        logger.info(f"Transcribing audio (length: {len(audio_bytes)} bytes, language: {request.language})")
        segments, info = model.transcribe(
            io.BytesIO(audio_bytes),
            language=request.language if request.language != "auto" else None,
            beam_size=5,
            vad_filter=True,  # Voice Activity Detection
        )
        
        # Collect segments
        segment_list = []
        full_text = ""
        total_confidence = 0.0
        segment_count = 0
        
        for segment in segments:
            segment_text = segment.text.strip()
            if segment_text:
                segment_list.append(
                    TranscriptionSegment(
                        start=segment.start,
                        end=segment.end,
                        text=segment_text,
                        confidence=getattr(segment, "avg_logprob", None),
                    )
                )
                full_text += segment_text + " "
                if hasattr(segment, "avg_logprob"):
                    total_confidence += segment.avg_logprob
                    segment_count += 1
        
        full_text = full_text.strip()
        avg_confidence = total_confidence / segment_count if segment_count > 0 else None
        
        # Convert logprob to confidence (0-1 range, approximate)
        confidence_score = None
        if avg_confidence is not None:
            # Logprob is typically negative, convert to 0-1 range
            # Higher logprob = higher confidence
            confidence_score = min(1.0, max(0.0, (avg_confidence + 1.0) / 2.0))
        
        logger.info(f"Transcription complete: {len(full_text)} characters, {len(segment_list)} segments")
        
        return TranscribeResponse(
            text=full_text,
            segments=segment_list if segment_list else None,
            confidence=confidence_score,
            language=info.language if hasattr(info, "language") else request.language,
        )
        
    except Exception as e:
        logger.error(f"Transcription error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

