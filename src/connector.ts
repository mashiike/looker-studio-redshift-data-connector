import {
  AssumeRoleWithWebIdentity,
  RedshiftDataAPIClient,
  DescribeTableRequest,
  DescribeTableResponse,
  GetStatementResultRequest,
  GetStatementResultResponse,
} from './aws';

type RedshiftDataConnectorParams = {
  IAMRoleARN: string;
  Region: string;
  WorkgroupName: string;
  ClusterIdentifier: string;
  DBUser: string;
  Database: string;
  Schema: string;
  Table: string;
};

type RedshiftDataConnectorRequest =
  GoogleAppsScript.Data_Studio.Request<RedshiftDataConnectorParams>;

// https://developers.google.com/datastudio/connector/reference#getconfig
export function getConfig(
  request: RedshiftDataConnectorRequest // eslint-disable-line @typescript-eslint/no-unused-vars
) {
  const cc = DataStudioApp.createCommunityConnector();
  const config = cc.getConfig();
  config
    .newInfo()
    .setId('instructions')
    .setText(
      'Enter IAM Role ARN and target Redshift information to connect to your data.'
    );

  config
    .newTextInput()
    .setId('IAMRoleARN')
    .setName('Enter a single IAM Role ARN (required)')
    .setHelpText('e.g. arn:aws:iam::123456789012:role/MyRedshiftRole')
    .setPlaceholder('arn:aws:iam::123456789012:role/MyRedshiftRole');

  config
    .newTextInput()
    .setId('Region')
    .setName('Enter a aws region (required)')
    .setHelpText('e.g. ap-northeast-1')
    .setPlaceholder('ap-northeast-1');

  config
    .newTextInput()
    .setId('WorkgroupName')
    .setName(
      'Enter a redshift serverless workgroup name (only if use Redshift Serverless)'
    )
    .setHelpText('e.g. default')
    .setPlaceholder('default');

  config
    .newTextInput()
    .setId('ClusterIdentifier')
    .setName(
      'Enter a redshift provisioned cluster identifier (only if use Redshift Provisioned)'
    )
    .setHelpText('e.g. default')
    .setPlaceholder('default');

  config
    .newTextInput()
    .setId('DBUser')
    .setName(
      'Enter a redshift database user name (only if use Redshift Provisioned)'
    )
    .setHelpText('e.g. awsuser')
    .setPlaceholder('awsuser');

  config
    .newTextInput()
    .setId('Database')
    .setName('Enter a redshift database name')
    .setHelpText('e.g. dev')
    .setPlaceholder('dev');

  config
    .newTextInput()
    .setId('Schema')
    .setName('Enter a redshift schema name')
    .setHelpText('e.g. public')
    .setPlaceholder('public');

  config
    .newTextInput()
    .setId('Table')
    .setName('Enter a redshift table name')
    .setHelpText('e.g. users')
    .setPlaceholder('users');

  return config.build();
}

