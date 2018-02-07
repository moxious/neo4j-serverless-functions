# Neo4j Cloud Functions

Useful google cloud functions for working with neo4j. 

## Requirements

You must have a GCP project, the `gcloud` CLI installed, and have enabled Google Cloud Functions API in that
project in order to use this repo.

## Local Testing

```
./node_modules/.bin/functions start
./node_modules/.bin/functions deploy node --trigger-http
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

Believe it or not, [google cloud functions don't yet support env vars](https://issuetracker.google.com/issues/35907643)

This file will not be checked into git, and you should take care to protect it.  If the file is missing, the functions will take local env
vars `NEO4J_USER`, `NEO4J_PASS`, and `NEO4J_URI`, which will work locally
but not when deployed.

## Deploy

```
gcloud beta functions deploy node --trigger-http
gcloud beta functions deploy edge --trigger-http
```

## Node Function

This function takes all data reported into the endpoint, and creates a node with a specified label having those properties.   Example:

```
curl http://whatever-endpoint/node?label=Foo&x=1&y=2
```

Will result in a node with the label Foo, having property names like `query.x=1, query.y=2`.   You can also POST a JSON body to the function,
and it will store whatever it is sent under body properties.

Obviously this schema isn't going to work for most people in most use cases, but it's a very easy starting point.  The node function can easily
be customized to create data however wished.

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