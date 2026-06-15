"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Booking, Location, Contact, Project } from "@/types";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/apiFetch";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  locations: Location[];
  clients: Contact[];
  projects: Project[];
  onSave: () => void;
  onDelete?: (id: string) => void;
  initialStartTime?: Date;
  initialEndTime?: Date;
  initialLocationId?: string;
}

export function BookingDialog({
  open,
  onOpenChange,
  booking,
  locations: initialLocations,
  clients: initialClients,
  projects,
  onSave,
  onDelete,
  initialStartTime,
  initialEndTime,
  initialLocationId,
}: BookingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [clients, setClients] = useState<Contact[]>(initialClients);

  const [formData, setFormData] = useState({
    title: "",
    location_id: "",
    client_id: "",
    project_id: "",
    start_time: "",
    end_time: "",
    status: "Confirmed",
    notes: "",
  });

  const [showNewLocation, setShowNewLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");

  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");

  useEffect(() => {
    setLocations(initialLocations);
    setClients(initialClients);
  }, [initialLocations, initialClients]);

  useEffect(() => {
    if (open) {
      // format date to "YYYY-MM-DDThh:mm"
      const formatLocal = (d?: Date) => {
        if (!d) return "";
        const tzoffset = d.getTimezoneOffset() * 60000; 
        return new Date(d.getTime() - tzoffset).toISOString().slice(0, 16);
      };
      
      const ensureUTC = (dateStr: string) => dateStr.endsWith("Z") ? dateStr : dateStr + "Z";

      if (booking) {
        setFormData({
          title: booking.title || "",
          location_id: booking.location_id || "",
          client_id: booking.client_id || "",
          project_id: booking.project_id || "",
          start_time: formatLocal(new Date(ensureUTC(booking.start_time))),
          end_time: formatLocal(new Date(ensureUTC(booking.end_time))),
          status: booking.status || "Confirmed",
          notes: booking.notes || "",
        });
      } else {
        
        setFormData({
          title: "",
          location_id: initialLocationId || "",
          client_id: "",
          project_id: "",
          start_time: formatLocal(initialStartTime),
          end_time: formatLocal(initialEndTime),
          status: "Confirmed",
          notes: "",
        });
      }
      setShowNewLocation(false);
      setShowNewClient(false);
    }
  }, [open, booking, initialStartTime, initialEndTime, initialLocationId]);

  const handleCreateLocation = async () => {
    if (!newLocationName) return;
    try {
      const res = await fetchWithAuth("http://localhost:8000/api/v1/locations/", {
        method: "POST",
        body: JSON.stringify({ name: newLocationName, type: "Studio", status: "Available" }),
      });
      if (res.ok) {
        const newLoc = await res.json();
        setLocations([...locations, newLoc]);
        setFormData({ ...formData, location_id: newLoc.id });
        setShowNewLocation(false);
        setNewLocationName("");
        toast.success("Studio created");
      }
    } catch (e) {
      toast.error("Failed to create studio");
    }
  };

  const handleCreateClient = async () => {
    if (!newClientName || !newClientEmail) return;
    try {
      const res = await fetchWithAuth("http://localhost:8000/api/v1/contacts/", {
        method: "POST",
        body: JSON.stringify({ name: newClientName, email: newClientEmail, role: "Client", status: "Active" }),
      });
      if (res.ok) {
        const newC = await res.json();
        setClients([...clients, newC]);
        setFormData({ ...formData, client_id: newC.id });
        setShowNewClient(false);
        setNewClientName("");
        setNewClientEmail("");
        toast.success("Client created");
      }
    } catch (e) {
      toast.error("Failed to create client");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.start_time || !formData.end_time || !formData.location_id) {
      toast.error("Please fill in required fields (Title, Studio, Start, End)");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        client_id: formData.client_id || null,
        project_id: formData.project_id || null,
      };

      const url = booking ? `http://localhost:8000/api/v1/bookings/${booking.id}` : `http://localhost:8000/api/v1/bookings/`;
      const method = booking ? "PUT" : "POST";

      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(booking ? "Booking updated" : "Booking created");
        onSave();
        onOpenChange(false);
      } else {
        const data = await res.json();
        toast.error(data.detail || "Error saving booking");
      }
    } catch (error) {
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>{booking ? "Edit Booking" : "New Booking"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Booking Title *</label>
            <Input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Photo Shoot" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Start Time *</label>
              <Input type="datetime-local" required value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">End Time *</label>
              <Input type="datetime-local" required value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-muted-foreground">Studio / Location *</label>
            {!showNewLocation ? (
              <select
                className="w-full h-10 px-3 rounded-md border border-border text-sm bg-card"
                value={formData.location_id}
                onChange={(e) => {
                  if (e.target.value === "CREATE_NEW") setShowNewLocation(true);
                  else setFormData({ ...formData, location_id: e.target.value });
                }}
                required
              >
                <option value="">Select Studio...</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
                <option value="CREATE_NEW" className="text-blue-600 font-semibold">+ Create New Studio</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <Input placeholder="New Studio Name" value={newLocationName} onChange={(e) => setNewLocationName(e.target.value)} />
                <Button type="button" onClick={handleCreateLocation} className="shrink-0 bg-primary">Save</Button>
                <Button type="button" variant="ghost" onClick={() => setShowNewLocation(false)}>Cancel</Button>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-muted-foreground">Client</label>
            {!showNewClient ? (
              <select
                className="w-full h-10 px-3 rounded-md border border-border text-sm bg-card"
                value={formData.client_id}
                onChange={(e) => {
                  if (e.target.value === "CREATE_NEW") setShowNewClient(true);
                  else setFormData({ ...formData, client_id: e.target.value });
                }}
              >
                <option value="">No Client (Internal)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value="CREATE_NEW" className="text-blue-600 font-semibold">+ Create New Client</option>
              </select>
            ) : (
              <div className="flex flex-col gap-2 p-3 bg-muted border rounded-md">
                <Input placeholder="Client Name *" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
                <Input placeholder="Client Email *" type="email" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} />
                <div className="flex justify-end gap-2 mt-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewClient(false)}>Cancel</Button>
                  <Button type="button" size="sm" onClick={handleCreateClient} className="bg-primary">Save Client</Button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Related Project</label>
            <select
              className="w-full h-10 px-3 rounded-md border border-border text-sm bg-card"
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
            >
              <option value="">No Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <DialogFooter className="mt-6 flex justify-between sm:justify-between w-full">
            {booking && onDelete ? (
              <Button type="button" variant="destructive" onClick={() => { onDelete(booking.id); onOpenChange(false); }}>
                Cancel Booking
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? "Saving..." : "Save Booking"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
