"use client";
import { fetchWithAuth } from "@/lib/apiFetch";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Building2, UserCircle, Bell, Palette, Save, Loader2, Users, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { format } from "date-fns";

interface SystemSettings {
  id: number;
  agency_name: string;
  agency_address?: string;
  tax_id?: string;
  default_currency: string;
  theme_preference: string;
  email_notifications: boolean;
}

export default function SettingsPage() {
  const { user, token, updateUser } = useAuth();
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  // New user form state
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    full_name: "",
    system_role: "agent",
    job_title: ""
  });
  const [isAddingUser, setIsAddingUser] = useState(false);

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    job_title: "",
    phone: "",
    timezone: "UTC",
    avatar_url: ""
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password update state
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
    if (user) {
      setProfileForm({
        full_name: user.full_name || "",
        job_title: user.job_title || "",
        phone: user.phone || "",
        timezone: user.timezone || "UTC",
        avatar_url: user.avatar_url || ""
      });
    }
    if (user?.system_role === "admin") {
      fetchTeamMembers();
      fetchActivityLogs();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth("http://localhost:8000/api/v1/settings/");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setTheme(data.theme_preference);
      }
    } catch (error) {
      toast.error("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await fetchWithAuth("http://localhost:8000/api/v1/auth/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTeamMembers(await res.json());
      }
    } catch (error) {
      toast.error("Failed to load team members.");
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const res = await fetchWithAuth("http://localhost:8000/api/v1/auth/activity", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setActivityLogs(await res.json());
      }
    } catch (error) {
      toast.error("Failed to load activity logs.");
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      const res = await fetchWithAuth("http://localhost:8000/api/v1/settings/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        toast.success("Settings saved successfully!");
        setSettings(await res.json());
      } else {
        toast.error("Failed to save settings.");
      }
    } catch (error) {
      toast.error("Network error while saving settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingUser(true);
    try {
      const res = await fetchWithAuth("http://localhost:8000/api/v1/auth/users", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        toast.success("Team member added successfully!");
        fetchTeamMembers();
        setNewUser({ email: "", password: "", full_name: "", system_role: "agent", job_title: "" });
      } else {
        const error = await res.json();
        toast.error(error.detail || "Failed to add team member.");
      }
    } catch (error) {
      toast.error("Network error while adding team member.");
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    if (passwords.new.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    
    setIsUpdatingPassword(true);
    try {
      const res = await fetchWithAuth("http://localhost:8000/api/v1/auth/password", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ current_password: passwords.current, new_password: passwords.new })
      });
      if (res.ok) {
        toast.success("Password updated successfully!");
        setPasswords({ current: "", new: "", confirm: "" });
      } else {
        const error = await res.json();
        toast.error(error.detail || "Failed to update password.");
      }
    } catch (error) {
      toast.error("Network error while updating password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      const res = await fetchWithAuth("http://localhost:8000/api/v1/auth/me", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });
      if (res.ok) {
        const updatedUser = await res.json();
        updateUser(updatedUser);
        toast.success("Profile updated successfully!");
      } else {
        const error = await res.json();
        toast.error(error.detail || "Failed to update profile.");
      }
    } catch (error) {
      toast.error("Network error while updating profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const updateSetting = async (key: keyof SystemSettings, value: any) => {
    if (settings) {
      const updatedSettings = { ...settings, [key]: value };
      setSettings(updatedSettings);
      
      if (key === 'theme_preference') {
        setTheme(value);
      }
      
      // Auto-save settings in the background
      try {
        await fetchWithAuth("http://localhost:8000/api/v1/settings/", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedSettings)
        });
      } catch (error) {
        console.error("Failed to auto-save settings", error);
      }
    }
  };

  if (loading || !user) {
    return <div className="flex h-[400px] items-center justify-center text-muted-foreground font-medium">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="p-8 text-center text-red-500 font-medium">Failed to load system settings. Ensure backend is running.</div>;
  }

  const isAdmin = user.system_role === "admin";

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto p-2 pb-10">
      
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">Manage your agency preferences and account configuration.</p>
        </div>
        <Button 
          onClick={handleSaveSettings} 
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm gap-2 transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-muted p-1 rounded-xl h-auto flex flex-wrap gap-2 mb-8">
          <TabsTrigger value="profile" className="rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-6 py-3 flex items-center gap-2">
            <UserCircle className="w-4 h-4" />
            My Profile
          </TabsTrigger>
          <TabsTrigger value="agency" className="rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-6 py-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Agency & Finance
          </TabsTrigger>
          <TabsTrigger value="preferences" className="rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-6 py-3 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            App Preferences
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="team" className="rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-6 py-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team Management
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="activity" className="rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-6 py-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Activity Log
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6 animate-in fade-in-50 duration-300">
          <Card className="border-0 shadow-sm rounded-2xl bg-card text-card-foreground overflow-hidden">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg font-medium">Personal Profile</CardTitle>
              <CardDescription className="font-medium">Your account information.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-6 pb-4">
                <div 
                  className="relative group cursor-pointer" 
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <input 
                    type="file" 
                    id="avatar-upload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setProfileForm({...profileForm, avatar_url: reader.result as string});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {profileForm.avatar_url ? (
                    <img src={profileForm.avatar_url} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-semibold">
                      {user.full_name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-[10px] font-medium uppercase tracking-wider">Change</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground">{user.full_name}</h3>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-1">{user.job_title || user.system_role}</p>
                </div>
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={isSavingProfile}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Profile
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-border">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</label>
                  <Input value={profileForm.full_name} onChange={e => setProfileForm({...profileForm, full_name: e.target.value})} className="bg-background border-border focus-visible:ring-primary rounded-xl font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Address</label>
                  <Input value={user.email} disabled className="bg-muted border-border rounded-xl font-medium text-muted-foreground cursor-not-allowed opacity-70" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone Number</label>
                  <Input value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} placeholder="+1 (555) 000-0000" className="bg-background border-border focus-visible:ring-primary rounded-xl font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Timezone</label>
                  <Select value={profileForm.timezone} onValueChange={(val) => setProfileForm({...profileForm, timezone: val})}>
                    <SelectTrigger className="bg-background border-border focus:ring-primary rounded-xl font-medium">
                      <SelectValue placeholder="Select Timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC (Universal)</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                      <SelectItem value="Asia/Kolkata">India Standard Time (IST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-2xl bg-card text-card-foreground overflow-hidden mt-6">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg font-medium">Security & Password</CardTitle>
              <CardDescription className="font-medium">Update your account password.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2 max-w-md">
                  <label className="text-xs font-medium text-muted-foreground">Current Password</label>
                  <Input type="password" required value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} className="h-10 bg-background border-border focus-visible:ring-primary" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">New Password</label>
                    <Input type="password" required value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} className="h-10 bg-background border-border focus-visible:ring-primary" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Confirm New Password</label>
                    <Input type="password" required value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} className="h-10 bg-background border-border focus-visible:ring-primary" />
                  </div>
                </div>
                <div className="pt-2">
                  <Button type="submit" disabled={isUpdatingPassword} className="bg-primary hover:bg-primary/90 text-primary-foreground w-full md:w-auto h-10">
                    {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agency" className="space-y-6 animate-in fade-in-50 duration-300">
          <Card className="border-0 shadow-sm rounded-2xl bg-card text-card-foreground overflow-hidden">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg font-medium">Agency Information</CardTitle>
              <CardDescription className="font-medium">Global settings applied across reports and invoices.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-center">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Agency Name</label>
                <Input 
                  value={settings.agency_name}
                  onChange={(e) => updateSetting('agency_name', e.target.value)}
                  className="bg-muted border-border rounded-xl focus-visible:ring-blue-500 font-medium max-w-md"
                />

                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Agency Address</label>
                <Input 
                  value={settings.agency_address || ''}
                  onChange={(e) => updateSetting('agency_address', e.target.value)}
                  placeholder="123 Production Way, City, State, ZIP"
                  className="bg-muted border-border rounded-xl focus-visible:ring-blue-500 font-medium max-w-md"
                />

                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">GST Number</label>
                <Input 
                  value={settings.tax_id || ''}
                  onChange={(e) => updateSetting('tax_id', e.target.value)}
                  placeholder="Enter GST number"
                  className="bg-muted border-border rounded-xl focus-visible:ring-blue-500 font-medium max-w-md"
                />

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Default Currency</label>
                  <p className="text-[10px] text-muted-foreground font-medium mt-1 pr-4">This currency will be used across the Accounting module.</p>
                </div>
                <Select value={settings.default_currency} onValueChange={(val) => updateSetting('default_currency', val)}>
                  <SelectTrigger className="bg-muted border-border rounded-xl focus:ring-blue-500 font-medium max-w-md">
                    <SelectValue placeholder="Select Currency" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border shadow-md font-medium">
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="AUD">AUD (A$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6 animate-in fade-in-50 duration-300">
          <Card className="border-0 shadow-sm rounded-2xl bg-card text-card-foreground overflow-hidden">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg font-medium">Interface & Notifications</CardTitle>
              <CardDescription className="font-medium">Customize how the CRM looks and communicates with you.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Palette className="w-4 h-4 text-muted-foreground" /> Color Theme
                  </h4>
                  <p className="text-xs font-medium text-muted-foreground">Select your preferred interface color mode.</p>
                </div>
                <Select value={settings.theme_preference} onValueChange={(val) => updateSetting('theme_preference', val)}>
                  <SelectTrigger className="bg-background border-border rounded-xl focus:ring-primary font-medium w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="rounded-xl border-border shadow-md font-medium">
                    <SelectItem value="light">Light Mode</SelectItem>
                    <SelectItem value="dark">Dark Mode</SelectItem>
                    <SelectItem value="system">System Default</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full h-px bg-border"></div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" /> Email Notifications
                  </h4>
                  <p className="text-xs font-medium text-muted-foreground">Receive daily summaries and critical project updates via email.</p>
                </div>
                <Switch 
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
                />
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <>
            <TabsContent value="team" className="space-y-6 animate-in fade-in-50 duration-300">
              <Card className="border-0 shadow-sm rounded-2xl bg-card text-card-foreground overflow-hidden mb-6">
                <CardHeader className="border-b border-border pb-4">
                  <CardTitle className="text-lg font-medium">Add Team Member</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                        <Input required value={newUser.full_name} onChange={(e) => setNewUser({...newUser, full_name: e.target.value})} className="h-10 bg-background border-border focus-visible:ring-primary" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Email</label>
                        <Input type="email" required value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="h-10 bg-background border-border focus-visible:ring-primary" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Temporary Password</label>
                        <Input type="password" required value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="h-10 bg-background border-border focus-visible:ring-primary" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">System Role</label>
                        <Select value={newUser.system_role} onValueChange={(val) => setNewUser({...newUser, system_role: val})}>
                          <SelectTrigger className="h-10 bg-background border-border focus:ring-primary">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-border">
                            <SelectItem value="admin">Manager (Admin)</SelectItem>
                            <SelectItem value="agent">Agent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-medium text-muted-foreground">Job Title (Optional)</label>
                        <Input placeholder="e.g. Video Editor, Accountant" value={newUser.job_title} onChange={(e) => setNewUser({...newUser, job_title: e.target.value})} className="h-10 bg-background border-border focus-visible:ring-primary" />
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button type="submit" disabled={isAddingUser} className="bg-primary hover:bg-primary/90 text-primary-foreground w-full md:w-auto h-10">
                        {isAddingUser ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Add Team Member
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm rounded-2xl bg-card text-card-foreground overflow-hidden">
                <CardHeader className="border-b border-border pb-4">
                  <CardTitle className="text-lg font-medium">Current Team</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b border-border bg-muted/50">
                        <TableHead className="font-semibold text-muted-foreground h-10 px-4 text-left align-middle text-[11px] uppercase tracking-wider">Name</TableHead>
                        <TableHead className="font-semibold text-muted-foreground h-10 px-4 text-left align-middle text-[11px] uppercase tracking-wider">Role</TableHead>
                        <TableHead className="font-semibold text-muted-foreground h-10 px-4 text-left align-middle text-[11px] uppercase tracking-wider">Job Title</TableHead>
                        <TableHead className="font-semibold text-muted-foreground h-10 px-4 text-left align-middle text-[11px] uppercase tracking-wider">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.map((member) => (
                        <TableRow key={member.id} className="border-b border-border transition-colors hover:bg-muted/50">
                          <TableCell className="px-4 py-3 align-middle text-[13px] text-foreground">
                            <div className="font-medium text-foreground">{member.full_name}</div>
                            <div className="text-muted-foreground">{member.email}</div>
                          </TableCell>
                          <TableCell className="px-4 py-3 align-middle text-[13px]">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${member.system_role === 'admin' ? 'bg-purple-500/20 text-purple-700 dark:text-purple-400' : 'bg-blue-500/20 text-blue-700 dark:text-blue-400'}`}>
                              {member.system_role === 'admin' ? 'Manager' : 'Agent'}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 align-middle text-[13px] text-muted-foreground">
                            {member.job_title || "—"}
                          </TableCell>
                          <TableCell className="px-4 py-3 align-middle text-[13px]">
                            <span className="inline-flex items-center rounded-md bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                              Active
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6 animate-in fade-in-50 duration-300">
              <Card className="border-0 shadow-sm rounded-2xl bg-card text-card-foreground overflow-hidden">
                <CardHeader className="border-b border-border pb-4">
                  <CardTitle className="text-lg font-medium">Activity Log</CardTitle>
                  <CardDescription className="font-medium">Monitor all system actions taken by your team.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b border-border bg-muted/50">
                        <TableHead className="font-semibold text-muted-foreground h-10 px-4 text-left align-middle text-[11px] uppercase tracking-wider">Timestamp</TableHead>
                        <TableHead className="font-semibold text-muted-foreground h-10 px-4 text-left align-middle text-[11px] uppercase tracking-wider">User</TableHead>
                        <TableHead className="font-semibold text-muted-foreground h-10 px-4 text-left align-middle text-[11px] uppercase tracking-wider">Action</TableHead>
                        <TableHead className="font-semibold text-muted-foreground h-10 px-4 text-left align-middle text-[11px] uppercase tracking-wider">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activityLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No activity logs found.</TableCell>
                        </TableRow>
                      ) : (
                        activityLogs.map((log) => (
                          <TableRow key={log.id} className="border-b border-border transition-colors hover:bg-muted/50">
                            <TableCell className="px-4 py-3 align-middle text-[13px] text-muted-foreground">
                              {format(new Date(log.timestamp), "MMM d, yyyy HH:mm")}
                            </TableCell>
                            <TableCell className="px-4 py-3 align-middle text-[13px] text-foreground font-medium">
                              {log.user?.full_name || "System"}
                            </TableCell>
                            <TableCell className="px-4 py-3 align-middle text-[13px] text-muted-foreground">
                              <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-[11px] font-mono text-muted-foreground">
                                {log.action}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 align-middle text-[13px] text-muted-foreground">
                              {log.entity_type && <span className="font-medium mr-1">{log.entity_type}:</span>}
                              {log.details ? JSON.stringify(log.details) : log.entity_id}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}

      </Tabs>
    </div>
  );
}
