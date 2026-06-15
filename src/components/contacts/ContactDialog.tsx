"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Contact, ContactRole, ContactStatus } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  role: ContactRole;
  status: ContactStatus;
  notes: string;
  tags: string[];
}

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact;
  onSave: (data: Omit<Contact, "id" | "created_at" | "updated_at">) => Promise<void>;
  loading?: boolean;
}

export function ContactDialog({
  open,
  onOpenChange,
  contact,
  onSave,
  loading,
}: ContactDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ContactFormData>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      role: "Client",
      status: "Active",
      notes: "",
      tags: [],
    },
  });

  const tags = watch("tags") || [];
  const role = watch("role");
  const status = watch("status");

  useEffect(() => {
    if (contact) {
      reset({
        name: contact.name,
        email: contact.email,
        phone: contact.phone || "",
        company: contact.company || "",
        role: contact.role,
        status: contact.status,
        notes: contact.notes || "",
        tags: contact.tags || [],
      });
    } else {
      reset({
        name: "",
        email: "",
        phone: "",
        company: "",
        role: "Client",
        status: "Active",
        notes: "",
        tags: [],
      });
    }
  }, [contact, reset, open]);

  const onSubmit = async (data: ContactFormData) => {
    await onSave(data);
    onOpenChange(false);
  };

  const addTag = (tagInput: HTMLInputElement) => {
    const value = tagInput.value.trim();
    if (value && !tags.includes(value)) {
      setValue("tags", [...tags, value]);
      tagInput.value = "";
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue(
      "tags",
      tags.filter((tag) => tag !== tagToRemove)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-foreground">
            {contact ? "Edit Contact" : "Add New Contact"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {contact
              ? "Update the contact information below."
              : "Fill in the details to create a new contact."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name" className="text-sm font-medium text-muted-foreground">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register("name", { required: "Name is required" })}
                placeholder="John Doe"
                className="mt-1.5 bg-muted border-border"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1 font-medium">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                placeholder="john@example.com"
                className="mt-1.5 bg-muted border-border"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-muted-foreground">Phone</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="+1 (555) 000-0000"
                className="mt-1.5 bg-muted border-border"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="company" className="text-sm font-medium text-muted-foreground">Company</Label>
              <Input
                id="company"
                {...register("company")}
                placeholder="Acme Inc."
                className="mt-1.5 bg-muted border-border"
              />
            </div>

            <div>
              <Label htmlFor="role" className="text-sm font-medium text-muted-foreground">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select value={role} onValueChange={(value) => setValue("role", value as ContactRole)}>
                <SelectTrigger className="mt-1.5 bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="Client">Client</SelectItem>
                  <SelectItem value="Agency">Agency</SelectItem>
                  <SelectItem value="Crew">Crew / Freelancer</SelectItem>
                  <SelectItem value="Talent">Talent</SelectItem>
                  <SelectItem value="Vendor">Vendor</SelectItem>
                  <SelectItem value="Partner">Partner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status" className="text-sm font-medium text-muted-foreground">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={status}
                onValueChange={(value) => setValue("status", value as ContactStatus)}
              >
                <SelectTrigger className="mt-1.5 bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Prospect">Prospect</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="tags" className="text-sm font-medium text-muted-foreground">Tags</Label>
              <Input
                id="tags"
                placeholder="Press Enter to add a tag"
                className="mt-1.5 bg-muted border-border"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(e.currentTarget);
                  }
                }}
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 border border-border">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-600 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes" className="text-sm font-medium text-muted-foreground">Notes</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Additional notes about this contact..."
                rows={4}
                className="mt-1.5 bg-muted border-border"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="cursor-pointer text-white">
              {loading ? "Saving..." : contact ? "Update Contact" : "Add Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
