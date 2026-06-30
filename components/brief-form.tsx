"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BriefFormProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function BriefForm({ value, onChange, disabled }: BriefFormProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="brief" className="text-sm font-medium">
        Your idea
      </Label>
      <Textarea
        id="brief"
        placeholder="e.g. Launching our new AI content aggregator at the hackathon today!"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={5}
        className="bg-background/50 resize-y text-base"
      />
      <p className="text-muted-foreground text-xs">
        Write the idea once — we adapt it for every platform you pick.
      </p>
    </div>
  );
}
