"""
TTS Service - Parler TTS
FastAPI service for text-to-speech synthesis using Parler-TTS
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import logging
from typing import Optional
import os
import io
import hashlib
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="TTS Service", version="1.0.0")

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
_device = os.getenv("TTS_DEVICE", "cpu")  # 'cpu' or 'cuda'
_cache_dir = os.getenv("TTS_CACHE_DIR", "/app/cache")


class SynthesizeRequest(BaseModel):
    text: str
    voice_preset: str  # e.g., 'SwissProfessionalDE', 'FriendlyFemaleDE'
    language: Optional[str] = "de"
    speed: Optional[float] = 1.0
    pitch: Optional[float] = 1.0
    engine: Optional[str] = "parler"  # 'parler' or 'piper'


def get_cache_key(text: str, voice_preset: str, language: str, speed: float, pitch: float) -> str:
    """Generate cache key for TTS request"""
    key_string = f"{text}|{voice_preset}|{language}|{speed}|{pitch}"
    return hashlib.sha256(key_string.encode()).hexdigest()


def load_parler_model():
    """Load Parler-TTS model (cached)"""
    global _model_cache
    
    if "parler" not in _model_cache:
        try:
            from parler_tts import ParlerTTSForConditionalGeneration
            from transformers import AutoTokenizer
            import torch
            
            logger.info(f"Loading Parler-TTS model on {_device}")
            
            model_id = "parler-tts/parler-tts-mini-v2"  # Smaller model for faster inference
            # For production, use: "parler-tts/parler-tts-medium-v2" or larger
            
            tokenizer = AutoTokenizer.from_pretrained(model_id)
            model = ParlerTTSForConditionalGeneration.from_pretrained(model_id).to(_device)
            model.eval()
            
            _model_cache["parler"] = {
                "model": model,
                "tokenizer": tokenizer,
            }
            logger.info("Parler-TTS model loaded successfully")
        except ImportError:
            logger.error("parler-tts not installed. Install with: pip install parler-tts")
            raise
        except Exception as e:
            logger.error(f"Failed to load Parler-TTS model: {e}")
            raise
    
    return _model_cache["parler"]


def synthesize_parler(text: str, voice_preset: str, language: str, speed: float, pitch: float) -> bytes:
    """
    Synthesize speech using Parler-TTS
    
    Args:
        text: Text to synthesize
        voice_preset: Voice preset identifier (mapped to description)
        language: Language code
        speed: Speech speed multiplier
        pitch: Pitch adjustment
        
    Returns:
        Audio bytes (WAV format, 16kHz PCM)
    """
    try:
        import torch
        import torchaudio
        import numpy as np
        
        model_data = load_parler_model()
        model = model_data["model"]
        tokenizer = model_data["tokenizer"]
        
        # Map voice presets to descriptions
        voice_descriptions = {
            "SwissProfessionalDE": "A professional Swiss German male voice, clear and confident",
            "FriendlyFemaleDE": "A friendly German female voice, warm and approachable",
            "NeutralDE": "A neutral German voice, clear and professional",
        }
        
        description = voice_descriptions.get(voice_preset, voice_descriptions["NeutralDE"])
        
        # Tokenize
        inputs = tokenizer(description, return_tensors="pt").to(_device)
        prompt_inputs = tokenizer(text, return_tensors="pt").to(_device)
        
        # Generate
        with torch.no_grad():
            generation = model.generate(
                input_ids=inputs.input_ids,
                prompt_input_ids=prompt_inputs.input_ids,
                max_new_tokens=512,
            )
        
        # Decode audio
        audio_array = generation.cpu().numpy().squeeze()
        
        # Resample to 16kHz if needed (Parler outputs at different sample rates)
        # For now, assume 16kHz output
        sample_rate = 16000
        
        # Apply speed and pitch adjustments (simplified)
        # In production, use more sophisticated audio processing
        if speed != 1.0 or pitch != 1.0:
            # Use torchaudio or librosa for proper resampling/pitch shifting
            # For now, basic resampling
            import scipy.signal
            if speed != 1.0:
                num_samples = int(len(audio_array) / speed)
                audio_array = scipy.signal.resample(audio_array, num_samples)
        
        # Convert to 16-bit PCM WAV
        audio_int16 = (audio_array * 32767).astype(np.int16)
        
        # Create WAV file in memory
        import wave
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, 'wb') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(audio_int16.tobytes())
        
        return wav_buffer.getvalue()
        
    except Exception as e:
        logger.error(f"Parler-TTS synthesis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {str(e)}")


def synthesize_piper(text: str, voice_preset: str, language: str, speed: float) -> bytes:
    """
    Synthesize speech using Piper TTS (CPU-only, faster fallback)
    
    Args:
        text: Text to synthesize
        voice_preset: Voice preset identifier
        language: Language code
        speed: Speech speed multiplier
        
    Returns:
        Audio bytes (WAV format, 16kHz PCM)
    """
    try:
        # Piper TTS implementation
        # For now, return error (Piper can be added later as fallback)
        raise NotImplementedError("Piper TTS not yet implemented. Use Parler-TTS.")
        
    except Exception as e:
        logger.error(f"Piper TTS synthesis error: {e}")
        raise HTTPException(status_code=500, detail=f"Piper TTS not available: {str(e)}")


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "tts-service", "engine": "parler"}


@app.post("/synthesize")
async def synthesize(request: SynthesizeRequest):
    """
    Synthesize text to speech
    
    Args:
        request: SynthesizeRequest with text, voice_preset, and optional parameters
        
    Returns:
        Audio WAV file (16kHz PCM)
    """
    try:
        # Check cache first
        cache_key = get_cache_key(
            request.text,
            request.voice_preset,
            request.language or "de",
            request.speed or 1.0,
            request.pitch or 1.0,
        )
        
        cache_path = os.path.join(_cache_dir, f"{cache_key}.wav")
        if os.path.exists(cache_path):
            logger.info(f"Cache hit for key: {cache_key}")
            with open(cache_path, "rb") as f:
                audio_bytes = f.read()
            return Response(content=audio_bytes, media_type="audio/wav")
        
        # Synthesize
        logger.info(f"Synthesizing: '{request.text[:50]}...' with preset '{request.voice_preset}'")
        
        if request.engine == "piper":
            audio_bytes = synthesize_piper(
                request.text,
                request.voice_preset,
                request.language or "de",
                request.speed or 1.0,
            )
        else:
            audio_bytes = synthesize_parler(
                request.text,
                request.voice_preset,
                request.language or "de",
                request.speed or 1.0,
                request.pitch or 1.0,
            )
        
        # Cache result
        os.makedirs(_cache_dir, exist_ok=True)
        with open(cache_path, "wb") as f:
            f.write(audio_bytes)
        logger.info(f"Cached audio: {cache_path}")
        
        return Response(content=audio_bytes, media_type="audio/wav")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Synthesis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

