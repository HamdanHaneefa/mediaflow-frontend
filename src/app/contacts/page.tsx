"use client";
import { fetchWithAuth } from "@/lib/apiFetch";

import { useState, useEffect, useMemo } from "react";
import { Contact, ContactStatus, Project, Task } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Download } from "lucide-react";
import { ContactsTable } from "@/components/contacts/ContactsTable";
import { ContactDialog } from "@/components/contacts/ContactDialog";
import { ContactDetailView } from "@/components/contacts/ContactDetailView";
import { ContactFilters, ContactFiltersState } from "@/components/contacts/ContactFilters";
import { BulkActions } from "@/components/contacts/BulkActions";
import { toast } from "sonner";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | undefined>();
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [filters, setFilters] = useState<ContactFiltersState>({
    search: "",
    role: "all",
    status: "all",
  });

  // Fetch all data from FastAPI
  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch Contacts
      const resContacts = await fetchWithAuth("http://localhost:8000/api/v1/contacts/");
      if (resContacts.ok) {
        const dataContacts = await resContacts.json();
        setContacts(dataContacts);
      }

      // Fetch Projects
      const resProjects = await fetchWithAuth("http://localhost:8000/api/v1/projects/");
      if (resProjects.ok) {
        const dataProjects = await resProjects.json();
        setProjects(dataProjects);
      }

      // Fetch Tasks
      const resTasks = await fetchWithAuth("http://localhost:8000/api/v1/tasks/");
      if (resTasks.ok) {
        const dataTasks = await resTasks.json();
        setTasks(dataTasks);
      }
    } catch (error) {
      console.error("Error fetching CRM data:", error);
      toast.error("Error connecting to FastAPI backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        filters.search === "" ||
        contact.name.toLowerCase().includes(searchLower) ||
        contact.email.toLowerCase().includes(searchLower) ||
        (contact.company && contact.company.toLowerCase().includes(searchLower));

      const matchesRole = filters.role === "all" || contact.role === filters.role;
      const matchesStatus = filters.status === "all" || contact.status === filters.status;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [contacts, filters]);

  const handleAddContact = () => {
    setSelectedContact(undefined);
    setDialogOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setDialogOpen(true);
  };

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact);
    setDetailViewOpen(true);
  };

  const handleSaveContact = async (data: Omit<Contact, "id" | "created_at" | "updated_at">) => {
    setSaving(true);
    try {
      if (selectedContact) {
        // PUT request to FastAPI
        const res = await fetchWithAuth(`http://localhost:8000/api/v1/contacts/${selectedContact.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Update failed");
        toast.success("Contact updated successfully");
      } else {
        // POST request to FastAPI
        const res = await fetchWithAuth("http://localhost:8000/api/v1/contacts/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Creation failed");
        toast.success("Contact added successfully");
      }
      await fetchAllData();
    } catch (error) {
      toast.error("Failed to save contact");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      const res = await fetchWithAuth(`http://localhost:8000/api/v1/contacts/${contactId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Contact deleted successfully");
      setSelectedContactIds(selectedContactIds.filter((id) => id !== contactId));
      await fetchAllData();
    } catch (error) {
      toast.error("Failed to delete contact");
    }
  };

  const handleSelectContact = (contactId: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedContactIds(selected ? filteredContacts.map((c) => c.id) : []);
  };

  const handleExport = () => {
    const contactsToExport =
      selectedContactIds.length > 0
        ? contacts.filter((c) => selectedContactIds.includes(c.id))
        : contacts;

    const csv = [
      ["Name", "Email", "Phone", "Company", "Role", "Status", "Tags", "Notes"].join(","),
      ...contactsToExport.map((c) =>
        [
          c.name,
          c.email,
          c.phone || "",
          c.company || "",
          c.role,
          c.status,
          (c.tags || []).join(";"),
          (c.notes || "").replace(/,/g, ";"),
        ]
          .map((field) => `"${field}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${contactsToExport.length} contacts`);
    setSelectedContactIds([]);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedContactIds.length} contacts?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedContactIds.map((id) =>
          fetchWithAuth(`http://localhost:8000/api/v1/contacts/${id}`, {
            method: "DELETE",
          })
        )
      );
      toast.success(`Deleted ${selectedContactIds.length} contacts`);
      setSelectedContactIds([]);
      await fetchAllData();
    } catch (error) {
      toast.error("Failed to delete contacts");
    }
  };

  const handleBulkStatusChange = async (status: ContactStatus) => {
    try {
      await Promise.all(
        selectedContactIds.map((id) =>
          fetchWithAuth(`http://localhost:8000/api/v1/contacts/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status }),
          })
        )
      );
      toast.success(`Updated ${selectedContactIds.length} contacts`);
      setSelectedContactIds([]);
      await fetchAllData();
    } catch (error) {
      toast.error("Failed to update contacts");
    }
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-medium tracking-tight text-foreground">Contacts</h2>
          <p className="text-muted-foreground mt-1">Manage your client relationships</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="cursor-pointer">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleAddContact} className="bg-blue-600 hover:bg-blue-700 cursor-pointer text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      <ContactFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalContacts={contacts.length}
        filteredCount={filteredContacts.length}
      />

      <BulkActions
        selectedCount={selectedContactIds.length}
        onExport={handleExport}
        onBulkDelete={handleBulkDelete}
        onBulkStatusChange={handleBulkStatusChange}
      />

      <ContactsTable
        contacts={filteredContacts}
        onEdit={handleEditContact}
        onDelete={handleDeleteContact}
        onView={handleViewContact}
        selectedContacts={selectedContactIds}
        onSelectContact={handleSelectContact}
        onSelectAll={handleSelectAll}
      />

      <ContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contact={selectedContact}
        onSave={handleSaveContact}
        loading={saving}
      />

      {selectedContact && (
        <ContactDetailView
          contact={selectedContact}
          projects={projects}
          tasks={tasks}
          open={detailViewOpen}
          onOpenChange={setDetailViewOpen}
          onEdit={handleEditContact}
          onDelete={handleDeleteContact}
        />
      )}
    </div>
  );
}
