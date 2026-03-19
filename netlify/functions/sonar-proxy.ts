import type { Handler, HandlerEvent } from "@netlify/functions";

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const SONAR_API_TOKEN = process.env.SONAR_API_TOKEN;
  if (!SONAR_API_TOKEN) {
    console.error("[sonar-proxy] SONAR_API_TOKEN is not configured");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Sonar API token is not configured on the server." }),
    };
  }

  try {
    const body = event.body;
    if (!body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Request body is required" }),
      };
    }

    const response = await fetch(PERPLEXITY_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SONAR_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body,
    });

    const data = await response.text();
    const upstreamContentType = response.headers.get("content-type") || "application/json";

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": upstreamContentType,
      },
      body: data,
    };
  } catch (error) {
    console.error("[sonar-proxy] Error proxying request:", error);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "Failed to reach the AI service." }),
    };
  }
};

export { handler };