function getFields(
  cc: GoogleAppsScript.Data_Studio.CommunityConnector,
  request: RedshiftDataConnectorRequest,
  client: RedshiftDataAPIClient
): GoogleAppsScript.Data_Studio.Fields {
  const params: DescribeTableRequest = {
    Database: request.configParams.Database,
    Schema: request.configParams.Schema,
    Table: request.configParams.Table,
    ClusterIdentifier:
      request.configParams.ClusterIdentifier === ''
        ? undefined
        : request.configParams.ClusterIdentifier,
    DbUser:
      request.configParams.DBUser === ''
        ? undefined
        : request.configParams.DBUser,
    WorkgroupName:
      request.configParams.WorkgroupName === ''
        ? undefined
        : request.configParams.WorkgroupName,
  };
  const resp = client.describeTable(params);
  if (resp.ColumnList.length === 0) {
    cc.newUserError()
      .setText(
        'You may not have access to this table. because column list is empty.'
      )
      .throwException();
  }
  const fields = cc.getFields();
  const types = cc.FieldType;

  const f = (resp: DescribeTableResponse) => {
    resp.ColumnList.forEach(column => {
      switch (column.typeName) {
        case 'smallint':
        case 'int2':
        case 'integer':
        case 'int':
        case 'int4':
        case 'bigint':
        case 'int8':
        case 'decimal':
        case 'numeric':
        case 'real':
        case 'float4':
        case 'double precision':
        case 'float8':
        case 'float':
          fields
            .newDimension()
            .setId(column.name)
            .setName(column.name)
            .setType(types.NUMBER);
          break;
        case 'boolean':
        case 'bool':
          fields
            .newDimension()
            .setId(column.name)
            .setName(column.name)
            .setType(types.BOOLEAN);
          break;
        case 'date':
          fields
            .newDimension()
            .setId(column.name)
            .setName(column.name)
            .setType(types.YEAR_MONTH_DAY);
          break;
        case 'timestamp':
        case 'timestamp without time zone':
        case 'timestamp with time zone':
        case 'timestamptz':
          fields
            .newDimension()
            .setId(column.name)
            .setName(column.name)
            .setType(types.YEAR_MONTH_DAY_SECOND);
          break;
        case 'time':
        case 'time without time zone':
        case 'time with time zone':
        case 'timetz':
          fields
            .newDimension()
            .setId(column.name)
            .setName(column.name)
            .setType(types.HOUR);
          break;
        case 'character':
        case 'char':
        case 'nchar':
        case 'bpchar':
        case 'character varying':
        case 'varchar':
        case 'nvarchar':
        case 'text':
          fields
            .newDimension()
            .setId(column.name)
            .setName(column.name)
            .setType(types.TEXT);
          break;
        default:
          break;
      }
    });
  };
  f(resp);
  let currentResp = resp;
  while (currentResp.NextToken) {
    params.NextToken = currentResp.NextToken;
    currentResp = client.describeTable(params);
    f(currentResp);
  }

  return fields;
}

function newRedshiftDataAPIClient(
  cc: GoogleAppsScript.Data_Studio.CommunityConnector,
  request: RedshiftDataConnectorRequest
): RedshiftDataAPIClient {
  const result = AssumeRoleWithWebIdentity(cc, {
    RoleArn: request.configParams.IAMRoleARN,
  });
  return new RedshiftDataAPIClient(cc, result.Credentials);
}

// https://developers.google.com/datastudio/connector/reference#getschema
export function getSchema(
  request: RedshiftDataConnectorRequest
): GoogleAppsScript.Data_Studio.GetSchemaResponse {
  const cc = DataStudioApp.createCommunityConnector();
  const client = newRedshiftDataAPIClient(cc, request);
  return cc
    .newGetSchemaResponse()
    .setFields(getFields(cc, request, client))
    .build();
}

interface requestField {
  name: string;
}

