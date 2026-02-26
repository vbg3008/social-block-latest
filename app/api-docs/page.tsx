"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";
import { useEffect, useState } from "react";
import { api } from "@/app/lib/api";

// Dynamic import to prevent SSR issues with swagger-ui-react
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<any>(null);

  useEffect(() => {
    api.get("/api/swagger")
      .then((data) => setSpec(data))
      .catch((err) => console.error("Failed to load Swagger spec", err));
  }, []);

  return (
    <div className="container mx-auto p-4 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        SocialBlock API Documentation
      </h1>
      <div className="border rounded shadow shadow-sm overflow-hidden p-4">
        {spec ? (
          <SwaggerUI spec={spec} />
        ) : (
          <div className="text-center p-10 text-gray-500">Loading API documentation...</div>
        )}
      </div>
    </div>
  );
}
