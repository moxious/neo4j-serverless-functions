const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const neo4j = require('neo4j-driver');

const project = process.env.GCP_PROJECT || 'graphs-are-everywhere';

// For proper auth, set GOOGLE_APPLICATION_CREDENTIALS to the key
// that contains project information & service account.
const getDriverOptions = async (config=process.env) => {    
    const DRIVER_OPTIONS = {
        maxConnectionLifetime: 8 * 1000 * 60, // 8 minutes
        connectionLivenessCheckTimeout: 2 * 1000 * 60,
    };

    let uri, user, password;

    if (config.URI_SECRET && config.USER_SECRET && config.PASSWORD_SECRET) {
        const client = new SecretManagerServiceClient();
        const val = await client.accessSecretVersion({ name: config.URI_SECRET });
        console.log('SECRET ',val);

        const [uriResponse] = await client.accessSecretVersion({ name: config.URI_SECRET });
        const [userResponse] = await client.accessSecretVersion({ name: config.USER_SECRET });
        const [passwordResponse] = await client.accessSecretVersion({ name: config.PASSWORD_SECRET });

        uri = uriResponse.payload.data.toString('utf8');
        user = userResponse.payload.data.toString('utf8');
        password = passwordResponse.payload.data.toString('utf8');
    } else {
        console.error('Attempting to configure driver from the environment, as Google Secret Manager keys are not present');

        uri = config.NEO4J_URI;
        user = config.NEO4J_USER;
        password = config.NEO4J_PASSWORD;
    }

    if (!uri || !user || !password) {
        throw new Error('You must either configure Google Secrets Manager for connection details, or you must specify environment variables');
    }

    const auth = neo4j.auth.basic(user, password);

    return [uri, auth, DRIVER_OPTIONS];
}

module.exports = getDriverOptions;
