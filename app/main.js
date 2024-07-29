const net = require("net");
const fs = require("fs");
const zlib = require("zlib");

const server = net.createServer((socket) => {
  let requestData = '';

  socket.on("data", (data) => {
    requestData += data.toString();
    const headerEndIndex = requestData.indexOf('\r\n\r\n');
    if (headerEndIndex !== -1) {
      const reqObj = requestData.substring(0, headerEndIndex);
      const body = requestData.substring(headerEndIndex + 4);
      console.log("Request Object\r\n", reqObj);

      const [requestLine, ...headerLines] = reqObj.split("\r\n");
      const [method, path, ...others] = requestLine.split(" ");

      const headers = headerLines.reduce((acc, line) => {
        const [key, val] = line.split(": ");
        if (key && val) {
          acc[key] = val;
        }
        return acc;
      }, {});

      handleRequest(socket, method, path, headers, body);
    }
  });

  socket.on("error", () => {
    socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
    socket.end();
  });
});

function handleRequest(socket, method, path, headers, body) {
  if (method === "GET" && path === "/") {
    const content = "Hello, World!";
    const httpResponse = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`;
    socket.write(httpResponse);
  } else if (method === "GET" && path.includes("/echo")) {
    const content = path.split("/echo/")[1];
    if (headers["Accept-Encoding"] && headers["Accept-Encoding"].includes("gzip")) {
      zlib.gzip(content, (err, compressedContent) => {
        if (err) {
          socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
          socket.end();
          return;
        }
        const httpResponse = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Encoding: gzip\r\nContent-Length: ${compressedContent.length}\r\n\r\n`;
        socket.write(httpResponse);
        socket.write(compressedContent);
        socket.end();
      });
    } else {
      const httpResponse = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`;
      socket.write(httpResponse);
    }
  } else if (method === "GET" && path.startsWith("/files/")) {
    const filename = path.split("/files/")[1];
    const directory = process.argv[3];
    if (fs.existsSync(`${directory}/${filename}`)) {
      const content = fs.readFileSync(`${directory}/${filename}`).toString();
      if (headers["Accept-Encoding"] && headers["Accept-Encoding"].includes("gzip")) {
        zlib.gzip(content, (err, compressedContent) => {
          if (err) {
            socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
            socket.end();
            return;
          }
          const httpResponse = `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Encoding: gzip\r\nContent-Length: ${compressedContent.length}\r\n\r\n`;
          socket.write(httpResponse);
          socket.write(compressedContent);
          socket.end();
        });
      } else {
        const httpResponse = `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${content.length}\r\n\r\n${content}`;
        socket.write(httpResponse);
      }
    } else {
      const httpResponse = "HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n";
      socket.write(httpResponse);
    }
  } else if (method === "GET" && path === "/user-agent") {
    const userAgent = headers["User-Agent"];
    if (userAgent) {
      const httpResponse = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`;
      socket.write(httpResponse);
    } else {
      const httpResponse = "HTTP/1.1 400 Bad Request\r\nContent-Length: 0\r\n\r\n";
      socket.write(httpResponse);
    }
  } else if (method === "POST" && path.startsWith("/files/")) {
    const filename = path.split("/files/")[1];
    const directory = process.argv[3];
    const filePath = `${directory}/${filename}`;
    fs.writeFile(filePath, body, (err) => {
      if (err) {
        const httpResponse = "HTTP/1.1 500 Internal Server Error\r\nContent-Length: 0\r\n\r\n";
        socket.write(httpResponse);
      } else {
        const httpResponse = "HTTP/1.1 201 Created\r\nContent-Length: 0\r\n\r\n";
        socket.write(httpResponse);
      }
      socket.end();
    });
  } else {
    const httpResponse = "HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n";
    socket.write(httpResponse);
  }
}

server.listen(4221, () => {
  console.log("Server Listening on port 4221");
});
