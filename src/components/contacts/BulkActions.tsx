import { ContactStatus } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Trash2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface BulkActionsProps {
  selectedCount: number;
  onExport: () => void;
  onBulkDelete: () => void;
  onBulkStatusChange: (status: ContactStatus) => void;
}

export function BulkActions({
  selectedCount,
  onExport,
  onBulkDelete,
  onBulkStatusChange,
}: BulkActionsProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
      <span className="text-sm font-medium text-blue-900">
        {selectedCount} {selectedCount === 1 ? "contact" : "contacts"} selected
      </span>

      <div className="flex-1" />

      <Button size="sm" variant="outline" onClick={onExport} className="cursor-pointer">
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="cursor-pointer bg-card border-border">
            Change Status
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-card border-border shadow-md">
          <DropdownMenuItem onClick={() => onBulkStatusChange("Active")} className="cursor-pointer">
            <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
            Set as Active
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onBulkStatusChange("Inactive")} className="cursor-pointer">
            <XCircle className="w-4 h-4 mr-2 text-muted-foreground" />
            Set as Inactive
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onBulkStatusChange("Prospect")} className="cursor-pointer">
            <AlertCircle className="w-4 h-4 mr-2 text-amber-600" />
            Set as Prospect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        size="sm"
        variant="outline"
        onClick={onBulkDelete}
        className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </Button>
    </div>
  );
}
