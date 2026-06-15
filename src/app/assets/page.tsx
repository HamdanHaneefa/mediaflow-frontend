"use client";
import { fetchWithAuth } from "@/lib/apiFetch";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Search,
  Download,
  MoreVertical,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  FolderOpen,
  Eye,
  Clock,
  Filter,
  Link as LinkIcon,
  HardDrive
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Project } from "@/types";

// MOCK_ASSETS removed, fetching from DB

export default function AssetsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  
  // New State for Upload Modal
  const [assetName, setAssetName] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [description, setDescription] = useState("");
  const [fileType, setFileType] = useState("Video");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("none");
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssets = async () => {
    try {
      const res = await fetchWithAuth("http://localhost:8000/api/v1/assets/");
      if (res.ok) {
        setAssets(await res.json());
      }
    } catch (err) {
      console.error("Error fetching assets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchWithAuth("http://localhost:8000/api/v1/projects/")
      .then(res => res.ok ? res.json() : [])
      .then(data => setProjects(data))
      .catch(err => console.error("Error loading projects", err));
  }, []);

  const handleSaveAsset = async () => {
    if (!assetName.trim()) {
      toast.error("Please provide an asset name.");
      return;
    }
    if (!externalUrl.trim()) {
      toast.error("Please provide the external link.");
      return;
    }
    
    // Convert states to payload
    const assetPayload = {
      name: assetName,
      description: description || null,
      file_url: externalUrl,
      file_type: fileType,
      file_size: null,
      project_id: selectedProjectId !== "none" ? selectedProjectId : null,
    };

    try {
      const res = await fetchWithAuth("http://localhost:8000/api/v1/assets/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assetPayload),
      });

      if (!res.ok) throw new Error("Failed to save asset");
      
      toast.success("Asset recorded successfully!");
      setShowUploadDialog(false);
      setAssetName("");
      setExternalUrl("");
      setDescription("");
      setFileType("Video");
      setSelectedProjectId("none");
      fetchAssets(); // Refresh list
    } catch (error) {
      toast.error("Error recording asset.");
      console.error(error);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (asset.description && asset.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || asset.file_type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case "Video": return <Video className="h-8 w-8 text-blue-500" />;
      case "Image": return <ImageIcon className="h-8 w-8 text-emerald-500" />;
      case "Audio": return <Music className="h-8 w-8 text-violet-500" />;
      case "Document": return <FileText className="h-8 w-8 text-orange-500" />;
      default: return <FileText className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) return (mb / 1024).toFixed(2) + " GB";
    return mb.toFixed(1) + " MB";
  };

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <FolderOpen className="w-8 h-8 text-blue-600" />
            Asset Library
          </h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">
            Manage, filter, and share your creative production files.
          </p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)} className="bg-blue-600 hover:bg-blue-700 font-medium gap-2">
          <Upload className="w-4 h-4" />
          Upload Asset
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap bg-card p-4 rounded-xl border border-border shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets by name or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 border-border"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px] h-10 bg-muted border-border">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Raw Footage">Raw Footage</SelectItem>
            <SelectItem value="Graphics">Graphics</SelectItem>
            <SelectItem value="Audio">Audio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Asset Grid */}
      {filteredAssets.length === 0 ? (
        <Card className="border-dashed border-2 border-border bg-muted/50">
          <CardContent className="py-16 text-center">
            <Filter className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No assets found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or upload a new file.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAssets.map((asset) => (
            <Card key={asset.id} className="group hover:shadow-md transition-all border-border bg-card overflow-hidden flex flex-col cursor-pointer" onClick={() => setSelectedAsset(asset)}>
              <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
                {asset.thumbnail_url ? (
                  <img
                    src={asset.thumbnail_url}
                    alt={asset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  getFileIcon(asset.file_type)
                )}
                <div className="absolute top-2 right-2">
                  <Badge className="bg-primary/70 text-white backdrop-blur-sm border-0 font-medium hover:bg-primary/90">
                    {asset.file_type}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4 flex flex-col flex-1">
                <h3 className="font-medium text-foreground truncate mb-1" title={asset.name}>{asset.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1 mb-3">{asset.description || "No description"}</p>
                <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground font-medium border-t border-border pt-3">
                  <span>{asset.file_size ? formatFileSize(asset.file_size) : "Link"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedAsset} onOpenChange={(open) => !open && setSelectedAsset(null)}>
        <DialogContent className="max-w-2xl bg-card">
          <DialogHeader>
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Eye className="w-5 h-5" />
              <span className="text-xs font-medium uppercase tracking-wider">Asset Inspector</span>
            </div>
            <DialogTitle className="text-xl font-medium text-foreground">{selectedAsset?.name}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Uploaded on {selectedAsset?.created_at ? format(new Date(selectedAsset.created_at), "PPP") : ""}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAsset && (
            <div className="space-y-4 pt-2">
              {selectedAsset.thumbnail_url && (
                <div className="aspect-video bg-muted rounded-xl overflow-hidden border border-border">
                  <img src={selectedAsset.thumbnail_url} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-muted p-3 rounded-xl border border-border">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">Format</span>
                  <p className="font-medium text-foreground text-sm mt-0.5">{selectedAsset.file_type}</p>
                </div>
                <div className="bg-muted p-3 rounded-xl border border-border">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">Size</span>
                  <p className="font-medium text-foreground text-sm mt-0.5">{selectedAsset.file_size ? formatFileSize(selectedAsset.file_size) : "External Link"}</p>
                </div>
                <div className="bg-muted p-3 rounded-xl border border-border">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">Status</span>
                  <p className="font-medium text-emerald-600 text-sm mt-0.5">{selectedAsset.status}</p>
                </div>
                <div className="bg-muted p-3 rounded-xl border border-border">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">Version</span>
                  <p className="font-medium text-foreground text-sm mt-0.5">v{selectedAsset.version}</p>
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                {selectedAsset.file_size ? (
                  <Button onClick={() => {
                    toast.success("Download started!");
                    setSelectedAsset(null);
                  }} className="bg-blue-600 hover:bg-blue-700 font-medium gap-2">
                    <Download className="w-4 h-4" />
                    Download File
                  </Button>
                ) : (
                  <Button onClick={() => {
                    window.open(selectedAsset.file_url || "#", "_blank");
                    setSelectedAsset(null);
                  }} className="bg-blue-600 hover:bg-blue-700 font-medium gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Open External Link
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium">Record New Asset</DialogTitle>
            <DialogDescription>
              Link to an external storage provider (Drive, Dropbox, etc.).
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Asset Name *</Label>
              <Input
                placeholder="e.g. Final B-Roll Cut"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                className="bg-muted border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Link to Project (Optional)</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">None (General Asset)</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">File Type *</Label>
                <Select value={fileType} onValueChange={setFileType}>
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="Video">Video</SelectItem>
                    <SelectItem value="Image">Image</SelectItem>
                    <SelectItem value="Audio">Audio</SelectItem>
                    <SelectItem value="Document">Document</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Storage Link URL *</Label>
              <Input
                placeholder="https://drive.google.com/..."
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                className="bg-muted border-border"
              />
              <p className="text-[10px] text-muted-foreground font-medium">Link to Google Drive, Dropbox, Frame.io, etc.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Description</Label>
              <Input
                placeholder="Brief description of the asset..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-muted border-border"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveAsset} className="bg-blue-600 text-white hover:bg-blue-700">
                Save Asset
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
