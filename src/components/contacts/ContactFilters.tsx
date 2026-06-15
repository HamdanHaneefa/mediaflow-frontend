import { ContactRole, ContactStatus } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

export interface ContactFiltersState {
  search: string;
  role: ContactRole | "all";
  status: ContactStatus | "all";
}

interface ContactFiltersProps {
  filters: ContactFiltersState;
  onFiltersChange: (filters: ContactFiltersState) => void;
  totalContacts: number;
  filteredCount: number;
}

export function ContactFilters({
  filters,
  onFiltersChange,
  totalContacts,
  filteredCount,
}: ContactFiltersProps) {
  const hasActiveFilters =
    filters.search !== "" || filters.role !== "all" || filters.status !== "all";

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      role: "all",
      status: "all",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, company, or email..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>

        <Select
          value={filters.role}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, role: value as ContactRole | "all" })
          }
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-card border-border">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border shadow-md">
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="Client">Client</SelectItem>
            <SelectItem value="Agency">Agency</SelectItem>
            <SelectItem value="Crew">Crew / Freelancer</SelectItem>
            <SelectItem value="Talent">Talent</SelectItem>
            <SelectItem value="Vendor">Vendor</SelectItem>
            <SelectItem value="Partner">Partner</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, status: value as ContactStatus | "all" })
          }
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-card border-border">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border shadow-md">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="Prospect">Prospect</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} className="gap-2 cursor-pointer">
            <X className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
          Showing {filteredCount} of {totalContacts} contacts
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2 bg-muted border border-border">
              Filtered
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
