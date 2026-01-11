import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { api, type ApiTransaction, type ApiBankAccount, type ApiWithdrawalRequest, formatINR } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { DollarSign, Download, History, ArrowDownLeft, Wallet as WalletIcon, AlertCircle, Plus, Trash2, Check, Clock, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MIN_WITHDRAWAL_AMOUNT = 500;
const WITHDRAWAL_GST_PERCENT = 18;

export default function Earnings() {
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>("");
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [upiForm, setUpiForm] = useState({
    accountHolderName: "",
    upiId: "",
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: api.getCurrentUser,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: () => user ? api.getUserTransactions(user.id) : [],
    enabled: !!user,
  });

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["bankAccounts"],
    queryFn: api.getBankAccounts,
  });

  const { data: withdrawalRequests = [] } = useQuery({
    queryKey: ["withdrawalRequests"],
    queryFn: api.getWithdrawalRequests,
  });

  // Auto-select default bank account when opening withdrawal dialog
  useEffect(() => {
    if (isWithdrawDialogOpen && bankAccounts.length > 0 && !selectedBankAccountId) {
      const defaultAccount = bankAccounts.find(a => a.isDefault) || bankAccounts[0];
      if (defaultAccount) {
        setSelectedBankAccountId(defaultAccount.id.toString());
      }
    }
  }, [isWithdrawDialogOpen, bankAccounts, selectedBankAccountId]);

  const addBankAccountMutation = useMutation({
    mutationFn: api.addBankAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bankAccounts"] });
      setIsBankDialogOpen(false);
      setUpiForm({ accountHolderName: "", upiId: "" });
      toast.success("UPI added successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add UPI");
    },
  });

  const deleteBankAccountMutation = useMutation({
    mutationFn: api.deleteBankAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bankAccounts"] });
      toast.success("UPI removed");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove UPI");
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: ({ amount, bankAccountId }: { amount: number; bankAccountId: number }) => {
      return api.createWithdrawalRequest(amount, bankAccountId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["withdrawalRequests"] });
      setWithdrawAmount("");
      setSelectedBankAccountId("");
      setIsWithdrawDialogOpen(false);
      toast.success("Withdrawal request submitted! You will receive the funds within 2-3 business days.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit withdrawal request");
    },
  });

  const handleAddUpi = () => {
    if (!upiForm.accountHolderName || !upiForm.upiId) {
      toast.error("Please enter your name and UPI ID");
      return;
    }
    addBankAccountMutation.mutate({
      accountHolderName: upiForm.accountHolderName,
      accountNumber: "UPI-" + Date.now(),
      ifscCode: "UPI00000",
      bankName: upiForm.upiId.includes("@") ? upiForm.upiId.split("@")[1].toUpperCase() : "UPI",
      upiId: upiForm.upiId,
    });
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (!user || isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amount < MIN_WITHDRAWAL_AMOUNT) {
      toast.error(`Minimum withdrawal amount is ₹${MIN_WITHDRAWAL_AMOUNT}`);
      return;
    }
    if (amount > parseFloat(user.balance)) {
      toast.error("Insufficient balance");
      return;
    }
    if (!selectedBankAccountId) {
      toast.error("Please select a bank account");
      return;
    }
    withdrawMutation.mutate({ amount, bankAccountId: parseInt(selectedBankAccountId) });
  };

  const currentBalance = user ? parseFloat(user.balance) : 0;
  const canWithdraw = currentBalance >= MIN_WITHDRAWAL_AMOUNT && bankAccounts.length > 0;
  const pendingWithdrawal = withdrawalRequests.find(r => r.status === "pending");

  const totalEarnings = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + parseFloat(t.net), 0);

  const totalTaxes = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + parseFloat(t.tax), 0);


  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Clock className="w-3 h-3 mr-1" /> Processing</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><Check className="w-3 h-3 mr-1" /> Completed</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
        <div className="mx-auto max-w-6xl p-6">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Earnings & Wallet</h1>
              <p className="text-muted-foreground">Track your revenue, taxes, and withdrawals.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" data-testid="button-statement">
                <Download className="mr-2 h-4 w-4" />
                Statement
              </Button>
              
              <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white" 
                    data-testid="button-withdraw"
                    disabled={!!pendingWithdrawal}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    {pendingWithdrawal ? "Withdrawal Pending" : "Withdraw Funds"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                    <DialogDescription>
                      Transfer funds to your bank account. Processing takes 2-3 business days.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Available Balance</Label>
                      <p className="text-2xl font-bold text-green-600" data-testid="text-available-balance">{formatINR(user.balance)}</p>
                    </div>
                    
                    {bankAccounts.length === 0 && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                        <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-orange-700 dark:text-orange-400">
                            Please add a UPI ID first to withdraw funds.
                          </p>
                          <Button 
                            variant="link" 
                            className="h-auto p-0 text-orange-600" 
                            onClick={() => { setIsWithdrawDialogOpen(false); setIsBankDialogOpen(true); }}
                          >
                            Add UPI
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {!canWithdraw && bankAccounts.length > 0 && currentBalance < MIN_WITHDRAWAL_AMOUNT && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                        <p className="text-sm text-orange-700 dark:text-orange-400">
                          Minimum balance of ₹{MIN_WITHDRAWAL_AMOUNT} required. You need ₹{(MIN_WITHDRAWAL_AMOUNT - currentBalance).toFixed(0)} more.
                        </p>
                      </div>
                    )}
                    
                    {canWithdraw && (
                      <>
                        <div className="grid gap-2">
                          <Label>Select UPI Account</Label>
                          <Select value={selectedBankAccountId} onValueChange={setSelectedBankAccountId}>
                            <SelectTrigger data-testid="select-bank-account">
                              <SelectValue placeholder="Choose UPI account" />
                            </SelectTrigger>
                            <SelectContent>
                              {bankAccounts.map(account => (
                                <SelectItem key={account.id} value={account.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-green-600" />
                                    <span>{account.upiId || account.accountHolderName}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="amount">Withdrawal Amount (Min: ₹{MIN_WITHDRAWAL_AMOUNT})</Label>
                          <Input 
                            id="amount" 
                            type="number"
                            placeholder={`Minimum ₹${MIN_WITHDRAWAL_AMOUNT}`}
                            min={MIN_WITHDRAWAL_AMOUNT}
                            max={currentBalance}
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            data-testid="input-withdraw-amount"
                          />
                          <p className="text-xs text-muted-foreground">
                            Maximum: {formatINR(user.balance)}
                          </p>
                        </div>
                        
                        {parseFloat(withdrawAmount) >= MIN_WITHDRAWAL_AMOUNT && (
                          <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
                            <h4 className="font-medium text-sm">Payment Breakdown</h4>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Withdrawal Amount</span>
                              <span>{formatINR(withdrawAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">GST ({WITHDRAWAL_GST_PERCENT}%)</span>
                              <span className="text-red-500">- {formatINR(Math.round(parseFloat(withdrawAmount) * WITHDRAWAL_GST_PERCENT / 100))}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t font-medium">
                              <span>You will receive</span>
                              <span className="text-green-600">
                                {formatINR(parseFloat(withdrawAmount) - Math.round(parseFloat(withdrawAmount) * WITHDRAWAL_GST_PERCENT / 100))}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={handleWithdraw} 
                      disabled={withdrawMutation.isPending || !canWithdraw || !selectedBankAccountId}
                      data-testid="button-confirm-withdraw"
                    >
                      {withdrawMutation.isPending ? "Processing..." : "Submit Withdrawal Request"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-100 dark:border-green-900">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">Wallet Balance</p>
                    <h3 className="mt-2 text-3xl font-bold text-green-800 dark:text-green-300" data-testid="text-balance">{formatINR(user.balance)}</h3>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                    <WalletIcon className="h-6 w-6 text-green-700 dark:text-green-400" />
                  </div>
                </div>
                <p className="mt-4 text-xs font-medium text-green-600/80 dark:text-green-500/80 flex items-center">
                  Available for withdrawal (Min: ₹{MIN_WITHDRAWAL_AMOUNT})
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">GST Deducted (YTD)</p>
                    <h3 className="mt-2 text-3xl font-bold" data-testid="text-taxes">{formatINR(totalTaxes)}</h3>
                  </div>
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-full">
                    <DollarSign className="h-6 w-6 text-orange-700 dark:text-orange-400" />
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">{WITHDRAWAL_GST_PERCENT}% GST on Withdrawals</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                    <h3 className="mt-2 text-3xl font-bold" data-testid="text-total-earnings">{formatINR(totalEarnings)}</h3>
                  </div>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                    <History className="h-6 w-6 text-purple-700 dark:text-purple-400" />
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">Net after tax deduction</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="transactions" className="space-y-6">
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <TabsList className="w-full md:w-auto inline-flex">
                <TabsTrigger value="transactions" className="text-xs md:text-sm whitespace-nowrap">History</TabsTrigger>
                <TabsTrigger value="withdrawals" className="text-xs md:text-sm whitespace-nowrap">Withdrawals</TabsTrigger>
                <TabsTrigger value="bank-accounts" className="text-xs md:text-sm whitespace-nowrap">Bank Accounts</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="transactions">
              <Card>
                <CardContent className="p-6">
                  {transactions.length === 0 ? (
                    <div className="py-12 text-center">
                      <History className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-4 text-sm text-muted-foreground">No transactions yet</p>
                      <p className="text-xs text-muted-foreground/80">Complete campaigns to start earning</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map((transaction, i) => (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between rounded-lg border p-4"
                          data-testid={`transaction-${transaction.id}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`rounded-full p-2 ${transaction.type === 'credit' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                              {transaction.type === 'credit' ? (
                                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                              ) : (
                                <ArrowDownLeft className="h-4 w-4 text-red-600 dark:text-red-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                                {transaction.type === 'credit' && (
                                  <>
                                    <span>•</span>
                                    <span className="text-orange-600">Tax: {formatINR(transaction.tax)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                              {transaction.type === 'credit' ? '+' : '-'}{formatINR(transaction.net)}
                            </p>
                            {transaction.type === 'credit' && (
                              <p className="text-xs text-muted-foreground">
                                Gross: {formatINR(transaction.amount)}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="withdrawals">
              <Card>
                <CardContent className="p-6">
                  {withdrawalRequests.length === 0 ? (
                    <div className="py-12 text-center">
                      <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-4 text-sm text-muted-foreground">No withdrawal requests yet</p>
                      <p className="text-xs text-muted-foreground/80">Withdraw your earnings when you're ready</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {withdrawalRequests.map((request, i) => {
                        const bankAccount = bankAccounts.find(b => b.id === request.bankAccountId);
                        return (
                          <motion.div
                            key={request.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center justify-between rounded-lg border p-4"
                            data-testid={`withdrawal-${request.id}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900/30">
                                <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="font-medium">Withdrawal Request #{request.id}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{new Date(request.requestedAt).toLocaleDateString()}</span>
                                  {bankAccount && (
                                    <>
                                      <span>•</span>
                                      <span>UPI: {bankAccount.upiId}</span>
                                    </>
                                  )}
                                </div>
                                {request.utrNumber && (
                                  <p className="text-xs text-green-600 mt-1">UTR: {request.utrNumber}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-blue-600">{formatINR(request.amount)}</p>
                              {getStatusBadge(request.status)}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bank-accounts">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Linked UPI Accounts</CardTitle>
                  <Dialog open={isBankDialogOpen} onOpenChange={setIsBankDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-bank">
                        <Plus className="mr-2 h-4 w-4" />
                        Add UPI
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add UPI Account</DialogTitle>
                        <DialogDescription>
                          Add your Google Pay, PhonePe, Paytm or any UPI ID to receive withdrawals.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="accountHolderName">Your Name *</Label>
                          <Input 
                            id="accountHolderName"
                            placeholder="Enter your full name"
                            value={upiForm.accountHolderName}
                            onChange={(e) => setUpiForm(prev => ({ ...prev, accountHolderName: e.target.value }))}
                            data-testid="input-account-holder"
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="upiId">UPI ID *</Label>
                          <Input 
                            id="upiId"
                            placeholder="e.g., 9876543210@paytm, name@okaxis"
                            value={upiForm.upiId}
                            onChange={(e) => setUpiForm(prev => ({ ...prev, upiId: e.target.value }))}
                            data-testid="input-upi"
                          />
                          <p className="text-xs text-muted-foreground">
                            Enter your Google Pay, PhonePe, Paytm, or any UPI ID
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={handleAddUpi}
                          disabled={addBankAccountMutation.isPending}
                          data-testid="button-save-bank"
                        >
                          {addBankAccountMutation.isPending ? "Adding..." : "Add UPI"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {bankAccounts.length === 0 ? (
                    <div className="py-12 text-center">
                      <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-4 text-sm text-muted-foreground">No UPI linked</p>
                      <p className="text-xs text-muted-foreground/80">Add your Google Pay, PhonePe or Paytm UPI ID to withdraw earnings</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bankAccounts.map((account, i) => (
                        <motion.div
                          key={account.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between rounded-lg border p-4"
                          data-testid={`bank-account-${account.id}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="rounded-full p-2 bg-green-100 dark:bg-green-900/30">
                              <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">UPI</p>
                                <Badge className="bg-green-500 text-xs">UPI</Badge>
                                {account.isDefault && (
                                  <Badge variant="secondary" className="text-xs">Default</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {account.accountHolderName} • {account.upiId}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteBankAccountMutation.mutate(account.id)}
                            disabled={deleteBankAccountMutation.isPending}
                            data-testid={`button-delete-bank-${account.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
