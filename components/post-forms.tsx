"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { composePostText } from "@/lib/publishers";
import type { PostDraft } from "@/lib/types";

export interface PostFormProps {
  draft: PostDraft;
  onChange: (patch: Partial<PostDraft>) => void;
  disabled?: boolean;
}

/** X (Twitter): single text field + hashtags, with a live 280-char counter. */
export function XForm({ draft, onChange, disabled }: PostFormProps) {
  const count = composePostText(draft).length;
  const over = count > 280;
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Tweet</Label>
        <Textarea
          value={draft.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={5}
          disabled={disabled}
          className="bg-background/40 resize-y"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Hashtags</Label>
        <Input
          value={draft.hashtags}
          onChange={(e) => onChange({ hashtags: e.target.value })}
          placeholder="#launch #ai"
          disabled={disabled}
        />
      </div>
      <p
        className={
          over
            ? "text-destructive text-right text-xs font-semibold"
            : "text-muted-foreground text-right text-xs"
        }
      >
        {count} / 280
      </p>
    </div>
  );
}

/** LinkedIn: a single professional body field with a word count. */
export function LinkedInForm({ draft, onChange, disabled }: PostFormProps) {
  const words = draft.text.trim() ? draft.text.trim().split(/\s+/).length : 0;
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Post body</Label>
        <Textarea
          value={draft.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={9}
          disabled={disabled}
          className="bg-background/40 resize-y leading-relaxed"
        />
      </div>
      <p className="text-muted-foreground text-right text-xs">{words} words</p>
    </div>
  );
}

/** Instagram: caption + hashtags + required image URL, with a preview. */
export function InstagramForm({ draft, onChange, disabled }: PostFormProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Caption</Label>
        <Textarea
          value={draft.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={5}
          disabled={disabled}
          className="bg-background/40 resize-y"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Hashtags</Label>
        <Input
          value={draft.hashtags}
          onChange={(e) => onChange({ hashtags: e.target.value })}
          placeholder="#reels #content #ai"
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">
          Image URL <span className="text-destructive">*</span>
        </Label>
        <Input
          value={draft.imageUrl}
          onChange={(e) => onChange({ imageUrl: e.target.value })}
          placeholder="https://…/image.jpg"
          disabled={disabled}
        />
        <p className="text-muted-foreground text-[11px]">
          Instagram requires an image to publish.
        </p>
      </div>
      {draft.imageUrl.trim() && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={draft.imageUrl}
          alt="Instagram preview"
          className="border-border max-h-44 w-full rounded-lg border object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      )}
    </div>
  );
}

const FORMS: Record<string, (props: PostFormProps) => React.ReactElement> = {
  x: XForm,
  linkedin: LinkedInForm,
  instagram: InstagramForm,
};

export function PostForm(props: PostFormProps) {
  const Form = FORMS[props.draft.platform] ?? LinkedInForm;
  return <Form {...props} />;
}
