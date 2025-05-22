# https-server-js

A lightweight, low-level HTTP server built using Node.js core modules (`net`, `fs`, `zlib`). This project demonstrates how HTTP communication works under the hood—without relying on frameworks like Express or Fastify.

## Features

- Manual HTTP parsing over raw TCP sockets
- Handles `GET` and `POST` requests
- Serves plain text and files
- Supports `gzip` compression if requested via `Accept-Encoding` header
- Echoes path content and returns `User-Agent` header
- Basic file upload support via `POST /files/:filename`
- Simple routing logic without any external dependencies

## Endpoints

### `GET /`
Returns a plain "Hello, World!" message.

### `GET /echo/:content`
Echoes back the content in the path. If `Accept-Encoding: gzip` is present, the response is compressed.

### `GET /files/:filename`
Serves files from a directory specified as a command-line argument (`process.argv[3]`). Supports optional gzip encoding.

### `POST /files/:filename`
Writes the body of the request to a file in the given directory.

### `GET /user-agent`
Returns the value of the `User-Agent` header.

## Usage

### Start the server

```bash
node main.js <placeholder> <directory>
