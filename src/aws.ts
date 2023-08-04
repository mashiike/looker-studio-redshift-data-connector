import {Signature} from './signature-v4';
import sha256 from 'crypto-js/sha256';
import hex from 'crypto-js/enc-hex';

type AssumeRoleWithWebIdentityRequest = {
  RoleArn: string;
  RoleSessionName?: string;
  DurationSeconds?: number;
};

export type AWSCredentials = {
  AccessKeyId: string;
  SecretAccessKey: string;
  SessionToken: string;
  Expiration: string;
};

export type AssumeRoleWithWebIdentityResult = {
  SubjectFromWebIdentityToken: string;
  Audience: string;
  AssumedRoleUser?: {
    Arn: string;
    AssumedRoleId: string;
  };
  SourceIdentity: string;
  Provider: string;
  Credentials?: AWSCredentials;
};

export function AssumeRoleWithWebIdentity(
  cc: GoogleAppsScript.Data_Studio.CommunityConnector,
  request: AssumeRoleWithWebIdentityRequest
): AssumeRoleWithWebIdentityResult {
  if (!request.RoleArn) {
    cc.newUserError().setText('RoleArn is undefined').throwException();
  }
  if (!request.RoleSessionName) {
    request.RoleSessionName =
      'looker-studio=' + Session.getActiveUser().getEmail();
  }
  if (!request.DurationSeconds) {
    request.DurationSeconds = 900;
  }
  const baseUrl = 'https://sts.amazonaws.com/';
  const params: {[name: string]: number | string | boolean} = {
    Action: 'AssumeRoleWithWebIdentity',
    RoleArn: request.RoleArn,
    DurationSeconds: request.DurationSeconds,
    RoleSessionName: request.RoleSessionName,
    WebIdentityToken: ScriptApp.getIdentityToken(),
    Version: '2011-06-15',
  };
  const query = Object.keys(params)
    .map(key => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    })
    .join('&');
  const resp = UrlFetchApp.fetch(baseUrl + '?' + query, {
    muteHttpExceptions: true,
  });
  if (resp.getResponseCode() !== 200) {
    const httpResponseCode = resp.getResponseCode();
    const err = ParseXmlErrorResponse(resp.getContentText());
    const message = `Faield to AssumeRoleWithWebIdentity(${httpResponseCode}): ${err.Error?.Code} ${err.Error?.Message}`;
    cc.newUserError().setText(message).throwException();
  }
  const xmlDocs = XmlService.parse(resp.getContentText());
  const root = xmlDocs.getRootElement();
  const nsDefault = root.getNamespace();
  const resultElement = root.getChild(
    'AssumeRoleWithWebIdentityResult',
    nsDefault
  );
  if (resultElement === null) {
    cc.newUserError()
      .setText('AssumeRoleWithWebIdentityResult is null')
      .throwException();
  }
  const result: AssumeRoleWithWebIdentityResult = {
    SubjectFromWebIdentityToken: resultElement
      .getChild('SubjectFromWebIdentityToken', nsDefault)
      ?.getText(),
    Audience: resultElement.getChild('Audience', nsDefault)?.getText(),
    SourceIdentity: resultElement
      .getChild('SourceIdentity', nsDefault)
      ?.getText(),
    Provider: resultElement.getChild('Provider', nsDefault)?.getText(),
  };
  const credentials = resultElement.getChild('Credentials', nsDefault);
  if (credentials) {
    result.Credentials = {
      SecretAccessKey: credentials
        .getChild('SecretAccessKey', nsDefault)
        ?.getText(),
      SessionToken: credentials.getChild('SessionToken', nsDefault)?.getText(),
      Expiration: credentials.getChild('Expiration', nsDefault)?.getText(),
      AccessKeyId: credentials.getChild('AccessKeyId', nsDefault)?.getText(),
    };
  }
  const assumedRoleUser = resultElement.getChild('AssumedRoleUser', nsDefault);
  if (assumedRoleUser) {
    result.AssumedRoleUser = {
      Arn: assumedRoleUser.getChild('Arn', nsDefault)?.getText(),
      AssumedRoleId: assumedRoleUser
        .getChild('AssumedRoleId', nsDefault)
        ?.getText(),
    };
  }
  return result;
}

