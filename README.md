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

```
// Enable the runtimeconfig API
gcloud service-management enable runtimeconfig.googleapis.com

gcloud beta runtime-config configs create neo4j

gcloud beta runtime-config configs variables \
    set neo4j.username "neo4j" \
    --config-name neo4j

gcloud beta runtime-config configs variables \
    set neo4j.password "neo4j" \
    --config-name neo4j    

gcloud beta runtime-config configs variables \
    set neo4j.uri "bolt://my-neo4j-host.whatever.com" \
    --config-name neo4j    
```

## Deploy

```
gcloud beta functions deploy helloGET --trigger-http
```