"use client";
import { fetchWithAuth } from "@/lib/apiFetch";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Project } from "@/types";
import { cn } from "@/lib/utils";

interface AccountGroup {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  description: string;
}

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess?: () => void;
}

export function TransactionDialog({ open, onOpenChange, onSaveSuccess }: TransactionDialogProps) {
  const [txType, setTxType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [txAmount, setTxAmount] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [txDescription, setTxDescription] = useState("");
  const [txGroupId, setTxGroupId] = useState("");
  const [txProjectId, setTxProjectId] = useState("none");

  const [accountGroups, setAccountGroups] = useState<AccountGroup[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState("$");

  useEffect(() => {
    if (open) {
      Promise.all([
        fetchWithAuth("http://localhost:8000/api/v1/account-groups/"),
        fetchWithAuth("http://localhost:8000/api/v1/projects/"),
        fetchWithAuth("http://localhost:8000/api/v1/settings/")
      ])
        .then(async ([resGroups, resProjects, resSettings]) => {
          if (resGroups.ok) setAccountGroups(await resGroups.json());
          if (resProjects.ok) setProjects(await resProjects.json());
          if (resSettings.ok) {
            const settingsData = await resSettings.json();
            const currencyMap: Record<string, string> = {
              USD: "$", EUR: "€", GBP: "£", INR: "₹", AUD: "A$"
            };
            setCurrencySymbol(currencyMap[settingsData.default_currency] || "$");
          }
        })
        .catch(error => {
          console.error("Error loading data for transaction dialog:", error);
        });
    }
  }, [open]);

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
        onOpenChange(false);
        resetTxForm();
        if (onSaveSuccess) onSaveSuccess();
      } else {
        const errorData = await res.json();
        toast.error(`Error: ${errorData.detail || "Failed to save"}`);
      }
    } catch (error) {
      toast.error("Failed to communicate with server.");
    }
  };

  const resetTxForm = () => {
    setTxType("INCOME");
    setTxAmount("");
    setTxDate(new Date().toISOString().split("T")[0]);
    setTxDescription("");
    setTxGroupId("");
    setTxProjectId("none");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-medium">Cancel</Button>
          <Button onClick={handleSaveTransaction} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">Save Transaction</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
