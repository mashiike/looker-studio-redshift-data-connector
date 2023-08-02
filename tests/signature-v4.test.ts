/*
  Original Code From: https://developer.mamezou-tech.com/blogs/2023/06/28/gas-using-npm-packages/
  Modified by: mashiike
  */

import {SignatureV4} from '@aws-sdk/signature-v4';
import {Sha256} from '@aws-crypto/sha256-js';
import {Signature} from '../src/signature-v4';

test('sign', async () => {
  const signerInit = {
    service: 's3',
    region: 'ap-northeast-3',
    sha256: Sha256,
    credentials: {
      accessKeyId: 'foo',
      secretAccessKey: 'bar',
    },
  };

  const signer = new SignatureV4(signerInit);
  const bucketName = 'mybucket';
  const contentType = 'application/json';

  const request = {
    method: 'PUT',
    protocol: 'https:',
    path: '/my.json',
    headers: {
      host: `${bucketName}.${signerInit.service}.${signerInit.region}.amazonaws.com`,
      'Content-Type': contentType,
      'X-Amz-Content-Sha256': 'UNSIGNED-PAYLOAD',
      'X-Amz-Security-Token': 'baz',
    },
    hostname: `${bucketName}.${signerInit.service}.${signerInit.region}.amazonaws.com`,
  };

  const signingDate = new Date('2000-01-01T00:00:00.000Z');
  const {headers} = await signer.sign(request, {signingDate: signingDate});

  console.log(headers);

  const target = new Signature(
    signerInit.service,
    signerInit.region,
    signerInit.credentials.accessKeyId,
    signerInit.credentials.secretAccessKey
  );

  const res = target.sign(signingDate, {
    method: 'PUT',
    protocol: 'https:',
    path: request.path,
    headers: {
      host: `${bucketName}.${signerInit.service}.${signerInit.region}.amazonaws.com`,
      'Content-Type': contentType,
      'X-Amz-Content-Sha256': 'UNSIGNED-PAYLOAD',
      'X-Amz-Security-Token': 'baz',
    },
    hostname: `${bucketName}.${signerInit.service}.${signerInit.region}.amazonaws.com`,
  });

  console.log(res.headers);

  expect(res.headers['Authorization']).toEqual(headers['authorization']);
});
