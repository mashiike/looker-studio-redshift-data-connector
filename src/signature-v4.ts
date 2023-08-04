/*
  Original Code From: https://developer.mamezou-tech.com/blogs/2023/06/28/gas-using-npm-packages/
  Modified by: mashiike
  */

import sha256 from 'crypto-js/sha256';
import hmac from 'crypto-js/hmac-sha256';
import hex from 'crypto-js/enc-hex';

export class Signature {
  service: string;
  region: string;
  access_key_id: string;
  secret_access_key: string;

  constructor(
    service: string,
    region: string,
    access_key_id: string,
    secret_access_key: string
  ) {
    this.service = service;
    this.region = region;
    this.access_key_id = access_key_id;
    this.secret_access_key = secret_access_key;
  }

  addZero(s: string | number): string {
    return (Number(s) < 10 ? '0' : '') + String(s);
  }

  dateStringFull(d: Date) {
    return (
      String(d.getUTCFullYear()) +
      this.addZero(d.getUTCMonth() + 1) +
      this.addZero(d.getUTCDate()) +
      'T' +
      this.addZero(d.getUTCHours()) +
      this.addZero(d.getUTCMinutes()) +
      this.addZero(d.getUTCSeconds()) +
      'Z'
    );
  }

  dateStringShort(d: Date) {
    return (
      String(d.getUTCFullYear()) +
      this.addZero(d.getUTCMonth() + 1) +
      this.addZero(d.getUTCDate())
    );
  }

  getSignatureKey(
    key: string,
    dateStamp: string,
    regionName: string,
    serviceName: string
  ): CryptoJS.lib.WordArray {
    const kDate = hmac(dateStamp, 'AWS4' + key);
    const kRegion = hmac(regionName, kDate);
    const kService = hmac(serviceName, kRegion);
    const kSigning = hmac('aws4_request', kService);

    return kSigning;
  }

  fixedEncodeURIComponent(str: string | number | boolean): string {
    return encodeURIComponent(str).replace(/[!'()*]/g, c => {
      return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    });
  }

  headers(h: {[key: string]: string}): string {
    return Object.keys(h)
      .sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1))
      .reduce((acc, k) => {
        acc += k.toLowerCase() + ':' + h[k] + '\n';
        return acc;
      }, '');
  }

  signedHeaders(h: {[key: string]: string}): string {
    return Object.keys(h)
      .sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1))
      .reduce((acc, k) => {
        if (acc) {
          acc += ';' + k.toLowerCase();
        } else {
          acc = k.toLowerCase();
        }
        return acc;
      }, '');
  }

  query(q: {[key: string]: string | number | boolean}): string {
    return Object.entries(q)
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .reduce((acc, [key, value]) => {
        if (acc) {
          acc += '&' + key + '=' + this.fixedEncodeURIComponent(value);
        } else {
          acc = key + '=' + this.fixedEncodeURIComponent(value);
        }
        return acc;
      }, '');
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  sign(signingDate: Date, request: {[key: string]: any}): {[key: string]: any} {
    const dateStringFull = this.dateStringFull(signingDate);
    const dateStringShort = this.dateStringShort(signingDate);

    request['headers']['X-Amz-Date'] = this.dateStringFull(signingDate);

    const algorithm = 'AWS4-HMAC-SHA256';
    const scope =
      dateStringShort +
      '/' +
      this.region +
      '/' +
      this.service +
      '/aws4_request';

    const headers = this.headers(request.headers);
    const signedHeaders = this.signedHeaders(request.headers);

    const query = this.query(request.query ? request.query : {});

    const canonicalString =
      request.method +
      '\n' +
      request.path +
      '\n' +
      query +
      '\n' +
      headers +
      '\n' +
      signedHeaders +
      '\n' +
      request.headers['X-Amz-Content-Sha256'];

    const canonHash = hex.stringify(sha256(canonicalString));

    const stringToSign =
      algorithm + '\n' + dateStringFull + '\n' + scope + '\n' + canonHash;

    const key = this.getSignatureKey(
      this.secret_access_key,
      dateStringShort,
      this.region,
      this.service
    );
    const signature = hex.stringify(hmac(stringToSign, key));

    request.headers[
      'Authorization'
    ] = `${algorithm} Credential=${this.access_key_id}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    request.headers = Object.assign(
      request.headers,
      request['unsingedHeaders']
    );
    delete request.headers['unsingedHeaders'];
    delete request.headers['host'];
    return request;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
