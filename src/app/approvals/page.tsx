"use client";
import { fetchWithAuth } from "@/lib/apiFetch";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Eye,
  FileText,
  TrendingUp,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { toast } from "sonner";
import { Project, Contact } from "@/types";

export default function ApprovalsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showNewReviewDialog, setShowNewReviewDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New Review Form State
  const [newReviewProjectId, setNewReviewProjectId] = useState<string>("");
  const [newReviewAssetId, setNewReviewAssetId] = useState<string>("");
  const [newReviewClientId, setNewReviewClientId] = useState<string>("");
  const [newReviewDeadline, setNewReviewDeadline] = useState<string>("");
  const [newReviewNotes, setNewReviewNotes] = useState<string>("");

  const loadData = async () => {
    try {
      const [resReviews, resProjects, resAssets, resContacts] = await Promise.all([
        fetchWithAuth("http://localhost:8000/api/v1/asset-reviews/"),
        fetchWithAuth("http://localhost:8000/api/v1/projects/"),
        fetchWithAuth("http://localhost:8000/api/v1/assets/"),
        fetchWithAuth("http://localhost:8000/api/v1/contacts/")
      ]);

      if (resReviews.ok) setReviews(await resReviews.json());
      if (resProjects.ok) setProjects(await resProjects.json());
      if (resAssets.ok) setAssets(await resAssets.json());
      if (resContacts.ok) setContacts(await resContacts.json());
    } catch (error) {
      console.error("Error loading approvals data:", error);
      toast.error("Failed to fetch approvals data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestReview = async () => {
    if (!newReviewProjectId || !newReviewAssetId || !newReviewClientId) {
      toast.error("Project, Asset, and Client are required.");
      return;
    }

    const payload = {
      project_id: newReviewProjectId,
      asset_id: newReviewAssetId,
      reviewer_id: newReviewClientId,
      deadline: newReviewDeadline ? new Date(newReviewDeadline).toISOString() : null,
      notes: newReviewNotes,
      status: "Pending",
      submitted_at: new Date().toISOString(),
    };

    try {
      const res = await fetchWithAuth("http://localhost:8000/api/v1/asset-reviews/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create review request");

      toast.success("Review link generated and sent successfully!");
      setShowNewReviewDialog(false);
      setNewReviewProjectId("");
      setNewReviewAssetId("");
      setNewReviewClientId("");
      setNewReviewDeadline("");
      setNewReviewNotes("");
      loadData();
    } catch (error) {
      toast.error("Error sending request.");
      console.error(error);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "overdue") {
      if (!r.deadline) return false;
      const days = differenceInDays(new Date(r.deadline), new Date());
      return days < 0 && r.status !== "Approved";
    }
    return r.status === filterStatus;
  });

  const pendingCount = reviews.filter((r) => r.status === "Pending" || r.status === "In Review").length;
  
  const overdueCount = reviews.filter((r) => {
    if (!r.deadline) return false;
    const days = differenceInDays(new Date(r.deadline), new Date());
    return days < 0 && r.status !== "Approved";
  }).length;

  const approvedTodayCount = reviews.filter((r) => {
    if (!r.submitted_at) return false;
    const submitted = new Date(r.submitted_at);
    const today = new Date();
    return submitted.toDateString() === today.toDateString() && r.status === "Approved";
  }).length;

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      "Pending": "bg-yellow-50 text-yellow-700 border-yellow-200",
      "In Review": "bg-blue-50 text-blue-700 border-blue-200",
      "Approved": "bg-emerald-50 text-emerald-700 border-emerald-200",
      "Rejected": "bg-rose-50 text-rose-700 border-rose-200",
      "Changes Requested": "bg-orange-50 text-orange-700 border-orange-200",
    };
    return <Badge className={`font-medium ${colors[status] || "bg-muted text-muted-foreground"}`}>{status}</Badge>;
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "Video": return <Video className="h-4 w-4 text-muted-foreground" />;
      case "Image": return <ImageIcon className="h-4 w-4 text-muted-foreground" />;
      default: return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const clientOptions = contacts.filter((c) => c.role === "Client");
  // Only show assets belonging to the selected project if a project is selected
  const availableAssets = newReviewProjectId 
    ? assets.filter(a => a.project_id === newReviewProjectId)
    : assets;

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            Approvals Dashboard
          </h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">
            Manage client review links, feedback loops, and asset approvals.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowNewReviewDialog(true)} className="bg-blue-600 hover:bg-blue-700 font-medium gap-2">
            <Send className="h-4 w-4" />
            Request Review
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{pendingCount}</div>
            <p className="text-xs font-medium text-muted-foreground mt-1">Awaiting client feedback</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Feedback</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-rose-600">{overdueCount}</div>
            <p className="text-xs font-medium text-muted-foreground mt-1">Past targeted deadline</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-emerald-600">{approvedTodayCount}</div>
            <p className="text-xs font-medium text-muted-foreground mt-1 flex items-center gap-1">
              {approvedTodayCount > 0 && <TrendingUp className="h-3 w-3 text-emerald-500" />} In last 24h
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">—</div>
            <p className="text-xs font-medium text-muted-foreground mt-1">Days to approve</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/50 border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-foreground">Active Review Links</CardTitle>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48 bg-card border-border font-medium">
                <SelectValue placeholder="Filter..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Review">In Review</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Changes Requested">Changes Requested</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Asset File</TableHead>
                <TableHead>Campaign Project</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Pipeline Status</TableHead>
                <TableHead>Feedback Deadline</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground font-medium">
                    No active reviews match your filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReviews.map((review) => {
                  const daysUntil = review.deadline ? differenceInDays(new Date(review.deadline), new Date()) : null;
                  return (
                    <TableRow key={review.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-md">
                            {getFileIcon(review.asset?.file_type || "Unknown")}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{review.asset?.name || "Unknown Asset"}</p>
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{review.asset?.file_type || "File"} • v{review.asset?.version || 1}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-foreground">{review.project?.title || "Unknown Project"}</p>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{review.project?.type || "Project"}</p>
                      </TableCell>
                      <TableCell className="font-medium text-muted-foreground">{review.reviewer?.name || "Unknown"}</TableCell>
                      <TableCell>{getStatusBadge(review.status)}</TableCell>
                      <TableCell>
                        {review.deadline ? (
                          <>
                            <p className="text-sm font-medium text-muted-foreground">{format(new Date(review.deadline), "MMM d, yyyy")}</p>
                            {review.status !== "Approved" && daysUntil !== null && (
                              <p className={`text-[10px] font-medium uppercase tracking-wider mt-0.5 ${daysUntil < 0 ? "text-rose-600" : daysUntil < 3 ? "text-orange-600" : "text-muted-foreground"}`}>
                                {daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue` : `${daysUntil}d left`}
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-muted-foreground text-sm">
                        {review.submitted_at ? format(new Date(review.submitted_at), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 relative z-50">
                          <button 
                            type="button"
                            className="inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const url = `${window.location.origin}/client/review/${review.review_link}`;
                              navigator.clipboard.writeText(url).then(() => {
                                toast.success("Magic Link copied to clipboard!");
                              }).catch(() => {
                                alert(`Please copy this link manually: ${url}`);
                              });
                            }}
                            title="Copy Client Link"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          <button 
                            type="button"
                            className="inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="View Internal Details & Feedback"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedReview(review);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            type="button"
                            className="inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Deactivate & Delete Link"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!confirm("Are you sure you want to deactivate and delete this review link? The client will lose access instantly.")) return;
                              
                              try {
                                const res = await fetchWithAuth(`http://localhost:8000/api/v1/asset-reviews/${review.id}`, {
                                  method: "DELETE"
                                });
                                if (!res.ok) throw new Error("Failed to delete review");
                                toast.success("Review link successfully deactivated and deleted.");
                                loadData();
                              } catch (err) {
                                toast.error("Error deleting review link.");
                              }
                            }}
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showNewReviewDialog} onOpenChange={setShowNewReviewDialog}>
        <DialogContent className="bg-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium">Request Final Review</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Send an asset to a client contact for their direct approval.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-medium text-foreground">Project *</Label>
              <Select value={newReviewProjectId} onValueChange={setNewReviewProjectId}>
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Select campaign..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-foreground">Asset File *</Label>
              <Select value={newReviewAssetId} onValueChange={setNewReviewAssetId} disabled={!newReviewProjectId && assets.length === 0}>
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Select deliverable..." />
                </SelectTrigger>
                <SelectContent>
                  {availableAssets.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name} (v{a.version})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-foreground">Client Contact *</Label>
              <Select value={newReviewClientId} onValueChange={setNewReviewClientId}>
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Select reviewer..." />
                </SelectTrigger>
                <SelectContent>
                  {clientOptions.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-foreground">Target Deadline</Label>
              <Input 
                type="date" 
                className="border-border"
                value={newReviewDeadline}
                onChange={e => setNewReviewDeadline(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-foreground">Internal Team Notes</Label>
              <Textarea 
                placeholder="Add notes for your internal tracking..." 
                className="border-border" 
                rows={3}
                value={newReviewNotes}
                onChange={e => setNewReviewNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewReviewDialog(false)} className="font-medium">
              Cancel
            </Button>
            <Button onClick={handleRequestReview} className="bg-blue-600 hover:bg-blue-700 font-medium gap-2">
              <Send className="h-4 w-4" /> Dispatch Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
        <DialogContent className="bg-card w-[90vw] max-w-[90vw] sm:w-[50vw] sm:max-w-[50vw] !max-w-[50vw]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Review Details & Feedback</DialogTitle>
            <DialogDescription className="text-muted-foreground text-base">
              Internal view of the client's progress and notes on this asset.
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-muted p-6 rounded-xl border border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Asset Status</p>
                  <div className="mb-4">{getStatusBadge(selectedReview.status)}</div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-2">Magic Link</p>
                  <div className="flex items-center gap-2">
                    <Input 
                      readOnly 
                      value={`${window.location.origin}/client/review/${selectedReview.review_link}`} 
                      className="h-10 text-sm bg-card"
                    />
                    <Button 
                      size="default" 
                      variant="outline" 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/client/review/${selectedReview.review_link}`);
                        toast.success("Copied to clipboard!");
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                
                <div className="bg-muted p-6 rounded-xl border border-border flex flex-col justify-center">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Asset Info</p>
                  <p className="text-lg font-medium text-foreground">{selectedReview.asset?.name || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground mb-6">Project: {selectedReview.project?.title || "Unknown"}</p>
                  
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Reviewer</p>
                  <p className="text-lg font-medium text-foreground">{selectedReview.reviewer?.name || "Unknown"}</p>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-muted-foreground" /> Client Feedback
                </h3>
                <div className="bg-muted rounded-2xl p-6 border border-border min-h-[250px] max-h-[500px] overflow-y-auto space-y-4 shadow-inner">
                  {!selectedReview.comments || selectedReview.comments.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground py-12">
                      <p className="text-base">No comments submitted by the client yet.</p>
                    </div>
                  ) : (
                    selectedReview.comments.map((comment: any) => (
                      <div key={comment.id} className="bg-card p-4 rounded-xl shadow-sm border border-border">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-bold text-foreground">{comment.commenter?.name || "Client"}</span>
                          <span className="text-xs font-medium text-muted-foreground">{format(new Date(comment.created_at), "MMM d, h:mm a")}</span>
                        </div>
                        <p className="text-base text-muted-foreground leading-relaxed">{comment.comment_text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSelectedReview(null)} className="font-medium bg-primary hover:bg-primary text-white px-6">
              Close Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
