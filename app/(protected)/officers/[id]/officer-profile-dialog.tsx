"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { ActionFeedback, FieldError, FormMessage } from "@/components/ui";
import { initialFormActionState, submittedValue } from "@/lib/form-feedback";
import { saveOfficerProfile } from "../actions";
import type { Tables } from "@/lib/database.types";

type OfficerProfileDialogProps = {
  officerId: number;
  profile?: Tables<"officer_profiles"> | null;
};

export default function OfficerProfileDialog({
  officerId,
  profile,
}: OfficerProfileDialogProps) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const wasOpen = useRef(false);
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [success, setSuccess] = useState("");
  const id = useId();
  const titleId = `${id}-title`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      requestAnimationFrame(() =>
        dialog.querySelector<HTMLElement>("[data-initial-focus]")?.focus(),
      );
    } else if (!open && dialog.open) {
      dialog.close();
    }
    if (!open && wasOpen.current) triggerRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  const handleSuccess = useCallback(
    (message: string) => {
      setSuccess(message);
      setFormKey((key) => key + 1);
      setOpen(false);
      router.refresh();
    },
    [router],
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        ref={triggerRef}
        type="button"
        className="button-secondary text-sm"
        onClick={() => {
          setSuccess("");
          setOpen(true);
        }}
      >
        Edit onboarding details
      </button>
      {success && !open && <FormMessage kind="success">{success}</FormMessage>}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg border border-border bg-surface p-5 text-foreground backdrop:bg-black/60 sm:p-6"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <h2
              id={titleId}
              className="text-base font-semibold tracking-tight text-foreground"
            >
              Edit onboarding details
            </h2>
            <p className="text-xs text-secondary">
              Update personal and onboarding profile details. All fields are
              optional.
            </p>
          </div>

          <OfficerProfileFields
            key={formKey}
            id={id}
            officerId={officerId}
            profile={profile}
            onSuccess={handleSuccess}
            onCancel={() => setOpen(false)}
          />
        </div>
      </dialog>
    </div>
  );
}

