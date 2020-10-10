const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const neo4j = require('neo4j-driver');

const project = process.env.GCP_PROJECT || 'graphs-are-everywhere';

// For proper auth, set GOOGLE_APPLICATION_CREDENTIALS to the key
// that contains project information & service account.
const getDriverOptions = async () => {    
    const DRIVER_OPTIONS = {
        maxConnectionLifetime: 8 * 1000 * 60, // 8 minutes
        connectionLivenessCheckTimeout: 2 * 1000 * 60,
    };

    let uri, user, password;

    try {
        if (!process.env.URI_SECRET || !process.env.USER_SECRET || !process.env.PASSWORD_SECRET) {
            throw new Error('In order to use GSM, you must specify env vars URI_SECRET, USER_SECRET, PASSWORD_SECRET');
        }

        const client = new SecretManagerServiceClient();
        const [uriResponse] = await client.accessSecretVersion({ name: process.env.URI_SECRET });
        const [userResponse] = await client.accessSecretVersion({ name: process.env.USER_SECRET });
        const [passwordResponse] = await client.accessSecretVersion({ name: process.env.PASSWORD_SECRET });

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
