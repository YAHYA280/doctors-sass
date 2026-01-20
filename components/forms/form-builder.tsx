"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { v4 as uuidv4 } from "uuid";
import {
  GripVertical,
  Trash2,
  Plus,
  Settings,
  Eye,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FORM_FIELD_TYPES, type FieldType, type FieldTypeConfig } from "@/constants/form-fields";
import { cn } from "@/lib/utils";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  conditionalLogic?: {
    showIf: {
      fieldId: string;
      operator: "equals" | "notEquals" | "contains";
      value: string;
    };
  };
  order: number;
}

interface FormBuilderProps {
  initialFields?: FormField[];
  onSave: (fields: FormField[]) => void;
  isPremium?: boolean;
}

export function FormBuilder({
  initialFields = [],
  onSave,
  isPremium = false,
}: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showFieldSelector, setShowFieldSelector] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({ ...item, order: index }));
      });
    }
  };

  const addField = (type: FieldType) => {
    const fieldConfig = FORM_FIELD_TYPES.find((f) => f.type === type);
    if (!fieldConfig) return;

    if (fieldConfig.premium && !isPremium) {
      toast.error("This field type is only available on Premium and Advanced plans");
      return;
    }

    const newField: FormField = {
      id: uuidv4(),
      type,
      label: `New ${fieldConfig.label}`,
      placeholder: "",
      required: false,
      options: fieldConfig.hasOptions ? ["Option 1", "Option 2"] : undefined,
      order: fields.length,
    };

    setFields([...fields, newField]);
    setSelectedField(newField);
    setShowFieldSelector(false);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
    if (selectedField?.id === id) {
      setSelectedField({ ...selectedField, ...updates });
    }
  };

  const deleteField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id));
    if (selectedField?.id === id) {
      setSelectedField(null);
    }
  };

  const handleSave = () => {
    if (fields.length === 0) {
      toast.error("Please add at least one field");
      return;
    }
    onSave(fields);
    toast.success("Form saved successfully");
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Field List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Form Fields</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Form
            </Button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {fields.map((field) => (
                <SortableFieldItem
                  key={field.id}
                  field={field}
                  isSelected={selectedField?.id === field.id}
                  onClick={() => setSelectedField(field)}
                  onDelete={() => deleteField(field.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {fields.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <p className="text-gray-500 mb-4">
                No fields yet. Add your first field to get started.
              </p>
            </CardContent>
          </Card>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowFieldSelector(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </div>

      {/* Field Properties */}
      <div>
        <Card>
          <CardContent className="pt-6">
            {selectedField ? (
              <FieldProperties
                field={selectedField}
                allFields={fields}
                onUpdate={(updates) => updateField(selectedField.id, updates)}
                isPremium={isPremium}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Settings className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>Select a field to edit its properties</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Field Selector Dialog */}
      <Dialog open={showFieldSelector} onOpenChange={setShowFieldSelector}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Field</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
            {FORM_FIELD_TYPES.map((fieldType) => {
              const Icon = fieldType.icon;
              const isLocked = fieldType.premium && !isPremium;

              return (
                <button
                  key={fieldType.type}
                  onClick={() => !isLocked && addField(fieldType.type)}
                  disabled={isLocked}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors",
                    isLocked
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:border-primary hover:bg-primary/5 cursor-pointer"
                  )}
                >
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-sm">{fieldType.label}</span>
                  {isLocked && (
                    <Badge variant="secondary" className="text-xs">
                      Premium
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Form Preview</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {fields.map((field) => (
              <FormFieldPreview key={field.id} field={field} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sortable Field Item
function SortableFieldItem({
  field,
  isSelected,
  onClick,
  onDelete,
}: {
  field: FormField;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const fieldConfig = FORM_FIELD_TYPES.find((f) => f.type === field.type);
  const Icon = fieldConfig?.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-white border rounded-lg cursor-pointer transition-all",
        isSelected && "ring-2 ring-primary",
        isDragging && "opacity-50"
      )}
      onClick={onClick}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 hover:bg-gray-100 rounded cursor-grab"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </button>

      <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
        {Icon && <Icon className="h-4 w-4 text-gray-600" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{field.label}</p>
        <p className="text-xs text-gray-500 capitalize">{field.type}</p>
      </div>

      {field.required && (
        <Badge variant="secondary" className="text-xs">
          Required
        </Badge>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// Field Properties Panel
function FieldProperties({
  field,
  allFields,
  onUpdate,
  isPremium,
}: {
  field: FormField;
  allFields: FormField[];
  onUpdate: (updates: Partial<FormField>) => void;
  isPremium: boolean;
}) {
  const fieldConfig = FORM_FIELD_TYPES.find((f) => f.type === field.type);

  return (
    <Tabs defaultValue="general">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label>Label</Label>
          <Input
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Placeholder</Label>
          <Input
            value={field.placeholder || ""}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Required</Label>
          <Switch
            checked={field.required}
            onCheckedChange={(checked) => onUpdate({ required: checked })}
          />
        </div>

        {fieldConfig?.hasOptions && (
          <div className="space-y-2">
            <Label>Options</Label>
            <Textarea
              value={field.options?.join("\n") || ""}
              onChange={(e) =>
                onUpdate({
                  options: e.target.value.split("\n").filter(Boolean),
                })
              }
              placeholder="One option per line"
              rows={4}
            />
          </div>
        )}
      </TabsContent>

      <TabsContent value="advanced" className="space-y-4 mt-4">
        {fieldConfig?.hasValidation && (
          <>
            {(field.type === "text" || field.type === "textarea") && (
              <>
                <div className="space-y-2">
                  <Label>Min Length</Label>
                  <Input
                    type="number"
                    value={field.validation?.min || ""}
                    onChange={(e) =>
                      onUpdate({
                        validation: {
                          ...field.validation,
                          min: parseInt(e.target.value) || undefined,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Length</Label>
                  <Input
                    type="number"
                    value={field.validation?.max || ""}
                    onChange={(e) =>
                      onUpdate({
                        validation: {
                          ...field.validation,
                          max: parseInt(e.target.value) || undefined,
                        },
                      })
                    }
                  />
                </div>
              </>
            )}
          </>
        )}

        {isPremium && allFields.length > 1 && (
          <div className="space-y-2">
            <Label>Conditional Logic</Label>
            <p className="text-xs text-gray-500 mb-2">
              Show this field only when another field meets a condition
            </p>
            <Select
              value={field.conditionalLogic?.showIf?.fieldId || "none"}
              onValueChange={(value) => {
                if (value === "none") {
                  onUpdate({ conditionalLogic: undefined });
                } else {
                  onUpdate({
                    conditionalLogic: {
                      showIf: {
                        fieldId: value,
                        operator: "equals",
                        value: "",
                      },
                    },
                  });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No condition</SelectItem>
                {allFields
                  .filter((f) => f.id !== field.id)
                  .map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {field.conditionalLogic && (
              <div className="space-y-2 mt-2">
                <Input
                  placeholder="Value to match"
                  value={field.conditionalLogic.showIf.value}
                  onChange={(e) =>
                    onUpdate({
                      conditionalLogic: {
                        showIf: {
                          ...field.conditionalLogic!.showIf,
                          value: e.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
            )}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

// Form Field Preview
function FormFieldPreview({ field }: { field: FormField }) {
  return (
    <div className="space-y-2">
      <Label>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {field.type === "text" && (
        <Input placeholder={field.placeholder} disabled />
      )}

      {field.type === "email" && (
        <Input type="email" placeholder={field.placeholder} disabled />
      )}

      {field.type === "phone" && (
        <Input type="tel" placeholder={field.placeholder} disabled />
      )}

      {field.type === "number" && (
        <Input type="number" placeholder={field.placeholder} disabled />
      )}

      {field.type === "textarea" && (
        <Textarea placeholder={field.placeholder} disabled />
      )}

      {field.type === "date" && <Input type="date" disabled />}

      {field.type === "select" && (
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder || "Select..."} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.type === "checkbox" && (
        <div className="space-y-2">
          {field.options?.map((option) => (
            <div key={option} className="flex items-center gap-2">
              <input type="checkbox" disabled className="rounded" />
              <span className="text-sm">{option}</span>
            </div>
          ))}
        </div>
      )}

      {field.type === "radio" && (
        <div className="space-y-2">
          {field.options?.map((option) => (
            <div key={option} className="flex items-center gap-2">
              <input type="radio" disabled />
              <span className="text-sm">{option}</span>
            </div>
          ))}
        </div>
      )}

      {field.type === "file" && (
        <Input type="file" disabled />
      )}
    </div>
  );
}
