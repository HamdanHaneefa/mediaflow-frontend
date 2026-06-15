"use client";
import { fetchWithAuth } from "@/lib/apiFetch";

import { useState, useEffect, useMemo } from "react";
import { Project, ProjectStatus, ProjectType, ProjectPhase, Contact, Task } from "@/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Grid3x3, List, ArrowUpDown } from "lucide-react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectListItem } from "@/components/projects/ProjectListItem";
import { ProjectFilters } from "@/components/projects/ProjectFilters";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { toast } from "sonner";

type ViewMode = "grid" | "list";
type SortOption = "created" | "due_date" | "budget" | "title";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "All">("All");
  const [typeFilter, setTypeFilter] = useState<ProjectType | "All">("All");
  const [phaseFilter, setPhaseFilter] = useState<ProjectPhase | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("created");

  // Fetch all projects, contacts, and tasks
  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const resProjects = await fetchWithAuth("http://localhost:8000/api/v1/projects/");
      if (resProjects.ok) {
        const dataProjects = await resProjects.json();
        setProjects(dataProjects);
      }

      const resContacts = await fetchWithAuth("http://localhost:8000/api/v1/contacts/");
      if (resContacts.ok) {
        const dataContacts = await resContacts.json();
        setContacts(dataContacts);
      }

      const resTasks = await fetchWithAuth("http://localhost:8000/api/v1/tasks/");
      if (resTasks.ok) {
        const dataTasks = await resTasks.json();
        setTasks(dataTasks);
      }

      const resSettings = await fetchWithAuth("http://localhost:8000/api/v1/settings/");
      if (resSettings.ok) {
        const settingsData = await resSettings.json();
        const currencyMap: Record<string, string> = {
          "USD": "$", "EUR": "€", "GBP": "£", "INR": "₹", "AUD": "A$"
        };
        setCurrencySymbol(currencyMap[settingsData.default_currency] || "$");
      }
    } catch (error) {
      console.error("Error loading projects data:", error);
      toast.error("Failed to load projects from FastAPI backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects;

    if (searchQuery) {
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "All") {
      filtered = filtered.filter((project) => project.status === statusFilter);
    }

    if (typeFilter !== "All") {
      filtered = filtered.filter((project) => project.type === typeFilter);
    }

    if (phaseFilter !== "All") {
      filtered = filtered.filter((project) => project.phase === phaseFilter);
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "due_date":
          if (!a.end_date) return 1;
          if (!b.end_date) return -1;
          return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
        case "budget":
          return (b.budget || 0) - (a.budget || 0);
        case "created":
        default:
          return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
      }
    });

    return sorted;
  }, [projects, searchQuery, statusFilter, typeFilter, phaseFilter, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setTypeFilter("All");
    setPhaseFilter("All");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-20" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl font-medium tracking-tight text-foreground truncate">Projects</h2>
          <p className="text-muted-foreground mt-1">
            {filteredAndSortedProjects.length}{" "}
            {filteredAndSortedProjects.length === 1 ? "project" : "projects"} active
          </p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 min-h-[40px] shrink-0 text-white cursor-pointer"
          onClick={() => setDialogOpen(true)}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span>New Project</span>
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-xs">
        <div className="p-4 border-b border-border space-y-4">
          <ProjectFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            phaseFilter={phaseFilter}
            onPhaseChange={setPhaseFilter}
            onClearFilters={clearFilters}
          />

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <TabsList className="bg-muted border border-border">
                <TabsTrigger value="grid" className="gap-2 cursor-pointer">
                  <Grid3x3 className="w-4 h-4" />
                  Grid
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2 cursor-pointer">
                  <List className="w-4 h-4" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-[180px] bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="created">Recently Created</SelectItem>
                  <SelectItem value="due_date">Due Date</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="title">Title (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {filteredAndSortedProjects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {projects.length === 0
                  ? "No projects yet. Create your first project to get started."
                  : "No projects match your filters."}
              </p>
              {projects.length === 0 && (
                <Button variant="outline" onClick={() => setDialogOpen(true)} className="cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    contacts={contacts}
                    tasks={tasks}
                    currencySymbol={currencySymbol}
                    onAddTaskSuccess={fetchAllData}
                  />
              ))}
            </div>
          ) : (
            <div className="space-y-0 overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted rounded-t-lg border-b border-border text-sm font-medium text-muted-foreground">
                  <div className="col-span-3">Project</div>
                  <div className="col-span-2">Client</div>
                  <div className="col-span-2">Status & Phase</div>
                  <div className="col-span-2">Progress</div>
                  <div className="col-span-1">Team</div>
                  <div className="col-span-2">Budget & Deadline</div>
                </div>
                {filteredAndSortedProjects.map((project) => (
                  <ProjectListItem
                    key={project.id}
                    project={project}
                    contacts={contacts}
                    tasks={tasks}
                    currencySymbol={currencySymbol}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaveSuccess={fetchAllData}
      />
    </div>
  );
}
