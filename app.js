const express = require('express');

const httpServerRoutes = require(process.cwd() + '/api/server/routes');
const httpServerMiddlewares = require(process.cwd() + '/api/server/middlewares');

const startWebServer = () => {
    const server = express();
    const port = 9000;

    server.use(httpServerMiddlewares.allowCrossDomain);
    httpServerRoutes.registerRoutes(server);

    server.listen(port, () => console.log(`Stock Exchange is listening on port ${port}`) )
};

startWebServer();