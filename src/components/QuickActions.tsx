"use client";
import { fetchWithAuth } from "@/lib/apiFetch";

import { useState } from "react";
import { Plus, X, Briefcase, Users, Calendar, Upload, ArrowRightLeft, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { ContactDialog } from "@/components/contacts/ContactDialog";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { AssetDialog } from "@/components/assets/AssetDialog";
import { TransactionDialog } from "@/components/accounting/TransactionDialog";

const quickActions = [
  { id: "transaction", icon: ArrowRightLeft, label: "Record Transaction", color: "bg-green-600 hover:bg-green-700" },
  { id: "booking", icon: Calendar, label: "Studio Booking", color: "bg-indigo-600 hover:bg-indigo-700" },
  { id: "project", icon: Briefcase, label: "New Project", color: "bg-blue-600 hover:bg-blue-700" },
  { id: "contact", icon: Users, label: "Add Contact", color: "bg-purple-600 hover:bg-purple-700" },
  { id: "lead", icon: Target, label: "Add New Lead", color: "bg-cyan-600 hover:bg-cyan-700" },
  { id: "task", icon: Calendar, label: "New Task", color: "bg-orange-600 hover:bg-orange-700" },
  { id: "asset", icon: Upload, label: "Upload Asset", color: "bg-pink-600 hover:bg-pink-700" },
];

export function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Dialog states
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);

  // Lead form state
  const [newLead, setNewLead] = useState({ name: "", email: "", phone: "", company_name: "", industry: "", estimated_budget: "" });
  const [leadSaving, setLeadSaving] = useState(false);

  const handleActionClick = (actionId: string) => {
    setIsOpen(false);
    switch (actionId) {
      case "project":
        setProjectDialogOpen(true);
        break;
      case "booking":
        router.push("/calendar?add_booking=true");
        break;
      case "contact":
        setContactDialogOpen(true);
        break;
      case "task":
        setTaskDialogOpen(true);
        break;
      case "transaction":
        setTransactionDialogOpen(true);
        break;
      case "asset":
        setAssetDialogOpen(true);
        break;
      case "lead":
        setLeadDialogOpen(true);
        break;
      default:
        break;
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40">
        <div
          className={cn(
            "flex flex-col-reverse gap-3 mb-3 transition-all duration-200",
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        {quickActions.map((action, index) => (
          <button
            key={action.label}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-full shadow-lg",
              "text-white font-medium text-sm transition-all",
              "touch-manipulation min-h-[48px]",
              action.color,
              "transform hover:scale-105 active:scale-95"
            )}
            style={{
              transitionDelay: isOpen ? `${index * 50}ms` : "0ms",
            }}
            onClick={() => handleActionClick(action.id)}
          >
            <action.icon className="w-5 h-5" />
            <span className="whitespace-nowrap">{action.label}</span>
          </button>
        ))}
      </div>

      <Button
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg text-white",
          "bg-blue-600 hover:bg-blue-700",
          "transition-transform touch-manipulation",
          isOpen && "rotate-45"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </Button>

      {/* Global Modals for Quick Actions */}
      <ProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        onSaveSuccess={() => {
          if (window.location.pathname === "/projects") window.location.reload();
        }}
      />
      
      <ContactDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        onSaveSuccess={() => {
          if (window.location.pathname === "/contacts") window.location.reload();
        }}
      />

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        onSaveSuccess={() => {
          if (window.location.pathname === "/projects" || window.location.pathname === "/calendar") window.location.reload();
        }}
      />
      
      <AssetDialog
        open={assetDialogOpen}
        onOpenChange={setAssetDialogOpen}
        onSaveSuccess={() => {
          if (window.location.pathname === "/assets") window.location.reload();
        }}
      />

      <TransactionDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        onSaveSuccess={() => {
          if (window.location.pathname === "/accounting") window.location.reload();
        }}
      />

      {/* Quick Add Lead Dialog */}
      <Dialog open={leadDialogOpen} onOpenChange={(open) => { setLeadDialogOpen(open); if (!open) setNewLead({ name: "", email: "", phone: "", company_name: "", industry: "", estimated_budget: "" }); }}>
        <DialogContent className="bg-card max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Target className="w-5 h-5 text-cyan-600" /> Add New Lead
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">Quickly add a new lead to the pipeline.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name *</label>
              <Input placeholder="Jane Doe" value={newLead.name} onChange={e => setNewLead({ ...newLead, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
              <Input type="email" placeholder="jane@company.com" value={newLead.email} onChange={e => setNewLead({ ...newLead, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</label>
              <Input placeholder="+1 555 000 0000" value={newLead.phone} onChange={e => setNewLead({ ...newLead, phone: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company</label>
              <Input placeholder="Acme Corp" value={newLead.company_name} onChange={e => setNewLead({ ...newLead, company_name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Industry</label>
              <Input placeholder="e.g. Real Estate" value={newLead.industry} onChange={e => setNewLead({ ...newLead, industry: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLeadDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={leadSaving || !newLead.name.trim()}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              onClick={async () => {
                setLeadSaving(true);
                try {
                  const res = await fetchWithAuth("http://localhost:8000/api/v1/leads/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...newLead, estimated_budget: newLead.estimated_budget ? parseFloat(newLead.estimated_budget) : null })
                  });
                  if (!res.ok) throw new Error();
                  toast.success("Lead added to pipeline!");
                  setLeadDialogOpen(false);
                  setNewLead({ name: "", email: "", phone: "", company_name: "", industry: "", estimated_budget: "" });
                  if (window.location.pathname === "/leads") window.location.reload();
                } catch {
                  toast.error("Failed to create lead.");
                } finally {
                  setLeadSaving(false);
                }
              }}
            >
              {leadSaving ? "Saving..." : "Save Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