export type AWSErrorResponse = {
  RequestId?: string;
  Error?: {
    Type?: string;
    Code?: string;
    Message?: string;
  };
};

export function ParseXmlErrorResponse(responseBody: string): AWSErrorResponse {
  const xmlDocs = XmlService.parse(responseBody);
  const root = xmlDocs.getRootElement();
  const nsDefault = root.getNamespace();
  const result: AWSErrorResponse = {
    RequestId: root.getChild('RequestId', nsDefault)?.getText(),
  };
  const error = root.getChild('Error', nsDefault);
  if (error === null) {
    return result;
  }
  result.Error = {
    Type: error.getChild('Type', nsDefault)?.getText(),
    Code: error.getChild('Code', nsDefault)?.getText(),
    Message: error.getChild('Message', nsDefault)?.getText(),
  };
  return result;
}

export type DescribeTableRequest = {
  ClusterIdentifier?: string;
  ConnectedDatabase?: string;
  Database: string;
  DbUser?: string;
  MaxResults?: number;
  NextToken?: string;
  Schema: string;
  SecretArn?: string;
  Table: string;
  WorkgroupName?: string;
};

export type DescribeTableResponse = {
  ColumnList: {
    columnDefault: string;
    isCaseSensitive: boolean;
    isCurrency: boolean;
    isSigned: boolean;
    label: string;
    length: number;
    name: string;
    nullable: number;
    precision: number;
    scale: number;
    schemaName: string;
    tableName: string;
    typeName: string;
  }[];
  NextToken?: string;
  TableName: string;
};

export type ExecuteStatementRequest = {
  ClientToken?: string;
  ClusterIdentifier?: string;
  Database: string;
  DbUser?: string;
  Parameters?: {
    name: string;
    value: string;
  }[];
  SecretArn?: string;
  Sql: string;
  StatementName?: string;
  WithEvent?: boolean;
  WorkgroupName?: string;
};

export type ExecuteStatementResponse = {
  ClusterIdentifier?: string;
  CreatedAt: number;
  Database: string;
  DbUser?: string;
  Id: string;
  SecretArn?: string;
  WorkgroupName?: string;
};

export type DescribeStatementRequest = {
  Id: string;
};

export type DescribeStatementResponse = {
  ClusterIdentifier?: string;
  CreatedAt: number;
  Database: string;
  DbUser?: string;
  Duration: number;
  Error?: string;
  HasResultSet: boolean;
  Id: string;
  QueryParameters?: {
    name: string;
    value: string;
  }[];
  QueryString: string;
  RedshiftPid?: number;
  RedshiftQueryId?: number;
  ResultRows?: number;
  ResultSize?: number;
  SecretArn?: string;
  Status: string;
  SubStatements?: {
    CreatedAt: number;
    Duration: number;
    Error?: string;
    HasResultSet: boolean;
    Id: string;
    QueryString: string;
    RedshiftQueryId?: number;
    ResultRows?: number;
    ResultSize?: number;
    Status: string;
    UpdatedAt: number;
  }[];
  UpdatedAt: number;
  WorkgroupName?: string;
};

export type GetStatementResultRequest = {
  Id: string;
  NextToken?: string;
};

export type Field = {
  blobValue?: string;
  stringValue?: string;
  isNull?: boolean;
  booleanValue?: boolean;
  doubleValue?: number;
  longValue?: number;
};

export type Record = Field[];

