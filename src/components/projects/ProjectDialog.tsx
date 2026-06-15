"use client";
import { fetchWithAuth } from "@/lib/apiFetch";

import { useState, useEffect } from "react";
import { Project, ProjectType, ProjectStatus, ProjectPhase, Contact } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Film,
  FileVideo,
  Music,
  Briefcase,
  Video,
  Camera,
  Share2,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
  onSaveSuccess?: () => void;
}

const projectTypeIcons: Record<ProjectType, React.ReactNode> = {
  Commercial: <Film className="w-4 h-4" />,
  Documentary: <FileVideo className="w-4 h-4" />,
  "Music Video": <Music className="w-4 h-4" />,
  Corporate: <Briefcase className="w-4 h-4" />,
  "Social Media": <Share2 className="w-4 h-4" />,
};

export function ProjectDialog({ open, onOpenChange, project, onSaveSuccess }: ProjectDialogProps) {
  const isEditing = !!project;
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "Commercial" as ProjectType,
    status: "Active" as ProjectStatus,
    phase: "Pre-production" as ProjectPhase,
    client_id: "",
    budget: "",
    team_members: [] as string[],
  });

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);

  // Fetch active contacts for clients and team members
  useEffect(() => {
    if (open) {
      fetchWithAuth("http://localhost:8000/api/v1/contacts/")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setContacts(data))
        .catch(() => console.error("Error loading contacts for projects"));
    }
  }, [open]);

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title,
        description: project.description || "",
        type: project.type,
        status: project.status,
        phase: project.phase,
        client_id: project.client_id || "",
        budget: project.budget?.toString() || "",
        team_members: project.team_members || [],
      });
      if (project.start_date) setStartDate(parseISO(project.start_date));
      if (project.end_date) setEndDate(parseISO(project.end_date));
    } else {
      setFormData({
        title: "",
        description: "",
        type: "Commercial",
        status: "Active",
        phase: "Pre-production",
        client_id: "",
        budget: "",
        team_members: [],
      });
      setStartDate(undefined);
      setEndDate(undefined);
    }
  }, [project, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Project title is required");
      return;
    }

    setLoading(true);

    try {
      const projectData = {
        title: formData.title,
        description: formData.description || null,
        type: formData.type,
        status: formData.status,
        phase: formData.phase,
        client_id: formData.client_id || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
        team_members: formData.team_members,
      };

      if (isEditing && project) {
        const res = await fetchWithAuth(`http://localhost:8000/api/v1/projects/${project.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectData),
        });
        if (!res.ok) throw new Error("Update failed");
        toast.success("Project updated successfully");
      } else {
        const res = await fetchWithAuth("http://localhost:8000/api/v1/projects/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectData),
        });
        if (!res.ok) throw new Error("Creation failed");
        toast.success("Project created successfully");
      }

      if (onSaveSuccess) onSaveSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save project");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const clientOptions = contacts.filter((c) => c.role === "Client");
  const teamOptions = contacts.filter((c) => c.status === "Active");

  const toggleTeamMember = (memberId: string) => {
    setFormData((prev) => ({
      ...prev,
      team_members: prev.team_members.includes(memberId)
        ? prev.team_members.filter((id) => id !== memberId)
        : [...prev.team_members, memberId],
    }));
  };

  const selectedMembers = teamOptions.filter((c) => formData.team_members.includes(c.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[50vw] w-[95vw] sm:w-[50vw] h-[95vh] overflow-hidden flex flex-col bg-card border border-border p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-foreground">
            {isEditing ? "Edit Project" : "Create New Project"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing ? "Update project details" : "Fill in the information to create a new project"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 min-h-0 pb-4">
          <form onSubmit={handleSubmit} className="space-y-6 p-1">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-muted-foreground">Project Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter project title"
                required
                className="bg-muted border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium text-muted-foreground">Project Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as ProjectType })}
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {Object.entries(projectTypeIcons).map(([type, icon]) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          {icon}
                          <span>{type}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-muted-foreground">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as ProjectStatus })}
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phase" className="text-sm font-medium text-muted-foreground">Phase *</Label>
                <Select
                  value={formData.phase}
                  onValueChange={(value) => setFormData({ ...formData, phase: value as ProjectPhase })}
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="Pre-production">Pre-production</SelectItem>
                    <SelectItem value="Production">Production</SelectItem>
                    <SelectItem value="Post-production">Post-production</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client" className="text-sm font-medium text-muted-foreground">Client</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {clientOptions.map((client) => (
                      <SelectItem key={client.id} value={client.id} className="cursor-pointer">
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-muted-foreground">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter project description"
                rows={4}
                className="bg-muted border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-muted border-border",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border border-border">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-muted border-border",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border border-border">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2 max-w-[200px]">
              <Label htmlFor="budget" className="text-sm font-medium text-muted-foreground">Budget</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="0.00"
                className="bg-muted border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Team Members</Label>
              <div className="border border-border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto bg-muted">
                {teamOptions.map((contact) => (
                  <div
                    key={contact.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted",
                      formData.team_members.includes(contact.id) && "bg-blue-50 hover:bg-blue-100"
                    )}
                    onClick={() => toggleTeamMember(contact.id)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                        {contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{contact.name}</p>
                      <p className="text-xs text-muted-foreground font-medium">{contact.role}</p>
                    </div>
                    {formData.team_members.includes(contact.id) && (
                      <Badge className="bg-blue-600 text-white border-0">Selected</Badge>
                    )}
                  </div>
                ))}
              </div>
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedMembers.map((member) => (
                    <Badge key={member.id} variant="secondary" className="gap-1 border border-border">
                      {member.name}
                      <X className="w-3 h-3 cursor-pointer ml-1" onClick={() => toggleTeamMember(member.id)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        <DialogFooter className="border-t border-border pt-3 mt-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="cursor-pointer text-white">
            {loading ? "Saving..." : isEditing ? "Update Project" : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
