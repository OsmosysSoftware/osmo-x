// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { Environment } from './environment.interface';

export const environment: Environment = {
  production: false,
  graphqlEndpoint: 'http://localhost:3000/graphql',
  jsEncryptPrivateKey: `-----BEGIN PRIVATE KEY-----
MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBAKfxjBXowylzICqm
JqrhcQ/hAynK1s/kGgepGBtIAkBJCV911gozsMiKDJUSLOnEDtVWDMq71X2ECWwz
A9BXu1ZMbCnP+y2FBELRaCIZPMedv3Myk+DujPkN/J47Urvyhjw9+YsH8DDBXyuB
RBfnZzyTY2+hCEaI6CHL0ThljYPPAgMBAAECgYEAjQa4BNndsJvdQhMd21bOc3AX
EOwk8JPyC8bB2H7ibQsn1MKFxzFa3TuXj0Kg9nhNoHXO7htHDkxnATXhmP1i8Jr+
L7KBOiwnOKv7G0jjDAhEM7LjyS3fpC8T3BAhhUv6wK/chRZoJUfVbmG0N0awhTTW
jUgKClhlVqJRmjoe0DECQQDcclQzRpCShFQgTDG/UBmyH/TiHmujHyghUWDSBrqt
ZUjHdSIkTPs5nBLxqIOdKK/ASaqMqqSCiRLY6VoDGu2JAkEAwweAsh9fUa1tZ5k2
yvXrCwHfn7jzPhMaG3EtEKoPuuIMAeWTaBX6iD9JmC/7+TFv8eHoB7PCI3ljHonA
eZ4olwJAFbZxEqfVn4jHHHNExxolncTGAuuKIIP2GOoCBk3BX0jFlVe1KCwo5nC3
8PNvGzChtufKk5ZPI8hKgfDh+8JQOQJAFprMA9k3BxR+1b8gZq3SLFhvPugE6XD1
WbDodEIByLtigOXHDA1gGGKdeRI2tk9QlkyExD/FhK8RGf0FXhNCyQJABxECI8Wz
pCvTTZUUo01y9KL8Y2o8miDtOcg1CRv8NCWbBii/lSBQfMCm1pUAXMEP5dYHOAA1
8tmlvSCKUAXZyQ==
-----END PRIVATE KEY-----`,
  jsEncryptPublicKey: `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCn8YwV6MMpcyAqpiaq4XEP4QMp
ytbP5BoHqRgbSAJASQlfddYKM7DIigyVEizpxA7VVgzKu9V9hAlsMwPQV7tWTGwp
z/sthQRC0WgiGTzHnb9zMpPg7oz5DfyeO1K78oY8PfmLB/AwwV8rgUQX52c8k2Nv
oQhGiOghy9E4ZY2DzwIDAQAB
-----END PUBLIC KEY-----`,
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
