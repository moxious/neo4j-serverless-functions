# Neo4j Cloud Functions

Useful google cloud functions for working with neo4j.  Turn any neo4j
database into a data sink that can be useful for callback hooks!

Any online service that permits a callback webhook can use this code.  Right now I'm
using it with Trello and Slack, but others are possible too.

## Pre-Requisites

- Have a Google Cloud project
- Have `gcloud` CLI installed
- Enable the Cloud Functions API on that project.

## Setup

```
yarn install
```

## Local Testing

```
./node_modules/.bin/functions-framework --target=node
./node_modules/.bin/functions-framework --target=edge
```

Inspect local logs with

```
./node_modules/.bin/functions logs read
```

## Configure

Place a file called `creds.json` in the neo4j subdirectory, looking like this:

```
{
    "username": "neo4j",
    "password": "neo4j",
    "uri": "bolt://localhost"
}
```

This file will not be checked into git, and you should take care to protect it.  If the file is missing, the functions will take local env
vars `NEO4J_USER`, `NEO4J_PASSWORD`, and `NEO4J_URI`, which will work locally
but not when deployed.

## Deploy

```
export NEO4J_USER=neo4j
export NEO4J_PASSWORD=secret
export NEO4J_URI=neo4j+s://my-host:7687/

gcloud beta functions deploy node \
     --set-env-vars NEO4J_USER=$NEO4J_USER,NEO4J_PASSWORD=$NEO4J_PASSWORD,NEO4J_URI=$NEO4J_URI \
     --trigger-http

gcloud beta functions deploy edge \
     --set-env-vars NEO4J_USER=$NEO4J_USER,NEO4J_PASSWORD=$NEO4J_PASSWORD,NEO4J_URI=$NEO4J_URI FOO=bar,BAZ=boo \
     --trigger-http
```

[See related documentation](https://cloud.google.com/functions/docs/env-var)

## Quick Example of functions and their results

```
# Given this local deploy URL prefix (provided by local testing above)
LOCALDEPLOY=http://localhost:8010/my-project/my-zone

# Node
curl -H "Content-Type: application/json" -X POST \
   -d '{"username":"xyz","name":"David"}' \
   $LOCALDEPLOY/node?label=User

# Node
curl -H "Content-Type: application/json" -X POST \
   -d '{"username":"foo","name":"Mark"}' \
   $LOCALDEPLOY/node?label=User

# Edge
curl -H "Content-Type: application/json" -X POST \
   -d '{"since":"yesterday","metadata":"whatever"}' \
   $LOCALDEPLOY'/edge?fromLabel=User&fromProp=username&fromVal=xyz&toLabel=User&toProp=username&toVal=foo&relType=knows'
```

![Example Result Graph](example.png)

## Node Function

This function takes JSON body data reported into the endpoint, and creates a node with a specified label having those properties.   Example:

```
curl -XPOST -d '{"name":"Bob"}' http://cloud-endpoint/node?label=Person
```

Will result in a node with the label Foo, having property names like `name:"Bob"`.

If deeply nested JSON is posted to the endpoint, the dictionary will be flattened, so that:
```
{
    "model": {
        "name": "something"
    }
}
```

Will turn into a property 

```
`model.name`: "something"
```

in neo4j.

By customizing the URL you use for the webhook, you can track source of data.  For example,
providing to the slack external webhook a URL of: `http://cloud-endpoint/node?label=SlackMessage`.

## Edge Function

This function matches two nodes, and creates a relationship between them with a given set of properties.

Example:

```
curl -XPOST -d '{"x":1,"y":2}' 'http://localhost:8010/test-drive-development/us-central1/edge?fromLabel=Foo&toLabel=Foo&fromProp=x&toProp=x&fro=6&toVal=5&relType=blark'
```

This is equivalent to doing this in Cypher:

```
   MATCH (a:Foo { x: "5" }), (b:Foo { x: "6" })
   CREATE (a)-[:blark { x: 1, y: 2 }]->(b);
```

Any POST'd JSON data will be stored as properties on the relationship.

## Request Metadata

HTTP headers associated with the requests will be stored in `:Request` nodes, which are linked
to the nodes created by the functions, for traceability.