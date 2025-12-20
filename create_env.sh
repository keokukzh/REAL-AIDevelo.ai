#!/bin/bash
# Script zum Erstellen der .env Datei auf dem Server

cd ~/REAL-AIDevelo.ai || exit 1

cat > .env << 'ENVEOF'
# ============================================
# AIDevelo Environment Variables
# ============================================

# ============================================
# PUBLIC URL (WICHTIG für FreeSWITCH!)
# ============================================
PUBLIC_BASE_URL=https://real-aidevelo-ai.onrender.com

# ============================================
# Frontend & CORS
# ============================================
FRONTEND_URL=https://aidevelo.ai
ALLOWED_ORIGINS=https://aidevelo.ai,https://www.aidevelo.ai

# ============================================
# FreeSWITCH
# ============================================
FREESWITCH_ESL_PASSWORD=ClueCon

# ============================================
# Database (PostgreSQL)
# ============================================
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=aidevelo

# ============================================
# MinIO (S3-compatible storage)
# ============================================
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

# ============================================
# LLM (vLLM)
# ============================================
VLLM_API_KEY=dummy
VLLM_MODEL=Qwen/Qwen2.5-7B-Instruct

# ============================================
# ASR Service (Speech Recognition)
# ============================================
ASR_DEVICE=cpu
ASR_MODEL_SIZE=large-v3

# ============================================
# TTS Service (Text-to-Speech)
# ============================================
TTS_DEVICE=cpu

# ============================================
# Service Providers
# ============================================
ASR_PROVIDER=faster_whisper
TTS_PROVIDER=parler
LLM_PROVIDER=vllm
TELEPHONY_ADAPTER=freeswitch
ENVEOF

echo "✅ .env Datei wurde erstellt!"
echo ""
echo "📋 Inhalt:"
cat .env
echo ""
echo "🔄 Starte FreeSWITCH neu..."
docker compose down freeswitch
docker compose up -d freeswitch
echo ""
echo "✅ Fertig! Prüfe mit: docker exec aidevelo-freeswitch env | grep PUBLIC_BASE_URL"