export type GetStatementResultResponse = {
  ColumnMetadata: {
    label: string;
    name: string;
    typeName: string;
  }[];
  NextToken?: string;
  Records: Record[];
  TotalNumRows: number;
};
export class RedshiftDataAPIClient {
  credentials: AWSCredentials;
  cc: GoogleAppsScript.Data_Studio.CommunityConnector;
  region: string;
  constructor(
    cc: GoogleAppsScript.Data_Studio.CommunityConnector,
    credentials?: AWSCredentials,
    region = 'ap-northeast-1'
  ) {
    if (credentials === undefined) {
      throw cc.newUserError().setText('credentials undefined');
    }
    this.credentials = credentials;
    this.cc = cc;
    this.region = region;
  }

  send(
    action: string,
    payload: string | any, // eslint-disable-line @typescript-eslint/no-explicit-any
    muteHttpExceptions = false
  ): GoogleAppsScript.URL_Fetch.HTTPResponse {
    if (action === undefined) {
      this.cc.newUserError().setText('Action undefined').throwException();
    }

    if (payload === undefined) {
      payload = '';
    } else if (typeof payload !== 'string') {
      payload = JSON.stringify(payload);
    }
    const hostname = `redshift-data.${this.region}.amazonaws.com`;
    const request = {
      method: 'POST',
      protocol: 'https:',
      path: '/',
      headers: {
        host: hostname,
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': `RedshiftData.${action}`,
        'X-Amz-Content-Sha256': hex.stringify(sha256(payload)),
        'X-Amz-Security-Token': this.credentials.SessionToken,
      },
      unsiginedHeaders: {
        'User-Agent':
          'github.com/mashiike/looker-studio-redshift-data-connector',
      },
      hostname: hostname,
    };
    const signingDate = new Date();
    const signer = new Signature(
      'redshift-data',
      this.region,
      this.credentials.AccessKeyId,
      this.credentials.SecretAccessKey
    );
    const signedRequest = signer.sign(signingDate, request);
    const resp = UrlFetchApp.fetch(
      signedRequest.protocol +
        '//' +
        signedRequest.hostname +
        signedRequest.path,
      {
        method: signedRequest.method,
        headers: signedRequest.headers,
        payload: payload,
        muteHttpExceptions: muteHttpExceptions,
      }
    );
    if (resp.getResponseCode() !== 200) {
      const httpResponseCode = resp.getResponseCode();
      const err = JSON.parse(resp.getContentText());
      const errCode = typeof err;
      const errMessage = err.message || err.Message || JSON.stringify(err);
      const message = `Faield to DescribeTable(${httpResponseCode}): ${errCode} ${errMessage}`;
      this.cc
        .newUserError()
        .setText(message)
        .setDebugText(
          JSON.stringify(signedRequest) + '\n\n' + resp.getContentText()
        )
        .throwException();
    }
    return resp;
  }

  // https://docs.aws.amazon.com/redshift-data/latest/APIReference/API_DescribeTable.html
  describeTable(request: DescribeTableRequest): DescribeTableResponse {
    const resp = this.send('DescribeTable', request);
    const result = JSON.parse(resp.getContentText());
    return result;
  }

  // https://docs.aws.amazon.com/redshift-data/latest/APIReference/API_ExecuteStatement.html
  executeStatement(request: ExecuteStatementRequest): ExecuteStatementResponse {
    const sqlHash = hex.stringify(sha256(request.Sql));
    if (request.ClientToken === undefined) {
      request.ClientToken = sqlHash;
    }
    const resp = this.send('ExecuteStatement', request);
    const result = JSON.parse(resp.getContentText());
    return result;
  }

  // https://docs.aws.amazon.com/redshift-data/latest/APIReference/API_DescribeStatement.html
  describeStatement(
    request: DescribeStatementRequest
  ): DescribeStatementResponse {
    const resp = this.send('DescribeStatement', request);
    const result = JSON.parse(resp.getContentText());
    return result;
  }

  //https://docs.aws.amazon.com/redshift-data/latest/APIReference/API_GetStatementResult.html
  getStatementResult(
    request: GetStatementResultRequest
  ): GetStatementResultResponse {
    const resp = this.send('GetStatementResult', request);
    const result = JSON.parse(resp.getContentText());
    return result;
  }
}
