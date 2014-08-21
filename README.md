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
Mock server listening on port 7878
```

or specify a port:

```
[prompt]$ npm start --port=1234
...
Mock server listening on port 1234
```


Get resources from any of the endpoints listed under 'Endpoints' below:

```
[prompt]$ curl http://localhost:7878/projects
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
[prompt]$ curl http://localhost:7878/projects/p/tiny-project
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
[prompt]$ curl http://localhost:7878/projects/p/tiny-project/iterations/i/1/r
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


projects
projects/p/{projectSlug}
projects/p/{projectSlug}/iterations/i/{versionSlug}
projects/p/{projectSlug}/iterations/i/{versionSlug}/r
projects/p/{projectSlug}/iterations/i/{versionSlug}/r/{docId}