"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plug,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Settings,
  Zap,
  MessageSquare,
  Cloud,
  DollarSign,
  Palette,
  Search,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const MOCK_INTEGRATIONS = [
  {
    id: "1",
    name: "Slack",
    provider: "Slack Technologies",
    description: "Send automated alerts to channels when task statuses change.",
    category: "Communication",
    status: "Active",
    is_connected: true,
    last_sync_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Google Drive",
    provider: "Google",
    description: "Sync final creative deliverables and assets to shared cloud folders.",
    category: "Storage",
    status: "Active",
    is_connected: true,
    last_sync_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "3",
    name: "Frame.io",
    provider: "Adobe",
    description: "Connect video feedback directly into project task comments.",
    category: "Creative",
    status: "Pending",
    is_connected: false,
    last_sync_at: null,
  },
  {
    id: "4",
    name: "Stripe",
    provider: "Stripe, Inc.",
    description: "Generate and send automated invoices upon project completion.",
    category: "Financial",
    status: "Pending",
    is_connected: false,
    last_sync_at: null,
  },
  {
    id: "5",
    name: "Dropbox",
    provider: "Dropbox",
    description: "Backup raw footage and project files securely.",
    category: "Storage",
    status: "Error",
    is_connected: true,
    last_sync_at: new Date(Date.now() - 86400000).toISOString(),
  }
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState(MOCK_INTEGRATIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any | null>(null);

  const toggleConnection = (integration: any) => {
    setIntegrations(integrations.map((i) => {
      if (i.id === integration.id) {
        const isNowConnected = !i.is_connected;
        return {
          ...i,
          is_connected: isNowConnected,
          status: isNowConnected ? "Active" : "Pending",
          last_sync_at: isNowConnected ? new Date().toISOString() : null,
        };
      }
      return i;
    }));
    toast.success(`${integration.name} ${!integration.is_connected ? "connected" : "disconnected"} successfully.`);
  };

  const syncIntegration = (integration: any) => {
    toast.success(`${integration.name} synced successfully.`);
    setIntegrations(integrations.map((i) => {
      if (i.id === integration.id) {
        return { ...i, last_sync_at: new Date().toISOString(), status: "Active" };
      }
      return i;
    }));
  };

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesCategory = selectedCategory === "All" || integration.category === selectedCategory;
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Communication": return MessageSquare;
      case "Storage": return Cloud;
      case "Financial": return DollarSign;
      case "Creative": return Palette;
      default: return Plug;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active": return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "Error": return <XCircle className="h-5 w-5 text-rose-500" />;
      case "Pending": return <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
      default: return <XCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const connectedCount = integrations.filter((i) => i.is_connected).length;
  const activeCount = integrations.filter((i) => i.status === "Active").length;
  const errorCount = integrations.filter((i) => i.status === "Error").length;

  return (
    <div className="space-y-6 p-1">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Plug className="w-8 h-8 text-blue-600" />
          Integrations Hub
        </h1>
        <p className="text-muted-foreground font-medium text-sm mt-1">
          Connect external platforms and automate your creative workflows.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Connected Services</CardTitle>
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{connectedCount}</div>
            <p className="text-xs font-medium text-muted-foreground mt-1">out of {integrations.length} available plugins</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Bridges</CardTitle>
            <Zap className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-emerald-600">{activeCount}</div>
            <p className="text-xs font-medium text-muted-foreground mt-1">operating normally without errors</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Connection Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-rose-600">{errorCount}</div>
            <p className="text-xs font-medium text-muted-foreground mt-1">requiring manual attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card p-4 rounded-xl border border-border shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search integrations by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 border-border"
          />
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={(val) => setSelectedCategory(val)}>
        <TabsList className="bg-muted border border-border p-1 flex flex-wrap h-auto">
          {["All", "Communication", "Storage", "Financial", "Creative"].map(cat => (
            <TabsTrigger key={cat} value={cat} className="data-[state=active]:bg-card data-[state=active]:shadow-sm font-medium text-muted-foreground">
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredIntegrations.map((integration) => {
              const CategoryIcon = getCategoryIcon(integration.category);
              return (
                <Card key={integration.id} className="hover:shadow-md transition-shadow border-border overflow-hidden flex flex-col">
                  <CardHeader className="bg-muted/50 border-b border-border pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center">
                          <CategoryIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-medium text-foreground">{integration.name}</CardTitle>
                          <p className="text-xs font-medium text-muted-foreground">{integration.provider}</p>
                        </div>
                      </div>
                      {getStatusIcon(integration.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 flex flex-col flex-1">
                    <p className="text-sm text-muted-foreground font-medium mb-4 flex-1">
                      {integration.description}
                    </p>

                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                      <Badge className={`font-medium ${
                        integration.status === "Active" ? "bg-emerald-50 text-emerald-700" :
                        integration.status === "Error" ? "bg-rose-50 text-rose-700" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {integration.status}
                      </Badge>
                      {integration.last_sync_at && (
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" />
                          {format(new Date(integration.last_sync_at), "MMM d, HH:mm")}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant={integration.is_connected ? "destructive" : "default"}
                        className={`flex-1 font-medium ${integration.is_connected ? "" : "bg-blue-600 hover:bg-blue-700"}`}
                        onClick={() => toggleConnection(integration)}
                      >
                        {integration.is_connected ? "Disconnect" : "Connect App"}
                      </Button>
                      
                      {integration.is_connected && (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            className="border-border hover:bg-muted"
                            title="Force Sync"
                            onClick={() => syncIntegration(integration)}
                          >
                            <RefreshCw className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="border-border hover:bg-muted"
                            title="Configure Settings"
                            onClick={() => {
                              setSelectedIntegration(integration);
                              setConfigDialogOpen(true);
                            }}
                          >
                            <Settings className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {filteredIntegrations.length === 0 && (
            <div className="bg-muted border-2 border-dashed border-border rounded-xl p-12 text-center">
              <Plug className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-foreground">No plugins match your filter</h3>
              <p className="text-sm font-medium text-muted-foreground mt-1">Try selecting a different category or adjusting your search.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="bg-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium">Configure {selectedIntegration?.name}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Manage webhook behaviors and sync frequencies for this plugin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium text-foreground">Background Auto-Sync</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Automatically pull data every hour.</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium text-foreground">Alert Notifications</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Receive warnings when syncing fails.</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-foreground">API Access Token</Label>
              <Input type="password" placeholder="sk_live_..." className="border-border" defaultValue="sk_mock_token_abc123" />
            </div>
            
            <div className="space-y-2">
              <Label className="font-medium text-foreground">Webhook Target URL</Label>
              <Input placeholder="https://api.yourcrm.com/webhooks" className="border-border" defaultValue="https://mediaflow.app/api/webhooks/listener" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)} className="font-medium">
              Cancel
            </Button>
            <Button onClick={() => {
              setConfigDialogOpen(false);
              toast.success("Plugin configuration saved successfully.");
            }} className="bg-blue-600 hover:bg-blue-700 font-medium gap-2">
              <Check className="w-4 h-4" /> Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