// https://developers.google.com/datastudio/connector/reference#getdata
export function getData(
  request: RedshiftDataConnectorRequest
): GoogleAppsScript.Data_Studio.GetDataResponse {
  const cc = DataStudioApp.createCommunityConnector();
  const client = newRedshiftDataAPIClient(cc, request);

  const fields = getFields(cc, request, client);
  const requestedFields = fields.forIds(
    request.fields.map((field: requestField) => {
      return field.name;
    })
  );
  const resp = cc.newGetDataResponse().setFields(requestedFields);
  let query =
    '/* Looker Studio Redshift Data API Connector query */\n' +
    'SELECT \n  ' +
    requestedFields
      .asArray()
      .map((field: GoogleAppsScript.Data_Studio.Field) => {
        const id = field.getId();
        let str = '"' + id + '"';
        //https://developers.google.com/looker-studio/connector/reference#field
        switch (field.getType()) {
          case cc.FieldType.TEXT:
            break;
          case cc.FieldType.YEAR:
            str = 'TO_CHAR(' + str + ", 'YYYY')";
            break;
          case cc.FieldType.YEAR_QUARTER:
            str = 'TO_CHAR(' + str + ", 'YYYYQ')";
            break;
          case cc.FieldType.YEAR_MONTH:
            str = 'TO_CHAR(' + str + ", 'YYYYMM')";
            break;
          case cc.FieldType.YEAR_WEEK:
            str = 'TO_CHAR(' + str + ", 'YYYYWW')";
            break;
          case cc.FieldType.YEAR_MONTH_DAY:
            str = 'TO_CHAR(' + str + ", 'YYYYMMDD')";
            break;
          case cc.FieldType.YEAR_MONTH_DAY_HOUR:
            str = 'TO_CHAR(' + str + ", 'YYYYMMDDHH24')";
            break;
          case cc.FieldType.YEAR_MONTH_DAY_SECOND:
            str = 'TO_CHAR(' + str + ", 'YYYYMMDDHH24MISS')";
            break;
          case cc.FieldType.QUARTER:
            str = 'TO_CHAR(' + str + ", 'Q')";
            break;
          case cc.FieldType.MONTH:
            str = 'TO_CHAR(' + str + ", 'MM')";
            break;
          case cc.FieldType.WEEK:
            str = 'TO_CHAR(' + str + ", 'WW')";
            break;
          case cc.FieldType.MONTH_DAY:
            str = 'TO_CHAR(' + str + ", 'MMDD')";
            break;
          case cc.FieldType.DAY_OF_WEEK:
            str = 'TO_CHAR(' + str + ", 'ww')";
            break;
          case cc.FieldType.DAY:
            str = 'TO_CHAR(' + str + ", 'DD')";
            break;
          case cc.FieldType.HOUR:
            str = 'TO_CHAR(' + str + ", 'HH')";
            break;
          case cc.FieldType.MINUTE:
            str = 'TO_CHAR(' + str + ", 'MI')";
            break;

          case cc.FieldType.BOOLEAN:
            str = 'CASE WHEN ' + str + " THEN 'true' ELSE 'false' END";
            break;
          default:
            str = str + '::VARCHAR';
            break;
        }
        return 'COALESCE(' + str + ", '') AS \"" + id + '"';
      })
      .join(',\n  ') +
    '\nFROM "' +
    request.configParams.Database +
    '"."' +
    request.configParams.Schema +
    '"."' +
    request.configParams.Table +
    '"\n';
  let applyFilter = false;
  let notSupportedFilter = false;
  if (
    request.dimensionsFilters !== undefined &&
    request.dimensionsFilters.length > 0
  ) {
    applyFilter = true;
    query +=
      'WHERE\n  ' +
      request.dimensionsFilters
        .map(filters => {
          return (
            '(' +
            filters
              .map(filter => {
                const quatedFieldName = '"' + filter.fieldName + '"';
                const quatedValues = filter.values.map(value => {
                  return "'" + value + "'";
                });
                switch (filter.operator) {
                  case 'EQUALS':
                  case 'IN_LIST':
                    return (
                      quatedFieldName +
                      (filter.type === 'EXCLUDE' ? ' NOT' : '') +
                      ' IN (' +
                      quatedValues.join(', ') +
                      ')'
                    );
                  case 'CONTAINS':
                    return (
                      '(' +
                      filter.values
                        .map(value => {
                          return (
                            quatedFieldName +
                            (filter.type === 'EXCLUDE' ? ' NOT' : '') +
                            ' LIKE ' +
                            "'%" +
                            value +
                            "%'"
                          );
                        })
                        .join(' OR ') +
                      ')'
                    );
                  case 'REGEXP_PARTIAL_MATCH':
                  case 'REGEXP_EXACT_MATCH':
                    return (
                      '(' +
                      filter.values
                        .map(value => {
                          return (
                            quatedFieldName +
                            (filter.type === 'EXCLUDE' ? ' !~ ' : ' ~ ') +
                            +"'" +
                            value +
                            "'"
                          );
                        })
                        .join(' OR ') +
                      ')'
                    );
                  case 'IS_NULL':
                    return (
                      quatedFieldName +
                      ' IS ' +
                      (filter.type === 'EXCLUDE' ? 'NOT ' : '') +
                      'NULL'
                    );
                  case 'BETWEEN':
                    return (
                      quatedFieldName +
                      (filter.type === 'EXCLUDE' ? ' NOT' : '') +
                      ' BETWEEN ' +
                      quatedValues[0] +
                      ' AND ' +
                      quatedValues[1]
                    );
                }
                let operator = '';
                switch (filter.operator) {
                  case 'NUMERIC_GREATER_THAN':
                    operator = '>';
                    break;
                  case 'NUMERIC_GREATER_THAN_OR_EQUAL':
                    operator = '>=';
                    break;
                  case 'NUMERIC_LESS_THAN':
                    operator = '<';
                    break;
                  case 'NUMERIC_LESS_THAN_OR_EQUAL':
                    operator = '<=';
                    break;
                  default:
                    notSupportedFilter = true;
                    return '1 = 1';
                }
                return (
                  '(' +
                  filter.values
                    .map(value => {
                      return (
                        quatedFieldName +
                        (filter.type === 'EXCLUDE' ? ' NOT' : '') +
                        operator +
                        value
                      );
                    })
                    .join(' OR ') +
                  ')'
                );
              })
              .join('\n  OR ') +
            ')'
          );
        })
        .join('\n  AND ');
  }

  const executeResp = client.executeStatement({
    Database: request.configParams.Database,
    Sql: query,
    WorkgroupName:
      request.configParams.WorkgroupName === ''
        ? undefined
        : request.configParams.WorkgroupName,
    ClusterIdentifier:
      request.configParams.ClusterIdentifier === ''
        ? undefined
        : request.configParams.ClusterIdentifier,
    DbUser:
      request.configParams.DBUser === ''
        ? undefined
        : request.configParams.DBUser,
  });
  let describeResp = client.describeStatement({
    Id: executeResp.Id,
  });

  while (
    describeResp.Status !== 'FINISHED' &&
    describeResp.Status !== 'FAILED' &&
    describeResp.Status !== 'ABORTED'
  ) {
    Utilities.sleep(1000);
    describeResp = client.describeStatement({
      Id: executeResp.Id,
    });
  }
  if (describeResp.Status === 'FAILED' || describeResp.Status === 'ABORTED') {
    cc.newUserError()
      .setText(
        `Query(${describeResp.RedshiftQueryId}) failed: ${describeResp.Error}`
      )
      .setDebugText(JSON.stringify(describeResp))
      .throwException();
  }
  if (describeResp.HasResultSet === false) {
    return resp.build();
  }
  const fetchParams: GetStatementResultRequest = {
    Id: executeResp.Id,
  };
  let fetchResp: GetStatementResultResponse;
  do {
    fetchResp = client.getStatementResult(fetchParams);
    fetchResp.Records.forEach(record => {
      const row = record.map(value => {
        if (value.isNull) {
          return '';
        }
        if (value.stringValue) {
          return value.stringValue;
        }
        if (value.booleanValue) {
          return value.booleanValue.toString();
        }
        if (value.doubleValue) {
          return value.doubleValue.toString();
        }
        if (value.longValue) {
          return value.longValue.toString();
        }
        if (value.blobValue) {
          return value.blobValue.toString();
        }
        return '';
      });
      resp.addRow(row);
    });
    fetchParams.NextToken = fetchResp.NextToken;
  } while (fetchResp.NextToken);
  resp.setFiltersApplied(applyFilter && !notSupportedFilter);
  return resp.build();
}
