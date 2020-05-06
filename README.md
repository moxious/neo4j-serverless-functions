# Neo4j Cloud Functions

[![CircleCI](https://circleci.com/gh/moxious/neo4j-serverless-functions.svg?style=svg)](https://circleci.com/gh/moxious/neo4j-serverless-functions)

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

## Unit Testing

```
yarn test
```

## Local Testing

```
./node_modules/.bin/functions-framework --target=cud
./node_modules/.bin/functions-framework --target=node
./node_modules/.bin/functions-framework --target=edge
```

## Configure

Connection details to your Neo4j instance are taken out of three env vars:
- `NEO4J_USER`
- `NEO4J_PASSWORD`
- `NEO4J_URI`

## Deploy

*Make sure to tweak the settings in this deploy*.  This deploys unsecured functions
that unauthenticated users can connect to.  Tailor the settings to your needs.

```
export NEO4J_USER=neo4j
export NEO4J_PASSWORD=secret
export NEO4J_URI=neo4j+s://my-host:7687/

gcloud functions deploy cud \
     --ingress-settings=all --runtime=nodejs10 --allow-unauthenticated \
     --timeout=300 \
     --set-env-vars NEO4J_USER=$NEO4J_USER,NEO4J_PASSWORD=$NEO4J_PASSWORD,NEO4J_URI=$NEO4J_URI \
     --trigger-http

gcloud functions deploy node \
     --ingress-settings=all --runtime=nodejs10 --allow-unauthenticated \
     --timeout=300 \
     --set-env-vars NEO4J_USER=$NEO4J_USER,NEO4J_PASSWORD=$NEO4J_PASSWORD,NEO4J_URI=$NEO4J_URI \
     --trigger-http

gcloud functions deploy edge \
     --ingress-settings=all --runtime=nodejs10 --allow-unauthenticated \
     --timeout=300 \
     --set-env-vars NEO4J_USER=$NEO4J_USER,NEO4J_PASSWORD=$NEO4J_PASSWORD,NEO4J_URI=$NEO4J_URI \
     --trigger-http
```

[See related documentation](https://cloud.google.com/functions/docs/env-var)

## Quick Example of functions and their results

```
# Given this local deploy URL prefix (provided by local testing above)
LOCALDEPLOY=http://localhost:8080/

# CUD
curl --data @test/cud-messages.json \
    -H "Content-Type: application/json" -X POST \
    $LOCALDEPLOY

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

## CUD Function

The CUD function takes an array of CUD command objects.

The CUD format is a tiny JSON format that allows you to specify a graph "Create, Update, 
or Delete" (CUD) operation on a graph.  For example, a JSON message may indicate that you 
want to create a node with certain labels and properties.

[See here for documentation on the CUD format](https://neo4j.com/docs/labs/neo4j-streams/current/#_cud_file_format)

Example:

```
curl --data @test/cud-messages.json \
    -H "Content-Type: application/json" -X POST \
    $LOCALDEPLOY
```