/**
 * Analytics Service
 * Supports Plausible Analytics and Google Analytics 4
 */

// Check which analytics service is configured
const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID;

// Initialize Plausible if configured
if (PLAUSIBLE_DOMAIN && typeof globalThis.window !== 'undefined') {
  (globalThis.window as any).plausible =
    (globalThis.window as any).plausible ||
    function (...args: any[]) {
      ((globalThis.window as any).plausible?.q || []).push(args);
    };
}

// Initialize GA4 if configured
if (GA4_MEASUREMENT_ID && typeof globalThis.window !== 'undefined') {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  (globalThis.window as any).dataLayer = (globalThis.window as any).dataLayer || [];
  function gtag(...args: any[]) {
    (globalThis.window as any).dataLayer.push(args);
  }
  (globalThis.window as any).gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA4_MEASUREMENT_ID, {
    anonymize_ip: true,
    respect_dnt: true,
  });
}

export interface AnalyticsEvent {
  name: string;
  props?: Record<string, string | number | boolean>;
}

/**
 * Track a custom event
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (typeof globalThis.window === 'undefined') return;

  const { name, props } = event;

  // Plausible Analytics
  if (PLAUSIBLE_DOMAIN && (globalThis.window as any).plausible) {
    (globalThis.window as any).plausible(name, { props });
  }

  // Google Analytics 4
  if (GA4_MEASUREMENT_ID && (globalThis.window as any).gtag) {
    (globalThis.window as any).gtag('event', name, props);
  }
}

/**
 * Track CTA click
 */
export function trackCTAClick(ctaName: string, location?: string): void {
  trackEvent({
    name: 'cta_click',
    props: {
      cta_name: ctaName,
      location: location || window.location.pathname,
    },
  });
}

/**
 * Track form submission
 */
export function trackFormSubmit(formName: string, success: boolean): void {
  trackEvent({
    name: success ? 'form_submit_success' : 'form_submit_error',
    props: {
      form_name: formName,
    },
  });
}

/**
 * Track form start (when user begins filling out a form)
 */
export function trackFormStart(formName: string): void {
  trackEvent({
    name: 'form_start',
    props: {
      form_name: formName,
    },
  });
}

/**
 * Track scroll depth
 */
let scrollDepthTracked = {
  25: false,
  50: false,
  75: false,
  100: false,
};

export function initScrollTracking(): void {
  if (typeof globalThis.window === 'undefined') return;

  const trackScrollDepth = () => {
    const scrollTop = globalThis.window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - globalThis.window.innerHeight;
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);

    if (scrollPercent >= 25 && !scrollDepthTracked[25]) {
      scrollDepthTracked[25] = true;
      trackEvent({ name: 'scroll_depth', props: { depth: 25 } });
    }
    if (scrollPercent >= 50 && !scrollDepthTracked[50]) {
      scrollDepthTracked[50] = true;
      trackEvent({ name: 'scroll_depth', props: { depth: 50 } });
    }
    if (scrollPercent >= 75 && !scrollDepthTracked[75]) {
      scrollDepthTracked[75] = true;
      trackEvent({ name: 'scroll_depth', props: { depth: 75 } });
    }
    if (scrollPercent >= 100 && !scrollDepthTracked[100]) {
      scrollDepthTracked[100] = true;
      trackEvent({ name: 'scroll_depth', props: { depth: 100 } });
    }
  };

  globalThis.window.addEventListener('scroll', trackScrollDepth, { passive: true });
}

/**
 * Track page view
 */
export function trackPageView(path: string): void {
  trackEvent({
    name: 'page_view',
    props: {
      path,
    },
  });

  // GA4 page view
  if (GA4_MEASUREMENT_ID && (globalThis.window as any).gtag) {
    (globalThis.window as any).gtag('config', GA4_MEASUREMENT_ID, {
      page_path: path,
    });
  }
}
