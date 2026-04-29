// Google Analytics 4 tracking functions
declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string,
      config?: any
    ) => void;
  }
}

export const GA_MEASUREMENT_ID = 'G-3KHQBT8232';

// Initialize gtag function
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_location: url,
    });
  }
};

// Custom event tracking
export const event = (action: string, parameters?: any) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      ...parameters,
    });
  }
};

// Specific tracking functions for proto2any.com
export const trackFileUpload = (method: 'drag_drop' | 'file_button' | 'api') => {
  event('file_upload', {
    event_category: 'proto_file',
    event_label: method,
    value: 1,
  });
};

export const trackConversion = (format: string, success: boolean, method: 'manual' | 'auto') => {
  event(success ? 'conversion_success' : 'conversion_error', {
    event_category: 'proto_conversion',
    event_label: format,
    custom_parameter_method: method,
    value: success ? 1 : 0,
  });
};

export const trackFormatSelection = (format: string, method: 'dropdown' | 'card_click') => {
  event('format_selection', {
    event_category: 'user_interaction',
    event_label: format,
    custom_parameter_selection_method: method,
  });
};

export const trackCopyToClipboard = (content_type: 'proto_input' | 'converted_output') => {
  event('copy_to_clipboard', {
    event_category: 'user_interaction',
    event_label: content_type,
    value: 1,
  });
};

export const trackAPIUsage = (format: string, success: boolean, uploadMethod?: string) => {
  event('api_usage', {
    event_category: 'api',
    event_label: format,
    custom_parameter_upload_method: uploadMethod,
    value: success ? 1 : 0,
  });
};

export const trackTabSwitch = (tab: 'formats' | 'output') => {
  event('tab_switch', {
    event_category: 'navigation',
    event_label: tab,
  });
};

export const trackExternalLink = (destination: string) => {
  event('click', {
    event_category: 'external_link',
    event_label: destination,
  });
};

// Enhanced ecommerce events for conversion funnel tracking
export const trackConversionFunnel = {
  // When user starts interacting (uploads file or modifies content)
  beginConversion: (format?: string) => {
    event('begin_checkout', {
      event_category: 'conversion_funnel',
      currency: 'USD',
      value: 0,
      items: [{
        item_id: 'proto_conversion',
        item_name: `Proto to ${format || 'Unknown'} Conversion`,
        category: 'conversion',
        quantity: 1,
      }],
    });
  },

  // When conversion is completed successfully
  completeConversion: (format: string) => {
    event('purchase', {
      event_category: 'conversion_funnel',
      transaction_id: `conversion_${Date.now()}`,
      currency: 'USD', 
      value: 1,
      items: [{
        item_id: 'proto_conversion',
        item_name: `Proto to ${format} Conversion`,
        category: 'conversion',
        quantity: 1,
        price: 1,
      }],
    });
  },
};

// User engagement tracking
export const trackUserEngagement = {
  // Track when user actively engages with the tool
  sessionStart: () => {
    event('session_start', {
      event_category: 'engagement',
    });
  },

  // Track meaningful interactions
  engagedUser: () => {
    event('user_engagement', {
      event_category: 'engagement',
      engagement_time_msec: 10000, // 10 seconds of meaningful interaction
    });
  },
};

// Privacy-compliant analytics consent
export const setAnalyticsConsent = (granted: boolean) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: granted ? 'granted' : 'denied',
      ad_storage: 'denied', // We don't use ads
    });
  }
};

// Helper to check if analytics is loaded
export const isAnalyticsReady = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};