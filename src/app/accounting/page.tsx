"use client";
import { fetchWithAuth } from "@/lib/apiFetch";

import { useState, useEffect } from "react";
import { Project } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownRight, ArrowUpRight, Plus, Wallet, Trash2, Search, ArrowRightLeft, FolderOpen, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Types
export interface AccountGroup {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  description: string;
}

export interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  date: string;
  description: string;
  group_id: string | null;
  project_id: string | null;
  project?: Project;
  account_group?: AccountGroup;
}

export default function AccountingPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accountGroups, setAccountGroups] = useState<AccountGroup[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [loading, setLoading] = useState(true);
  
  // Transaction Modal State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [txAmount, setTxAmount] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [txDescription, setTxDescription] = useState("");
  const [txGroupId, setTxGroupId] = useState("");
  const [txProjectId, setTxProjectId] = useState("none");
  const [searchTerm, setSearchTerm] = useState("");

  // Group Modal State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState("Income");
  const [groupDesc, setGroupDesc] = useState("");

  const loadData = async () => {
    try {
      const [resTransactions, resGroups, resProjects, resSettings] = await Promise.all([
        fetchWithAuth("http://localhost:8000/api/v1/transactions/"),
        fetchWithAuth("http://localhost:8000/api/v1/account-groups/"),
        fetchWithAuth("http://localhost:8000/api/v1/projects/"),
        fetchWithAuth("http://localhost:8000/api/v1/settings/")
      ]);

      if (resTransactions.ok) setTransactions(await resTransactions.json());
      if (resGroups.ok) setAccountGroups(await resGroups.json());
      if (resProjects.ok) setProjects(await resProjects.json());
      
      if (resSettings.ok) {
        const settingsData = await resSettings.json();
        const currencyMap: Record<string, string> = {
          "USD": "$", "EUR": "€", "GBP": "£", "INR": "₹", "AUD": "A$"
        };
        setCurrencySymbol(currencyMap[settingsData.default_currency] || "$");
      }
    } catch (error) {
      console.error("Error loading accounting data:", error);
      toast.error("Unable to reach backend API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalIncome = transactions.filter(t => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
  const netCashFlow = totalIncome - totalExpense;

  const handleSaveTransaction = async () => {
    if (!txAmount || isNaN(Number(txAmount)) || !txGroupId || !txDate) {
      toast.error("Please fill in all required fields (Amount, Date, Account Group).");
      return;
    }

    const newTx = {
      type: txType,
      amount: Number(txAmount),
      date: txDate,
      description: txDescription,
      group_id: txGroupId,
      project_id: txProjectId === "none" ? null : txProjectId
    };

    try {
      const res = await fetchWithAuth("http://localhost:8000/api/v1/transactions/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTx),
      });

      if (res.ok) {
        toast.success("Transaction recorded successfully!");
        setIsTxModalOpen(false);
        resetTxForm();
        loadData();
      } else {
        const errorData = await res.json();
        toast.error(`Error: ${errorData.detail || "Failed to save"}`);
      }
    } catch (error) {
      toast.error("Failed to communicate with server.");
    }
  };

  const handleSaveGroup = async () => {
    if (!groupName) {
      toast.error("Account Group name is required.");
      return;
    }

    try {
      const res = await fetchWithAuth("http://localhost:8000/api/v1/account-groups/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName, type: groupType, description: groupDesc }),
      });

      if (res.ok) {
        toast.success("Account Group created!");
        setIsGroupModalOpen(false);
        setGroupName("");
        setGroupDesc("");
        loadData();
      }
    } catch {
      toast.error("Error creating group.");
    }
  };

  const handleDeleteTx = async (id: string) => {
    if (!confirm("Delete transaction?")) return;
    try {
      const res = await fetchWithAuth(`http://localhost:8000/api/v1/transactions/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Transaction deleted."); loadData(); }
    } catch { toast.error("Server error."); }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Delete account group? This might detach it from past transactions.")) return;
    try {
      const res = await fetchWithAuth(`http://localhost:8000/api/v1/account-groups/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Account Group deleted."); loadData(); }
    } catch { toast.error("Server error."); }
  };

  const resetTxForm = () => {
    setTxType("INCOME");
    setTxAmount("");
    setTxDate(new Date().toISOString().split("T")[0]);
    setTxDescription("");
    setTxGroupId("");
    setTxProjectId("none");
  };

  const filteredTransactions = transactions.filter(t => 
    t.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.account_group?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-2 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Accounting</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">Track cash flow, account categories, and project profitability.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="font-medium rounded-xl border-border">
                <FolderOpen className="w-4 h-4 mr-2" />
                New Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] bg-card">
              <DialogHeader>
                <DialogTitle>New Account Group</DialogTitle>
                <DialogDescription>Create a ledger category (e.g. Project Fees, Software Subs).</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Group Name</label>
                  <Input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g. Server Hosting" className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Type</label>
                  <Select value={groupType} onValueChange={setGroupType}>
                    <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Income">Income (Money In)</SelectItem>
                      <SelectItem value="Expense">Expense (Money Out)</SelectItem>
                      <SelectItem value="Asset">Asset</SelectItem>
                      <SelectItem value="Liability">Liability</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Description</label>
                  <Input value={groupDesc} onChange={e => setGroupDesc(e.target.value)} placeholder="Optional" className="bg-muted" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsGroupModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveGroup} className="bg-blue-600 text-white hover:bg-blue-700">Save Group</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isTxModalOpen} onOpenChange={setIsTxModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm gap-2">
                <Plus className="w-4 h-4" />
                Record Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-2xl bg-card border-0 shadow-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-foreground">Record Transaction</DialogTitle>
                <DialogDescription className="sr-only">Record a new income or expense transaction.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                
                <div className="flex bg-muted p-1 rounded-xl">
                  <button
                    className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all", txType === "INCOME" ? "bg-card text-emerald-600 shadow-sm" : "text-muted-foreground hover:text-muted-foreground")}
                    onClick={() => setTxType("INCOME")}
                  >
                    Cash In
                  </button>
                  <button
                    className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all", txType === "EXPENSE" ? "bg-card text-red-600 shadow-sm" : "text-muted-foreground hover:text-muted-foreground")}
                    onClick={() => setTxType("EXPENSE")}
                  >
                    Cash Out
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">{currencySymbol}</span>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        className="pl-7 bg-muted border-border rounded-xl focus-visible:ring-blue-500 font-medium"
                        value={txAmount}
                        onChange={(e) => setTxAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</label>
                    <Input 
                      type="date" 
                      className="bg-muted border-border rounded-xl focus-visible:ring-blue-500 font-medium"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Account Group</label>
                  <Select value={txGroupId} onValueChange={setTxGroupId}>
                    <SelectTrigger className="bg-muted rounded-xl">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {accountGroups.filter(g => txType === "INCOME" ? g.type === "Income" : g.type === "Expense").map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
                  <Input 
                    placeholder="Optional details..." 
                    className="bg-muted border-border rounded-xl focus-visible:ring-blue-500 font-medium"
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Link to Project (Optional)</label>
                  <Select value={txProjectId} onValueChange={setTxProjectId}>
                    <SelectTrigger className="bg-muted border-border rounded-xl focus:ring-blue-500 font-medium">
                      <SelectValue placeholder="Select Project" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-md">
                      <SelectItem value="none" className="font-medium text-muted-foreground">General (No Project)</SelectItem>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id} className="font-medium">{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsTxModalOpen(false)} className="rounded-xl font-medium">Cancel</Button>
                <Button onClick={handleSaveTransaction} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">Save Transaction</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-6 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="dashboard" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-6">Dashboard</TabsTrigger>
          <TabsTrigger value="ledger" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-6">Ledger</TabsTrigger>
          <TabsTrigger value="groups" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-6">Account Groups</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-8 mt-0 focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm rounded-2xl bg-card transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Total Income</CardTitle>
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-500">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-foreground">
                  {currencySymbol}{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-[10px] text-muted-foreground font-medium mt-2 uppercase tracking-wider">All time cash in</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm rounded-2xl bg-card transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Total Expenses</CardTitle>
                <div className="p-2 bg-red-50 rounded-xl text-red-500">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-foreground">
                  {currencySymbol}{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-[10px] text-muted-foreground font-medium mt-2 uppercase tracking-wider">All time cash out</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm rounded-2xl bg-card transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Net Cash Flow</CardTitle>
                <div className={cn("p-2 rounded-xl", netCashFlow >= 0 ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600")}>
                  <Wallet className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className={cn("text-3xl font-semibold", netCashFlow >= 0 ? "text-blue-600" : "text-orange-600")}>
                  {currencySymbol}{netCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-[10px] text-muted-foreground font-medium mt-2 uppercase tracking-wider">Available liquidity</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Ledger Tab */}
        <TabsContent value="ledger" className="mt-0 focus-visible:outline-none">
          <Card className="border-0 shadow-sm rounded-2xl bg-card overflow-hidden">
            <CardHeader className="border-b border-border pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card">
              <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
                Transaction Ledger
              </CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search group or description..." 
                  className="pl-9 bg-muted border-0 rounded-xl h-10 font-medium focus-visible:ring-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-6">Date</TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead className="hidden md:table-cell">Linked Project</TableHead>
                    <TableHead className="text-right pr-6">Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground font-medium">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <TableRow key={tx.id} className="border-slate-50 hover:bg-muted/50 transition-colors">
                        <TableCell className="pl-6 py-4 text-sm font-medium text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", tx.type === "INCOME" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500")}>
                              {tx.type === "INCOME" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground line-clamp-1">{tx.description || (tx.type === "INCOME" ? "Income" : "Expense")}</p>
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{tx.type}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="bg-muted text-muted-foreground text-xs font-medium px-2.5 py-1 rounded-md">
                            {tx.account_group?.name || "Uncategorized"}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 hidden md:table-cell">
                          {tx.project ? (
                            <span className="text-sm font-medium text-indigo-600 hover:underline cursor-pointer line-clamp-1">
                              {tx.project.title}
                            </span>
                          ) : (
                            <span className="text-sm font-medium text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4 text-right pr-6 whitespace-nowrap">
                          <span className={cn("text-base font-semibold", tx.type === "INCOME" ? "text-emerald-600" : "text-foreground")}>
                            {tx.type === "INCOME" ? "+" : "-"}{currencySymbol}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 pr-6">
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500 hover:bg-red-50 h-8 w-8 rounded-lg" onClick={() => handleDeleteTx(tx.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="mt-0 focus-visible:outline-none">
          <Card className="border-0 shadow-sm rounded-2xl bg-card overflow-hidden">
            <CardHeader className="border-b border-border pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card">
              <div>
                <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-blue-500" />
                  Chart of Accounts
                </CardTitle>
                <CardDescription className="text-xs mt-1">Manage categories for logging transactions.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-6">Group Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountGroups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground font-medium">No account groups found.</TableCell>
                    </TableRow>
                  ) : (
                    accountGroups.map(g => (
                      <TableRow key={g.id} className="border-slate-50 hover:bg-muted/50 transition-colors">
                        <TableCell className="pl-6 py-4 font-medium text-foreground">{g.name}</TableCell>
                        <TableCell className="py-4">
                          <span className={cn("text-xs font-medium px-2.5 py-1 rounded-md", g.type === "Income" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700")}>
                            {g.type}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-sm text-muted-foreground">{g.description || "—"}</TableCell>
                        <TableCell className="py-4 pr-6">
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500 hover:bg-red-50 h-8 w-8 rounded-lg" onClick={() => handleDeleteGroup(g.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
