# Examples

This is a separate JS project in the same repo, so make sure to run:

```
npm install
```

## Load some CSV with Custom Cypher

Note the URL, this is assuming you're running the function locally.

This will load a set of Emoji along with their categories into the database that the service
is pointing at.

```
CYPHER="MERGE (c:Category { name: event.category }) CREATE (e:Emoji) SET e += event CREATE (e)-[:IN]->(c)"
node load-csv.js -u http://localhost:8080/ -f all-emojis.csv \
    -c "$CYPHER"
```