function OfficerProfileFields({
  id,
  officerId,
  profile,
  onSuccess,
  onCancel,
}: {
  id: string;
  officerId: number;
  profile?: Tables<"officer_profiles"> | null;
  onSuccess: (message: string) => void;
  onCancel: () => void;
}) {
  const [state, action, pending] = useActionState(
    saveOfficerProfile,
    initialFormActionState,
  );
  const fieldErrors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.success) {
      onSuccess(state.success);
    }
  }, [onSuccess, state.success]);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="officer_id" value={officerId} />

      <label className="block">
        Birthday
        <input
          data-initial-focus
          name="birthday"
          defaultValue={submittedValue(
            state.values,
            "birthday",
            profile?.birthday ?? "",
          )}
          placeholder="e.g. October 15"
          aria-invalid={Boolean(fieldErrors.birthday)}
          aria-describedby={
            fieldErrors.birthday ? `${id}-birthday-error` : undefined
          }
        />
        <FieldError id={`${id}-birthday-error`}>
          {fieldErrors.birthday}
        </FieldError>
      </label>

      <label className="block">
        Hobbies
        <input
          name="hobbies"
          defaultValue={submittedValue(
            state.values,
            "hobbies",
            profile?.hobbies ?? "",
          )}
          placeholder="e.g. Hiking, chess, coding"
          aria-invalid={Boolean(fieldErrors.hobbies)}
          aria-describedby={
            fieldErrors.hobbies ? `${id}-hobbies-error` : undefined
          }
        />
        <FieldError id={`${id}-hobbies-error`}>
          {fieldErrors.hobbies}
        </FieldError>
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          Favorite color
          <input
            name="favorite_color"
            defaultValue={submittedValue(
              state.values,
              "favorite_color",
              profile?.favorite_color ?? "",
            )}
            placeholder="e.g. Emerald Green"
            aria-invalid={Boolean(fieldErrors.favorite_color)}
            aria-describedby={
              fieldErrors.favorite_color ? `${id}-favcolor-error` : undefined
            }
          />
          <FieldError id={`${id}-favcolor-error`}>
            {fieldErrors.favorite_color}
          </FieldError>
        </label>

        <label className="block">
          Favorite song
          <input
            name="favorite_song"
            defaultValue={submittedValue(
              state.values,
              "favorite_song",
              profile?.favorite_song ?? "",
            )}
            placeholder="e.g. Bohemian Rhapsody"
            aria-invalid={Boolean(fieldErrors.favorite_song)}
            aria-describedby={
              fieldErrors.favorite_song ? `${id}-favsong-error` : undefined
            }
          />
          <FieldError id={`${id}-favsong-error`}>
            {fieldErrors.favorite_song}
          </FieldError>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          Personality type
          <input
            name="personality_type"
            defaultValue={submittedValue(
              state.values,
              "personality_type",
              profile?.personality_type ?? "",
            )}
            placeholder="e.g. INTJ"
            aria-invalid={Boolean(fieldErrors.personality_type)}
            aria-describedby={
              fieldErrors.personality_type
                ? `${id}-personality-error`
                : undefined
            }
          />
          <FieldError id={`${id}-personality-error`}>
            {fieldErrors.personality_type}
          </FieldError>
        </label>

        <label className="block">
          Favorite Pokémon
          <input
            name="favorite_pokemon"
            defaultValue={submittedValue(
              state.values,
              "favorite_pokemon",
              profile?.favorite_pokemon ?? "",
            )}
            placeholder="e.g. Gengar"
            aria-invalid={Boolean(fieldErrors.favorite_pokemon)}
            aria-describedby={
              fieldErrors.favorite_pokemon ? `${id}-pokemon-error` : undefined
            }
          />
          <FieldError id={`${id}-pokemon-error`}>
            {fieldErrors.favorite_pokemon}
          </FieldError>
        </label>
      </div>

      <label className="block">
        Personal motto
        <input
          name="personal_motto"
          defaultValue={submittedValue(
            state.values,
            "personal_motto",
            profile?.personal_motto ?? "",
          )}
          placeholder="e.g. Consistency is key"
          aria-invalid={Boolean(fieldErrors.personal_motto)}
          aria-describedby={
            fieldErrors.personal_motto ? `${id}-motto-error` : undefined
          }
        />
        <FieldError id={`${id}-motto-error`}>
          {fieldErrors.personal_motto}
        </FieldError>
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          Instagram handle
          <input
            name="instagram_handle"
            defaultValue={submittedValue(
              state.values,
              "instagram_handle",
              profile?.instagram_handle ?? "",
            )}
            placeholder="e.g. @cic_officer"
            aria-invalid={Boolean(fieldErrors.instagram_handle)}
            aria-describedby={
              fieldErrors.instagram_handle ? `${id}-instagram-error` : undefined
            }
          />
          <FieldError id={`${id}-instagram-error`}>
            {fieldErrors.instagram_handle}
          </FieldError>
        </label>

        <label className="block">
          T-shirt size
          <input
            name="tshirt_size"
            defaultValue={submittedValue(
              state.values,
              "tshirt_size",
              profile?.tshirt_size ?? "",
            )}
            placeholder="e.g. M, L, XL"
            aria-invalid={Boolean(fieldErrors.tshirt_size)}
            aria-describedby={
              fieldErrors.tshirt_size ? `${id}-tshirt-error` : undefined
            }
          />
          <FieldError id={`${id}-tshirt-error`}>
            {fieldErrors.tshirt_size}
          </FieldError>
        </label>
      </div>

      <label className="block">
        Photo URL
        <input
          name="photo_url"
          type="url"
          defaultValue={submittedValue(
            state.values,
            "photo_url",
            profile?.photo_url ?? "",
          )}
          placeholder="https://example.com/photo.jpg"
          aria-invalid={Boolean(fieldErrors.photo_url)}
          aria-describedby={
            fieldErrors.photo_url ? `${id}-photo-error` : undefined
          }
        />
        <FieldError id={`${id}-photo-error`}>
          {fieldErrors.photo_url}
        </FieldError>
      </label>

      <label className="flex items-center gap-2 pt-1 text-sm font-normal">
        <input
          type="checkbox"
          name="has_cic_shirt"
          value="true"
          defaultChecked={
            state.values?.has_cic_shirt !== undefined
              ? state.values.has_cic_shirt === "true" ||
                state.values.has_cic_shirt === "on"
              : (profile?.has_cic_shirt ?? false)
          }
          className="h-4 w-4 rounded border-border"
        />
        <span>Has CIC shirt</span>
      </label>

      <ActionFeedback state={state} />

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <button
          type="button"
          disabled={pending}
          className="button-secondary min-h-11"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="button-primary min-h-11"
        >
          {pending ? "Saving…" : "Save details"}
        </button>
      </div>
    </form>
  );
}
