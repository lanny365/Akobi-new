import { useState } from 'react';
import { Banknote, CreditCard, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Invoice {
  id: string;
  patientName: string;
  patientId: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  services: string;
}

export function Billing() {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  const invoices: Invoice[] = [
    { id: 'INV-3001', patientName: 'John Anderson', patientId: 'P-2847', amount: 2500, date: '2026-04-15', dueDate: '2026-05-15', status: 'Pending', services: 'Surgery, Lab Tests' },
    { id: 'INV-3002', patientName: 'Maria Garcia', patientId: 'P-2846', amount: 850, date: '2026-04-18', dueDate: '2026-05-18', status: 'Paid', services: 'X-Ray, Consultation' },
    { id: 'INV-3003', patientName: 'Robert Chen', patientId: 'P-2845', amount: 450, date: '2026-04-10', dueDate: '2026-05-10', status: 'Paid', services: 'Prescription, Follow-up' },
    { id: 'INV-3004', patientName: 'Emily Brown', patientId: 'P-2844', amount: 3200, date: '2026-03-25', dueDate: '2026-04-25', status: 'Overdue', services: 'Emergency Surgery' },
    { id: 'INV-3005', patientName: 'David Wilson', patientId: 'P-2843', amount: 1750, date: '2026-04-12', dueDate: '2026-05-12', status: 'Pending', services: 'MRI Scan, Consultation' },
  ];

  const filteredInvoices = filterStatus === 'all'
    ? invoices
    : invoices.filter(inv => inv.status === filterStatus);

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = invoices.filter(inv => inv.status === 'Pending').reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAmount = invoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-6">
      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Banknote className="w-8 h-8" />
          </div>
          <p className="text-blue-100 text-sm">Total Revenue</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(totalRevenue)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-gray-600 text-sm">Paid</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{formatCurrency(paidAmount)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-gray-600 text-sm">Pending</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{formatCurrency(pendingAmount)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-600 text-sm">Overdue</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{formatCurrency(overdueAmount)}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1 w-fit">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded ${filterStatus === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          All Invoices
        </button>
        <button
          onClick={() => setFilterStatus('Paid')}
          className={`px-4 py-2 rounded ${filterStatus === 'Paid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          Paid
        </button>
        <button
          onClick={() => setFilterStatus('Pending')}
          className={`px-4 py-2 rounded ${filterStatus === 'Pending' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilterStatus('Overdue')}
          className={`px-4 py-2 rounded ${filterStatus === 'Overdue' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          Overdue
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Invoice ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Patient</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Services</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Issue Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Due Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{invoice.id}</td>
                  <td className="px-6 py-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{invoice.patientName}</p>
                      <p className="text-xs text-gray-500">{invoice.patientId}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{invoice.services}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{formatCurrency(invoice.amount)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{invoice.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{invoice.dueDate}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                      invoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {invoice.status === 'Paid' && <CheckCircle className="w-3 h-3" />}
                      {invoice.status === 'Pending' && <Clock className="w-3 h-3" />}
                      {invoice.status === 'Overdue' && <XCircle className="w-3 h-3" />}
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1">
                        <CreditCard className="w-4 h-4" />
                        Pay
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
