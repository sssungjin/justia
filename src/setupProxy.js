const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = (app) => {
  app.use(
    "/webchat",
    createProxyMiddleware({
      target: "http://localhost:8080/webchat",
      changeOrigin: true,
      ws: true,
    })
  );
};
