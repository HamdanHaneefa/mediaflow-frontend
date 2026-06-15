"use client";
import { fetchWithAuth } from "@/lib/apiFetch";

import { useState, useEffect } from "react";
import { Project, Contact, Task } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Film,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  FolderKanban,
  Activity,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [resProjects, resContacts, resTasks, resSettings] = await Promise.all([
          fetchWithAuth("http://localhost:8000/api/v1/projects/"),
          fetchWithAuth("http://localhost:8000/api/v1/contacts/"),
          fetchWithAuth("http://localhost:8000/api/v1/tasks/"),
          fetchWithAuth("http://localhost:8000/api/v1/settings/"),
        ]);

        if (resProjects.ok) setProjects(await resProjects.json());
        if (resContacts.ok) setContacts(await resContacts.json());
        if (resTasks.ok) setTasks(await resTasks.json());
        if (resSettings.ok) {
          const settingsData = await resSettings.json();
          const currencyMap: Record<string, string> = {
            "USD": "$",
            "EUR": "€",
            "GBP": "£",
            "INR": "₹",
            "AUD": "A$"
          };
          setCurrencySymbol(currencyMap[settingsData.default_currency] || "$");
        }
      } catch (error) {
        console.error("Error loading dashboard metrics:", error);
        toast.error("Unable to reach FastAPI backend. Showing default fallback view.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const activeProjectsCount = projects.filter((p) => p.status === "Active").length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const tasksProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const preProdCount = projects.filter((p) => p.phase === "Pre-production").length;
  const prodCount = projects.filter((p) => p.phase === "Production").length;
  const postProdCount = projects.filter((p) => p.phase === "Post-production").length;
  const deliveredCount = projects.filter((p) => p.phase === "Delivered").length;

  const currentHour = new Date().getHours();
  let greeting = "Good evening";
  if (currentHour < 12) greeting = "Good morning";
  else if (currentHour < 18) greeting = "Good afternoon";

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-2 pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {greeting}, Admin User 👋
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Here is what's happening with your projects today.
          </p>
        </div>
      </div>

      {/* Overview Stats Cards - Constructive Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm rounded-2xl bg-card transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Pipeline Budget</CardTitle>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-500">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">
              {currencySymbol}{totalBudget.toLocaleString()}
            </div>
            <p className="text-[10px] text-muted-foreground font-medium mt-2 flex items-center gap-1 uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>Accumulated value</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-2xl bg-card transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Active Projects</CardTitle>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-500">
              <Film className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{activeProjectsCount}</div>
            <p className="text-[10px] text-muted-foreground font-medium mt-2 uppercase tracking-wider">In production phase</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-2xl bg-card transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Contacts</CardTitle>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{contacts.length}</div>
            <p className="text-[10px] text-muted-foreground font-medium mt-2 uppercase tracking-wider">Clients & freelancers</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-2xl bg-card transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Task Completion</CardTitle>
            <div className="p-2 bg-violet-50 rounded-xl text-violet-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground mb-2">{tasksProgress}%</div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${tasksProgress}%` }}></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Stage Breakdown */}
        <Card className="lg:col-span-1 border-0 shadow-sm rounded-2xl bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Production Stages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            <div>
              <div className="flex justify-between text-xs font-medium text-foreground mb-2">
                <span>Pre-production</span>
                <span className="text-muted-foreground">{preProdCount}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${projects.length ? (preProdCount / projects.length) * 100 : 0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-foreground mb-2">
                <span>Production</span>
                <span className="text-muted-foreground">{prodCount}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${projects.length ? (prodCount / projects.length) * 100 : 0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-foreground mb-2">
                <span>Post-production</span>
                <span className="text-muted-foreground">{postProdCount}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${projects.length ? (postProdCount / projects.length) * 100 : 0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-foreground mb-2">
                <span>Delivered</span>
                <span className="text-muted-foreground">{deliveredCount}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${projects.length ? (deliveredCount / projects.length) * 100 : 0}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Launchpad */}
        <Card className="lg:col-span-2 border-0 shadow-sm rounded-2xl bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Creative Launchpad
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="border border-border hover:border-blue-200 hover:bg-blue-50/50 rounded-xl p-5 transition-all flex flex-col justify-between group h-full">
              <div>
                <h4 className="font-medium text-foreground mb-2 group-hover:text-blue-700">Contacts Catalog</h4>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-6">
                  Manage commercial clients, creative directors, team freelancers, and key partners.
                </p>
              </div>
              <Link href="/contacts" passHref>
                <Button size="sm" className="w-full bg-card border border-border text-muted-foreground hover:bg-blue-600 hover:text-white hover:border-blue-600 gap-2 font-medium shadow-sm transition-all">
                  Open Contacts
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="border border-border hover:border-indigo-200 hover:bg-indigo-50/50 rounded-xl p-5 transition-all flex flex-col justify-between group h-full">
              <div>
                <h4 className="font-medium text-foreground mb-2 group-hover:text-indigo-700">Projects Pipeline</h4>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-6">
                  Add new client requests, monitor budget tracks, color grades, and creative timelines.
                </p>
              </div>
              <Link href="/projects" passHref>
                <Button size="sm" className="w-full bg-card border border-border text-muted-foreground hover:bg-indigo-600 hover:text-white hover:border-indigo-600 gap-2 font-medium shadow-sm transition-all">
                  Open Projects
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
