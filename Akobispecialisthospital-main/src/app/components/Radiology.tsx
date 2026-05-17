import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScanLine } from 'lucide-react';

export function Radiology() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Radiology Department</h1>
        <p className="text-gray-600 mt-1">Medical imaging and diagnostic radiology services</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-teal-600" />
              X-Ray Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Chest, abdomen, and skeletal X-ray imaging</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-teal-600" />
              CT Scan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Advanced computed tomography imaging</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-teal-600" />
              MRI & Ultrasound
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Magnetic resonance and ultrasound imaging</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Radiology Portal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <ScanLine className="w-16 h-16 text-teal-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Radiology Management System</h3>
            <p className="text-sm text-gray-500">
              Imaging request processing and results management will be displayed here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
