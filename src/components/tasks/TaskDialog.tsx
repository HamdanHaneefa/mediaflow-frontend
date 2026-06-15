"use client";
import { fetchWithAuth } from "@/lib/apiFetch";

import { useState, useEffect } from "react";
import { Task, TaskStatus, TaskPriority, TaskType, Contact, Project } from "@/types";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  projectId?: string;
  onSaveSuccess?: () => void;
}

export function TaskDialog({ open, onOpenChange, task, projectId, onSaveSuccess }: TaskDialogProps) {
  const isEditing = !!task;
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "To Do" as TaskStatus,
    project_id: projectId || "",
    assigned_to: "unassigned",
    priority: "Medium" as TaskPriority,
    type: "Creative" as TaskType,
  });

  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);

  // Load active contacts for assignment and projects for global task creation
  useEffect(() => {
    if (open) {
      fetchWithAuth("http://localhost:8000/api/v1/contacts/")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setContacts(data))
        .catch(() => console.error("Error loading contacts"));
        
      if (!projectId) {
        fetchWithAuth("http://localhost:8000/api/v1/projects/")
          .then((res) => (res.ok ? res.json() : []))
          .then((data) => setProjects(data))
          .catch(() => console.error("Error loading projects"));
      }
    }
  }, [open, projectId]);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        status: task.status,
        project_id: task.project_id || "",
        assigned_to: task.assigned_to || "unassigned",
        priority: task.priority,
        type: task.type,
      });
      if (task.due_date) setDueDate(parseISO(task.due_date));
    } else {
      setFormData({
        title: "",
        description: "",
        status: "To Do",
        project_id: projectId || "",
        assigned_to: "unassigned",
        priority: "Medium",
        type: "Creative",
      });
      setDueDate(undefined);
    }
  }, [task, projectId, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Task title is required");
      return;
    }
    if (!formData.project_id) {
      toast.error("Project association is required");
      return;
    }

    setLoading(true);

    try {
      const taskData = {
        title: formData.title,
        description: formData.description || null,
        status: formData.status,
        project_id: formData.project_id,
        assigned_to: formData.assigned_to === "unassigned" ? null : formData.assigned_to,
        priority: formData.priority,
        type: formData.type,
        due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
      };

      if (isEditing && task) {
        const res = await fetchWithAuth(`http://localhost:8000/api/v1/tasks/${task.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });
        if (!res.ok) throw new Error("Update failed");
        toast.success("Task updated successfully");
      } else {
        const res = await fetchWithAuth("http://localhost:8000/api/v1/tasks/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });
        if (!res.ok) throw new Error("Create failed");
        toast.success("Task created successfully");
      }

      if (onSaveSuccess) onSaveSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save task");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    setLoading(true);
    try {
      const res = await fetchWithAuth(`http://localhost:8000/api/v1/tasks/${task.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Task deleted successfully");
      if (onSaveSuccess) onSaveSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to delete task");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const availableAssignees = contacts.filter((c) => c.status === "Active");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-foreground">
            {isEditing ? "Edit Task" : "Create New Task"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing ? "Update task details" : "Fill in the information to create a new task"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 min-h-0 pb-4">
          <form onSubmit={handleSubmit} className="space-y-4 p-1">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-muted-foreground">Task Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
                required
                className="bg-muted border-border"
              />
            </div>

            {!projectId && (
              <div className="space-y-2">
                <Label htmlFor="project_id" className="text-sm font-medium text-muted-foreground">Project *</Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {projects.map((proj) => (
                      <SelectItem key={proj.id} value={proj.id}>{proj.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-muted-foreground">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
                rows={3}
                className="bg-muted border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-muted-foreground">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="To Do">To Do</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="In Review">In Review</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-medium text-muted-foreground">Priority *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium text-muted-foreground">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as TaskType })}
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="Creative">Creative</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Administrative">Administrative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-muted border-border",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border border-border">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_to" className="text-sm font-medium text-muted-foreground">Assign To</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {availableAssignees.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id} className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-blue-600 text-white text-xs">
                            {contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{contact.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>
        </div>

        <DialogFooter className="mt-auto sm:justify-between flex-row">
          {isEditing ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="cursor-pointer"
            >
              Delete
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2 justify-end w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={loading} className="cursor-pointer text-white">
              {loading ? "Saving..." : isEditing ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
