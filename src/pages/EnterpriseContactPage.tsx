import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EnterpriseContactForm } from '../components/EnterpriseContactForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const EnterpriseContactPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
      <header className="p-6 border-b border-white/10 flex items-center justify-between">
        <div onClick={() => navigate('/')} className="cursor-pointer flex items-center gap-2">
          <img src="/main-logo.png" alt="AIDevelo.ai" className="h-8 w-auto object-contain" />
        </div>
        <Button variant="outline" onClick={() => navigate('/')} className="text-sm">
          <ArrowLeft size={16} className="mr-2" />
          Zurück
        </Button>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface/50 rounded-2xl border border-white/10 p-8 md:p-12"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Enterprise-Anfrage</h1>
            <p className="text-gray-400 text-lg">
              Lassen Sie uns gemeinsam eine maßgeschneiderte Lösung für Ihr Unternehmen entwickeln.
            </p>
          </div>

          <EnterpriseContactForm onSuccess={() => navigate('/')} />
        </motion.div>
      </main>
    </div>
  );
};

