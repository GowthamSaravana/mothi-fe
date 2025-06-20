export default async function handler(req, res) {
  const { slug = [] } = req.query;
  const targetPath = "/" + slug.join("/");
  const targetUrl = `http://raiseandresolve-app-env.eba-cvcff52c.us-east-1.elasticbeanstalk.com${targetPath}`;

  try {
    const beanstalkRes = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: undefined
      },
      body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body
    });

    const contentType = beanstalkRes.headers.get("content-type");
    res.setHeader("content-type", contentType);
    res.status(beanstalkRes.status).send(await beanstalkRes.text());
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Proxy request failed" });
  }
}
