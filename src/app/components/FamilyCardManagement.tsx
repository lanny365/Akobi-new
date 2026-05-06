import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  Users,
  Plus,
  UserPlus,
  RefreshCw,
  Wallet,
  DollarSign,
  ArrowRight,
  AlertCircle,
  Trash2,
  Search,
  CreditCard,
  UserMinus,
  Link2,
  Unlink,
} from 'lucide-react';
import { useFamilyCard, FamilyCard } from '../context/FamilyCardContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function FamilyCardManagement() {
  const {
    familyCards,
    conversions,
    attachedPersonalCards,
    addMemberToFamily,
    removeMemberFromFamily,
    convertToFamilyCard,
    convertToIndividualCard,
    addBillToMember,
    updateFamilyWallet,
    attachPersonalCardToFamily,
    detachPersonalCardFromFamily,
    addBillToAttachedCard,
    getAttachedCardsByFamily,
  } = useFamilyCard();

  const [selectedFamily, setSelectedFamily] = useState<FamilyCard | null>(null);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showAttachCardDialog, setShowAttachCardDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showFundWalletDialog, setShowFundWalletDialog] = useState(false);
  const [conversionType, setConversionType] = useState<'toFamily' | 'toIndividual'>('toFamily');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Member Form State
  const [memberForm, setMemberForm] = useState({
    patientId: '',
    patientName: '',
    cardNumber: '',
    age: '',
    gender: '',
    relationship: '',
    originalCardType: 'New Patient Card',
  });

  // Attach Personal Card Form State
  const [attachCardForm, setAttachCardForm] = useState({
    patientId: '',
    patientName: '',
    personalCardNumber: '',
    age: '',
    gender: '',
    relationship: '',
  });

  // Conversion Form State
  const [conversionForm, setConversionForm] = useState({
    patientId: '',
    patientName: '',
    currentCardType: 'New Patient Card',
    newCardType: 'New Patient Card',
    familyName: '',
    memberId: '',
  });

  const [walletAmount, setWalletAmount] = useState('');

  // Conversion fees configuration
  const conversionFees = {
    toFamily: 2000,
    toIndividual: 1500,
  };

  const relationships = [
    'Spouse',
    'Son',
    'Daughter',
    'Father',
    'Mother',
    'Brother',
    'Sister',
    'Grandfather',
    'Grandmother',
    'Uncle',
    'Aunt',
    'Cousin',
    'Other',
  ];

  const cardTypes = [
    'New Patient Card',
    'VIP Patient Card',
    'Staff Dependent Card',
  ];

  const handleAddMember = () => {
    if (!selectedFamily) return;

    if (!memberForm.patientId || !memberForm.patientName || !memberForm.relationship) {
      toast.error('Please fill in all required fields');
      return;
    }

    addMemberToFamily(selectedFamily.id, {
      patientId: memberForm.patientId,
      patientName: memberForm.patientName,
      cardNumber: memberForm.cardNumber || `AKB-${Math.random().toString().slice(2, 8)}`,
      age: Number(memberForm.age) || 0,
      gender: memberForm.gender,
      relationship: memberForm.relationship,
      originalCardType: memberForm.originalCardType,
    });

    toast.success(`${memberForm.patientName} added to ${selectedFamily.familyName}`);

    // Reset form
    setMemberForm({
      patientId: '',
      patientName: '',
      cardNumber: '',
      age: '',
      gender: '',
      relationship: '',
      originalCardType: 'New Patient Card',
    });
    setShowAddMemberDialog(false);
  };

  const handleConvertToFamily = () => {
    if (!conversionForm.patientId || !conversionForm.patientName || !conversionForm.familyName) {
      toast.error('Please fill in all required fields');
      return;
    }

    const familyId = convertToFamilyCard(
      conversionForm.patientId,
      conversionForm.patientName,
      conversionForm.currentCardType,
      conversionForm.familyName,
      conversionFees.toFamily
    );

    toast.success(
      `Conversion successful!\n` +
      `${conversionForm.patientName} converted to Family Card\n` +
      `Conversion Fee: ₦${conversionFees.toFamily.toLocaleString()}`,
      { duration: 5000 }
    );

    setShowConvertDialog(false);
    // Find and select the newly created family
    const newFamily = familyCards.find(f => f.id === familyId);
    if (newFamily) setSelectedFamily(newFamily);
  };

  const handleConvertToIndividual = () => {
    if (!selectedFamily || !conversionForm.memberId || !conversionForm.newCardType) {
      toast.error('Please fill in all required fields');
      return;
    }

    const member = selectedFamily.members.find(m => m.id === conversionForm.memberId);
    if (!member) return;

    convertToIndividualCard(
      selectedFamily.id,
      conversionForm.memberId,
      conversionForm.newCardType,
      conversionFees.toIndividual
    );

    toast.success(
      `Conversion successful!\n` +
      `${member.patientName} converted to ${conversionForm.newCardType}\n` +
      `Conversion Fee: ₦${conversionFees.toIndividual.toLocaleString()}`,
      { duration: 5000 }
    );

    setShowConvertDialog(false);
  };

  const handleFundWallet = () => {
    if (!selectedFamily || !walletAmount) return;

    const amount = Number(walletAmount);
    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    updateFamilyWallet(selectedFamily.id, amount);
    toast.success(`₦${amount.toLocaleString()} added to ${selectedFamily.familyName} wallet`);
    setWalletAmount('');
    setShowFundWalletDialog(false);
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (!selectedFamily) return;

    if (confirm(`Remove ${memberName} from ${selectedFamily.familyName}?`)) {
      removeMemberFromFamily(selectedFamily.id, memberId);
      toast.success(`${memberName} removed from family`);
    }
  };

  const handleAttachPersonalCard = () => {
    if (!selectedFamily) return;

    if (!attachCardForm.patientId || !attachCardForm.patientName || !attachCardForm.personalCardNumber || !attachCardForm.relationship) {
      toast.error('Please fill in all required fields');
      return;
    }

    attachPersonalCardToFamily(selectedFamily.id, {
      patientId: attachCardForm.patientId,
      patientName: attachCardForm.patientName,
      personalCardNumber: attachCardForm.personalCardNumber,
      age: Number(attachCardForm.age) || 0,
      gender: attachCardForm.gender,
      relationship: attachCardForm.relationship,
    });

    toast.success(`${attachCardForm.patientName}'s personal card attached to ${selectedFamily.familyName}! Bills will now reflect in family ledger.`);

    // Reset form
    setAttachCardForm({
      patientId: '',
      patientName: '',
      personalCardNumber: '',
      age: '',
      gender: '',
      relationship: '',
    });
    setShowAttachCardDialog(false);
  };

  const handleDetachCard = (attachedCardId: string, cardHolderName: string) => {
    if (confirm(`Detach ${cardHolderName}'s personal card from this family?`)) {
      detachPersonalCardFromFamily(attachedCardId);
      toast.success(`${cardHolderName}'s personal card detached`);
    }
  };

  const filteredFamilies = familyCards.filter(
    (family) =>
      family.familyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      family.familyCardNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      family.headOfFamily.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Card Management
          </h2>
          <p className="text-gray-600 mt-1">Manage family cards, attach personal cards, and shared billing</p>
        </div>
        <Button
          onClick={() => {
            setConversionType('toFamily');
            setShowConvertDialog(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Convert to Family Card
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Families</p>
                <p className="text-2xl font-bold text-blue-900">{familyCards.length}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-green-900">
                  {familyCards.reduce((sum, f) => sum + f.members.length, 0)}
                </p>
              </div>
              <UserPlus className="w-10 h-10 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Conversions</p>
                <p className="text-2xl font-bold text-purple-900">{conversions.length}</p>
              </div>
              <RefreshCw className="w-10 h-10 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Fees</p>
                <p className="text-lg font-bold text-orange-900">
                  ₦{conversions.reduce((sum, c) => sum + c.conversionFee, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Family List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Family Cards
            </CardTitle>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search families..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto space-y-2">
            {filteredFamilies.map((family) => (
              <div
                key={family.id}
                onClick={() => setSelectedFamily(family)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedFamily?.id === family.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{family.familyName}</p>
                    <p className="text-xs text-gray-500">{family.familyCardNumber}</p>
                  </div>
                  <Badge className="bg-blue-600 text-[10px]">
                    {family.members.length + 1} Members
                  </Badge>
                </div>
                <div className="text-xs text-gray-600">
                  <p>Head: {family.headOfFamily.name}</p>
                  <p className="mt-1">
                    Balance: <span className="font-semibold text-green-600">
                      ₦{family.familyWalletBalance.toLocaleString()}
                    </span>
                  </p>
                  <p>
                    Outstanding: <span className="font-semibold text-red-600">
                      ₦{family.totalOutstanding.toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right: Family Details */}
        <Card className="lg:col-span-2">
          {selectedFamily ? (
            <>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{selectedFamily.familyName}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{selectedFamily.familyCardNumber}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setShowAttachCardDialog(true)}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Attach Card
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowAddMemberDialog(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Member
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs defaultValue="members" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="wallet">Family Wallet</TabsTrigger>
                    <TabsTrigger value="bills">Bills Breakdown</TabsTrigger>
                  </TabsList>

                  {/* Members Tab */}
                  <TabsContent value="members" className="space-y-4 mt-4">
                    {/* Head of Family */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            👑
                          </div>
                          <div>
                            <p className="font-semibold">{selectedFamily.headOfFamily.name}</p>
                            <p className="text-sm text-gray-600">Head of Family</p>
                            <p className="text-xs text-gray-500">{selectedFamily.headOfFamily.cardNumber}</p>
                          </div>
                        </div>
                        <Badge className="bg-purple-600">Head</Badge>
                      </div>
                    </div>

                    {/* Attached Personal Cards Section */}
                    {getAttachedCardsByFamily(selectedFamily.id).length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-orange-700">
                          <Link2 className="w-4 h-4" />
                          Attached Personal Cards ({getAttachedCardsByFamily(selectedFamily.id).length})
                        </div>
                        {getAttachedCardsByFamily(selectedFamily.id).map((attachedCard) => (
                          <div
                            key={attachedCard.id}
                            className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border-2 border-orange-200 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Link2 className="w-4 h-4 text-orange-600" />
                                  <p className="font-semibold">{attachedCard.patientName}</p>
                                  <Badge variant="outline" className="text-xs border-orange-600 text-orange-600">
                                    {attachedCard.relationship}
                                  </Badge>
                                  <Badge className="text-xs bg-orange-600">
                                    Personal Card
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                  <p>Personal Card: {attachedCard.personalCardNumber}</p>
                                  <p>Age: {attachedCard.age} years</p>
                                  <p>Gender: {attachedCard.gender}</p>
                                  <p>Attached: {new Date(attachedCard.attachedDate).toLocaleDateString()}</p>
                                </div>
                                <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <p className="text-gray-600">Total Bills</p>
                                    <p className="font-semibold text-blue-900">
                                      ₦{attachedCard.totalBills.toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Outstanding</p>
                                    <p className="font-semibold text-red-600">
                                      ₦{attachedCard.outstandingBalance.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-2 p-2 bg-orange-100 rounded text-xs text-orange-800">
                                  <AlertCircle className="w-3 h-3 inline mr-1" />
                                  Bills from this personal card reflect in the family ledger
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => handleDetachCard(attachedCard.id, attachedCard.patientName)}
                                >
                                  <Unlink className="w-3 h-3 mr-1" />
                                  Detach
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Regular Family Members Section */}
                    {selectedFamily.members.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                          <Users className="w-4 h-4" />
                          Direct Family Members ({selectedFamily.members.length})
                        </div>
                        {selectedFamily.members.map((member) => (
                          <div
                            key={member.id}
                            className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="font-semibold">{member.patientName}</p>
                                  <Badge variant="outline" className="text-xs">
                                    {member.relationship}
                                  </Badge>
                                  <Badge
                                    className={`text-xs ${
                                      member.status === 'active' ? 'bg-green-600' : 'bg-gray-600'
                                    }`}
                                  >
                                    {member.status}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                  <p>Card: {member.cardNumber}</p>
                                  <p>Age: {member.age} years</p>
                                  <p>Gender: {member.gender}</p>
                                  <p>Joined: {new Date(member.joinedDate).toLocaleDateString()}</p>
                                </div>
                                <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <p className="text-gray-600">Total Bills</p>
                                    <p className="font-semibold text-blue-900">
                                      ₦{member.totalBills.toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Outstanding</p>
                                    <p className="font-semibold text-red-600">
                                      ₦{member.outstandingBalance.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setConversionType('toIndividual');
                                    setConversionForm({
                                      ...conversionForm,
                                      memberId: member.id,
                                      patientName: member.patientName,
                                    });
                                    setShowConvertDialog(true);
                                  }}
                                >
                                  <RefreshCw className="w-3 h-3 mr-1" />
                                  Convert
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => handleRemoveMember(member.id, member.patientName)}
                                >
                                  <UserMinus className="w-3 h-3 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedFamily.members.length === 0 && getAttachedCardsByFamily(selectedFamily.id).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>No family members or attached cards yet</p>
                        <p className="text-sm">Click "Add Member" or "Attach Card" to get started</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Wallet Tab */}
                  <TabsContent value="wallet" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Wallet className="w-10 h-10 text-green-600" />
                            <div>
                              <p className="text-sm text-gray-600">Wallet Balance</p>
                              <p className="text-2xl font-bold text-green-900">
                                ₦{selectedFamily.familyWalletBalance.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="w-10 h-10 text-red-600" />
                            <div>
                              <p className="text-sm text-gray-600">Total Outstanding</p>
                              <p className="text-2xl font-bold text-red-900">
                                ₦{selectedFamily.totalOutstanding.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-10 h-10 text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-600">Total Family Bills</p>
                            <p className="text-2xl font-bold text-blue-900">
                              ₦{selectedFamily.totalFamilyBills.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-900">
                          <p className="font-semibold mb-1">How Family Wallet Works:</p>
                          <ul className="list-disc list-inside space-y-1 text-blue-800">
                            <li>All family members' bills are added to the family wallet</li>
                            <li>Payments from the wallet reduce outstanding balance for all members</li>
                            <li>You can track individual member contributions and bills</li>
                            <li>Wallet funds are shared across the entire family</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Bills Breakdown Tab */}
                  <TabsContent value="bills" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      {selectedFamily.members.map((member) => (
                        <Card key={member.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{member.patientName}</p>
                                <p className="text-sm text-gray-600">{member.relationship}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600">Total Bills</p>
                                <p className="text-lg font-bold text-blue-900">
                                  ₦{member.totalBills.toLocaleString()}
                                </p>
                                <p className="text-xs text-red-600">
                                  Outstanding: ₦{member.outstandingBalance.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {selectedFamily.members.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p>No member bills yet</p>
                        </div>
                      )}
                    </div>

                    <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm opacity-90">Grand Total</p>
                            <p className="text-2xl font-bold">
                              ₦{selectedFamily.totalFamilyBills.toLocaleString()}
                            </p>
                          </div>
                          <DollarSign className="w-12 h-12 opacity-50" />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-[400px]">
              <div className="text-center text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="font-medium">No family selected</p>
                <p className="text-sm">Select a family from the list to view details</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Add Family Member
            </DialogTitle>
            <DialogDescription>
              Add an individual patient to {selectedFamily?.familyName}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label>Patient ID *</Label>
              <Input
                value={memberForm.patientId}
                onChange={(e) => setMemberForm({ ...memberForm, patientId: e.target.value })}
                placeholder="e.g., P12345"
              />
            </div>
            <div>
              <Label>Patient Name *</Label>
              <Input
                value={memberForm.patientName}
                onChange={(e) => setMemberForm({ ...memberForm, patientName: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div>
              <Label>Card Number</Label>
              <Input
                value={memberForm.cardNumber}
                onChange={(e) => setMemberForm({ ...memberForm, cardNumber: e.target.value })}
                placeholder="Auto-generated if empty"
              />
            </div>
            <div>
              <Label>Relationship *</Label>
              <Select
                value={memberForm.relationship}
                onValueChange={(value) => setMemberForm({ ...memberForm, relationship: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {relationships.map((rel) => (
                    <SelectItem key={rel} value={rel}>
                      {rel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Age</Label>
              <Input
                type="number"
                value={memberForm.age}
                onChange={(e) => setMemberForm({ ...memberForm, age: e.target.value })}
                placeholder="Age in years"
              />
            </div>
            <div>
              <Label>Gender</Label>
              <Select
                value={memberForm.gender}
                onValueChange={(value) => setMemberForm({ ...memberForm, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Original Card Type</Label>
              <Select
                value={memberForm.originalCardType}
                onValueChange={(value) => setMemberForm({ ...memberForm, originalCardType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cardTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Convert Card Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              {conversionType === 'toFamily' ? 'Convert to Family Card' : 'Convert to Individual Card'}
            </DialogTitle>
            <DialogDescription>
              {conversionType === 'toFamily'
                ? 'Convert an individual patient card to a Family Card'
                : 'Convert a family member back to an individual card'}
            </DialogDescription>
          </DialogHeader>

          {conversionType === 'toFamily' ? (
            <div className="space-y-4 py-4">
              <div>
                <Label>Patient ID *</Label>
                <Input
                  value={conversionForm.patientId}
                  onChange={(e) => setConversionForm({ ...conversionForm, patientId: e.target.value })}
                  placeholder="e.g., P12345"
                />
              </div>
              <div>
                <Label>Patient Name *</Label>
                <Input
                  value={conversionForm.patientName}
                  onChange={(e) => setConversionForm({ ...conversionForm, patientName: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div>
                <Label>Current Card Type</Label>
                <Select
                  value={conversionForm.currentCardType}
                  onValueChange={(value) => setConversionForm({ ...conversionForm, currentCardType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cardTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Family Name *</Label>
                <Input
                  value={conversionForm.familyName}
                  onChange={(e) => setConversionForm({ ...conversionForm, familyName: e.target.value })}
                  placeholder="e.g., Johnson Family"
                />
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="text-sm text-orange-900">
                    <p className="font-semibold">Conversion Fee: ₦{conversionFees.toFamily.toLocaleString()}</p>
                    <p className="text-xs mt-1">This fee will be charged to the new family wallet</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Member:</span> {conversionForm.patientName}
                </p>
              </div>
              <div>
                <Label>New Card Type *</Label>
                <Select
                  value={conversionForm.newCardType}
                  onValueChange={(value) => setConversionForm({ ...conversionForm, newCardType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select new card type" />
                  </SelectTrigger>
                  <SelectContent>
                    {cardTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="text-sm text-orange-900">
                    <p className="font-semibold">Conversion Fee: ₦{conversionFees.toIndividual.toLocaleString()}</p>
                    <p className="text-xs mt-1">This fee will be charged to the family wallet</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConvertDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={conversionType === 'toFamily' ? handleConvertToFamily : handleConvertToIndividual}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Convert ({conversionType === 'toFamily' ? `₦${conversionFees.toFamily.toLocaleString()}` : `₦${conversionFees.toIndividual.toLocaleString()}`})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fund Wallet Dialog */}
      <Dialog open={showFundWalletDialog} onOpenChange={setShowFundWalletDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-600" />
              Fund Family Wallet
            </DialogTitle>
            <DialogDescription>
              Add funds to {selectedFamily?.familyName} wallet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                Current Balance: <span className="font-bold">₦{selectedFamily?.familyWalletBalance.toLocaleString()}</span>
              </p>
            </div>
            <div>
              <Label>Amount to Add *</Label>
              <Input
                type="number"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowFundWalletDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleFundWallet} className="bg-green-600 hover:bg-green-700">
              <Wallet className="w-4 h-4 mr-2" />
              Add Funds
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attach Card Dialog */}
      <Dialog open={showAttachCardDialog} onOpenChange={setShowAttachCardDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-orange-600" />
              Attach Personal Card
            </DialogTitle>
            <DialogDescription>
              Attach a personal card to {selectedFamily?.familyName}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label>Patient ID *</Label>
              <Input
                value={attachCardForm.patientId}
                onChange={(e) => setAttachCardForm({ ...attachCardForm, patientId: e.target.value })}
                placeholder="e.g., P12345"
              />
            </div>
            <div>
              <Label>Patient Name *</Label>
              <Input
                value={attachCardForm.patientName}
                onChange={(e) => setAttachCardForm({ ...attachCardForm, patientName: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div>
              <Label>Personal Card Number *</Label>
              <Input
                value={attachCardForm.personalCardNumber}
                onChange={(e) => setAttachCardForm({ ...attachCardForm, personalCardNumber: e.target.value })}
                placeholder="e.g., PC12345"
              />
            </div>
            <div>
              <Label>Relationship *</Label>
              <Select
                value={attachCardForm.relationship}
                onValueChange={(value) => setAttachCardForm({ ...attachCardForm, relationship: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {relationships.map((rel) => (
                    <SelectItem key={rel} value={rel}>
                      {rel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Age</Label>
              <Input
                type="number"
                value={attachCardForm.age}
                onChange={(e) => setAttachCardForm({ ...attachCardForm, age: e.target.value })}
                placeholder="Age in years"
              />
            </div>
            <div>
              <Label>Gender</Label>
              <Select
                value={attachCardForm.gender}
                onValueChange={(value) => setAttachCardForm({ ...attachCardForm, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAttachCardDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAttachPersonalCard} className="bg-orange-600 hover:bg-orange-700">
              <Link2 className="w-4 h-4 mr-2" />
              Attach Card
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}