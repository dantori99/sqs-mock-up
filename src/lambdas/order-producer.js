const {
  createUser
} = require('../util/utils');
const { getQldbDriver } = require('../util/ConnectToLedger');
const { Logger } = require('@aws-lambda-powertools/logger');
const ApiResponse = require('../util/apiResponse');
const sqsService = require('../services/sqs.service');
const response = require('cfn-response-promise')
const { v4: uuid } = require('uuid');

const logger = new Logger();

module.exports.createUser = async (event, ctx, cb) => {
  const { body = {} } = event;

  const { name = '' } = JSON.parse(body);
  const insertId = uuid();

  try {
    await createUser(insertId, name, logger);
    return cb(null, ApiResponse.ok({ message: 'success', insertId }));
  } catch (e) {
    return cb(
      null,
      ApiResponse.serverError({ message: 'Failed to create order' })
    );
  }
}

module.exports.handler = async (event, ctx, cb) => {
  const numSend = 500;
  const { body = {} } = event;

  const { id, reduceLimit } = JSON.parse(body);

  const order = {
    id,
    reduceLimit
  };

  try {
    const queueURL = process.env.ordersQueue;
    for (let i = 0; i < numSend; i++) {
      await sqsService.sendMessage(queueURL, JSON.stringify(order));
      cb(null, ApiResponse.ok({ message: 'success', id }));
    }
  } catch (e) {
    console.log(e)
    return cb(
      null,
      ApiResponse.serverError({ message: 'Failed to create order' })
    );
  }
};

// const createTable = async (txn, tableName) => {
//   console.log(tableName)
//   console.log(txn)
//   const statement = `CREATE TABLE ${tableName}`;
//   return txn.execute(statement).then((result) => {
//     logger.debug(`Successfully created table ${tableName}.`);
//     return result;
//   });
// }

// module.exports.tableCreation = async (event, context) => {
//   logger.addContext(context);
//   logger.debug(`QLDB Table request received:\n${JSON.stringify(event, null, 2)}`);

//   try {
//     if (event.RequestType === 'Create') {
//       logger.debug('Attempting to create QLDB table');

//       try {
//         console.log('first')
//         console.log('getQLDB: ' + getQldbDriver)
//         const qldbDriver = await getQldbDriver();
//         console.log('second')
//         console.log('qldb: '+ JSON.stringify(qldbDriver))
//         await qldbDriver.executeLambda(async (txn) => {
//           console.log('third')
//           await createTable(txn, process.env.TableName);
//         }, () => logger.info('Retrying due to OCC conflict...'));
//       } catch (e) {
//         logger.error(`Unable to connect: ${e}`);
//         await response.send(event, context, response.FAILED);
//       }

//       const responseData = { requestType: event.RequestType };
//       await response.send(event, context, response.SUCCESS, responseData);
//     } else if (event.RequestType === 'Delete') {
//       logger.debug('Request received to delete QLDB table');
//       // Do nothing as table will be deleted as part of deleting QLDB Ledger
//       const responseData = { requestType: event.RequestType };
//       await response.send(event, context, response.SUCCESS, responseData);
//     } else {
//       logger.error('Did not recognise event type resource');
//       await response.send(event, context, response.FAILED);
//     }
//   } catch (error) {
//     console.log(error);
//     console.log(JSON.stringify(error));
//     logger.error(`Failed to create table in custom resource: ${JSON.stringify(error)}`);
//     await response.send(event, context, response.FAILED);
//   }
// }
