import { createContext, useContext, useState, type ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { mockCampaigns } from './mock-data';

export type SubmissionStatus = 'available' | 'reserved' | 'submitted' | 'approved' | 'rejected' | 'paid';

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  tax: number;
  net: number;
  date: string;
  description: string;
  status: 'completed' | 'pending';
}

export interface CampaignSubmission {
  campaignId: string;
  status: SubmissionStatus;
  reservedAt?: string;
  submittedAt?: string;
  link?: string;
  clipUrl?: string;
  startTime?: string;
  endTime?: string;
}

interface UserProfile {
  name: string;
  handle: string;
  email: string;
  followers: string;
  earnings: string; // Display string
  balance: number; // Numeric for calculations
  engagement: string;
  reach: string;
  avatar: string;
  isVerified: boolean;
  tier: string;
}

interface StoreContextType {
  user: UserProfile;
  updateUser: (data: Partial<UserProfile>) => void;
  campaignsStatus: Record<string, CampaignSubmission>;
  transactions: Transaction[];
  reserveCampaign: (id: string, title: string) => void;
  submitWork: (id: string, data: { link: string, clipUrl?: string, startTime: string, endTime: string }) => void;
  getCampaignStatus: (id: string) => SubmissionStatus;
  withdrawFunds: (amount: number) => void;
  simulateAdminApproval: (id: string) => void; // For demo purposes
}

const defaultUser: UserProfile = {
  name: "Alex Johnson",
  handle: "@alex.creates",
  email: "alex.johnson@example.com",
  followers: "142.5K",
  earnings: "$4,250",
  balance: 4250,
  engagement: "4.8%",
  reach: "1.2M",
  avatar: "https://github.com/shadcn.png",
  isVerified: true,
  tier: "Influencer Lvl 3"
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [campaignsStatus, setCampaignsStatus] = useState<Record<string, CampaignSubmission>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "tx-1",
      type: "credit",
      amount: 500,
      tax: 50,
      net: 450,
      date: "2024-05-15",
      description: "Campaign Payout: Zara Summer Launch",
      status: "completed"
    },
    {
      id: "tx-2",
      type: "credit",
      amount: 150,
      tax: 15,
      net: 135,
      date: "2024-05-20",
      description: "Campaign Payout: Liquid I.V. Story",
      status: "completed"
    }
  ]);

  const updateUser = (data: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...data }));
    toast({
      title: "Profile Updated",
      description: "Your changes have been saved successfully.",
    });
  };

  const reserveCampaign = (id: string, title: string) => {
    if (campaignsStatus[id]) return;
    
    setCampaignsStatus(prev => ({
      ...prev,
      [id]: {
        campaignId: id,
        status: 'reserved',
        reservedAt: new Date().toISOString()
      }
    }));

    toast({
      title: "Campaign Reserved! 🎉",
      description: `You have 48 hours to submit your content for ${title}.`,
    });
  };

  const submitWork = (id: string, data: { link: string, clipUrl?: string, startTime: string, endTime: string }) => {
    setCampaignsStatus(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        ...data
      }
    }));

    toast({
      title: "Submission Received! 📤",
      description: "Your content is now under review by the admin team.",
    });
    
    // Auto-approve simulation for demo flow if needed, but let's keep it manual via a hidden trigger or just wait
  };

  const simulateAdminApproval = (id: string) => {
    const campaign = mockCampaigns.find(c => c.id === id);
    if (!campaign) return;

    const gross = campaign.payAmount;
    const tax = gross * 0.10; // 10% tax
    const net = gross - tax;

    setCampaignsStatus(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        status: 'approved'
      }
    }));

    // Add transaction
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'credit',
      amount: gross,
      tax: tax,
      net: net,
      date: new Date().toISOString().split('T')[0],
      description: `Campaign Payout: ${campaign.title}`,
      status: 'completed'
    };

    setTransactions(prev => [newTx, ...prev]);
    
    // Update balance
    setUser(prev => ({
      ...prev,
      balance: prev.balance + net,
      earnings: `$${(prev.balance + net).toLocaleString()}`
    }));

    toast({
      title: "Submission Approved! 💰",
      description: `$${net} has been added to your wallet (Tax withheld: $${tax})`,
    });
  };

  const withdrawFunds = (amount: number) => {
    if (amount > user.balance) {
      toast({
        title: "Insufficient Funds",
        description: "You cannot withdraw more than your available balance.",
        variant: "destructive"
      });
      return;
    }

    const newTx: Transaction = {
      id: `wd-${Date.now()}`,
      type: 'debit',
      amount: amount,
      tax: 0,
      net: amount,
      date: new Date().toISOString().split('T')[0],
      description: "Withdrawal to Bank Account (Stripe)",
      status: 'pending' // Simulating pending state
    };

    setTransactions(prev => [newTx, ...prev]);
    
    setUser(prev => ({
      ...prev,
      balance: prev.balance - amount,
      earnings: `$${(prev.balance - amount).toLocaleString()}`
    }));

    toast({
      title: "Withdrawal Initiated 🏦",
      description: `$${amount} is being processed to your bank account via Stripe.`,
    });
  };

  const getCampaignStatus = (id: string): SubmissionStatus => {
    return campaignsStatus[id]?.status || 'available';
  };

  return (
    <StoreContext.Provider value={{ 
      user, 
      updateUser, 
      campaignsStatus, 
      transactions,
      reserveCampaign, 
      submitWork, 
      getCampaignStatus,
      withdrawFunds,
      simulateAdminApproval
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
