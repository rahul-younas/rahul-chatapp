import { dark } from "@clerk/themes";

const textPrimary = "#fafafa";
const textSecondary = "#a1a1aa";
const surface = "#18181b";
const surfaceInput = "#27272a";
const border = "#3f3f46";

/** Shared Clerk appearance — inline styles so headers/labels stay visible on dark UI */
export const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#6366f1",
    colorDanger: "#ef4444",
    colorSuccess: "#22c55e",
    colorWarning: "#f59e0b",
    colorBackground: surface,
    colorInputBackground: surfaceInput,
    colorInputText: textPrimary,
    colorText: textPrimary,
    colorTextSecondary: textSecondary,
    colorTextOnPrimaryBackground: "#ffffff",
    colorNeutral: textSecondary,
    colorMuted: textSecondary,
    colorForeground: textPrimary,
    colorModalBackdrop: "rgba(0, 0, 0, 0.7)",
    borderRadius: "0.5rem",
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    fontSize: "0.875rem",
  },
  elements: {
    rootBox: { width: "100%" },
    cardBox: { width: "100%", maxWidth: "28rem" },
    card: {
      backgroundColor: surface,
      border: `1px solid ${border}`,
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
      color: textPrimary,
    },
    header: { color: textPrimary },
    headerTitle: {
      color: textPrimary,
      fontSize: "1.5rem",
      fontWeight: "600",
      lineHeight: "1.25",
    },
    headerSubtitle: {
      color: textSecondary,
      fontSize: "0.875rem",
      lineHeight: "1.5",
    },
    formHeaderTitle: {
      color: textPrimary,
      fontSize: "1.25rem",
      fontWeight: "600",
    },
    formHeaderSubtitle: {
      color: textSecondary,
      fontSize: "0.875rem",
    },
    socialButtonsBlockButton: {
      backgroundColor: surfaceInput,
      border: `1px solid ${border}`,
      color: textPrimary,
    },
    socialButtonsBlockButtonText: {
      color: textPrimary,
      fontWeight: "500",
    },
    dividerLine: { backgroundColor: border },
    dividerText: { color: textSecondary },
    formFieldLabel: { color: "#e4e4e7", fontWeight: "500" },
    formFieldInput: {
      backgroundColor: surfaceInput,
      borderColor: border,
      color: textPrimary,
    },
    formFieldInputShowPasswordButton: { color: textSecondary },
    formButtonPrimary: {
      backgroundColor: "#4f46e5",
      color: "#ffffff",
    },
    footer: {
      backgroundColor: "transparent",
      color: textSecondary,
    },
    footerAction: {
      backgroundColor: "transparent",
      color: textSecondary,
    },
    footerActionText: {
      color: "#d4d4d8",
      fontSize: "0.875rem",
    },
    footerActionLink: {
      color: "#a5b4fc",
      fontWeight: "600",
      textDecoration: "none",
    },
    footerPages: { color: textSecondary },
    footerPagesLink: {
      color: "#a5b4fc",
      fontWeight: "600",
    },
    identityPreviewText: { color: textPrimary },
    identityPreviewEditButton: { color: "#818cf8" },
    alertText: { color: textPrimary },
    formResendCodeLink: { color: "#818cf8" },
    otpCodeFieldInput: {
      backgroundColor: surfaceInput,
      borderColor: border,
      color: textPrimary,
    },
    navbarButton: { color: "#e4e4e7" },
    profileSectionTitle: { color: "#e4e4e7" },
    profileSectionContent: { color: textSecondary },
    formFieldSuccessText: { color: "#86efac" },
    formFieldErrorText: { color: "#fca5a5" },
    formFieldHintText: { color: textSecondary },
    backLink: { color: textSecondary },
    logoBox: { color: textPrimary },
  },
};
