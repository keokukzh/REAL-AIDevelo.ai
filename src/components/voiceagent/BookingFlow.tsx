import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, CheckCircle2, ArrowRight, ArrowLeft, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { FloatingInput } from '../ui/FloatingInput';
import { trackCTAClick } from '../../lib/analytics';

interface BookingFlowProps {
  onClose?: () => void;
  onBookingComplete?: () => void;
  className?: string;
}

type Step = 'select' | 'details' | 'confirm';

export const BookingFlow: React.FC<BookingFlowProps> = ({ onClose, onBookingComplete, className = '' }) => {
  const [step, setStep] = useState<Step>('select');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
  });

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  ];

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    trackCTAClick('booking_date_selected', 'booking_flow');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    trackCTAClick('booking_time_selected', 'booking_flow');
  };

  const handleNext = () => {
    if (step === 'select' && selectedDate && selectedTime) {
      setStep('details');
      trackCTAClick('booking_to_details', 'booking_flow');
    } else if (step === 'details') {
      if (formData.name && formData.email) {
        setStep('confirm');
        trackCTAClick('booking_to_confirm', 'booking_flow');
      }
    }
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('select');
    } else if (step === 'confirm') {
      setStep('details');
    }
  };

  const handleSubmit = async () => {
    trackCTAClick('booking_submit', 'booking_flow');
    // Redirect to Calendly with pre-filled data
    const calendlyUrl = `https://calendly.com/aidevelo-enterprise?name=${encodeURIComponent(formData.name)}&email=${encodeURIComponent(formData.email)}&a1=${encodeURIComponent(selectedDate)}&a2=${encodeURIComponent(selectedTime)}`;
    window.open(calendlyUrl, '_blank');
    onBookingComplete?.();
  };

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Get next 7 days for date selection
  const getAvailableDates = () => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      // Skip weekends
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    return dates;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'long' });
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm ${className}`} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden"
      >
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors z-10"
            aria-label="Schließen"
          >
            <X size={18} />
          </button>
        )}

        <div className="p-8">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === 'select' ? 'bg-accent text-black' : 'bg-slate-700 text-gray-400'
              }`}>
                1
              </div>
              <span className={`text-sm ${step === 'select' ? 'text-white' : 'text-gray-500'}`}>Termin wählen</span>
            </div>
            <div className="flex-1 h-[1px] bg-slate-700 mx-4" />
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === 'details' ? 'bg-accent text-black' : step === 'confirm' ? 'bg-slate-700 text-gray-400' : 'bg-slate-800 text-gray-600'
              }`}>
                2
              </div>
              <span className={`text-sm ${step === 'details' ? 'text-white' : 'text-gray-500'}`}>Kontakt</span>
            </div>
            <div className="flex-1 h-[1px] bg-slate-700 mx-4" />
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === 'confirm' ? 'bg-accent text-black' : 'bg-slate-800 text-gray-600'
              }`}>
                3
              </div>
              <span className={`text-sm ${step === 'confirm' ? 'text-white' : 'text-gray-500'}`}>Bestätigen</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 'select' && (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Wählen Sie einen Termin</h2>
                  <p className="text-gray-400">Wählen Sie ein Datum und eine Uhrzeit für Ihre Demo</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Datum auswählen</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {getAvailableDates().map((date) => (
                      <button
                        key={date}
                        onClick={() => handleDateSelect(date)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          selectedDate === date
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-slate-700 bg-slate-800/50 text-gray-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="text-xs font-semibold">{formatDate(date)}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedDate && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-3">Uhrzeit auswählen</h3>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time)}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            selectedTime === time
                              ? 'border-accent bg-accent/10 text-accent'
                              : 'border-slate-700 bg-slate-800/50 text-gray-300 hover:border-slate-600'
                          }`}
                        >
                          <Clock size={16} className="inline mr-1" />
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleNext}
                    disabled={!selectedDate || !selectedTime}
                    variant="primary"
                    className="px-8"
                  >
                    Weiter
                    <ArrowRight size={18} />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Ihre Kontaktdaten</h2>
                  <p className="text-gray-400">
                    Termin: {selectedDate && formatDate(selectedDate)} um {selectedTime} Uhr
                  </p>
                </div>

                <div className="space-y-4">
                  <FloatingInput
                    label="Name *"
                    value={formData.name}
                    onChange={handleChange('name')}
                    required
                  />
                  <FloatingInput
                    label="E-Mail *"
                    type="email"
                    value={formData.email}
                    onChange={handleChange('email')}
                    required
                  />
                  <FloatingInput
                    label="Firma"
                    value={formData.company}
                    onChange={handleChange('company')}
                  />
                  <FloatingInput
                    label="Telefon"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange('phone')}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nachricht (optional)</label>
                    <textarea
                      value={formData.message}
                      onChange={handleChange('message')}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="Haben Sie spezielle Fragen oder Anforderungen?"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="px-6"
                  >
                    <ArrowLeft size={18} />
                    Zurück
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!formData.name || !formData.email}
                    variant="primary"
                    className="px-8"
                  >
                    Weiter
                    <ArrowRight size={18} />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Termin bestätigen</h2>
                  <p className="text-gray-400">Bitte überprüfen Sie Ihre Angaben</p>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 space-y-4 border border-slate-700">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Termin</p>
                    <p className="text-white font-semibold">
                      {selectedDate && formatDate(selectedDate)} um {selectedTime} Uhr
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Name</p>
                    <p className="text-white">{formData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">E-Mail</p>
                    <p className="text-white">{formData.email}</p>
                  </div>
                  {formData.company && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Firma</p>
                      <p className="text-white">{formData.company}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="px-6"
                  >
                    <ArrowLeft size={18} />
                    Zurück
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    variant="primary"
                    className="px-8"
                  >
                    <Calendar size={18} />
                    Termin buchen
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

