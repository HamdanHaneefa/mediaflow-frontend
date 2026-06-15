"use client";
import { fetchWithAuth } from "@/lib/apiFetch";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle, FileText, Download, XCircle, Clock, Building2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClientQuotePage() {
  const params = useParams();
  const token = params.token as string;
  
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<"not_found" | "expired" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchQuote();
  }, [token]);

  const fetchQuote = async () => {
    try {
      const res = await fetchWithAuth(`http://localhost:8000/api/v1/leads/public/quote/${token}`);
      
      if (res.status === 410) {
        setErrorType("expired");
        throw new Error("Expired");
      }
      if (!res.ok) {
        setErrorType("not_found");
        throw new Error("Not Found");
      }
      
      setQuote(await res.json());
    } catch (err) {
      // Handled by errorType state
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (status: "Accepted" | "Rejected") => {
    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`http://localhost:8000/api/v1/leads/public/quote/${token}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (res.status === 410) {
        toast.error("This quotation has expired.");
        setErrorType("expired");
        return;
      }
      
      if (!res.ok) throw new Error("Failed to submit decision");
      
      const updatedQuote = await res.json();
      setQuote(updatedQuote);
      toast.success(status === "Accepted" ? "Quotation Accepted!" : "Quotation Declined.");
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-muted flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground font-medium text-sm">Loading Quotation...</p>
        </div>
      </div>
    );
  }

  if (errorType === "expired") {
    return (
      <div className="fixed inset-0 z-[100] bg-muted flex items-center justify-center p-4">
        <div className="bg-card p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-border max-w-md w-full text-center">
          <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3 tracking-tight">Quotation Expired</h1>
          <p className="text-muted-foreground text-base mb-8 leading-relaxed">
            The deadline to accept this quotation has passed. Please contact the agency representative to request an updated quote.
          </p>
        </div>
      </div>
    );
  }

  if (errorType === "not_found" || !quote) {
    return (
      <div className="fixed inset-0 z-[100] bg-muted flex items-center justify-center p-4">
        <div className="bg-card p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-border max-w-md w-full text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3 tracking-tight">Link Invalid</h1>
          <p className="text-muted-foreground text-base mb-8 leading-relaxed">
            This quotation link is invalid or no longer exists.
          </p>
        </div>
      </div>
    );
  }

  const isDecided = quote.status === "Accepted" || quote.status === "Rejected";
  const lead = quote.lead;

  return (
    <div className="min-h-screen bg-muted text-foreground font-sans selection:bg-blue-100 selection:text-blue-900 print:bg-card print:m-0">
      
      {/* Top Banner (Hidden when printing) */}
      <div className="bg-primary text-white px-4 py-3 flex items-center justify-between print:hidden shadow-md">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="MediaFlow Logo" className="h-12 w-auto brightness-0 invert" />
          <span className="text-sm font-medium tracking-wide">MediaFlow Quotation Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground font-medium">Secure Link</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint}
            className="border-slate-700 bg-primary text-white hover:bg-slate-700 hover:text-white text-xs h-8"
          >
            <Download className="w-3.5 h-3.5 mr-2" /> Download PDF
          </Button>
        </div>
      </div>

      {isDecided && (
        <div className={`print:hidden text-center py-3 text-sm font-medium shadow-sm border-b ${quote.status === "Accepted" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}>
          This quotation has been {quote.status.toLowerCase()}.
        </div>
      )}

      {/* Main Quotation Document */}
      <main className="max-w-4xl mx-auto my-8 md:my-16 bg-card p-8 md:p-16 md:rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-border print:shadow-none print:border-0 print:m-0 print:p-0 print:max-w-full">
        
        {/* Document Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter mb-2">QUOTATION</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              Ref: <span className="text-foreground font-mono bg-muted px-2 py-0.5 rounded text-sm">{quote.id.split('-')[0].toUpperCase()}</span>
            </p>
          </div>
          <div className="text-left md:text-right">
            <img src="/logo.svg" alt="MediaFlow Logo" className="h-20 w-auto mb-4 md:ml-auto" />
            <h2 className="text-xl font-bold text-foreground mb-1">MediaFlow Agency</h2>
            <p className="text-sm text-muted-foreground">123 Creative Studio Way</p>
            <p className="text-sm text-muted-foreground">hello@mediaflow.agency</p>
          </div>
        </div>

        {/* Client & Dates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div className="space-y-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Prepared For</p>
            <div>
              <p className="text-xl font-bold text-foreground">{lead?.company_name || lead?.name}</p>
              {lead?.company_name && <p className="text-muted-foreground mt-1">{lead?.name}</p>}
              <p className="text-muted-foreground text-sm mt-1">{lead?.email}</p>
              {lead?.phone && <p className="text-muted-foreground text-sm">{lead?.phone}</p>}
            </div>
          </div>
          
          <div className="space-y-4 md:text-right">
            <div className="grid grid-cols-2 md:grid-cols-1 gap-4 md:gap-2">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Issued Date</p>
                <p className="font-semibold text-foreground">{format(new Date(quote.created_at), "MMMM d, yyyy")}</p>
              </div>
              {quote.due_date && (
                <div>
                  <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1 mt-0 md:mt-4">Valid Until</p>
                  <p className="font-semibold text-orange-600">{format(new Date(quote.due_date), "MMMM d, yyyy")}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Particulars Table */}
        <div className="mb-12">
          <div className="bg-muted border border-border rounded-2xl overflow-hidden print:bg-card print:border-border">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-sm font-semibold text-foreground">
                  <th className="py-4 px-6 w-3/4">Description of Service</th>
                  <th className="py-4 px-6 text-right w-1/4">Amount</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {quote.particulars?.map((item: any, index: number) => (
                  <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors print:hover:bg-transparent">
                    <td className="py-5 px-6 leading-relaxed font-medium text-foreground">{item.description}</td>
                    <td className="py-5 px-6 text-right font-semibold whitespace-nowrap">${parseFloat(item.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-16">
          <div className="w-full md:w-1/2 lg:w-1/3 bg-primary text-white rounded-2xl p-6 shadow-xl print:bg-card print:text-foreground print:shadow-none print:border print:border-border">
            <div className="flex justify-between items-center text-sm font-medium text-slate-300 print:text-muted-foreground mb-2">
              <span>Subtotal</span>
              <span>${quote.total_amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-medium text-slate-300 print:text-muted-foreground mb-6 pb-6 border-b border-slate-700 print:border-border">
              <span>Taxes</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Total Due</span>
              <span className="text-2xl font-black text-blue-400 print:text-foreground">
                ${quote.total_amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </span>
            </div>
          </div>
        </div>

        {/* Footer / Terms */}
        <div className="border-t border-border pt-8">
          <h4 className="text-sm font-bold text-foreground mb-2">Terms & Conditions</h4>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
            This quotation is valid until the stated expiration date. By accepting this quote, you agree to the standard terms of service provided by MediaFlow Agency. A formal contract and invoice will follow acceptance. Project commencement is subject to schedule availability.
          </p>
        </div>

      </main>

      {/* Sticky Action Footer (Hidden when decided or printing) */}
      {!isDecided && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border p-4 md:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] print:hidden z-50">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-base font-bold text-foreground">Ready to move forward?</p>
              <p className="text-sm text-muted-foreground">Accept this quotation to begin the project.</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button 
                variant="outline" 
                className="flex-1 md:flex-none border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 font-semibold h-12 px-6 rounded-xl transition-all"
                onClick={() => handleDecision("Rejected")}
                disabled={isSubmitting}
              >
                <XCircle className="w-5 h-5 mr-2" /> Decline
              </Button>
              <Button 
                className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 px-8 rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5"
                onClick={() => handleDecision("Accepted")}
                disabled={isSubmitting}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" /> Accept Quotation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Padding for sticky footer */}
      {!isDecided && <div className="h-32 print:hidden"></div>}
    </div>
  );
}
