"use client";
import { fetchWithAuth } from "@/lib/apiFetch";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { CheckCircle2, AlertTriangle, Send, FileText, Image as ImageIcon, Video, ArrowLeft, Download, MessageSquare } from "lucide-react";

export default function ClientReviewPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReview();
  }, [token]);

  const fetchReview = async () => {
    try {
      const res = await fetchWithAuth(`http://localhost:8000/api/v1/asset-reviews/public/${token}`);
      if (!res.ok) throw new Error("Review not found");
      setReview(await res.json());
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (status: "Approved" | "Changes Requested") => {
    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`http://localhost:8000/api/v1/asset-reviews/public/${token}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to submit decision");
      
      const updatedReview = await res.json();
      setReview(updatedReview);
      toast.success(status === "Approved" ? "Asset Approved!" : "Changes requested.");
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`http://localhost:8000/api/v1/asset-reviews/public/${token}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review_id: review.id,
          asset_id: review.asset_id,
          comment_text: newComment
        })
      });
      if (!res.ok) throw new Error("Failed to add comment");
      
      setNewComment("");
      fetchReview(); // Refresh to get the new comments
      toast.success("Comment added.");
    } catch (err) {
      toast.error("Failed to add comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-muted flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground font-medium text-sm">Loading Review Portal...</p>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="fixed inset-0 z-[100] bg-muted flex items-center justify-center p-4">
        <div className="bg-card p-8 rounded-2xl shadow-sm border border-border max-w-md w-full text-center">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Link Invalid or Expired</h1>
          <p className="text-muted-foreground text-sm mb-6">This review link is no longer active or does not exist. Please contact your agency representative for a new link.</p>
        </div>
      </div>
    );
  }

  const asset = review.asset;
  const project = review.project;
  const isClosed = review.status === "Approved" || review.status === "Changes Requested";

  // If closed, we can still render the page but in a completely read-only mode, 
  // or we can show a dedicated "Review Complete" screen. Let's keep the UI but lock it.

  return (
    <div className="fixed inset-0 z-[100] bg-muted flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="MediaFlow Logo" className="h-16 w-auto" />
          <div>
            <h1 className="font-semibold text-foreground text-sm leading-tight">{project?.title || "MediaFlow Agency"}</h1>
            <p className="text-xs text-muted-foreground">Client Review Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${review.status === "Approved" ? "bg-emerald-100 text-emerald-700" : review.status === "Changes Requested" ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"}`}>
            {review.status}
          </span>
        </div>
      </header>

      {isClosed && (
        <div className="bg-primary text-white text-center py-2 text-sm font-medium shadow-sm">
          This review cycle has been closed and submitted to the agency.
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
        
        {/* Left/Center: Media Viewer */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              {asset?.file_type === "Video" ? <Video className="w-6 h-6 text-blue-500" /> : asset?.file_type === "Image" ? <ImageIcon className="w-6 h-6 text-emerald-500" /> : <FileText className="w-6 h-6 text-orange-500" />}
              {asset?.name}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Version {asset?.version} • Uploaded {format(new Date(review.submitted_at || new Date()), "PPP")}</p>
          </div>

          <div className="flex-1 bg-primary rounded-2xl flex items-center justify-center overflow-hidden relative shadow-inner min-h-[300px]">
             {/* Mocking the actual media player for now since file_url is often a placeholder */}
             {asset?.file_type === "Video" || asset?.file_type === "Image" ? (
               <div className="text-center">
                 {asset.thumbnail_url ? (
                   <img src={asset.thumbnail_url} alt={asset.name} className="max-w-full max-h-full object-contain" />
                 ) : (
                   <div className="text-muted-foreground flex flex-col items-center">
                     {asset?.file_type === "Video" ? <Video className="w-16 h-16 mb-4 opacity-50" /> : <ImageIcon className="w-16 h-16 mb-4 opacity-50" />}
                     <p>Media Preview Area</p>
                     <Button variant="outline" className="mt-4 bg-primary text-slate-200 border-slate-700 hover:bg-slate-700" onClick={() => window.open(asset.file_url, '_blank')}>
                       Open External Link <Download className="w-4 h-4 ml-2" />
                     </Button>
                   </div>
                 )}
               </div>
             ) : (
               <div className="text-center text-muted-foreground">
                 <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                 <p className="mb-4">Document Viewer</p>
                 <Button variant="outline" className="bg-primary text-slate-200 border-slate-700 hover:bg-slate-700" onClick={() => window.open(asset.file_url, '_blank')}>
                   Download Document <Download className="w-4 h-4 ml-2" />
                 </Button>
               </div>
             )}
          </div>
        </div>

        {/* Right: Feedback Panel */}
        <div className="w-full md:w-[400px] bg-card border-l border-border flex flex-col shrink-0 h-[50vh] md:h-auto">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Feedback & Comments</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted">
            {review.comments?.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No comments yet.</p>
              </div>
            ) : (
              review.comments?.map((comment: any) => (
                <div key={comment.id} className="bg-card p-3 rounded-xl shadow-sm border border-border">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-foreground">{comment.commenter?.name || "Client"}</span>
                    <span className="text-[10px] font-medium text-muted-foreground">{format(new Date(comment.created_at), "MMM d, h:mm a")}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.comment_text}</p>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-border bg-card">
            <Textarea 
              placeholder={isClosed ? "Review closed. Feedback has been submitted." : "Type your feedback here..."}
              className="resize-none border-border mb-2 focus-visible:ring-blue-500 text-sm"
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={isSubmitting || isClosed}
            />
            <Button 
              className="w-full bg-primary text-white hover:bg-primary gap-2 font-medium"
              onClick={handleAddComment}
              disabled={isSubmitting || !newComment.trim() || isClosed}
            >
              <Send className="w-4 h-4" /> Add Comment
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      {!isClosed && (
        <div className="h-20 bg-card border-t border-border flex items-center justify-between px-4 md:px-8 shrink-0 shadow-lg z-10">
          <div>
            <p className="text-sm font-semibold text-foreground">Finished Reviewing?</p>
            <p className="text-xs text-muted-foreground">Select your decision to notify the agency.</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="border-orange-200 text-orange-700 hover:bg-orange-50 font-medium"
              onClick={() => handleDecision("Changes Requested")}
              disabled={isSubmitting}
            >
              Request Changes
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2"
              onClick={() => handleDecision("Approved")}
              disabled={isSubmitting}
            >
              <CheckCircle2 className="w-4 h-4" /> Approve Asset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
