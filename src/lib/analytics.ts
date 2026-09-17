import { site } from "./site";

type Gtag = (
  command: "config" | "event",
  target: string,
  parameters: Record<string, unknown>,
) => void;

declare global {
  interface Window {
    dataLayer?: IArguments[];
    gtag?: Gtag;
  }
}

let initialized = false;
let lastTrackedUrl: string | undefined;

function queueGtag(
  _command: "config" | "event",
  _target: string,
  _parameters: Record<string, unknown>,
): void {
  window.dataLayer?.push(arguments);
}

export function shouldTrack(origin: string, enabled: boolean): boolean {
  return enabled && origin === site.origin;
}

function initialize(): Gtag {
  window.dataLayer ??= [];
  window.gtag ??= queueGtag;

  if (!initialized) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${site.analyticsId}`;
    document.head.appendChild(script);
    window.gtag("config", site.analyticsId, { send_page_view: false });
    initialized = true;
  }

  return window.gtag;
}

export function trackPageView(url: string, title: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (lastTrackedUrl === url) return;

  const gtag = initialize();
  gtag("event", "page_view", {
    page_location: url,
    page_title: title,
  });
  lastTrackedUrl = url;
}
