// node index.js

const http = require("http");
const fs = require("fs");


const host = 'localhost';
const port = 8000;

// const clearDataFiles = [];

// fs.readdir(__dirname,  (err, files) => {
//     if (err)
//       console.log(err);
//     else {
//       console.log("\nCurrent directory filenames:");
//         const ctpSelect = document.createElement("select");
//         files.forEach(file => {
//         console.log(file);
//         clearDataFiles.append(file);
//         const optionElement = document.createElement("option");
//         optionElement.innerText = file;
//         ctpSelect.append(optionElement);

//         document.append(ctpSelect);
//       })
//     }
//   })

//   if (clearDataFiles.length) {
//     document.createElement("select");
//   }


const requestListener = function (req, res) {
    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    
    switch (req.url) {
        case "/":
            console.log("first");
            res.end(`<html><body><h1>This is HTML</h1></body></html>`);
            break;
        case "/addTable" :
            console.log("ready to get table");
            res.end(`<html><body><h1>This is HTML</h1></body></html>`);
            break;
    }
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
