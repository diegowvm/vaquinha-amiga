import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

function getDeviceType(): string {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    const trackView = async () => {
      try {
        await supabase.from("page_views").insert({
          page: location.pathname,
          referrer: document.referrer || "",
          user_agent: navigator.userAgent.substring(0, 500),
          device_type: getDeviceType(),
        });
      } catch {
        // silent fail
      }
    };

    trackView();
  }, [location.pathname]);
}
