// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/(protected)/officers/actions", () => ({
  saveOfficerProfile: vi.fn(),
}));

import { saveOfficerProfile } from "@/app/(protected)/officers/actions";
import OfficerProfileDialog from "@/app/(protected)/officers/[id]/officer-profile-dialog";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

let root: Root;
let host: HTMLDivElement;

beforeEach(() => {
  vi.clearAllMocks();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value() {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value() {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    },
  });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

async function renderDialog(
  profile?: {
    birthday?: string;
    hobbies?: string;
    favorite_color?: string;
    favorite_song?: string;
    personality_type?: string;
    favorite_pokemon?: string;
    personal_motto?: string;
    instagram_handle?: string;
    photo_url?: string;
    has_cic_shirt?: boolean;
    tshirt_size?: string;
  } | null,
) {
  await act(async () => {
    root.render(
      createElement(OfficerProfileDialog, {
        officerId: 10,
        profile: profile as never,
      }),
    );
  });
}

it("renders trigger button and opens dialog upon click", async () => {
  await renderDialog({ birthday: "October 15", hobbies: "Chess" });

  const trigger = host.querySelector<HTMLButtonElement>(
    'button[type="button"]',
  );
  expect(trigger?.textContent).toContain("Edit profile details");

  const dialog = host.querySelector<HTMLDialogElement>("dialog");
  expect(dialog?.hasAttribute("open")).toBe(false);

  await act(async () => {
    trigger?.click();
  });

  expect(dialog?.hasAttribute("open")).toBe(true);

  const birthdayInput = host.querySelector<HTMLInputElement>(
    'input[name="birthday"]',
  );
  expect(birthdayInput?.defaultValue).toBe("October 15");

  const hobbiesInput = host.querySelector<HTMLInputElement>(
    'input[name="hobbies"]',
  );
  expect(hobbiesInput?.defaultValue).toBe("Chess");
});

it("submits the form and calls saveOfficerProfile action", async () => {
  vi.mocked(saveOfficerProfile).mockResolvedValue({
    error: "",
    success: "Onboarding details saved",
  });

  await renderDialog();

  const trigger = host.querySelector<HTMLButtonElement>(
    'button[type="button"]',
  );
  await act(async () => {
    trigger?.click();
  });

  const form = host.querySelector<HTMLFormElement>("form");
  await act(async () => {
    form?.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  });

  expect(saveOfficerProfile).toHaveBeenCalled();
});
