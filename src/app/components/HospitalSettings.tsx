import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Settings, DollarSign, FlaskConical, Scissors, Receipt, Bed, Percent, IdCard, ScanLine, Plus, X, Eye, EyeOff } from 'lucide-react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { useCardTypes } from '../context/CardTypesContext';
import { ConsultationFees } from './ConsultationFees';
import { LaboratoryPrices } from './LaboratoryPrices';
import { SurgeryCosts } from './SurgeryCosts';
import { ManualBilling } from './ManualBilling';
import { WardManagement } from './WardManagement';
import { RadiologyPrices } from './RadiologyPrices';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';

type SettingsSection =
  | 'consultation-fees'
  | 'laboratory-prices'
  | 'radiology-prices'
  | 'surgery-costs'
  | 'manual-billing'
  | 'ward-charges'
  | 'patient-card-fees'
  | 'discount-rules';

export function HospitalSettings() {
  const [selectedSection, setSelectedSection] = useState<SettingsSection>('consultation-fees');
  const [isManageSectionsOpen, setIsManageSectionsOpen] = useState(false);

  const allSettingsSections = [
    { value: 'consultation-fees', label: 'Consultation Fees', icon: DollarSign, color: 'text-blue-600' },
    { value: 'laboratory-prices', label: 'Laboratory Test Prices', icon: FlaskConical, color: 'text-purple-600' },
    { value: 'radiology-prices', label: 'Radiology Prices', icon: ScanLine, color: 'text-teal-600' },
    { value: 'surgery-costs', label: 'Surgery (Theatre) Costs', icon: Scissors, color: 'text-red-600' },
    { value: 'manual-billing', label: 'Manual Billing', icon: Receipt, color: 'text-green-600' },
    { value: 'ward-charges', label: 'Ward Charges', icon: Bed, color: 'text-indigo-600' },
    { value: 'patient-card-fees', label: 'Patient Card Fees', icon: IdCard, color: 'text-cyan-600' },
    { value: 'discount-rules', label: 'Discount Rules', icon: Percent, color: 'text-orange-600' },
  ];

  const [enabledSections, setEnabledSections] = useState<SettingsSection[]>([
    'consultation-fees',
    'laboratory-prices',
    'radiology-prices',
    'surgery-costs',
    'manual-billing',
    'ward-charges',
    'patient-card-fees',
    'discount-rules',
  ]);

  const settingsSections = allSettingsSections.filter(section =>
    enabledSections.includes(section.value as SettingsSection)
  );

  const toggleSection = (sectionValue: SettingsSection) => {
    if (enabledSections.includes(sectionValue)) {
      if (enabledSections.length === 1) {
        toast.error('Cannot disable all sections. At least one section must be enabled.');
        return;
      }
      setEnabledSections(enabledSections.filter(s => s !== sectionValue));
      if (selectedSection === sectionValue) {
        setSelectedSection(enabledSections[0]);
      }
      toast.success('Section disabled');
    } else {
      setEnabledSections([...enabledSections, sectionValue]);
      toast.success('Section enabled');
    }
  };

  const renderSection = () => {
    switch (selectedSection) {
      case 'consultation-fees':
        return <ConsultationFees />;
      case 'laboratory-prices':
        return <LaboratoryPrices />;
      case 'radiology-prices':
        return <RadiologyPrices />;
      case 'surgery-costs':
        return <SurgeryCosts />;
      case 'manual-billing':
        return <ManualBilling />;
      case 'ward-charges':
        return <WardManagement />;
      case 'patient-card-fees':
        return <PatientCardFeesSection />;
      case 'discount-rules':
        return <DiscountRulesSection />;
      default:
        return <ConsultationFees />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card with Dropdown Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg flex items-center justify-center shadow-md">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Hospital Settings</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Configure pricing, fees, and hospital-wide settings
              </p>
            </div>
          </div>

          {/* Section Selector Dropdown */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="section-select" className="text-sm font-semibold text-gray-700">
                Select Settings Section
              </Label>
              <Dialog open={isManageSectionsOpen} onOpenChange={setIsManageSectionsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Settings className="w-3 h-3 mr-1" />
                    Manage Sections
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Manage Settings Sections</DialogTitle>
                    <DialogDescription>
                      Enable or disable settings sections from the dropdown menu
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {allSettingsSections.map((section) => {
                      const Icon = section.icon;
                      const isEnabled = enabledSections.includes(section.value as SettingsSection);
                      return (
                        <div
                          key={section.value}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            isEnabled
                              ? 'bg-white border-gray-200'
                              : 'bg-gray-50 border-gray-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 bg-gradient-to-br ${
                                isEnabled ? 'from-orange-500 to-orange-700' : 'from-gray-400 to-gray-600'
                              } rounded-lg flex items-center justify-center`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{section.label}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={isEnabled ? 'default' : 'secondary'} className="text-xs">
                                    {isEnabled ? 'Enabled' : 'Disabled'}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {section.value}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              onClick={() => toggleSection(section.value as SettingsSection)}
                              variant="outline"
                              size="sm"
                              className={
                                isEnabled
                                  ? 'border-red-300 text-red-700 hover:bg-red-50'
                                  : 'border-green-300 text-green-700 hover:bg-green-50'
                              }
                            >
                              {isEnabled ? (
                                <>
                                  <EyeOff className="w-4 h-4 mr-1" />
                                  Disable
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 mr-1" />
                                  Enable
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        <strong>{enabledSections.length}</strong> of <strong>{allSettingsSections.length}</strong> sections enabled
                      </span>
                      <Button onClick={() => setIsManageSectionsOpen(false)}>
                        Done
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <select
              id="section-select"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value as SettingsSection)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <option key={section.value} value={section.value}>
                    {section.label}
                  </option>
                );
              })}
            </select>
          </div>
        </CardHeader>
      </Card>

      {/* Dynamic Content Area */}
      <div className="mt-6">
        {renderSection()}
      </div>
    </div>
  );
}

// Patient Card Fees Section Component
function PatientCardFeesSection() {
  const { cardTypes } = useCardTypes();
  const [cardFees, setCardFees] = useState([
    { id: '1', cardTypeId: '1', cardType: 'New Patient Card', amount: 500, status: 'active' },
    { id: '2', cardTypeId: '2', cardType: 'Card Replacement (Lost)', amount: 1000, status: 'active' },
    { id: '3', cardTypeId: '3', cardType: 'Card Replacement (Damaged)', amount: 700, status: 'active' },
  ]);

  const [selectedCardTypeId, setSelectedCardTypeId] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const activeCardTypes = cardTypes.filter(ct => ct.status === 'active');

  const handleAddCardFee = () => {
    if (!selectedCardTypeId) {
      toast.error('Please select a card type');
      return;
    }

    if (!newAmount || parseFloat(newAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const selectedCardType = cardTypes.find(ct => ct.id === selectedCardTypeId);
    if (!selectedCardType) {
      toast.error('Invalid card type selected');
      return;
    }

    // Check if fee already exists for this card type
    const existingFee = cardFees.find(f => f.cardTypeId === selectedCardTypeId && f.id !== editingId);
    if (existingFee) {
      toast.error('Fee already exists for this card type. Please edit the existing one.');
      return;
    }

    if (editingId) {
      // Update existing fee
      setCardFees(cardFees.map(fee =>
        fee.id === editingId
          ? {
              ...fee,
              cardTypeId: selectedCardTypeId,
              cardType: selectedCardType.name,
              amount: parseFloat(newAmount)
            }
          : fee
      ));
      toast.success('Patient card fee updated successfully');
      setEditingId(null);
    } else {
      // Add new fee
      const newFee = {
        id: (cardFees.length + 1).toString(),
        cardTypeId: selectedCardTypeId,
        cardType: selectedCardType.name,
        amount: parseFloat(newAmount),
        status: 'active' as const
      };

      setCardFees([...cardFees, newFee]);
      toast.success('Patient card fee added successfully');
    }

    // Reset form
    setSelectedCardTypeId('');
    setNewAmount('');
  };

  const handleEditFee = (fee: any) => {
    setEditingId(fee.id);
    setSelectedCardTypeId(fee.cardTypeId);
    setNewAmount(fee.amount.toString());
    toast.info('Editing card fee - Update and click Add/Update button');
  };

  const handleDeleteFee = (id: string) => {
    setCardFees(cardFees.filter(fee => fee.id !== id));
    toast.success('Patient card fee deleted successfully');
  };

  const toggleFeeStatus = (id: string) => {
    setCardFees(cardFees.map(fee =>
      fee.id === id
        ? { ...fee, status: fee.status === 'active' ? 'inactive' : 'active' }
        : fee
    ));
    toast.success('Card fee status updated');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-lg flex items-center justify-center shadow-md">
            <IdCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Patient Card Fees</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Configure fees for issuing patient hospital cards
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Add/Edit Patient Card Fee Form */}
          <div className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border-2 border-cyan-200">
            <h3 className="text-lg font-semibold text-cyan-900 mb-4 flex items-center gap-2">
              <IdCard className="w-5 h-5" />
              {editingId ? 'Update Patient Card Fee' : 'Add New Patient Card Fee'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-900 font-semibold">Card Type *</Label>
                <select
                  value={selectedCardTypeId}
                  onChange={(e) => setSelectedCardTypeId(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">-- Select Card Type --</option>
                  {activeCardTypes.map(cardType => (
                    <option key={cardType.id} value={cardType.id}>
                      {cardType.name}
                    </option>
                  ))}
                </select>
                {activeCardTypes.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    No active card types found. Please add card types in User Management first.
                  </p>
                )}
              </div>

              <div>
                <Label className="text-gray-900 font-semibold">Fee Amount (₦) *</Label>
                <Input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="e.g., 500"
                  className="mt-1"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <Button
                onClick={handleAddCardFee}
                className="flex-1 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white"
              >
                <IdCard className="w-4 h-4 mr-2" />
                {editingId ? 'Update Card Fee' : 'Add Card Fee'}
              </Button>
              {editingId && (
                <Button
                  onClick={() => {
                    setEditingId(null);
                    setSelectedCardTypeId('');
                    setNewAmount('');
                  }}
                  variant="outline"
                  className="px-6"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Patient Card Fees List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configured Patient Card Fees</h3>
            <div className="space-y-3">
              {cardFees.map((fee) => (
                <div
                  key={fee.id}
                  className="p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-cyan-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {(() => {
                          const cardType = cardTypes.find(ct => ct.id === fee.cardTypeId);
                          const colorMap: Record<string, string> = {
                            'blue': 'bg-blue-500',
                            'green': 'bg-green-500',
                            'red': 'bg-red-500',
                            'purple': 'bg-purple-500',
                            'orange': 'bg-orange-500',
                            'pink': 'bg-pink-500',
                            'yellow': 'bg-yellow-500',
                            'indigo': 'bg-indigo-500'
                          };
                          const colorClass = cardType ? colorMap[cardType.color] || 'bg-gray-500' : 'bg-gray-500';
                          return (
                            <div className={`w-10 h-10 ${colorClass} rounded-lg flex items-center justify-center`}>
                              <IdCard className="w-5 h-5 text-white" />
                            </div>
                          );
                        })()}
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-lg">{fee.cardType}</h4>
                          {(() => {
                            const cardType = cardTypes.find(ct => ct.id === fee.cardTypeId);
                            return cardType?.description ? (
                              <p className="text-xs text-gray-500">{cardType.description}</p>
                            ) : null;
                          })()}
                        </div>
                        <Badge variant={fee.status === 'active' ? 'default' : 'secondary'}>
                          {fee.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 inline-block">
                        <p className="text-xs text-green-700 font-semibold mb-1">Card Fee</p>
                        <p className="text-3xl font-bold text-green-900">₦{fee.amount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleEditFee(fee)}
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => toggleFeeStatus(fee.id)}
                        variant="outline"
                        size="sm"
                        className={fee.status === 'active' ? 'border-orange-300 text-orange-700 hover:bg-orange-50' : 'border-green-300 text-green-700 hover:bg-green-50'}
                      >
                        {fee.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        onClick={() => handleDeleteFee(fee.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Information Section */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">About Patient Card Fees</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Card Types:</strong> Card types are managed in User Management → Patient Card Types</li>
              <li>• <strong>Selection:</strong> Only active card types from User Management are available for fee configuration</li>
              <li>• <strong>Application:</strong> These fees are typically collected during patient registration at Reception</li>
              <li>• <strong>One Fee Per Type:</strong> Each card type can only have one fee amount configured</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Discount Rules Section Component
function DiscountRulesSection() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Percent className="w-5 h-5 text-orange-600" />
          <CardTitle>Discount Rules</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <Percent className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Discount Rules</h3>
          <p className="text-sm text-gray-500">
            Discount management functionality coming soon
          </p>
        </div>
      </CardContent>
    </Card>
  );
}