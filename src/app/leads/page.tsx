"use client";
import { fetchWithAuth } from "@/lib/apiFetch";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, Target, Building2, Globe, FileText, Banknote, Calendar as CalendarIcon, Trash2, Send, CheckCircle2, ArrowRight, Eye, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function LeadsPage() {
  const { token } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [selectedLeadForQuote, setSelectedLeadForQuote] = useState<any>(null);

  // New Lead Form State
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    company_name: "",
    company_website: "",
    industry: "",
    estimated_budget: "",
    notes: ""
  });

  // Quotation Builder State
  const [quoteDueDate, setQuoteDueDate] = useState<string>("");
  const [particulars, setParticulars] = useState([{ description: "", amount: "" }]);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const res = await fetchWithAuth("http://localhost:8000/api/v1/leads/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setLeads(await res.json());
      }
    } catch (err) {
      toast.error("Failed to load leads.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async () => {
    if (!newLead.name) return toast.error("Name is required");

    try {
      const payload = {
        ...newLead,
        estimated_budget: newLead.estimated_budget ? parseFloat(newLead.estimated_budget) : null
      };

      const res = await fetchWithAuth("http://localhost:8000/api/v1/leads/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to create lead");

      toast.success("Lead created successfully!");
      setShowNewLeadModal(false);
      setNewLead({ name: "", email: "", phone: "", company_name: "", company_website: "", industry: "", estimated_budget: "", notes: "" });
      loadLeads();
    } catch (err) {
      toast.error("Error creating lead");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "New Lead":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none font-semibold">New Lead</Badge>;
      case "Meeting Booked":
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none font-semibold">Meeting Booked</Badge>;
      case "Quotation Sent":
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-none font-semibold">Quotation Sent</Badge>;
      case "Closed Won":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none font-semibold">Closed Won</Badge>;
      case "Closed Lost":
        return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-none font-semibold">Closed Lost</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground hover:bg-slate-200 border-none font-semibold">{status}</Badge>;
    }
  };

  const addParticular = () => setParticulars([...particulars, { description: "", amount: "" }]);
  const removeParticular = (idx: number) => setParticulars(particulars.filter((_, i) => i !== idx));
  const updateParticular = (idx: number, field: string, value: string) => {
    const updated = [...particulars];
    updated[idx] = { ...updated[idx], [field]: value };
    setParticulars(updated);
  };

  const totalAmount = particulars.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  const handleGenerateQuote = async () => {
    if (!quoteDueDate) return toast.error("Due Date is required for the magic link expiration.");
    if (particulars.some(p => !p.description || !p.amount)) return toast.error("All line items must have a description and amount.");

    try {
      const payload = {
        lead_id: selectedLeadForQuote.id,
        due_date: quoteDueDate,
        total_amount: totalAmount,
        particulars: particulars.map(p => ({
          description: p.description,
          amount: parseFloat(p.amount)
        }))
      };

      const res = await fetchWithAuth(`http://localhost:8000/api/v1/leads/${selectedLeadForQuote.id}/quotations`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to generate quote");
      
      const quote = await res.json();
      const link = `${window.location.origin}/client/quote/${quote.token}`;
      
      // Show link inside the modal instead of alert
      setGeneratedLink(link);
      toast.success("Quotation generated! Copy your magic link below.");
      loadLeads();
    } catch (err) {
      toast.error("Error generating quotation.");
    }
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }).catch(() => {
      toast.error("Could not copy automatically. Please copy the link manually.");
    });
  };

  const handleCloseQuoteModal = () => {
    setSelectedLeadForQuote(null);
    setGeneratedLink(null);
    setLinkCopied(false);
    setQuoteDueDate("");
    setParticulars([{ description: "", amount: "" }]);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-muted p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-xl">
                <Target className="w-6 h-6 text-white" />
              </div>
              Leads Pipeline
            </h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base max-w-2xl">
              Track prospective clients, advance them through the funnel, and generate magical quotation links in seconds.
            </p>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
            onClick={() => setShowNewLeadModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Add New Lead
          </Button>
        </div>

        {/* Leads Table */}
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-border rounded-xl m-6">
              <Target className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No Leads Yet</h3>
              <p className="text-muted-foreground max-w-sm mt-2 mb-6">You haven't added any prospective clients yet. Add your first lead to start filling your pipeline.</p>
              <Button onClick={() => setShowNewLeadModal(true)} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                <Plus className="w-4 h-4 mr-2" /> Add Lead
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Lead Info</TableHead>
                  <TableHead>Business Details</TableHead>
                  <TableHead>Pipeline Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id} className="group">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{lead.name}</span>
                        <span className="text-xs text-muted-foreground">{lead.email || "No email"} • {lead.phone || "No phone"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-muted-foreground flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          {lead.company_name || "—"}
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5">{lead.industry || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(lead.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(lead.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      {lead.quotations && lead.quotations.length > 0 ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                            title="View Quote"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const token = lead.quotations[lead.quotations.length - 1].token;
                              window.open(`/client/quote/${token}`, '_blank');
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-orange-600 hover:bg-orange-50"
                            title="Regenerate Quote"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedLeadForQuote(lead);
                            }}
                          >
                            <RefreshCcw className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 relative z-50 cursor-pointer"
                          title="Generate Quote"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedLeadForQuote(lead);
                          }}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* New Lead Modal */}
      <Dialog open={showNewLeadModal} onOpenChange={setShowNewLeadModal}>
        <DialogContent className="max-w-2xl bg-card p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
          <div className="bg-muted border-b border-border p-6">
            <DialogTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Add New Lead
            </DialogTitle>
            <DialogDescription className="mt-1 text-muted-foreground">
              Enter the prospect's details and business intelligence.
            </DialogDescription>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Name *</label>
                <Input placeholder="Jane Doe" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} className="bg-card" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
                <Input type="email" placeholder="jane@company.com" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} className="bg-card" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                <Input placeholder="+1 (555) 000-0000" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} className="bg-card" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Acme Corp" value={newLead.company_name} onChange={e => setNewLead({...newLead, company_name: e.target.value})} className="pl-9 bg-card" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Industry</label>
                <Input placeholder="e.g. Real Estate, Tech" value={newLead.industry} onChange={e => setNewLead({...newLead, industry: e.target.value})} className="bg-card" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Est. Budget ($)</label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="number" placeholder="5000" value={newLead.estimated_budget} onChange={e => setNewLead({...newLead, estimated_budget: e.target.value})} className="pl-9 bg-card" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Internal Notes</label>
              <Textarea 
                placeholder="What is the client looking for?" 
                value={newLead.notes} 
                onChange={e => setNewLead({...newLead, notes: e.target.value})}
                className="bg-card resize-none"
                rows={3}
              />
            </div>
          </div>
          
          <div className="p-6 bg-muted border-t border-border flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowNewLeadModal(false)} className="text-muted-foreground font-medium">Cancel</Button>
            <Button onClick={handleCreateLead} className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm">
              Save Lead
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quotation Builder Modal */}
      <Dialog open={!!selectedLeadForQuote} onOpenChange={(open) => !open && handleCloseQuoteModal()}>
        <DialogContent className="max-w-4xl bg-muted p-0 overflow-hidden border-0 shadow-2xl rounded-2xl w-[90vw] sm:w-[80vw] sm:max-w-[1000px] !max-w-[1000px]">
          
          {/* SUCCESS STATE: Show generated link */}
          {generatedLink ? (
            <div className="flex flex-col items-center justify-center p-12 text-center gap-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Quotation Created!</h2>
                <p className="text-muted-foreground text-sm">Share this magic link with your client via WhatsApp or Email.</p>
              </div>
              <div className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <p className="flex-1 text-sm text-muted-foreground font-mono break-all text-left">{generatedLink}</p>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                    linkCopied 
                      ? "bg-emerald-100 text-emerald-700" 
                      : "bg-primary text-white hover:bg-slate-700"
                  }`}
                >
                  {linkCopied ? "Copied!" : "Copy"}
                </button>
              </div>
              <button
                type="button"
                onClick={handleCloseQuoteModal}
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
          <div className="flex flex-col md:flex-row h-[85vh] md:h-auto md:max-h-[85vh]">
            
            {/* Left: Configuration */}
            <div className="flex-1 bg-card flex flex-col border-r border-border overflow-y-auto">
              <div className="p-6 border-b border-border sticky top-0 bg-card/95 backdrop-blur z-10">
                <DialogTitle className="text-2xl font-bold text-foreground tracking-tight">Quotation Builder</DialogTitle>
                <DialogDescription className="mt-1 text-muted-foreground">
                  Build line items. A beautiful Magic Link will be generated.
                </DialogDescription>
              </div>

              <div className="p-6 space-y-8 flex-1">
                {/* Client Recap */}
                <div className="bg-muted rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                      {selectedLeadForQuote?.name?.substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm leading-tight">{selectedLeadForQuote?.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedLeadForQuote?.company_name || "Independent"} • {selectedLeadForQuote?.email || "No Email"}</p>
                    </div>
                  </div>
                </div>

                {/* Expiration Date */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-orange-500" />
                    Quote Expiration Date (Hard Deadline)
                  </label>
                  <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                    Once this date passes, the magic link will permanently lock itself, preventing the client from accepting outdated pricing.
                  </p>
                  <Input 
                    type="date" 
                    value={quoteDueDate} 
                    onChange={e => setQuoteDueDate(e.target.value)} 
                    className="max-w-[200px] border-border" 
                  />
                </div>

                {/* Line Items */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      Line Items (Particulars)
                    </label>
                    <Button variant="outline" size="sm" onClick={addParticular} className="h-8 text-xs font-medium text-blue-600 border-blue-200 hover:bg-blue-50">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {particulars.map((p, idx) => (
                      <div key={idx} className="flex items-start gap-3 bg-card p-3 rounded-xl border border-border shadow-sm transition-all hover:border-blue-300">
                        <div className="flex-1 space-y-1">
                          <Input 
                            placeholder="e.g. Hero Video Production (2 Days)" 
                            value={p.description} 
                            onChange={e => updateParticular(idx, "description", e.target.value)}
                            className="bg-transparent border-none shadow-none px-1 font-medium focus-visible:ring-0 placeholder:font-normal placeholder:text-muted-foreground"
                          />
                        </div>
                        <div className="w-32 relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground font-medium">$</span>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            value={p.amount} 
                            onChange={e => updateParticular(idx, "amount", e.target.value)}
                            className="pl-7 bg-transparent border-border text-right focus-visible:ring-blue-500 font-medium"
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeParticular(idx)}
                          className="mt-2 text-muted-foreground hover:text-rose-500 transition-colors p-1"
                          disabled={particulars.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Live Preview Panel */}
            <div className="w-full md:w-[350px] bg-muted flex flex-col shrink-0">
              <div className="p-6 flex-1 overflow-y-auto">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">Live Link Preview</p>
                
                <div className="bg-card rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border">
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-sm tracking-wider">MF</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Quotation To</p>
                      <p className="text-sm font-semibold text-foreground leading-tight">{selectedLeadForQuote?.company_name || selectedLeadForQuote?.name}</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    {particulars.map((p, i) => (
                      <div key={i} className="flex justify-between items-start text-sm border-b border-slate-50 pb-3">
                        <span className="text-muted-foreground pr-4">{p.description || "—"}</span>
                        <span className="font-medium text-foreground shrink-0">${parseFloat(p.amount || "0").toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-border flex justify-between items-center">
                    <span className="font-bold text-foreground">Total</span>
                    <span className="text-xl font-bold text-blue-600">${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-card border-t border-border">
                <Button 
                  onClick={handleGenerateQuote} 
                  className="w-full bg-primary hover:bg-primary text-white shadow-xl shadow-slate-900/20 py-6 text-base font-semibold transition-all hover:-translate-y-0.5"
                >
                  Generate Magic Link <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-4">
                  The magic link will be automatically copied to your clipboard.
                </p>
              </div>
            </div>
          </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
