const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

exports.registerRoutes = (server) => {
    const makeHandler = (actionName, controllerName) => (req, res) => {
        const controllerPath = `${process.cwd()}/api/controllers/${controllerName}Controller`;
        const controller = require(controllerPath);

        controller[actionName](req, (err, result) => {
            if (err) {
                return res.status(400).json({ error: 'Something went wrong!'});
            }

            return res.send(result);


        });
    };

    const routes = [{
        url: '/stockExchange',
        httpMethod: 'post',
        multerField: 'inputs',
        handler: makeHandler('compute', 'stockExchange')
    }];

    routes.forEach((route) => {
        server[route.httpMethod](route.url, route.multerField ? upload.single(route.multerField) : upload.none(), route.handler);
    });
};