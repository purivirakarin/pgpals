import React, { useState, useEffect } from 'react';
import { Users, Plus, Check, X, Send, AlertCircle } from 'lucide-react';

interface GroupSubmissionFormProps {
  questId: number;
  questTitle: string;
  onSubmissionSuccess?: () => void;
  onCancel?: () => void;
}

interface User {
  id: number;
  name: string;
  telegram_username?: string;
  partner_id?: number;
  partner?: {
    id: number;
    name: string;
    telegram_username?: string;
  };
}

interface PairInfo {
  user1Name: string;
  user2Name: string;
  user1TelegramUsername?: string;
  user2TelegramUsername?: string;
}

const GroupSubmissionForm: React.FC<GroupSubmissionFormProps> = ({
  questId,
  questTitle,
  onSubmissionSuccess,
  onCancel
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [pairNames, setPairNames] = useState<Record<string, PairInfo>>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'confirm' | 'submit'>('select');
  const [telegramInstructions, setTelegramInstructions] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        // Filter out current user and only show users with partners (pairs)
        const pairs = data.filter((user: User) => user.partner_id);
        setUsers(pairs);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleParticipantToggle = (userId: number, partnerId?: number) => {
    setSelectedParticipants(prev => {
      const newSelection = [...prev];
      
      // Add/remove user
      if (newSelection.includes(userId)) {
        // Remove user and partner
        const filtered = newSelection.filter(id => id !== userId && id !== partnerId);
        
        // Remove from pair names tracking
        const pairKey = `${Math.min(userId, partnerId || 0)}-${Math.max(userId, partnerId || 0)}`;
        setPairNames(prev => {
          const updated = { ...prev };
          delete updated[pairKey];
          return updated;
        });
        
        return filtered;
      } else {
        // Add user and partner
        newSelection.push(userId);
        if (partnerId && !newSelection.includes(partnerId)) {
          newSelection.push(partnerId);
        }
        
        // Initialize pair names for manual entry requirement
        const pairKey = `${Math.min(userId, partnerId || 0)}-${Math.max(userId, partnerId || 0)}`;
        const user = users.find(u => u.id === userId);
        const partner = users.find(u => u.id === partnerId);
        
        setPairNames(prev => ({
          ...prev,
          [pairKey]: {
            user1Name: user?.name || '',
            user2Name: partner?.name || '',
            user1TelegramUsername: user?.telegram_username,
            user2TelegramUsername: partner?.telegram_username
          }
        }));
        
        return newSelection;
      }
    });
  };

  const updatePairName = (pairKey: string, field: keyof PairInfo, value: string) => {
    setPairNames(prev => ({
      ...prev,
      [pairKey]: {
        ...prev[pairKey],
        [field]: value
      }
    }));
  };

  const validatePairNames = (): boolean => {
    const errors: string[] = [];
    
    Object.entries(pairNames).forEach(([pairKey, pairInfo]) => {
      if (!pairInfo.user1Name.trim()) {
        errors.push(`Please enter the first person&apos;s name for one of the pairs`);
      }
      if (!pairInfo.user2Name.trim()) {
        errors.push(`Please enter the second person&apos;s name for one of the pairs`);
      }
    });
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const proceedToSubmission = () => {
    if (!validatePairNames()) {
      return;
    }
    
    const pairCount = Math.ceil(selectedParticipants.length / 2);
    const pairsList = Object.entries(pairNames).map(([key, pairInfo]) => {
      const telegramInfo = [pairInfo.user1TelegramUsername, pairInfo.user2TelegramUsername]
        .filter(Boolean)
        .map(username => `@${username}`)
        .join(' & ');
      
      return `• ${pairInfo.user1Name} & ${pairInfo.user2Name}${telegramInfo ? ` (${telegramInfo})` : ''}`;
    });

    const instructions = `
📋 **Group Submission Instructions**

To create this group submission:

1. **Take a photo/proof** of the completed quest
2. **Send it to the Telegram bot** with this command:
   \`/submit ${questId}\`

3. **The bot will automatically:**
   - Create a group submission for all participants
   - Send confirmation notifications to everyone
   - Track completion for all pairs

**📊 Selected Participants:**
${pairsList.join('\n')}

**Total:** ${selectedParticipants.length} people (${pairCount} pairs)

**⚠️ Important Notes:**
- All participants will receive notifications about the submission
- The submission will count for all included pairs
- Only one person needs to submit via Telegram
- All pair members will get credit when approved

**✉️ Confirmation Alerts:**
- Submitter and their partner: Immediate confirmation
- All group participants: Group submission notification
- Status updates: Sent to all participants
    `;
    
    setTelegramInstructions(instructions);
    setStep('submit');
  };

  const confirmGroupCreation = async () => {
    // Instead of just proceeding to Telegram, let's provide the exact command needed
    const pairCommands = Object.entries(pairNames).map(([key, pairInfo]) => 
      `${pairInfo.user1Name}&${pairInfo.user2Name}`
    ).join(',');
    
    const exactCommand = `/submit ${questId} group:${pairCommands}`;
    
    setTelegramInstructions(`
📋 **Ready to Submit!**

**Exact Command to Use:**
\`${exactCommand}\`

**Instructions:**
1. Copy the command above exactly
2. Open Telegram and go to the PGPals bot
3. Take a photo of your completed quest
4. Send the photo with the copied command as the caption

**What happens next:**
- ✅ Group submission will be created instantly
- 📧 All participants will receive notifications
- 🎯 Everyone gets credit when approved!

**Participants included:**
${Object.entries(pairNames).map(([key, pairInfo]) => 
  `• ${pairInfo.user1Name} & ${pairInfo.user2Name}`
).join('\n')}
    `);
    
    setStep('submit');
  };

  if (step === 'submit') {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <Send className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900">Submit via Telegram</h3>
          <p className="text-gray-600">Follow these steps to create your group submission</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
            {telegramInstructions}
          </pre>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => {
              setStep('select');
              setValidationErrors([]);
            }}
            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back to Selection
          </button>
          <button
            onClick={() => {
              if (onSubmissionSuccess) {
                onSubmissionSuccess();
              }
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Got it! Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Create Group Submission
        </h3>
        <p className="text-gray-600">
          Quest: <span className="font-medium">{questTitle}</span>
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Select pairs to include in this group submission. Each pair counts as 2 participants.
        </p>
      </div>

      {step === 'select' && (
        <>
          <div className="grid md:grid-cols-1 gap-4 mb-6 max-h-96 overflow-y-auto">
            {users.map((user) => {
              const pairKey = `${Math.min(user.id, user.partner_id || 0)}-${Math.max(user.id, user.partner_id || 0)}`;
              const isSelected = selectedParticipants.includes(user.id);
              
              return (
                <div key={user.id} className="space-y-3">
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleParticipantToggle(user.id, user.partner_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {user.name}
                          {user.partner && ` & ${user.partner.name}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.telegram_username && `@${user.telegram_username}`}
                          {user.partner?.telegram_username && ` & @${user.partner.telegram_username}`}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Pair ({user.partner ? '2 people' : '1 person'})
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                  
                  {/* Pair Name Input Fields - Show when selected */}
                  {isSelected && (
                    <div className="ml-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        📝 Enter exact pair names for submission:
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            First Person&apos;s Name*
                          </label>
                          <input
                            type="text"
                            value={pairNames[pairKey]?.user1Name || ''}
                            onChange={(e) => updatePairName(pairKey, 'user1Name', e.target.value)}
                            placeholder="Enter exact name"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Second Person&apos;s Name*
                          </label>
                          <input
                            type="text"
                            value={pairNames[pairKey]?.user2Name || ''}
                            onChange={(e) => updatePairName(pairKey, 'user2Name', e.target.value)}
                            placeholder="Enter exact name"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        💡 These names will be used in notifications and records
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-red-800 mb-1">Please fix these issues:</div>
                  <ul className="text-sm text-red-700 list-disc list-inside">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                Selected: {selectedParticipants.length} participants ({Math.ceil(selectedParticipants.length / 2)} pairs)
              </div>
              <div className="text-xs text-gray-500">
                Min: 2 participants • Max: 10 participants
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={proceedToSubmission}
                disabled={selectedParticipants.length < 2 || selectedParticipants.length > 10}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Next: Get Submission Instructions
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GroupSubmissionForm;
