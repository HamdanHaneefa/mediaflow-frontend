"use client";
import { fetchWithAuth } from "@/lib/apiFetch";

import { useState, useEffect } from "react";
import { Project, Task, Contact, Location, Booking } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  CheckSquare,
  FolderKanban,
  LayoutList,
  Calendar
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, addDays, subDays, startOfDay, addHours } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookingDialog } from "@/components/calendar/BookingDialog";
import { LocationDialog } from "@/components/locations/LocationDialog";

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<"month" | "timeline">("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal inspection states
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  
  // Booking Dialog states
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [initialStart, setInitialStart] = useState<Date | undefined>();
  const [initialEnd, setInitialEnd] = useState<Date | undefined>();
  const [initialLoc, setInitialLoc] = useState<string | undefined>();

  const fetchData = async () => {
    try {
      const [resProj, resTasks, resCont, resLoc, resBook] = await Promise.all([
        fetchWithAuth("http://localhost:8000/api/v1/projects/"),
        fetchWithAuth("http://localhost:8000/api/v1/tasks/"),
        fetchWithAuth("http://localhost:8000/api/v1/contacts/"),
        fetchWithAuth("http://localhost:8000/api/v1/locations/"),
        fetchWithAuth("http://localhost:8000/api/v1/bookings/"),
      ]);

      if (resProj.ok) setProjects(await resProj.json());
      if (resTasks.ok) setTasks(await resTasks.json());
      if (resCont.ok) setContacts(await resCont.json());
      if (resLoc.ok) setLocations(await resLoc.json());
      if (resBook.ok) setBookings(await resBook.json());
    } catch (error) {
      console.error("Error loading calendar datasets:", error);
      toast.error("Failed to sync backend metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData().then(() => {
      if (typeof window !== "undefined" && window.location.search.includes("add_booking=true")) {
        setViewMode("timeline");
        setBookingDialogOpen(true);
        // clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    });
  }, []);

  const nextPeriod = () => setCurrentDate((prev) => viewMode === "month" ? addMonths(prev, 1) : addDays(prev, 1));
  const prevPeriod = () => setCurrentDate((prev) => viewMode === "month" ? subMonths(prev, 1) : subDays(prev, 1));
  const goToToday = () => setCurrentDate(new Date());

  // --- MONTH VIEW LOGIC ---
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - monthStart.getDay());
  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(calendarEnd.getDate() + (6 - monthEnd.getDay()));
  const daysGrid = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // --- TIMELINE VIEW LOGIC ---
  // Show 12 hours from 8 AM to 8 PM
  const timelineDay = startOfDay(currentDate);
  const hours = Array.from({ length: 13 }, (_, i) => addHours(timelineDay, i + 8));

  const handleEmptySlotClick = (locId: string, time: Date) => {
    setInitialLoc(locId);
    setInitialStart(time);
    setInitialEnd(addHours(time, 1));
    setSelectedBooking(null);
    setBookingDialogOpen(true);
  };

  const handleBookingClick = (booking: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBooking(booking);
    setBookingDialogOpen(true);
  };

  const deleteBooking = async (id: string) => {
    try {
      await fetchWithAuth(`http://localhost:8000/api/v1/bookings/${id}`, { method: "DELETE" });
      fetchData();
    } catch (e) {}
  };

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <CalendarDays className="w-8 h-8 text-blue-600" />
            {viewMode === "month" ? "Task Calendar" : "Studio Schedule"}
          </h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">
            {viewMode === "month" ? "Manage project tasks and deadlines." : "Manage studio bookings and availability."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {viewMode === "timeline" && (
            <Button 
              onClick={() => { setSelectedBooking(null); setInitialStart(undefined); setInitialEnd(undefined); setInitialLoc(undefined); setBookingDialogOpen(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold"
            >
              + Add Booking
            </Button>
          )}

          <div className="flex bg-muted p-1 rounded-lg">
            <button
              onClick={() => setViewMode("timeline")}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === "timeline" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-muted-foreground"}`}
            >
              <LayoutList className="w-4 h-4" /> Timeline
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === "month" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-muted-foreground"}`}
            >
              <Calendar className="w-4 h-4" /> Month
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={prevPeriod} className="h-9 w-9 p-0">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} className="h-9 px-4 font-medium">
              Today
            </Button>
            <span className="text-base font-semibold text-foreground min-w-[140px] text-center">
              {viewMode === "month" ? format(currentDate, "MMMM yyyy") : format(currentDate, "EEE, MMM d, yyyy")}
            </span>
            <Button variant="outline" size="sm" onClick={nextPeriod} className="h-9 w-9 p-0">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {viewMode === "month" ? (
        <Card className="border-border shadow-sm bg-card overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b border-border bg-muted/70 text-center font-medium text-xs text-muted-foreground py-3">
              <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
            </div>
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[600px]">
              {daysGrid.map((day, idx) => {
                const dayTasks = tasks.filter((t) => t.due_date && isSameDay(new Date(t.due_date), day));
                const dayBookings = bookings.filter((b) => isSameDay(new Date(b.start_time.endsWith("Z") ? b.start_time : b.start_time + "Z"), day));
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                return (
                  <div key={idx} className={`min-h-[100px] p-2 flex flex-col justify-between relative ${isCurrentMonth ? "bg-card text-foreground" : "bg-muted/30 text-muted-foreground"}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isSameDay(day, new Date()) ? "bg-blue-600 text-white" : "text-muted-foreground"}`}>
                        {format(day, "d")}
                      </span>
                    </div>
                    <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px] scrollbar-thin">
                      {dayTasks.map((tsk) => (
                        <div 
                          key={tsk.id} 
                          onClick={() => setSelectedTask(tsk)} 
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded cursor-pointer truncate flex items-center gap-1 transition-colors ${
                            tsk.status === "Completed"
                              ? "bg-emerald-50 border-l-2 border-emerald-500 text-emerald-700 hover:bg-emerald-100"
                              : tsk.priority === "High"
                              ? "bg-rose-50 border-l-2 border-rose-500 text-rose-700 hover:bg-rose-100"
                              : "bg-blue-50 border-l-2 border-blue-500 text-blue-700 hover:bg-blue-100"
                          }`}
                        >
                          {tsk.status === "Completed" ? (
                            <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                          ) : (
                            <Clock className="w-3 h-3 flex-shrink-0" />
                          )}
                          <span>{tsk.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border shadow-sm bg-card overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Timeline Header */}
              <div className="flex border-b border-border bg-muted/70">
                <div className="w-48 shrink-0 p-3 border-r border-border font-semibold text-xs text-muted-foreground flex items-center justify-center">
                  STUDIO / LOCATION
                </div>
                <div className="flex-1 grid grid-cols-13 divide-x divide-slate-100">
                  {hours.map(h => (
                    <div key={h.toISOString()} className="p-2 text-center text-xs font-medium text-muted-foreground">
                      {format(h, "ha")}
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline Rows */}
              <div className="divide-y divide-slate-100">
                {locations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">No studios found. Click anywhere or the + button to add one.</div>
                ) : locations.map((loc) => (
                  <div key={loc.id} className="flex">
                    <div 
                      onClick={() => { setSelectedLocation(loc); setLocationDialogOpen(true); }}
                      className="w-48 shrink-0 p-3 border-r border-border font-medium text-sm text-foreground flex items-center bg-muted/30 cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      {loc.name}
                    </div>
                    <div className="flex-1 grid grid-cols-13 divide-x divide-slate-100 relative">
                      {hours.map(h => {
                        const hEnd = new Date(h.getTime() + 60 * 60 * 1000);
                        const cellBookings = bookings.filter(b => {
                          if (b.location_id !== loc.id) return false;
                          const bStart = new Date(b.start_time.endsWith("Z") ? b.start_time : b.start_time + "Z");
                          const bEnd = new Date(b.end_time.endsWith("Z") ? b.end_time : b.end_time + "Z");
                          // True if booking intersects this 1-hour slot
                          return bStart < hEnd && bEnd > h;
                        });
                        
                        return (
                          <div 
                            key={h.toISOString()} 
                            onClick={() => handleEmptySlotClick(loc.id, h)}
                            className="min-h-[60px] relative hover:bg-blue-50/50 cursor-pointer transition-colors p-1"
                          >
                            {cellBookings.map(b => (
                              <div 
                                key={b.id} 
                                onClick={(e) => handleBookingClick(b, e)}
                                className="absolute top-1 left-1 right-1 bottom-1 bg-blue-600 rounded-md text-white p-1.5 overflow-hidden shadow-sm z-10"
                              >
                                <div className="text-xs font-bold truncate">{b.title}</div>
                                <div className="text-[10px] text-blue-100 truncate">{format(new Date(b.start_time.endsWith("Z") ? b.start_time : b.start_time + "Z"), "h:mm a")} - {format(new Date(b.end_time.endsWith("Z") ? b.end_time : b.end_time + "Z"), "h:mm a")}</div>
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Inspection Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <CheckSquare className="w-5 h-5" />
              <span className="text-xs font-medium uppercase tracking-wider">Task Inspection</span>
            </div>
            <DialogTitle className="text-xl font-medium text-foreground">
              {selectedTask?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Due Date: {selectedTask?.due_date ? format(new Date(selectedTask.due_date), "PP") : "N/A"}
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted p-2.5 rounded-lg border border-border">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase">Priority</div>
                  <div className="text-sm font-medium text-foreground mt-0.5">
                    {selectedTask.priority}
                  </div>
                </div>
                <div className="bg-muted p-2.5 rounded-lg border border-border">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase">Status</div>
                  <div className="text-sm font-medium text-foreground mt-0.5">
                    {selectedTask.status}
                  </div>
                </div>
                <div className="bg-muted p-2.5 rounded-lg border border-border">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase">Task Type</div>
                  <div className="text-sm font-medium text-foreground mt-0.5">
                    {selectedTask.type || "N/A"}
                  </div>
                </div>
                <div className="bg-muted p-2.5 rounded-lg border border-border">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase">Assignee</div>
                  <div className="text-sm font-medium text-foreground mt-0.5 truncate">
                    {selectedTask.assigned_to 
                      ? contacts.find(c => c.id === selectedTask.assigned_to)?.name || "Unknown" 
                      : "Unassigned"}
                  </div>
                </div>
                <div className="col-span-2 bg-muted p-2.5 rounded-lg border border-border">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase">Associated Project</div>
                  <div className="text-sm font-medium text-foreground mt-0.5 truncate cursor-pointer hover:text-blue-600" onClick={() => {
                    const proj = projects.find(p => p.id === selectedTask.project_id);
                    if (proj) {
                      setSelectedTask(null);
                      setSelectedProject(proj);
                    }
                  }}>
                    {projects.find(p => p.id === selectedTask.project_id)?.title || "N/A"}
                  </div>
                </div>
              </div>

              {selectedTask.description && (
                <div className="bg-muted p-3 rounded-lg border border-border">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Description</div>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    {selectedTask.description}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-4 flex gap-2 justify-end pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setSelectedTask(null)}>
              Close
            </Button>
            {selectedTask && selectedTask.status !== "Completed" && (
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={async () => {
                  try {
                    const res = await fetchWithAuth(`http://localhost:8000/api/v1/tasks/${selectedTask.id}`, {
                      method: "PUT",
                      body: JSON.stringify({ status: "Completed" })
                    });
                    if (res.ok) {
                      toast.success("Task marked as completed!");
                      setSelectedTask(null);
                      // re-fetch calendar data
                      fetchData();
                    } else {
                      toast.error("Failed to update task");
                    }
                  } catch (e) {
                    toast.error("Server error");
                  }
                }}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Complete
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Inspection Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <FolderKanban className="w-5 h-5" />
              <span className="text-xs font-medium uppercase tracking-wider">Project Timeline</span>
            </div>
            <DialogTitle className="text-xl font-medium text-foreground">
              {selectedProject?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Pipeline Stage: {selectedProject?.phase}
            </DialogDescription>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-2.5 rounded-lg border border-border">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase">Start Date</div>
                  <div className="text-sm font-medium text-foreground mt-0.5">
                    {selectedProject.start_date ? format(new Date(selectedProject.start_date), "PP") : "N/A"}
                  </div>
                </div>
                <div className="bg-muted p-2.5 rounded-lg border border-border">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase">End Date</div>
                  <div className="text-sm font-medium text-foreground mt-0.5">
                    {selectedProject.end_date ? format(new Date(selectedProject.end_date), "PP") : "N/A"}
                  </div>
                </div>
              </div>

              {selectedProject.description && (
                <div className="bg-muted p-3 rounded-lg border border-border">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Project Details</div>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    {selectedProject.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reusable Booking Dialog */}
      <BookingDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        booking={selectedBooking}
        locations={locations}
        clients={contacts}
        projects={projects}
        onSave={fetchData}
        onDelete={deleteBooking}
        initialStartTime={initialStart}
        initialEndTime={initialEnd}
        initialLocationId={initialLoc}
      />

      {/* Location / Studio Edit Dialog */}
      <LocationDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        location={selectedLocation}
        onSaveSuccess={fetchData}
      />
    </div>
  );
}
