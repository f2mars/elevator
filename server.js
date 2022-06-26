const http = require("http");
const fs = require("fs");

const host = "localhost";
const port = 8000;

const clearDataFiles = [];

fs.readdir(__dirname + "/clearData", (err, files) => {
  if (err) console.log(err);
  else {
    console.log("\nCurrent directory filenames:");
    files.forEach((file) => {
      clearDataFiles.push(file);
    });
  }
});

if (clearDataFiles.length) {
  console.log("clearDataFiles:");
  console.log(clearDataFiles);
}

const requestListener = function (req, res) {
  switch (req.url) {
    case req.url.match(/\/getTable/) ? req.url : true:
      console.log("getTable works");
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "OPTIONS, GET, POST, PUT, PATCH, DELETE"
      );
      let questionIndex = req.url.indexOf("?");
      let fileName = req.url.slice(questionIndex + 1);
      let filePath = __dirname + "/clearData/" + fileName;
      fs.access(filePath, fs.constants.R_OK, (err) => {
        if (err) {
          res.statusCode = 404;
          res.end("Resourse not found!");
        } else {
          res.writeHead(200);
          fs.createReadStream(filePath).pipe(res);
        }
      });
      break;
    case "/getFileNames":
      res.setHeader("Content-Type", "application/json");
      console.log("getFileNames");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "OPTIONS, GET, POST, PUT, PATCH, DELETE"
      );
      res.writeHead(200);
      res.end(clearDataFiles.toString());
      break;
    case "/addTable":
      res.end(`<html><body><h1>This is HTML</h1></body></html>`);
      break;
  }
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
