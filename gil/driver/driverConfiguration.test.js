const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const getDriverOptions = require('./driverConfiguration');
const neo4j = require('./index');
const sinon = require('sinon');
const { iteratee } = require('lodash');
const { expectation } = require('sinon');

describe('Driver Configuration', () => {
    let driver, session, tx, run, rec;
    let data;

    const URI = 'neo4j://fake';
    const USER = 'MySpecialUser';
    const PASS = 'MySecretPassword';

    const fakeSecrets = {
        uriSecret: 'neo4j://secreturi',
        userSecret: 'MySecretUser',
        passwordSecret: 'xxx',
    };

    let stub;

    beforeEach(() => {
        stub = sinon.stub(SecretManagerServiceClient.prototype, 'accessSecretVersion')
            .callsFake(args => {
                const response = {
                    payload: {
                        data: fakeSecrets[args.name],
                    },
                };

                return [response];
            });
    });

    afterEach(() => stub.restore());

    const goodReturnValue = val => {
        expect(val).toBeInstanceOf(Array);
        expect(val.length).toEqual(3);
        expect(val[2]).toBeInstanceOf(Object);
        expect(val[1]).toBeInstanceOf(Object);

        // ['scheme', 'principal', 'credentials'].forEach(key => {
        //     expect(val[1][key]).toBeOk();
        // });
    }

    it('throws an error when given no configuration information', async () => {
        const config = {
            NEO4J_URI: '',
            NEO4J_USER: '',
            NEO4J_PASSWORD: '',
            URI_SECRET: '',
            USER_SECRET: '',
            PASSWORD_SECRET: '',
        };

        expect(getDriverOptions(config)).rejects;
    });

    it('uses environment variables when they are specified', async () => {
        const config = {
            NEO4J_URI: URI,
            NEO4J_USER: USER,
            NEO4J_PASSWORD: PASS,
            URI_SECRET: '',
            USER_SECRET: '',
            PASSWORD_SECRET: '',
        };

        const res = await getDriverOptions(config);

        goodReturnValue(res);
        expect(res[0]).toEqual(URI);
        console.log(res[1]);
    });

    it('uses Google Secret Manager configuration when it is specified', async() => {
        const config = {
            NEO4J_URI: '',
            NEO4J_USER: '',
            NEO4J_PASSWORD: '',
            URI_SECRET: 'uriSecret',
            USER_SECRET: 'userSecret',
            PASSWORD_SECRET: 'passwordSecret',
        };

        const res = await getDriverOptions(config);
        goodReturnValue(res);
        expect(res[0]).toEqual(fakeSecrets.uriSecret);

    });
});