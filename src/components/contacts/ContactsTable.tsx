"use client";

import { useState } from "react";
import { Contact, ContactRole, ContactStatus } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowUpDown, MoreHorizontal, Mail, Phone, Trash2, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface ContactsTableProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
  onView: (contact: Contact) => void;
  selectedContacts: string[];
  onSelectContact: (contactId: string) => void;
  onSelectAll: (selected: boolean) => void;
}

type SortField = "name" | "company" | "role" | "status" | "created_at";
type SortDirection = "asc" | "desc";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getRoleBadgeColor(role: ContactRole) {
  switch (role) {
    case "Client":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Agency":
      return "bg-indigo-100 text-indigo-700 border-indigo-200";
    case "Crew":
      return "bg-green-100 text-green-700 border-green-200";
    case "Talent":
      return "bg-pink-100 text-pink-700 border-pink-200";
    case "Vendor":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "Partner":
      return "bg-orange-100 text-orange-700 border-orange-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function getStatusBadgeColor(status: ContactStatus) {
  switch (status) {
    case "Active":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Inactive":
      return "bg-muted text-muted-foreground border-border";
    case "Prospect":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function ContactsTable({
  contacts,
  onEdit,
  onDelete,
  onView,
  selectedContacts,
  onSelectContact,
  onSelectAll,
}: ContactsTableProps) {
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedContacts = [...contacts].sort((a, b) => {
    let aValue: string | number = "";
    let bValue: string | number = "";

    switch (sortField) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "company":
        aValue = (a.company || "").toLowerCase();
        bValue = (b.company || "").toLowerCase();
        break;
      case "role":
        aValue = a.role;
        bValue = b.role;
        break;
      case "status":
        aValue = a.status;
        bValue = b.status;
        break;
      case "created_at":
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const allSelected = contacts.length > 0 && selectedContacts.length === contacts.length;
  const someSelected = selectedContacts.length > 0 && selectedContacts.length < contacts.length;

  if (contacts.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-12 text-center shadow-xs">
        <p className="text-muted-foreground">No contacts found</p>
        <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or add a new contact</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border shadow-xs overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => onSelectAll(checked === true)}
                aria-label="Select all"
                className={cn(someSelected && "data-[state=checked]:bg-blue-600")}
              />
            </TableHead>
            <TableHead className="w-12"></TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 text-muted-foreground"
                onClick={() => handleSort("name")}
              >
                Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 text-muted-foreground"
                onClick={() => handleSort("company")}
              >
                Company
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 text-muted-foreground"
                onClick={() => handleSort("role")}
              >
                Role
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 text-muted-foreground"
                onClick={() => handleSort("status")}
              >
                Status
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 text-muted-foreground"
                onClick={() => handleSort("created_at")}
              >
                Added
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedContacts.map((contact) => (
            <TableRow
              key={contact.id}
              className="cursor-pointer hover:bg-muted"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("button, input, [role=checkbox]")) return;
                onView(contact);
              }}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedContacts.includes(contact.id)}
                  onCheckedChange={() => onSelectContact(contact.id)}
                  aria-label={`Select ${contact.name}`}
                />
              </TableCell>
              <TableCell>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                    {getInitials(contact.name)}
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="font-medium text-foreground">{contact.name}</TableCell>
              <TableCell className="text-muted-foreground font-medium">{contact.company || "-"}</TableCell>
              <TableCell>
                <Badge variant="outline" className={getRoleBadgeColor(contact.role)}>
                  {contact.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusBadgeColor(contact.status)}>
                  {contact.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm font-medium">
                {formatDistanceToNow(parseISO(contact.created_at), { addSuffix: true })}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border shadow-md">
                    <DropdownMenuItem onClick={() => onView(contact)} className="cursor-pointer">
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(contact)} className="cursor-pointer">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Mail className="mr-2 h-4 w-4" />
                      Send Email
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Phone className="mr-2 h-4 w-4" />
                      Call
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(contact.id)}
                      className="text-red-600 cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
