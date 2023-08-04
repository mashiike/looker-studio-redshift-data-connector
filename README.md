# LookerStudio RedshiftDataAPI Connector

## Overview

This is a community connector that connects to [Redshift Data API](https://docs.aws.amazon.com/ja_jp/redshift/latest/mgmt/data-api.html) in [LookerStudio](https://cloud.google.com/looker-studio?hl=ja).
In order to connect to Redshift in VPC with the default Redshift connector in LookerStudio, there was a security concern such as opening a hole in the security group, so
We have developed a community connector that connects with AssumeRoleWithWebIdentity + Redshift Data API to get data in a more secure way.

## Installation

Prepare an IAM Role to connect from LookerStudio to Redshift.
For reference, [terraform](./terraform) is available.
This IAM Role is intended to receive Google's ID Token and perform AssumeRoleWithWebIdentity.

You need to install [clasp](https://github.com/google/clasp) in advance.
Next, create a Google Apps Script project.
After creating it, create `.clasp.json` as follows.
```json
{
  "scriptId": "<Google Apps Script project ID>",
  "rootDir": "./dist"
}
```

Then you can deploy it with the following command.
```console
$ yarn install
$ yarn deploy
```

Then, deploy the AppScript project.

## Usage

Access to the following URL.
```
https://lookerstudio.google.com/datasources/create?connectorId=<your app script deploy id>
```

## LICENSE

MIT
