import {
  Type,
  AlignLeft,
  List,
  CheckSquare,
  Circle,
  Calendar,
  Upload,
  Mail,
  Phone,
  Hash,
  LucideIcon
} from "lucide-react";

export type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "file"
  | "email"
  | "phone"
  | "number";

export interface FieldTypeConfig {
  type: FieldType;
  label: string;
  icon: LucideIcon;
  description: string;
  hasOptions: boolean;
  hasValidation: boolean;
  premium: boolean;
}

export const FORM_FIELD_TYPES: FieldTypeConfig[] = [
  {
    type: "text",
    label: "Short Text",
    icon: Type,
    description: "Single line text input",
    hasOptions: false,
    hasValidation: true,
    premium: false,
  },
  {
    type: "textarea",
    label: "Long Text",
    icon: AlignLeft,
    description: "Multi-line text area",
    hasOptions: false,
    hasValidation: true,
    premium: false,
  },
  {
    type: "select",
    label: "Dropdown",
    icon: List,
    description: "Dropdown selection",
    hasOptions: true,
    hasValidation: false,
    premium: true,
  },
  {
    type: "checkbox",
    label: "Checkbox",
    icon: CheckSquare,
    description: "Multiple choice checkboxes",
    hasOptions: true,
    hasValidation: false,
    premium: true,
  },
  {
    type: "radio",
    label: "Radio Buttons",
    icon: Circle,
    description: "Single choice radio buttons",
    hasOptions: true,
    hasValidation: false,
    premium: true,
  },
  {
    type: "date",
    label: "Date",
    icon: Calendar,
    description: "Date picker",
    hasOptions: false,
    hasValidation: true,
    premium: false,
  },
  {
    type: "file",
    label: "File Upload",
    icon: Upload,
    description: "File attachment",
    hasOptions: false,
    hasValidation: true,
    premium: true,
  },
  {
    type: "email",
    label: "Email",
    icon: Mail,
    description: "Email address input",
    hasOptions: false,
    hasValidation: true,
    premium: false,
  },
  {
    type: "phone",
    label: "Phone",
    icon: Phone,
    description: "Phone number input",
    hasOptions: false,
    hasValidation: true,
    premium: false,
  },
  {
    type: "number",
    label: "Number",
    icon: Hash,
    description: "Numeric input",
    hasOptions: false,
    hasValidation: true,
    premium: true,
  },
];

export const DEFAULT_FREE_FORM_FIELDS = [
  {
    id: "full_name",
    type: "text" as FieldType,
    label: "Full Name",
    placeholder: "Enter your full name",
    required: true,
    order: 0,
  },
  {
    id: "appointment_date",
    type: "date" as FieldType,
    label: "Preferred Appointment Date",
    required: true,
    order: 1,
  },
  {
    id: "sickness",
    type: "textarea" as FieldType,
    label: "Reason for Visit / Symptoms",
    placeholder: "Please describe your symptoms or reason for visit",
    required: true,
    order: 2,
  },
];

export const getFieldTypeConfig = (type: FieldType): FieldTypeConfig | undefined => {
  return FORM_FIELD_TYPES.find((field) => field.type === type);
};

export const getAvailableFieldTypes = (isPremium: boolean): FieldTypeConfig[] => {
  return FORM_FIELD_TYPES.filter((field) => !field.premium || isPremium);
};
