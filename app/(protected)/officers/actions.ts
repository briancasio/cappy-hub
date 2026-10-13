"use server";

import {
  getAuthorizationContext,
  canManageOfficers,
  canEditOfficerProfile,
} from "@/lib/authorization";

import { withReturnTo } from "@/lib/return-context";
import { withSuccessNotice } from "@/lib/mutation-feedback";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mutationError } from "@/lib/mutation-error";
import {
  formFailure,
  validationFailure,
  type FormActionState,
} from "@/lib/form-feedback";
import {
  applicationRoleChangeInputSchema,
  saveOfficerInputSchema,
  saveOfficerProfileInputSchema,
} from "./validation";

const officerFormFields = [
  "name",
  "utep_email",
  "personal_email",
  "position_id",
  "classification",
  "status",
  "branches",
] as const;

export async function saveOfficer(
  _previous: FormActionState,
  formData: FormData,
) {
  const actor = await getAuthorizationContext();
  if (!canManageOfficers(actor))
    return formFailure(
      "Admin required",
      formData,
      officerFormFields,
      undefined,
      ["branches"],
    );
  const rawOfficerInput = {
    id: formData.get("id") ?? "",
    name: formData.get("name") ?? "",
    utep_email: formData.get("utep_email") ?? "",
    personal_email: formData.get("personal_email") ?? "",
    position_id: formData.get("position_id") ?? "",
    classification: formData.get("classification") ?? "",
    status: formData.get("status") ?? "",
    branches: formData.getAll("branches"),
  };
  const validationResult = saveOfficerInputSchema.safeParse(rawOfficerInput);
  if (!validationResult.success)
    return validationFailure(
      validationResult.error,
      formData,
      officerFormFields,
      ["branches"],
    );
  const validatedOfficerInput = validationResult.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_officer", {
    p_officer_id: validatedOfficerInput.id,
    p_name: validatedOfficerInput.name,
    p_utep_email: validatedOfficerInput.utep_email || undefined,
    p_personal_email: validatedOfficerInput.personal_email || undefined,
    p_position_id: validatedOfficerInput.position_id,
    p_classification: validatedOfficerInput.classification,
    p_status:
      validatedOfficerInput.id !== undefined
        ? validatedOfficerInput.status
        : "active",
    p_branch_ids: validatedOfficerInput.branches,
  });
  if (error)
    return formFailure(
      mutationError(error.message),
      formData,
      officerFormFields,
      undefined,
      ["branches"],
    );
  revalidatePath("/", "layout");
  redirect(
    withSuccessNotice(
      withReturnTo(`/officers/${data}`, formData.get("returnTo")),
      "officer-saved",
    ),
  );
}

export async function changeApplicationRole(
  _previous: FormActionState,
  formData: FormData,
) {
  const actor = await getAuthorizationContext();
  if (!canManageOfficers(actor))
    return formFailure("Admin required", formData, ["role"]);
  const rawApplicationRoleChangeInput = {
    officer_id: formData.get("officer_id") ?? "",
    role: formData.get("role") ?? "",
  };
  const validationResult = applicationRoleChangeInputSchema.safeParse(
    rawApplicationRoleChangeInput,
  );
  if (!validationResult.success) {
    const roleIsInvalid = validationResult.error.issues.some(
      (issue) => issue.path[0] === "role",
    );
    return formFailure(
      "Invalid role assignment",
      formData,
      ["role"],
      roleIsInvalid ? { role: "Select a valid application role." } : undefined,
    );
  }
  const validatedApplicationRoleChange = validationResult.data;
  if (validatedApplicationRoleChange.officer_id === actor.id)
    return formFailure("Admins cannot demote themselves", formData, ["role"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_officer_application_role", {
    p_officer_id: validatedApplicationRoleChange.officer_id,
    p_role: validatedApplicationRoleChange.role,
  });
  if (error)
    return formFailure(mutationError(error.message), formData, ["role"]);
  revalidatePath("/", "layout");
  return { error: "", success: "Application role saved" };
}

const officerProfileFormFields = [
  "birthday",
  "hobbies",
  "favorite_color",
  "favorite_song",
  "personality_type",
  "favorite_pokemon",
  "personal_motto",
  "instagram_handle",
  "photo_url",
  "has_cic_shirt",
  "tshirt_size",
] as const;

export async function saveOfficerProfile(
  _previous: FormActionState,
  formData: FormData,
) {
  const actor = await getAuthorizationContext();
  const rawInput = {
    officer_id: formData.get("officer_id") ?? "",
    birthday: formData.get("birthday") ?? "",
    hobbies: formData.get("hobbies") ?? "",
    favorite_color: formData.get("favorite_color") ?? "",
    favorite_song: formData.get("favorite_song") ?? "",
    personality_type: formData.get("personality_type") ?? "",
    favorite_pokemon: formData.get("favorite_pokemon") ?? "",
    personal_motto: formData.get("personal_motto") ?? "",
    instagram_handle: formData.get("instagram_handle") ?? "",
    photo_url: formData.get("photo_url") ?? "",
    has_cic_shirt: formData.get("has_cic_shirt") ?? "",
    tshirt_size: formData.get("tshirt_size") ?? "",
  };
  const validationResult = saveOfficerProfileInputSchema.safeParse(rawInput);
  if (!validationResult.success) {
    return validationFailure(
      validationResult.error,
      formData,
      officerProfileFormFields,
    );
  }
  const validated = validationResult.data;
  if (!canEditOfficerProfile(actor, validated.officer_id)) {
    return formFailure(
      "Cannot manage another officer's profile unless admin",
      formData,
      officerProfileFormFields,
    );
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_officer_profile", {
    p_officer_id: validated.officer_id,
    p_birthday: validated.birthday || undefined,
    p_hobbies: validated.hobbies || undefined,
    p_favorite_color: validated.favorite_color || undefined,
    p_favorite_song: validated.favorite_song || undefined,
    p_personality_type: validated.personality_type || undefined,
    p_favorite_pokemon: validated.favorite_pokemon || undefined,
    p_personal_motto: validated.personal_motto || undefined,
    p_instagram_handle: validated.instagram_handle || undefined,
    p_photo_url: validated.photo_url || undefined,
    p_has_cic_shirt: validated.has_cic_shirt ?? undefined,
    p_tshirt_size: validated.tshirt_size || undefined,
  });
  if (error) {
    return formFailure(
      mutationError(error.message),
      formData,
      officerProfileFormFields,
    );
  }
  revalidatePath("/", "layout");
  return { error: "", success: "Profile details saved" };
}
