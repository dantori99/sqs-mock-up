const {
  updateBalance
} = require('../util/utils');
const { Logger } = require('@aws-lambda-powertools/logger');
const logger = new Logger();

module.exports.handler = event => {
  const { Records = [] } = event;
  // Records.forEach(async item => {
  //   try {
  //     const tableName = process.env.orderTableName;
  //     const order = JSON.parse(item.body);
  //     await DynamoService.write(order, tableName);
  //   } catch (e) {
  //     console.log('Error saving the data');
  //     console.log(e);
  //   }
  // });
  const result = []
  if (Records.length > 1) {
    console.log('length:'+Records.length)
    const records = []
    Records.forEach(item => {
      console.log('idMessage:' + item.messageId)
      try {
        const order = JSON.parse(item.body);
        records.push(order);
      } catch (e) {
        console.log('Error saving the data');
        console.log(e);
      }
    });
    records.reduce(function(res, value) {
      if (!res[value.id]) {
        res[value.id] = { id: value.id, reduceLimit: 0 };
        result.push(res[value.id])
      }
      res[value.id].reduceLimit += value.reduceLimit;
      return res;
    }, {});
  } else if(Records.length === 1) {
    console.log('length:'+Records.length)
    Records.forEach(item => {
      console.log('idMessage:' + item.messageId)
      try {
        const order = JSON.parse(item.body);
        result.push(order);
      } catch (e) {
        console.log('Error saving the data');
        console.log(e);
      }
    });
  }
  console.log('result:' + JSON.stringify(result));
  result.forEach(async data => {
    try {
      const userId = data.id
      const finalLimit = data.reduceLimit
      console.log(finalLimit)
      const final = await updateBalance(userId, finalLimit, logger);
      console.log('final: ' + JSON.stringify(final))
    } catch (e) {
      console.log('Error saving the data');
      console.log(e);
    }
  })
}
