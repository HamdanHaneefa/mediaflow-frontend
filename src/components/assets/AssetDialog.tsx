"use client";
import { fetchWithAuth } from "@/lib/apiFetch";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Project } from "@/types";

interface AssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess?: () => void;
}

export function AssetDialog({ open, onOpenChange, onSaveSuccess }: AssetDialogProps) {
  const [assetName, setAssetName] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [description, setDescription] = useState("");
  const [fileType, setFileType] = useState("Video");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("none");
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (open) {
      fetchWithAuth("http://localhost:8000/api/v1/projects/")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setProjects(data))
        .catch((err) => console.error("Error loading projects", err));
    }
  }, [open]);

  const handleSaveAsset = async () => {
    if (!assetName.trim()) {
      toast.error("Please provide an asset name.");
      return;
    }
    if (!externalUrl.trim()) {
      toast.error("Please provide the external link.");
      return;
    }

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
      setAssetName("");
      setExternalUrl("");
      setDescription("");
      setFileType("Video");
      setSelectedProjectId("none");
      onOpenChange(false);
      if (onSaveSuccess) onSaveSuccess();
    } catch (error) {
      toast.error("Error recording asset.");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
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
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsset} className="bg-blue-600 text-white hover:bg-blue-700">
              Save Asset
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
