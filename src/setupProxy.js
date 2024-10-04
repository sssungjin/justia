const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = (app) => {
  app.use(
    "/webchat",
    createProxyMiddleware({
      target: "http://localhost:8080",
      changeOrigin: true,
      ws: true,
      pathRewrite: {
        "^/webchat": "/webchat", // 필요한 경우 경로 재작성
      },
      onError: (err, req, res) => {
        console.error("Proxy error:", err);
        res.status(500).send("Proxy error");
      },
    })
  );
};
