const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const neo4j = require('neo4j-driver');

const project = process.env.GOOGLE_PROJECT || 'graphs-are-everywhere';

// For proper auth, set GOOGLE_APPLICATION_CREDENTIALS to the key
// that contains project information & service account.
const getDriverOptions = async () => {    
    const DRIVER_OPTIONS = {
        maxConnectionLifetime: 8 * 1000 * 60, // 8 minutes
        connectionLivenessCheckTimeout: 2 * 1000 * 60,
    };

    let uri, user, password;

    try {
        const client = new SecretManagerServiceClient();
        const [uriResponse] = await client.accessSecretVersion({
            name: `projects/${project}/secrets/NEO4J_URI/versions/latest`,
        });

        const [userResponse] = await client.accessSecretVersion({
            name: `projects/${project}/secrets/NEO4J_USER/versions/latest`,
        });

        const [passwordResponse] = await client.accessSecretVersion({
            name: `projects/${project}/secrets/NEO4J_PASSWORD/versions/latest`,
        });

        uri = uriResponse.payload.data.toString('utf8');
        user = userResponse.payload.data.toString('utf8');
        password = passwordResponse.payload.data.toString('utf8');
    } catch (err) {
        console.error('Failed to use Google Secrets Manager to configure the environment, due to:');
        console.error(err);

        uri = process.env.NEO4J_URI;
        user = process.env.NEO4J_USER;
        password = process.env.NEO4J_PASSWORD;
    }

    if (!uri || !user || !password) {
        throw new Error('You must either configure Google Secrets Manager for connection details, or you must specify environment variables');
    }

    const auth = neo4j.auth.basic(user, password);

    return [uri, auth, DRIVER_OPTIONS];
}

module.exports = getDriverOptions;
