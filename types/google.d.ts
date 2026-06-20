// Minimal typings for the Google Identity Services client library
// (https://accounts.google.com/gsi/client), loaded at runtime in the browser.
export {};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            use_fedcm_for_prompt?: boolean;
            error_callback?: (error: { type?: string; message?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void;
          prompt: () => void;
          // Stops GIS from auto-selecting the last account on the next visit —
          // used to make sign-out predictable.
          disableAutoSelect: () => void;
          cancel: () => void;
        };
      };
    };
  }
}
