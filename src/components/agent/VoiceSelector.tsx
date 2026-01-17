import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, Check, Search, Info } from 'lucide-react';
import { Button } from '../ui/Button.js';
import { apiRequest } from '../../services/api.js';

interface Voice {
  id: string;
  name: string;
  language: string;
  languageCode: string;
  gender: 'Male' | 'Female';
  previewText: string;
  tags: string[];
}

const AVAILABLE_VOICES: Voice[] = [
  {
    id: 'de-CH-LeniNeural',
    name: 'Leni (Schweiz)',
    language: 'Deutsch (CH)',
    languageCode: 'de-CH',
    gender: 'Female',
    previewText: 'Grüezi! Ich bin Ihre neue digitale Assistentin. Wie kann ich Ihnen heute helfen?',
    tags: ['Einfühlsam', 'Professionell', 'Schweizerdeutsch'],
  },
  {
    id: 'de-CH-JanNeural',
    name: 'Jan (Schweiz)',
    language: 'Deutsch (CH)',
    languageCode: 'de-CH',
    gender: 'Male',
    previewText:
      'Guten Tag. Hier ist Ihr virtueller Mitarbeiter. Ich unterstütze Sie gerne bei Ihren Anfragen.',
    tags: ['Zuverlässig', 'Kompetent', 'Schweizerdeutsch'],
  },
  {
    id: 'de-DE-KatjaNeural',
    name: 'Katja (Standard)',
    language: 'Deutsch (DE)',
    languageCode: 'de-DE',
    gender: 'Female',
    previewText: 'Hallo! Ich bin Ihre KI-Stimme für klare und präzise Kommunikation.',
    tags: ['Klar', 'Modern'],
  },
  {
    id: 'de-DE-ConradNeural',
    name: 'Conrad (Standard)',
    language: 'Deutsch (DE)',
    languageCode: 'de-DE',
    gender: 'Male',
    previewText: 'Guten Tag. Ich bin bereit, Ihre Kunden professionell zu empfangen.',
    tags: ['Seriös', 'Tief'],
  },
  {
    id: 'fr-CH-ArianeNeural',
    name: 'Ariane (Suisse)',
    language: 'Français (CH)',
    languageCode: 'fr-CH',
    gender: 'Female',
    previewText:
      "Bonjour! Je suis votre assistante virtuelle. Comment puis-je vous aider aujourd'hui?",
    tags: ['Douce', 'Professionnelle'],
  },
  {
    id: 'it-CH-IsabellaNeural',
    name: 'Isabella (Svizzera)',
    language: 'Italiano (CH)',
    languageCode: 'it-CH',
    gender: 'Female',
    previewText: 'Buongiorno! Sono la sua assistente virtuale. Come posso aiutarla oggi?',
    tags: ['Elegante', 'Chiara'],
  },
];

interface VoiceSelectorProps {
  selectedVoiceId: string;
  onVoiceSelect: (voiceId: string) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedVoiceId, onVoiceSelect }) => {
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVoices = AVAILABLE_VOICES.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const handlePreview = async (voice: Voice) => {
    if (previewingId === voice.id) {
      audio?.pause();
      setPreviewingId(null);
      return;
    }

    setLoadingId(voice.id);
    try {
      const res = await apiRequest<{ success: boolean; audioUrl: string }>('/voice/preview', {
        method: 'POST',
        data: {
          text: voice.previewText,
          voiceId: voice.id,
          language: voice.languageCode,
        },
      });

      if (res.audioUrl) {
        if (audio) {
          audio.pause();
        }
        const newAudio = new Audio(res.audioUrl);
        newAudio.onended = () => setPreviewingId(null);
        setAudio(newAudio);
        setPreviewingId(voice.id);
        newAudio.play();
      }
    } catch (error) {
      console.error('Preview failed', error);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Stimmen suchen (z.B. Schweiz, Leni, Profi)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredVoices.map((voice) => (
          <motion.div
            key={voice.id}
            whileHover={{ y: -2 }}
            className={`relative p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedVoiceId === voice.id
                ? 'bg-accent/10 border-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.15)]'
                : 'bg-surface/50 border-white/10 hover:border-white/20'
            }`}
            onClick={() => onVoiceSelect(voice.id)}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-lg">{voice.name}</h4>
                  {selectedVoiceId === voice.id && (
                    <div className="bg-accent text-black p-0.5 rounded-full">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-400">{voice.language}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreview(voice);
                }}
                className={`w-10 h-10 rounded-full p-0 flex items-center justify-center transition-colors ${
                  previewingId === voice.id ? 'bg-accent text-black' : 'hover:bg-white/10'
                }`}
                disabled={loadingId === voice.id}
              >
                {loadingId === voice.id ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : previewingId === voice.id ? (
                  <Square size={16} fill="currentColor" />
                ) : (
                  <Play size={16} fill="currentColor" className="ml-0.5" />
                )}
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-auto">
              {voice.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-white/5 text-gray-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
        <Info className="text-blue-400 shrink-0" size={20} />
        <div className="text-sm text-blue-100/80">
          <p className="font-bold text-blue-300 mb-1">Premium Stimmen</p>
          Wir nutzen modernste KI-Modelle von Microsoft Azure und ElevenLabs für maximale
          Natürlichkeit und regionale Dialekte.
        </div>
      </div>
    </div>
  );
};
