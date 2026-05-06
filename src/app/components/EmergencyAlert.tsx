import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { AlertTriangle, Phone, User, Clock, Activity, Heart } from 'lucide-react';
import { toast } from 'sonner';

interface EmergencyPatient {
  id: string;
  patientId: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  emergencyType: string;
  severity: 'critical' | 'severe' | 'moderate';
  chiefComplaint: string;
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    oxygenSaturation?: string;
  };
  timestamp: string;
  alertedAt: Date;
}

interface EmergencyAlertProps {
  emergencyPatients: EmergencyPatient[];
  onAcceptEmergency: (patientId: string) => void;
  onDismissAlert: (patientId: string) => void;
}

export function EmergencyAlert({ emergencyPatients, onAcceptEmergency, onDismissAlert }: EmergencyAlertProps) {
  const [isBlinking, setIsBlinking] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState(false);

  // Get the most recent emergency
  const currentEmergency = emergencyPatients.length > 0 ? emergencyPatients[0] : null;

  useEffect(() => {
    if (currentEmergency) {
      // Start blinking effect
      setIsBlinking(true);
      
      // Play alarm sound (simulated with beep)
      if (!audioPlaying) {
        playAlarmSound();
        setAudioPlaying(true);
      }

      // Blink interval
      const blinkInterval = setInterval(() => {
        setIsBlinking(prev => !prev);
      }, 500);

      return () => {
        clearInterval(blinkInterval);
        setAudioPlaying(false);
      };
    }
  }, [currentEmergency, audioPlaying]);

  const playAlarmSound = () => {
    // In production, this would play an actual alarm sound
    // For now, we'll use the browser's beep and show notification
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 1000; // High frequency for urgency
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      // Repeat alarm every 2 seconds
      const alarmInterval = setInterval(() => {
        if (currentEmergency) {
          const newOscillator = audioContext.createOscillator();
          const newGainNode = audioContext.createGain();
          
          newOscillator.connect(newGainNode);
          newGainNode.connect(audioContext.destination);
          
          newOscillator.frequency.value = 1000;
          newOscillator.type = 'sine';
          
          newGainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          newGainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          
          newOscillator.start(audioContext.currentTime);
          newOscillator.stop(audioContext.currentTime + 0.5);
        } else {
          clearInterval(alarmInterval);
        }
      }, 2000);
    } catch (error) {
      console.error('Could not play alarm sound:', error);
    }
  };

  const handleAccept = () => {
    if (currentEmergency) {
      onAcceptEmergency(currentEmergency.id);
      toast.success(`Emergency patient ${currentEmergency.name} accepted`);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600';
      case 'severe':
        return 'bg-orange-600';
      case 'moderate':
        return 'bg-yellow-600';
      default:
        return 'bg-red-600';
    }
  };

  if (!currentEmergency) return null;

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-4xl p-0 border-0 bg-transparent overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Full Screen Overlay with Blinking Effect */}
        <div 
          className={`fixed inset-0 z-50 transition-opacity duration-500 ${
            isBlinking ? 'bg-red-900/40' : 'bg-red-900/20'
          }`}
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <div className="flex items-center justify-center min-h-screen p-4">
            <Card 
              className={`w-full max-w-4xl border-8 ${
                isBlinking ? 'border-red-600 shadow-2xl shadow-red-500/50' : 'border-red-800 shadow-xl'
              } transition-all duration-300`}
            >
              <CardContent className="p-0">
                {/* Emergency Header - Blinking */}
                <div 
                  className={`${getSeverityColor(currentEmergency.severity)} ${
                    isBlinking ? 'opacity-100' : 'opacity-80'
                  } transition-opacity duration-300 p-6`}
                >
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className={`${isBlinking ? 'scale-110' : 'scale-100'} transition-transform duration-300`}>
                      <AlertTriangle className="w-16 h-16 text-white animate-pulse" />
                    </div>
                    <div className="text-center">
                      <h1 className="text-4xl font-black text-white tracking-wider mb-2">
                        🚨 EMERGENCY ALERT 🚨
                      </h1>
                      <p className="text-white text-xl font-bold uppercase tracking-widest">
                        {currentEmergency.severity} CASE - IMMEDIATE ATTENTION REQUIRED
                      </p>
                    </div>
                    <div className={`${isBlinking ? 'scale-110' : 'scale-100'} transition-transform duration-300`}>
                      <AlertTriangle className="w-16 h-16 text-white animate-pulse" />
                    </div>
                  </div>

                  {/* Emergency Type Badge */}
                  <div className="flex justify-center">
                    <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-white">
                      <p className="text-white text-lg font-bold flex items-center gap-2">
                        <Heart className="w-6 h-6" />
                        {currentEmergency.emergencyType}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Patient Information */}
                <div className="p-8 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Patient Details */}
                    <Card className="border-2 border-red-200 bg-red-50">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                          <User className="w-5 h-5" />
                          Patient Information
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">Patient Name</p>
                            <p className="text-2xl font-bold text-gray-900">{currentEmergency.name}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600 font-semibold">Card Number</p>
                              <p className="text-base font-bold text-blue-600">{currentEmergency.patientId}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 font-semibold">Age / Gender</p>
                              <p className="text-base font-bold text-gray-900">
                                {currentEmergency.age}y, {currentEmergency.gender}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-semibold flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              Contact
                            </p>
                            <p className="text-base font-bold text-gray-900">{currentEmergency.phone}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Emergency Details */}
                    <Card className="border-2 border-orange-200 bg-orange-50">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          Emergency Details
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">Chief Complaint</p>
                            <p className="text-base font-bold text-red-600">{currentEmergency.chiefComplaint}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Alert Time
                            </p>
                            <p className="text-base font-bold text-gray-900">
                              {new Date(currentEmergency.alertedAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">Severity Level</p>
                            <div className={`inline-flex px-4 py-2 rounded-full ${getSeverityColor(currentEmergency.severity)} text-white font-bold uppercase text-sm`}>
                              {currentEmergency.severity}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Vital Signs (if available) */}
                  {currentEmergency.vitalSigns && (
                    <Card className="border-2 border-blue-200 bg-blue-50 mb-6">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          Last Recorded Vital Signs
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {currentEmergency.vitalSigns.bloodPressure && (
                            <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                              <p className="text-xs text-gray-600 font-semibold mb-1">Blood Pressure</p>
                              <p className="text-xl font-bold text-blue-900">
                                {currentEmergency.vitalSigns.bloodPressure}
                              </p>
                            </div>
                          )}
                          {currentEmergency.vitalSigns.heartRate && (
                            <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                              <p className="text-xs text-gray-600 font-semibold mb-1">Heart Rate</p>
                              <p className="text-xl font-bold text-blue-900">
                                {currentEmergency.vitalSigns.heartRate}
                              </p>
                            </div>
                          )}
                          {currentEmergency.vitalSigns.temperature && (
                            <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                              <p className="text-xs text-gray-600 font-semibold mb-1">Temperature</p>
                              <p className="text-xl font-bold text-blue-900">
                                {currentEmergency.vitalSigns.temperature}
                              </p>
                            </div>
                          )}
                          {currentEmergency.vitalSigns.oxygenSaturation && (
                            <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                              <p className="text-xs text-gray-600 font-semibold mb-1">O₂ Saturation</p>
                              <p className="text-xl font-bold text-blue-900">
                                {currentEmergency.vitalSigns.oxygenSaturation}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Queue Info */}
                  {emergencyPatients.length > 1 && (
                    <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                      <p className="text-sm font-bold text-yellow-900">
                        ⚠️ {emergencyPatients.length - 1} more emergency patient(s) waiting
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <Button
                      onClick={handleAccept}
                      className={`flex-1 py-8 text-xl font-bold ${getSeverityColor(currentEmergency.severity)} hover:opacity-90 text-white ${
                        isBlinking ? 'shadow-2xl scale-105' : 'shadow-xl'
                      } transition-all duration-300`}
                    >
                      <AlertTriangle className="w-8 h-8 mr-3" />
                      ACCEPT EMERGENCY PATIENT - SEE NOW
                    </Button>
                    <Button
                      onClick={() => onDismissAlert(currentEmergency.id)}
                      variant="outline"
                      className="px-8 py-8 text-base font-bold border-2 border-gray-400 hover:bg-gray-100"
                    >
                      Dismiss Alert
                      <br />
                      <span className="text-xs font-normal">(Transfer to another doctor)</span>
                    </Button>
                  </div>

                  {/* Warning Message */}
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 text-center font-semibold">
                      ⚠️ This is an EMERGENCY case requiring immediate medical attention. 
                      Accepting this patient will override your current session.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
