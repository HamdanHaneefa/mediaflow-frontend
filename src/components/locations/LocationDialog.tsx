"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Location } from "@/types";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/apiFetch";
import { MapPin } from "lucide-react";

interface LocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: Location | null;
  onSaveSuccess: () => void;
}

export function LocationDialog({ open, onOpenChange, location, onSaveSuccess }: LocationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "Studio",
    status: "Available",
    address: "",
    capacity: "",
    hourly_rate: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      if (location) {
        setFormData({
          name: location.name || "",
          type: location.type || "Studio",
          status: location.status || "Available",
          address: location.address || "",
          capacity: location.capacity?.toString() || "",
          hourly_rate: location.hourly_rate?.toString() || "",
          notes: location.notes || "",
        });
      } else {
        setFormData({
          name: "",
          type: "Studio",
          status: "Available",
          address: "",
          capacity: "",
          hourly_rate: "",
          notes: "",
        });
      }
    }
  }, [open, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Please provide a name.");
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
      };

      const url = location ? `http://localhost:8000/api/v1/locations/${location.id}` : `http://localhost:8000/api/v1/locations/`;
      const method = location ? "PUT" : "POST";

      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(location ? "Location updated" : "Location created");
        onSaveSuccess();
        onOpenChange(false);
      } else {
        const data = await res.json();
        toast.error(data.detail || "Error saving location");
      }
    } catch (error) {
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            {location ? "Edit Location / Studio" : "New Location / Studio"}
          </DialogTitle>
          <DialogDescription>
            {location ? "Update the details and capacity." : "Add a new studio or shooting location."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Name *</label>
            <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Main Sound Stage" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-border text-sm bg-card"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Available">Available</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-border text-sm bg-card"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Studio">Studio</option>
                <option value="Outdoor">Outdoor Location</option>
                <option value="Remote">Remote</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Hourly Rate ($)</label>
              <Input type="number" step="0.01" value={formData.hourly_rate} onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })} placeholder="e.g. 150" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Max Capacity (People)</label>
              <Input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} placeholder="e.g. 25" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Address</label>
            <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="123 Studio Way..." />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
            <Textarea className="h-20 resize-none text-sm" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Access codes, equipment details..." />
          </div>

          <DialogFooter className="mt-6 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? "Saving..." : "Save Details"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
