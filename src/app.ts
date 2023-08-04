import {getAuthType, isAdminUser} from './auth';
import {getConfig, getSchema, getData} from './connector';

declare let global: any; //eslint-disable-line @typescript-eslint/no-explicit-any
global.getAuthType = getAuthType;
global.isAdminUser = isAdminUser;
global.getConfig = getConfig;
global.getSchema = getSchema;
global.getData = getData;
