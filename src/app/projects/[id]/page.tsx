"use client";
import { fetchWithAuth } from "@/lib/apiFetch";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Project, Contact, Task } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Edit,
  FolderKanban,
  CheckCircle2,
  Trash2,
  Plus,
  MessageCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { cn } from "@/lib/utils";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Contact | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [loading, setLoading] = useState(true);

  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();

  const fetchProjectDetails = async () => {
    try {
        // Fetch project, tasks, and client contact
        const resProject = await fetchWithAuth(`http://localhost:8000/api/v1/projects/${projectId}`);
        if (!resProject.ok) {
          throw new Error("Project not found");
        }
        const projData: Project = await resProject.json();
        setProject(projData);

        // Fetch client details if client_id exists
        if (projData.client_id) {
          const resClient = await fetchWithAuth(`http://localhost:8000/api/v1/contacts/${projData.client_id}`);
          if (resClient.ok) {
            setClient(await resClient.json());
          }
        }

        // Fetch all tasks and filter by project_id
        const resTasks = await fetchWithAuth(`http://localhost:8000/api/v1/tasks/`);
        if (resTasks.ok) {
          const allTasks: Task[] = await resTasks.json();
          setProjectTasks(allTasks.filter((t) => t.project_id === projectId));
        }

        // Fetch settings for currency
        const resSettings = await fetchWithAuth("http://localhost:8000/api/v1/settings/");
        if (resSettings.ok) {
          const settingsData = await resSettings.json();
          const currencyMap: Record<string, string> = {
            "USD": "$", "EUR": "€", "GBP": "£", "INR": "₹", "AUD": "A$"
          };
          setCurrencySymbol(currencyMap[settingsData.default_currency] || "$");
        }
      } catch (error) {
        console.error("Error loading project information:", error);
        toast.error("Unable to load project metadata.");
      } finally {
        setLoading(false);
      }
  };

  const toggleTaskStatus = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newStatus = task.status === "Completed" ? "To Do" : "Completed";
      const res = await fetchWithAuth(`http://localhost:8000/api/v1/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      
      setProjectTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      toast.success(`Task marked as ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update task status");
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const res = await fetchWithAuth(`http://localhost:8000/api/v1/projects/${projectId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Project deleted successfully.");
        router.push("/projects");
      } else {
        toast.error("Failed to delete project.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Connection error during delete.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/projects")} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
        </Button>
        <Card className="border-border bg-card p-12 text-center shadow-xs">
          <p className="text-muted-foreground font-medium">Synchronizing project records...</p>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/projects")} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
        </Button>
        <Card className="border-border bg-card p-12 text-center shadow-xs">
          <p className="text-muted-foreground font-medium text-lg">Project not found</p>
        </Card>
      </div>
    );
  }

  const completedTasksCount = projectTasks.filter((t) => t.status === "Completed").length;
  const progressPercent =
    projectTasks.length > 0 ? Math.round((completedTasksCount / projectTasks.length) * 100) : 0;

  return (
    <div className="space-y-6 p-1">
      {/* Top action row */}
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={() => router.push("/projects")}
          className="text-muted-foreground hover:text-foreground font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setProjectDialogOpen(true)} className="gap-2 font-medium">
            <Edit className="w-4 h-4" />
            Edit Project
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-2 font-medium">
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Core details container */}
      <Card className="border-border shadow-sm bg-card overflow-hidden">
        <div className="p-6 md:p-8 space-y-6">
          {/* Headline */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
            <div className="space-y-2">
              <div className="flex items-center flex-wrap gap-2.5">
                <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                  {project.title}
                </h1>
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium px-2.5 py-0.5 rounded-full text-xs">
                  {project.status}
                </Badge>
                <Badge className="bg-blue-50 text-blue-700 border border-blue-100 font-medium px-2.5 py-0.5 rounded-full text-xs">
                  {project.phase}
                </Badge>
              </div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <FolderKanban className="w-4 h-4 text-blue-600" />
                <span>{project.type} category client campaign</span>
              </p>
            </div>
          </div>

          {/* Client Details Section */}
          {client && (
            <div className="bg-muted/50 rounded-xl p-4 border border-border space-y-3">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Primary Client Account
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <Avatar className="h-12 w-12 border border-border">
                    <AvatarFallback className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-semibold">
                      {client.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-foreground">{client.name}</h4>
                    <p className="text-xs text-muted-foreground font-medium">{client.company || "Independent Client"}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {client.email && (
                    <a href={`mailto:${client.email}`}>
                      <Button variant="outline" size="sm" className="h-9 px-3 gap-2 font-medium">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        Send Mail
                      </Button>
                    </a>
                  )}
                  {client.phone && (
                    <>
                      <a href={`tel:${client.phone}`}>
                        <Button variant="outline" size="sm" className="h-9 px-3 gap-2 font-medium">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          Call
                        </Button>
                      </a>
                      <a href={`https://wa.me/${client.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="h-9 px-3 gap-2 font-medium border-green-200 hover:bg-green-50 hover:text-green-700">
                          <MessageCircle className="w-4 h-4 text-green-600" />
                          WhatsApp
                        </Button>
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-muted/50 p-4 rounded-xl border border-border/70">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium mb-1">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Budget Allocation
              </div>
              <p className="text-xl font-semibold text-foreground">
                {project.budget ? `${currencySymbol}${project.budget.toLocaleString()}` : "Not set"}
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-xl border border-border/70">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium mb-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                Start Date
              </div>
              <p className="text-xl font-semibold text-foreground">
                {project.start_date ? format(new Date(project.start_date), "MMM d, yyyy") : "Not set"}
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-xl border border-border/70">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium mb-1">
                <Clock className="w-4 h-4 text-indigo-600" />
                Target End Date
              </div>
              <p className="text-xl font-semibold text-foreground">
                {project.end_date ? format(new Date(project.end_date), "MMM d, yyyy") : "Not set"}
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-xl border border-border/70">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium mb-1">
                <Users className="w-4 h-4 text-violet-600" />
                Active Staff
              </div>
              <p className="text-xl font-semibold text-foreground">
                {project.team_members?.length || 0} members assigned
              </p>
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-950">Campaign Overview & Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                {project.description}
              </p>
            </div>
          )}

          {/* Progress Tracking */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex justify-between items-center text-sm font-medium text-foreground">
              <span>Task Execution Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2.5" />
            <p className="text-xs text-muted-foreground font-medium">
              {completedTasksCount} of {projectTasks.length} total milestones completed
            </p>
          </div>
        </div>
      </Card>

      {/* Task list section */}
      <Card className="border-border shadow-sm bg-card overflow-hidden">
        <CardHeader className="border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Campaign Deliverables Checklist
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground font-medium">
              Timeline goals associated with this production project.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 font-medium"
            onClick={() => {
              setEditingTask(undefined);
              setTaskDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-slate-100">
          {projectTasks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground font-medium text-sm">
              No tasks currently registered for this project.
            </div>
          ) : (
            projectTasks.map((tsk) => (
              <div 
                key={tsk.id} 
                className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => {
                  setEditingTask(tsk);
                  setTaskDialogOpen(true);
                }}
              >
                <button
                  type="button"
                  className={cn(
                    "shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    tsk.status === "Completed" 
                      ? "border-emerald-500 bg-emerald-500 text-white" 
                      : "border-slate-300 hover:border-emerald-500"
                  )}
                  onClick={(e) => toggleTaskStatus(tsk, e)}
                  title={tsk.status === "Completed" ? "Mark as To Do" : "Mark as Completed"}
                >
                  {tsk.status === "Completed" && <CheckCircle2 className="w-5 h-5" />}
                </button>
                <div className="flex-1 space-y-1">
                  <h4 className={`text-sm font-medium text-foreground ${tsk.status === "Completed" ? "line-through text-muted-foreground" : ""}`}>
                    {tsk.title}
                  </h4>
                  {tsk.description && (
                    <p className="text-xs text-muted-foreground font-medium line-clamp-1">{tsk.description}</p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                      tsk.priority === "High" ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700"
                    }`}>
                      {tsk.priority} Priority
                    </span>
                    {tsk.due_date && (
                      <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        Due {format(new Date(tsk.due_date), "PP")}
                      </span>
                    )}
                  </div>
                </div>

                <Badge className={`font-medium ${
                  tsk.status === "Completed" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                }`}>
                  {tsk.status}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <ProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        project={project}
        onSaveSuccess={fetchProjectDetails}
      />

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={(open) => {
          setTaskDialogOpen(open);
          if (!open) setEditingTask(undefined);
        }}
        task={editingTask}
        projectId={project.id}
        onSaveSuccess={fetchProjectDetails}
      />
    </div>
  );
}
