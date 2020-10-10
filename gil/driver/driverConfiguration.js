const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const neo4j = require('neo4j-driver');

const project = process.env.GOOGLE_PROJECT || 'graphs-are-everywhere';

// For proper auth, set GOOGLE_APPLICATION_CREDENTIALS to the key
// that contains project information & service account.
const getDriverOptions = async () => {
    const client = new SecretManagerServiceClient();

    const DRIVER_OPTIONS = {
        maxConnectionLifetime: 8 * 1000 * 60, // 8 minutes
        connectionLivenessCheckTimeout: 2 * 1000 * 60,
    };

    const [uriResponse] = await client.accessSecretVersion({
        name: `projects/${project}/secrets/NEO4J_URI/versions/latest`,
    });

    const [userResponse] = await client.accessSecretVersion({
        name: `projects/${project}/secrets/NEO4J_USER/versions/latest`,
    });

    const [passwordResponse] = await client.accessSecretVersion({
        name: `projects/${project}/secrets/NEO4J_PASSWORD/versions/latest`,
    });

    const uri = uriResponse.payload.data.toString('utf8');
    const user = userResponse.payload.data.toString('utf8');
    const password = passwordResponse.payload.data.toString('utf8');

    const auth = neo4j.auth.basic(user, password);

    return [uri, auth, DRIVER_OPTIONS];
}

module.exports = getDriverOptions;
