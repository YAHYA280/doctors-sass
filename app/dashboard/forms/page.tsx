"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Check,
  MoreHorizontal,
  Lock,
  Sparkles,
  ArrowLeft,
  GripVertical,
  Layers,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { DashboardHeader } from "@/components/layouts/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormBuilder, type FormField } from "@/components/forms/form-builder";
import { canUseCustomForms } from "@/constants/plans";

interface FormTemplate {
  id: string;
  formName: string;
  description?: string;
  fields: FormField[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
}

export default function FormsPage() {
  const { session } = useAuth();
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showNewFormDialog, setShowNewFormDialog] = useState(false);
  const [newFormName, setNewFormName] = useState("");
  const [newFormDescription, setNewFormDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const isPremium = session?.user?.subscriptionPlan !== "free_trial";

  const fetchForms = async () => {
    try {
      const response = await fetch("/api/doctors/forms");
      const data = await response.json();

      if (data.success) {
        setForms(data.data);
      }
    } catch (error) {
      console.error("Error fetching forms:", error);
      toast.error("Failed to fetch forms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleCreateForm = async () => {
    if (!newFormName.trim()) {
      toast.error("Form name is required");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/doctors/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formName: newFormName,
          description: newFormDescription,
          fields: [
            {
              id: "name",
              type: "text",
              label: "Full Name",
              required: true,
              order: 0,
            },
          ],
          isActive: true,
          isDefault: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Form created successfully");
        setShowNewFormDialog(false);
        setNewFormName("");
        setNewFormDescription("");
        fetchForms();
        setSelectedForm(data.data);
        setShowBuilder(true);
      } else {
        toast.error(data.error || "Failed to create form");
      }
    } catch (error) {
      toast.error("Failed to create form");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveForm = async (fields: FormField[]) => {
    if (!selectedForm) return;

    try {
      const response = await fetch("/api/doctors/forms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: selectedForm.id,
          fields,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Form saved successfully");
        fetchForms();
      } else {
        toast.error(data.error || "Failed to save form");
      }
    } catch (error) {
      toast.error("Failed to save form");
    }
  };

  const handleSetDefault = async (formId: string) => {
    try {
      const response = await fetch("/api/doctors/forms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId,
          isDefault: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Default form updated");
        fetchForms();
      }
    } catch (error) {
      toast.error("Failed to update default form");
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!confirm("Are you sure you want to delete this form?")) return;

    try {
      const response = await fetch(`/api/doctors/forms?formId=${formId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Form deleted");
        fetchForms();
      } else {
        toast.error(data.error || "Failed to delete form");
      }
    } catch (error) {
      toast.error("Failed to delete form");
    }
  };

  if (showBuilder && selectedForm) {
    return (
      <div className="animate-fade-in">
        <DashboardHeader
          title={`Edit: ${selectedForm.formName}`}
          description="Drag and drop to reorder fields"
        />
        <div className="p-4 lg:p-8">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setShowBuilder(false)}
              className="gap-2 hover:bg-muted/50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Forms
            </Button>
          </div>
          <FormBuilder
            initialFields={selectedForm.fields}
            onSave={handleSaveForm}
            isPremium={isPremium}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Intake Forms"
        description="Create and manage patient intake forms"
      />

      <div className="p-4 lg:p-8 space-y-6">
        {/* Premium Notice */}
        {!isPremium && (
          <div className="relative overflow-hidden rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50 to-orange-50/50 p-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-200/20 to-transparent rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="relative flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-lg text-amber-900">
                  Upgrade to Create Custom Forms
                </h3>
                <p className="text-sm text-amber-700/80 mt-1 leading-relaxed">
                  Custom form builder is available on Premium and Advanced plans.
                  Upgrade to create unlimited custom intake forms with drag-and-drop
                  functionality.
                </p>
                <Button className="mt-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25" size="sm">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Upgrade Now
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card-premium p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold">{forms.length}</p>
                <p className="text-sm text-muted-foreground">Total Forms</p>
              </div>
            </div>
          </div>
          <div className="card-premium p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold">
                  {forms.filter(f => f.isActive).length}
                </p>
                <p className="text-sm text-muted-foreground">Active Forms</p>
              </div>
            </div>
          </div>
          <div className="card-premium p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center">
                <GripVertical className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold">
                  {forms.reduce((acc, f) => acc + f.fields.length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Fields</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-display font-semibold text-lg">Your Forms</h3>
            <p className="text-sm text-muted-foreground">Manage your patient intake forms</p>
          </div>
          <Button
            onClick={() => setShowNewFormDialog(true)}
            disabled={!isPremium}
            className="btn-premium bg-primary text-primary-foreground gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Form
          </Button>
        </div>

        {/* Forms List */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i} className="card-premium">
                <CardContent className="pt-6">
                  <Skeleton className="h-6 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : forms.length === 0 ? (
          <div className="card-premium p-12 text-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">No forms yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {isPremium
                ? "Create your first custom intake form to collect patient information before appointments"
                : "Upgrade your plan to create custom intake forms"}
            </p>
            {isPremium && (
              <Button
                onClick={() => setShowNewFormDialog(true)}
                className="mt-6 btn-premium bg-primary text-primary-foreground gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Your First Form
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {forms.map((form, index) => (
              <div
                key={form.id}
                className="card-premium group hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div className="flex items-start gap-4">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                      form.isDefault
                        ? 'bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25'
                        : 'bg-gradient-to-br from-muted to-muted/50'
                    }`}>
                      <FileText className={`h-5 w-5 ${form.isDefault ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        {form.formName}
                        {form.isDefault && (
                          <Badge className="bg-primary/10 text-primary border-0 text-xs font-medium">
                            Default
                          </Badge>
                        )}
                      </CardTitle>
                      {form.description && (
                        <CardDescription className="mt-1">{form.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedForm(form);
                          setShowBuilder(true);
                        }}
                        disabled={!isPremium && !form.isDefault}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Form
                      </DropdownMenuItem>
                      {!form.isDefault && (
                        <DropdownMenuItem onClick={() => handleSetDefault(form.id)} className="gap-2">
                          <Check className="h-4 w-4" />
                          Set as Default
                        </DropdownMenuItem>
                      )}
                      {!form.isDefault && (
                        <DropdownMenuItem
                          onClick={() => handleDeleteForm(form.id)}
                          className="text-destructive focus:text-destructive gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Layers className="h-4 w-4" />
                      <span>{form.fields.length} fields</span>
                    </div>
                    <div className="h-1 w-1 rounded-full bg-border" />
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${form.isActive ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                      <span className="text-sm text-muted-foreground">
                        {form.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Form Dialog */}
      <Dialog open={showNewFormDialog} onOpenChange={setShowNewFormDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Create New Form</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Form Name</Label>
              <Input
                placeholder="e.g., New Patient Intake"
                value={newFormName}
                onChange={(e) => setNewFormName(e.target.value)}
                className="input-premium"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Description <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Textarea
                placeholder="Describe the purpose of this form..."
                value={newFormDescription}
                onChange={(e) => setNewFormDescription(e.target.value)}
                className="input-premium min-h-[100px] resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowNewFormDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateForm} disabled={creating} className="btn-premium bg-primary text-primary-foreground">
              {creating ? "Creating..." : "Create Form"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
