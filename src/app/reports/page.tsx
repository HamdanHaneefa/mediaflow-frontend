"use client";
import { fetchWithAuth } from "@/lib/apiFetch";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Briefcase,
  Clock,
  Download,
  Target,
  Award,
  Activity,
} from "lucide-react";
import { differenceInDays } from "date-fns";

// Fixed mock data for standalone UI
const mockRevenue = [
  { month: "Jan", revenue: 55000, expenses: 38000, profit: 17000 },
  { month: "Feb", revenue: 62000, expenses: 40000, profit: 22000 },
  { month: "Mar", revenue: 58000, expenses: 39000, profit: 19000 },
  { month: "Apr", revenue: 75000, expenses: 45000, profit: 30000 },
  { month: "May", revenue: 68000, expenses: 42000, profit: 26000 },
  { month: "Jun", revenue: 85000, expenses: 50000, profit: 35000 },
];

const projectsByStatus = [
  { name: "Active", value: 14, color: "#3b82f6" },
  { name: "On Hold", value: 3, color: "#f59e0b" },
  { name: "Completed", value: 25, color: "#10b981" },
  { name: "Cancelled", value: 2, color: "#ef4444" },
];

const projectsByType = [
  { name: "Commercial", value: 18 },
  { name: "Documentary", value: 8 },
  { name: "Music Video", value: 12 },
  { name: "Corporate", value: 6 },
];

const teamProductivity = [
  { name: "Alex", completed: 45, total: 50, completion: 90 },
  { name: "Sarah", completed: 38, total: 42, completion: 90 },
  { name: "Mike", completed: 52, total: 60, completion: 86 },
  { name: "Emma", completed: 30, total: 35, completion: 85 },
];

const projectTimelines = [
  { name: "Creative Bloom Doc", progress: 85, status: "Active", onTime: true },
  { name: "Wright Media Branding", progress: 60, status: "Active", onTime: false },
  { name: "TechLaunch 2024", progress: 40, status: "Active", onTime: true },
  { name: "Summer Promo Campaign", progress: 95, status: "Active", onTime: true },
];

const clientMetrics = [
  { name: "Wright Media", projects: 5, value: 125000, satisfaction: 9.2 },
  { name: "TechLaunch Inc", projects: 3, value: 85000, satisfaction: 8.8 },
  { name: "Creative Bloom", projects: 2, value: 65000, satisfaction: 9.5 },
];

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("6months");
  const [activeTab, setActiveTab] = useState("overview");
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [currencyCode, setCurrencyCode] = useState("USD");

  useEffect(() => {
    fetchWithAuth("http://localhost:8000/api/v1/settings/")
      .then(res => res.json())
      .then(data => {
        const currencyMap: Record<string, string> = {
          "USD": "$", "EUR": "€", "GBP": "£", "INR": "₹", "AUD": "A$"
        };
        setCurrencyCode(data.default_currency || "USD");
        setCurrencySymbol(currencyMap[data.default_currency] || "$");
      })
      .catch(() => {});
  }, []);

  const totalRevenue = mockRevenue.reduce((sum, m) => sum + m.revenue, 0);
  const totalProfit = mockRevenue.reduce((sum, m) => sum + m.profit, 0);
  const avgProjectValue = totalRevenue / 44; // Total projects mock count
  const profitMargin = (totalProfit / totalRevenue) * 100;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">
            Business insights, financial metrics, and operational performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40 border-border bg-card font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="font-medium border-border bg-card">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{formatCurrency(totalRevenue)}</div>
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 mt-2">
              <TrendingUp className="h-3 w-3" />
              <span>+14.2% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profit Margin</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{profitMargin.toFixed(1)}%</div>
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 mt-2">
              <TrendingUp className="h-3 w-3" />
              <span>+2.1% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">14</div>
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mt-2">
              <Activity className="h-3 w-3" />
              <span>4 completed this period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Task Completion</CardTitle>
            <Award className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">88%</div>
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mt-2">
              <Clock className="h-3 w-3" />
              <span>165 of 187 tasks completed</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted border border-border p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-card font-medium text-muted-foreground">Overview</TabsTrigger>
          <TabsTrigger value="financial" className="data-[state=active]:bg-card font-medium text-muted-foreground">Financial</TabsTrigger>
          <TabsTrigger value="operational" className="data-[state=active]:bg-card font-medium text-muted-foreground">Operational</TabsTrigger>
          <TabsTrigger value="clients" className="data-[state=active]:bg-card font-medium text-muted-foreground">Clients</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="font-medium text-foreground">Revenue & Profit Trends</CardTitle>
                <CardDescription className="font-medium text-muted-foreground">Monthly financial performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${currencySymbol}${value / 1000}k`} />
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontWeight: "bold" }} formatter={(value) => formatCurrency(Number(value))} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", fontWeight: "bold" }} />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} name="Revenue" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} name="Profit" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="font-medium text-foreground">Projects by Status</CardTitle>
                <CardDescription className="font-medium text-muted-foreground">Current project distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectsByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {projectsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontWeight: "bold" }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", fontWeight: "bold" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="font-medium text-foreground">Team Productivity</CardTitle>
                <CardDescription className="font-medium text-muted-foreground">Task completion by team member</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamProductivity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontWeight: "bold" }} cursor={{ fill: "#f8fafc" }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", fontWeight: "bold" }} />
                      <Bar dataKey="completed" fill="#10b981" name="Completed Tasks" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="total" fill="#e2e8f0" name="Assigned Tasks" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="font-medium text-foreground">Projects by Type</CardTitle>
                <CardDescription className="font-medium text-muted-foreground">Project category distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectsByType} layout="vertical" barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={100} />
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontWeight: "bold" }} cursor={{ fill: "#f8fafc" }} />
                      <Bar dataKey="value" fill="#3b82f6" name="Projects" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="font-medium text-foreground">Revenue vs Expenses Breakdown</CardTitle>
              <CardDescription className="font-medium text-muted-foreground">Monthly financial comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${currencySymbol}${value / 1000}k`} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontWeight: "bold" }} cursor={{ fill: "#f8fafc" }} formatter={(value) => formatCurrency(Number(value))} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", fontWeight: "bold" }} />
                    <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operational" className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="font-medium text-foreground">Project Timeline Adherence</CardTitle>
              <CardDescription className="font-medium text-muted-foreground">Progress vs planned timeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 mt-4">
                {projectTimelines.map((project, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span className="text-foreground">{project.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{project.progress}%</span>
                        {project.onTime ? (
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-rose-500" />
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          project.onTime ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="font-medium text-foreground">Top Clients by Value</CardTitle>
                <CardDescription className="font-medium text-muted-foreground">Most valuable client relationships</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clientMetrics.map((client) => (
                    <div key={client.name} className="flex items-center justify-between p-3 bg-muted rounded-xl border border-border hover:border-border transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{client.name}</p>
                          <p className="text-xs font-medium text-muted-foreground">{client.projects} active projects</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">{formatCurrency(client.value)}</p>
                        <div className="flex items-center justify-end gap-1 text-[10px] font-medium text-emerald-600 uppercase tracking-wider mt-0.5">
                          <span>{client.satisfaction.toFixed(1)} / 10 Score</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="font-medium text-foreground">Client Satisfaction Scores</CardTitle>
                <CardDescription className="font-medium text-muted-foreground">Average ratings by client</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={clientMetrics} layout="horizontal" barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis type="number" domain={[0, 10]} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontWeight: "bold" }} cursor={{ fill: "#f8fafc" }} />
                      <Bar dataKey="satisfaction" fill="#10b981" name="Score out of 10" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
