# Fake Zanata Server

A simple REST server that presents a REST API similar to
[Zanata Server](https://github.com/zanata/zanata-server).

## Purpose

Fake Zanata Server is a tool to support developers who are making apps
that communicate with a real Zanata server. It can also be used to try
out proposed REST endpoints for Zanata during API design.


## Dependencies

Requires [Node.js](http://nodejs.org/).


## Contributions

To contribute to this server, create a branch or fork with your changes
and submit a pull request for review.

Do not commit directly to master - it is not a maintainable practice. I
will revert, rewrite or annihilate commits that are not reviewed through
a pull request.


## Usage

Install dependencies:

```
[prompt]$ npm install
...
```

Start the server with the default settings:

```
[prompt]$ npm start
...
REST endpoint listening at http://localhost:7878/zanata/rest, with latency 50..500
```

You can change some settings with command-line flags:

```
[prompt]$ npm start --port=1234 --latency=1000..5000 --path=rest
...
REST endpoint listening at http://localhost:1234/rest, with latency 1000..5000
```

 - --port: any available system port to listen on. Default: 7878
 - --path: path to prepend to the local portion of each resource URL.
           Default: zanata/rest
 - --latency: milliseconds to delay each response. Can be a single number,
            or a range in the form `minimum..maximum`. Default: 50..500
 - --debug: true to show debugging information in the console. Default: false


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

 - Projects, Strings and Translations
   - projects
   - projects/p/{projectSlug}
   - projects/p/{projectSlug}/iterations/i/{versionSlug}
   - projects/p/{projectSlug}/iterations/i/{versionSlug}/r
   - projects/p/{projectSlug}/iterations/i/{versionSlug}/r/{encodedDocId*}
 - Statistics
   - /stats/proj/{projectSlug}/iter/{versionSlug}/doc/{encodedDocId*}


*Note: docId is encoded by replacing `/` with `,`.


### Fake endpoints

These do not exist on the real Zanata server, but may be implemented there
in the future.

 - projects/p/{projectSlug}/iterations/i/{versionSlug}/locales
   - get a list of the enabled translation locales for a project-version

 - projects/p/{projectSlug}/iterations/i/{versionSlug}/r/{docId}/states/{localeId}
   - get a list of all text flow ids with their state in a given locale
   - may want to allow query parameters for start index and limit, so that
     simple clients can use paging. Range header fields may be appropriate for
     this.
   - includes both the numeric database id (id) and the resource id (resId)
   - e.g.
     [
       { id: 1234, resId: "first", state: "translated" },
       { id: 1237, resId: "second", state: "fuzzy" },
       { id: 1238, resId: "third", state: "untranslated" }
     ]

 - /stats/proj/{projectSlug}/iter/{versionSlug}/doc/{encodedDocId*}/locale/{localeId}
   - get words and message statistic of given document in given locale

 - endpoints for getting string details: source, translation, or both
   - paths from root REST url:
     - source?ids={list-of-ids}
     - trans/{localeId}?ids={list-of-ids}
       - {document-path}/translations/{localeId} is already available, but is
         not quite right for what the editor will use.
     - source+trans/{localeId}?ids={list-of-ids}
   - response will be an object with the ids as keys, and the data as values.
   - data is an object in the form { source: <sourceData>, <localeId>: <translationData> }
     and may exclude one or the other key depending which method is used.
   - these include the full detail for the head revision in a given language of
     some text flows.
   - may respond with 403 (Forbidden) if the list of ids is too long. The
     limit should be set at a sufficiently high number as to prevent the editor
     getting a 403 response in normal operation.
   - numeric ids are used since they pose less challenges with encoding.
     - endpoints under a document resource may be added later that use a list of
       resIds. The path for such endpoints is purposely very different because
       resId is only unique within a document, and allowing both id and resId on
       the same resource could cause a lot of confusion.

 - /user
   - get authenticated user information

 - /user/{username}
   - get user's information with given username
   - e.g.
        {
          "username" : "username",
          "email" : "email",
          "name" : "display name",
          "gravatarHash" : "gravatar hash"
        }
