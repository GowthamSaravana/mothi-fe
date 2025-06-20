import { URL } from "url";

import { Buffer } from "buffer";

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8")); // ✅ returns string
    });
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  // Get full request URL (e.g. /proxy/users?id=123)
  const fullReqUrl = new URL(req.url, `http://${req.headers.host}`);
  // Extract the path after /proxy
  const targetPath = fullReqUrl.pathname.replace(/^\/proxy/, "") || "/";
  console.log({ targetPath });

  const queryString = Object.entries(req.query)
    .filter(([key]) => !key.includes("slug")) // exclude dynamic slug param
    .map(([key, value]) =>
      Array.isArray(value)
        ? value.map((val) => `${key}=${encodeURIComponent(val)}`).join("&")
        : `${key}=${encodeURIComponent(value)}`
    )
    .join("&");
  const targetUrl = `http://raiseandresolve-app-env.eba-cvcff52c.us-east-1.elasticbeanstalk.com${targetPath}${
    queryString ? "?" + queryString : ""
  }`;
  try {
    let body = undefined;
    if (!["GET", "HEAD"].includes(req.method)) {
      body = await getRawBody(req); // ✅ works with Node streams
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: undefined,
        "accept-encoding": undefined,
      },
      body,
    });

    const contentType = response.headers.get("content-type");
    if (contentType) res.setHeader("content-type", contentType);
    res.status(response.status).send(await response.text());
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy request failed" });
  }
}
