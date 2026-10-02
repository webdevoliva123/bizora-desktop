import type { SetupData } from "./setup-state";

const SETUP_STORAGE_KEY = "bizora:setup-draft";

export interface SetupDraft {
  currentStep: number;
  setupData: SetupData;
}

/**
 * Save the current setup progress to localStorage.
 *
 * File objects cannot be stored in localStorage,
 * so logo and QR files are temporarily excluded.
 *
 * Their temporary file paths will be handled
 * separately in the setup temp storage.
 */
export function saveSetupDraft(
    setupData: SetupData,
    currentStep: number,
  ) {
    if (typeof window === "undefined") {
      return;
    }
  
    const draft: SetupDraft = {
      currentStep,
  
      setupData: {
        ...setupData,
  
        // File objects cannot be stored in localStorage.
        logo: null,
  
        paymentDetails: {
          ...setupData.paymentDetails,
  
          // File object cannot be stored.
          qrCode: null,
        },
      },
    };
  
    try {
      localStorage.setItem(
        SETUP_STORAGE_KEY,
        JSON.stringify(draft),
      );
    } catch (error) {
      console.error(
        "Failed to save Bizora setup draft:",
        error,
      );
    }
  }

/**
 * Load the saved setup progress from localStorage.
 */
export function loadSetupDraft(): SetupDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(
      SETUP_STORAGE_KEY,
    );

    if (!stored) {
      return null;
    }

    return JSON.parse(stored) as SetupDraft;
  } catch (error) {
    console.error(
      "Failed to load Bizora setup draft:",
      error,
    );

    return null;
  }
}

/**
 * Remove the saved setup draft.
 *
 * This should be called after setup has
 * successfully been completed.
 */
export function clearSetupDraft() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(
      SETUP_STORAGE_KEY,
    );
  } catch (error) {
    console.error(
      "Failed to clear Bizora setup draft:",
      error,
    );
  }
}