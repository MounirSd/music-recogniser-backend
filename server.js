require('dotenv').config()
const port = process.env.PORT
const path = require('path');
const express = require('express')
const app = express()
const expressWs = require('express-ws')(app);
const apiRoutes = require("./routes/api.route")
const logger = require('day-log-savings')

// route api requests
app.use('/api', apiRoutes)

// serve angular build
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'view/index.html'));
});
app.get('/*.*', express.static('./view', {maxAge: '1y'}));

app.listen(port, () => {
    logger.write(`Listening at port ${port}`)
})