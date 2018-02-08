#!/bin/bash

LOCALDEPLOY=http://localhost:8010/test-drive-development/us-central1

curl -H "Content-Type: application/json" -X POST -d '{"username":"xyz","name":"David"}' $LOCALDEPLOY/node?label=User
curl -H "Content-Type: application/json" -X POST -d '{"username":"foo","name":"Mark"}' $LOCALDEPLOY/node?label=User
curl -H "Content-Type: application/json" -X POST -d '{"since":"yesterday","metadata":"whatever"}' \
   $LOCALDEPLOY'/edge?fromLabel=User&fromProp=username&fromVal=xyz&toLabel=User&toProp=username&toVal=foo&relType=knows'
