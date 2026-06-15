"use client";

import { useState } from "react";
import { Project, Contact, Task } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { TaskDialog } from "@/components/tasks/TaskDialog";

interface ProjectCardProps {
  project: Project;
  contacts: Contact[];
  tasks: Task[];
  currencySymbol?: string;
  onAddTaskSuccess?: () => void;
}

export function ProjectCard({ project, contacts = [], tasks = [], currencySymbol = "$", onAddTaskSuccess }: ProjectCardProps) {
  const router = useRouter();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  const client = project.client_id ? contacts.find((c) => c.id === project.client_id) : null;
  const projectTasks = tasks.filter((task) => task.project_id === project.id);
  const completedTasks = projectTasks.filter((task) => task.status === "Completed");
  const progress =
    projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0;

  const teamMembers = project.team_members
    .map((id) => contacts.find((c) => c.id === id))
    .filter((contact): contact is NonNullable<typeof contact> => contact !== null && contact !== undefined)
    .slice(0, 4);
  const extraMembersCount = Math.max(0, project.team_members.length - 4);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 border-green-200";
      case "On Hold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-muted text-foreground border-border";
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "Pre-production":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Production":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Post-production":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      case "Delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-muted text-foreground border-border";
    }
  };

  return (
    <Card
      className="p-4 hover:shadow-lg transition-shadow cursor-pointer border border-border bg-card shadow-xs"
      onClick={() => router.push(`/projects/${project.id}`)}
    >
      <div className="space-y-4">
        <div>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-medium text-foreground mb-1 line-clamp-1 text-base">
                {project.title}
              </h3>
              <p className="text-sm text-muted-foreground font-medium">{project.type}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Badge className={getStatusColor(project.status)} variant="outline">
              {project.status}
            </Badge>
            <Badge className={getPhaseColor(project.phase)} variant="outline">
              {project.phase}
            </Badge>
          </div>
        </div>

        {client && (
          <div className="flex items-center gap-2 py-2 border-y border-border">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                {client.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {client.name}
              </p>
              {client.company && (
                <p className="text-xs text-muted-foreground font-medium truncate">{client.company}</p>
              )}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-medium">Progress</span>
            <span className="text-sm font-medium text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-sm">
          {project.team_members.length > 0 ? (
            <div className="flex items-center gap-1">
              {teamMembers.map((member, index) => (
                <Avatar
                  key={member?.id}
                  className="h-6 w-6 border-2 border-white"
                  style={{ marginLeft: index > 0 ? "-8px" : "0" }}
                >
                  <AvatarFallback className="bg-blue-600 text-white text-[10px] font-medium">
                    {member?.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {extraMembersCount > 0 && (
                <div
                  className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground border-2 border-white"
                  style={{ marginLeft: "-8px" }}
                >
                  +{extraMembersCount}
                </div>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground font-medium text-xs">No team assigned</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-3">
            {project.budget && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground font-medium">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{currencySymbol}{project.budget.toLocaleString()}</span>
              </div>
            )}
            {project.end_date && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground font-medium">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{format(parseISO(project.end_date), "MMM d")}</span>
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setTaskDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>
      </div>

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        projectId={project.id}
        onSaveSuccess={onAddTaskSuccess}
      />
    </Card>
  );
}
