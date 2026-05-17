import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { FlaskConical, Send, Pencil, X, User, Clock, TestTube } from 'lucide-react';
import { toast } from 'sonner';

interface LabRequest {
  id: string;
  patientName: string;
  cardNumber: string;
  requestedBy: string;
  tests: string[];
  status: 'pending' | 'in-progress' | 'completed';
  requestedAt: string;
  completedAt?: string;
}

interface InProgressPatientsProps {
  patients: LabRequest[];
  onSendResult: (request: LabRequest, results: string, notes: string) => void;
}

export function InProgressPatients({ patients, onSendResult }: InProgressPatientsProps) {
  const [selectedPatient, setSelectedPatient] = useState<LabRequest | null>(null);
  const [testResults, setTestResults] = useState('');
  const [labNotes, setLabNotes] = useState('');
  const [handwritingNotes, setHandwritingNotes] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const interpretHandwriting = () => {
    toast.success('Handwriting interpreted');
    setHandwritingNotes('Simulated lab notes: Sample collected and processed. All tests conducted according to standard protocols. Quality control checks passed.');
  };

  const handleSendResults = () => {
    if (!selectedPatient) return;

    if (!testResults.trim()) {
      toast.error('Please enter test results');
      return;
    }

    onSendResult(selectedPatient, testResults, labNotes);
    setSelectedPatient(null);
    setTestResults('');
    setLabNotes('');
    setHandwritingNotes('');
    clearCanvas();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">In-Progress Patients</h2>
        <p className="text-gray-600 mt-1">Complete test results and send back to doctors</p>
      </div>

      {patients.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <FlaskConical className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="font-medium">No patients in progress</p>
            <p className="text-sm mt-2">Patients will appear here when lab technicians start processing tests</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((patient) => (
            <Card
              key={patient.id}
              className="border-2 border-blue-200 hover:border-blue-400 transition-all cursor-pointer"
              onClick={() => setSelectedPatient(patient)}
            >
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-blue-100">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{patient.patientName}</span>
                  <Badge className="bg-blue-600">In Progress</Badge>
                </CardTitle>
                <p className="text-xs text-gray-600">{patient.cardNumber}</p>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-700">{patient.requestedBy}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{patient.requestedAt}</span>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Tests:</p>
                    {patient.tests.map((test, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                        <TestTube className="w-3 h-3 text-purple-500" />
                        {test}
                      </div>
                    ))}
                  </div>
                </div>
                <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700" size="sm">
                  Enter Results
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results Entry Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Test Results - {selectedPatient?.patientName}
            </DialogTitle>
            <DialogDescription>
              Enter lab test results and send them back to the requesting doctor
            </DialogDescription>
          </DialogHeader>

          {selectedPatient && (
            <div className="space-y-6">
              {/* Patient Info */}
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Patient</p>
                      <p className="font-semibold">{selectedPatient.patientName}</p>
                      <p className="text-sm text-gray-600">{selectedPatient.cardNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Requested By</p>
                      <p className="font-semibold">{selectedPatient.requestedBy}</p>
                      <p className="text-sm text-gray-600">{selectedPatient.requestedAt}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tests */}
              <div>
                <Label className="text-base font-semibold">Requested Tests</Label>
                <div className="mt-2 space-y-2">
                  {selectedPatient.tests.map((test, idx) => (
                    <div key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-medium text-gray-900">{test}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Test Results Input */}
              <div>
                <Label>Test Results *</Label>
                <Textarea
                  placeholder="Enter detailed test results here..."
                  rows={6}
                  className="mt-1"
                  value={testResults}
                  onChange={(e) => setTestResults(e.target.value)}
                />
              </div>

              {/* Handwriting Notes */}
              <div>
                <Label>Handwriting Notes (Optional)</Label>
                <div className="mt-1">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="border rounded cursor-crosshair bg-gray-50 w-full"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={clearCanvas}>
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                    <Button size="sm" onClick={interpretHandwriting}>
                      <Pencil className="w-4 h-4 mr-1" />
                      Interpret Handwriting
                    </Button>
                  </div>
                  {handwritingNotes && (
                    <div className="mt-2 p-2 bg-purple-50 rounded text-sm">
                      {handwritingNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Lab Notes */}
              <div>
                <Label>Additional Lab Notes</Label>
                <Textarea
                  placeholder="Additional observations, quality control notes, or comments..."
                  rows={3}
                  className="mt-1"
                  value={labNotes}
                  onChange={(e) => setLabNotes(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => toast.success('Draft saved')}
                >
                  Save as Draft
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleSendResults}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Results to Doctor
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
