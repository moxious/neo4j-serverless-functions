# Neo4j Cloud Functions

Useful google cloud functions for working with neo4j.  Turn any neo4j
database into a data sink that can be useful for callback hooks!

## Pre-Requisites

- Have a Google Cloud project
- Have `gcloud` CLI installed
- Enable the Cloud Functions API on that project.

## Local Testing

```
./node_modules/.bin/functions start
./node_modules/.bin/functions deploy node --trigger-http
./node_modules/.bin/functions deploy edge --trigger-http
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