import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useAuthStore from "../store/auth.store";

export function useTenantSlug() {
  const { slug: urlSlug } = useParams();
  const storeSlug = useAuthStore((state) => state.tenantSlug);
  const savedSlug = localStorage.getItem("tenantSlug");

  const slug = urlSlug || storeSlug || savedSlug;

  // Persist the resolved slug so it survives page reloads and navigation
  useEffect(() => {
    if (slug) {
      localStorage.setItem("tenantSlug", slug);
    }
  }, [slug]);

  return slug;
}

export function useTenantNavigate() {
  const navigate = useNavigate();
  const slug = useTenantSlug();

  return (path) => {
    if (!slug) {
      console.warn("[useTenantNavigate] slug is not available");
      return;
    }
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    navigate(`/${slug}${normalizedPath}`);
  };
}
