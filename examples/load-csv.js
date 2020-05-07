const csv = require('csv-load-sync');
const request = require('request-promise');
const args = require('yargs')
    .example('$0 -f people.csv -l Person -u http://localhost:8080/WhereCypherRuns')
    .describe('u', 'URL where the Cypher endpoint runs')
    .describe('f', 'CSV file to load')
    .describe('l', 'Label to apply to all nodes in the CSV')
    .describe('c', 'Cypher to execute')
    .demandOption(['u', 'f'])
    .argv;
   
if ((!args.l && !args.c) || (args.l && args.c)) {
    throw new Error('You must specify exactly one of either -l label or -c Cypher');
}

const data = csv(args.f);

const cypher = args.l ? `CREATE (n:\`${args.l}\`) SET n += event` : args.c;

request({
    uri: args.u,
    method: 'POST',
    json: true,
    body: {
        cypher,
        batch: data,
    },
})
    .then(results => {
        console.log(JSON.stringify(results, null, 2));
    })
    .catch(err => console.error(err));
