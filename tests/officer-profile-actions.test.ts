import { beforeEach, expect, it, vi } from "vitest";

vi.mock("@/lib/authorization", () => ({
  getAuthorizationContext: vi.fn(),
  canManageOfficers: (actor: { applicationRole: string }) =>
    actor.applicationRole === "admin",
  canEditOfficerProfile: (
    actor: { id: number; applicationRole: string },
    officerId: number,
  ) => actor.applicationRole === "admin" || actor.id === officerId,
  isAdmin: (actor: { applicationRole: string }) =>
    actor.applicationRole === "admin",
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { getAuthorizationContext } from "@/lib/authorization";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { saveOfficerProfile } from "@/app/(protected)/officers/actions";

const rpc = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAuthorizationContext).mockResolvedValue({
    id: 10,
    applicationRole: "officer",
  } as never);
  vi.mocked(createClient).mockResolvedValue({ rpc } as never);
  rpc.mockResolvedValue({ error: null });
});

it("rejects unauthorized officers trying to edit another officer's profile", async () => {
  const form = new FormData();
  form.set("officer_id", "20"); // Different officer, not admin
  form.set("birthday", "October 15");

  const result = await saveOfficerProfile({ error: "", success: "" }, form);
  expect(result.error).toBe(
    "Cannot manage another officer's profile unless admin",
  );
  expect(rpc).not.toHaveBeenCalled();
});

it("allows an officer to edit their own profile", async () => {
  const form = new FormData();
  form.set("officer_id", "10");
  form.set("birthday", " October 15 ");
  form.set("hobbies", " Chess, Coding ");
  form.set("favorite_color", "Emerald");
  form.set("favorite_song", "Starlight");
  form.set("personality_type", "INTJ");
  form.set("favorite_pokemon", "Gengar");
  form.set("personal_motto", "Consistency");
  form.set("instagram_handle", "@cic");
  form.set("photo_url", "https://example.com/pic.jpg");
  form.set("has_cic_shirt", "true");
  form.set("tshirt_size", " M ");

  const result = await saveOfficerProfile({ error: "", success: "" }, form);
  expect(result).toEqual({
    error: "",
    success: "Onboarding details saved",
  });
  expect(rpc).toHaveBeenCalledWith("save_officer_profile", {
    p_officer_id: 10,
    p_birthday: "October 15",
    p_hobbies: "Chess, Coding",
    p_favorite_color: "Emerald",
    p_favorite_song: "Starlight",
    p_personality_type: "INTJ",
    p_favorite_pokemon: "Gengar",
    p_personal_motto: "Consistency",
    p_instagram_handle: "@cic",
    p_photo_url: "https://example.com/pic.jpg",
    p_has_cic_shirt: true,
    p_tshirt_size: "M",
  });
  expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
});

it("allows an admin to edit any officer profile", async () => {
  vi.mocked(getAuthorizationContext).mockResolvedValue({
    id: 1,
    applicationRole: "admin",
  } as never);

  const form = new FormData();
  form.set("officer_id", "99");
  form.set("birthday", "Jan 1");

  const result = await saveOfficerProfile({ error: "", success: "" }, form);
  expect(result.success).toBe("Onboarding details saved");
  expect(rpc).toHaveBeenCalledWith(
    "save_officer_profile",
    expect.objectContaining({
      p_officer_id: 99,
      p_birthday: "Jan 1",
    }),
  );
});
