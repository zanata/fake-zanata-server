# Fake Zanata Server

A simple REST server that presents a REST API similar to
[Zanata Server](https://github.com/zanata/zanata-server).

## Purpose

Fake Zanata Server is a tool to support developers who are making apps
that communicate with a real Zanata server. It can also be used to try
out proposed REST endpoints for Zanata during API design.


## Dependencies

Requires [Node.js](http://nodejs.org/).


## Usage

Install dependencies:

```
[prompt]$ npm install
...
```

Start the server with the default port:

```
[prompt]$ npm start
...
REST endpoint listening at http://localhost:7878/zanata/rest, with latency 50..500
```

you can specify a port, base REST path, and latency:

```
[prompt]$ npm start --port=1234 --latency=1000..5000 --path=rest
...
REST endpoint listening at http://localhost:1234/rest, with latency 1000..5000
```

 - port: any available port to use
 - path: path to prepend to the local portion of each resource URL
 - latency: plain number or range of milliseconds to delay each response



Get resources from any of the endpoints listed under 'Endpoints' below:

```
[prompt]$ curl http://localhost:7878/zanata/rest/projects
[{
    "id": "tiny-project",
    "defaultType": "File",
    "name": "Tiny Project",
    "description": "A minimal project with a single version containing a single document.",
    "sourceViewURL": null,
    "sourceCheckoutURL": null,
    "links": [{
        "href": "p/tiny-project",
        "rel": "self",
        "type": "application/vnd.zanata.project+json"
    }],
    "iterations": null,
    "status": "ACTIVE"
  }
]
[prompt]$ curl http://localhost:7878/zanata/rest/projects/p/tiny-project
{
  "id": "tiny-project",
  "defaultType": "File",
  "name": "Tiny Project",
  "description": "A minimal project with a single version containing a single document.",
  "sourceViewURL": "source-view-url",
  "sourceCheckoutURL": "source-checkout-url",
  "links": null,
  "iterations": [{
      "id": "1",
      "links": [{
          "href": "iterations/i/1",
          "rel": "self",
          "type": "application/vnd.zanata.project.iteration+json"
      }],
      "status": "ACTIVE",
      "projectType": "File"
  }],
  "status": "ACTIVE"
}
[prompt]$ curl http://localhost:7878/zanata/rest/projects/p/tiny-project/iterations/i/1/r
[{
    "name": "hello.txt",
    "contentType": "text/plain",
    "lang": "en-US",
    "extensions": null,
    "type": "FILE",
    "revision": 1
}]
```



## Data

The data available from this mock endpoint will intentionally be minimal,
so that it is easy to reason about.

### Tiny Project

A minimal project with a single version containing a single document.

 - id: tiny-project
 - version: 1
 - document: hello.txt


## Endpoints

Here is a list of the available endpoint URLs. Some are experimental
URLs for use in development, that are not yet present in the real
Zanata server.

### Real endpoints

These exist on the real Zanata server

 - projects
 - projects/p/{projectSlug}
 - projects/p/{projectSlug}/iterations/i/{versionSlug}
 - projects/p/{projectSlug}/iterations/i/{versionSlug}/r
 - projects/p/{projectSlug}/iterations/i/{versionSlug}/r/{docId}

### Fake endpoints

These do not exist on the real Zanata server, but may be implemented there
in the future.

 - projects/p/{projectSlug}/iterations/i/{versionSlug}/locales
   - get a list of the enabled translation locales for a project-version
