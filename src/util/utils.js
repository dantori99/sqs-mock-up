const { getQldbDriver } = require('../util/ConnectToLedger');

async function createWalletData(txn, walletDoc) {
  const statement = 'INSERT INTO Users ?';
  return txn.execute(statement, walletDoc);
}

const createUser = async (id, name, logger) => {
  let wallet;
  // Get a QLDB Driver instance
  console.log('masuk utils')
  const qldbDriver = await getQldbDriver();
  await qldbDriver.executeLambda(async (txn) => {
    // Check if the record already exists assuming email unique for demo
    const walletDoc = [{
      id, name, bet: 100
    }];
    // Create the record. This returns the unique document ID in an array as the result set
    await createWalletData(txn, walletDoc, logger);
  }, () => logger.info('Retrying due to OCC conflict...'));
  return wallet;
};

const getUser = async (txn, id, logger) => {
  logger.debug('In getBalanceById function');
  const query = 'SELECT * FROM Users AS d WHERE d.id = ?';
  return txn.execute(query, id);
};

const getUserById = async (id, logger) => {
  let wallet;
  const qldbDriver = await getQldbDriver();
  await qldbDriver.executeLambda(async (txn) => {
    await getUser(txn, id, logger).then(result => {
      const resultList = result.getResultList();
      wallet = JSON.stringify(resultList[0])
    })
  }, () => logger.info('Retrying due to OCC conflict...'));
  return wallet
}

const updateOne = async (txn, id, bet, logger) => {
  logger.debug('In updateBalance function');
  const query = `UPDATE Users AS d SET d.bet = ? WHERE d.id = ?`;
  return txn.execute(query, bet, id);
}

const updateBalance = async (id, reduceLimit, logger) => {
  console.log(id)
  console.log(reduceLimit)
  let wallet;
  let amount = reduceLimit;
  const qldbDriver = await getQldbDriver();
  await qldbDriver.executeLambda(async (txn) => {
    const result = await getUser(txn, id, logger)
    const resultList = result.getResultList();
    let newAmount = resultList[0].bet - amount;
    console.log(newAmount)

    await updateOne(txn, id, newAmount, logger);

    const finalResult = await getUser(txn, id, logger)
    const finalResultList = finalResult.getResultList();

    wallet = {
      id,
      name: finalResultList[0].name,
      limit: newAmount
    }
    console.log(wallet)
  }, () => logger.info('Retrying due to OCC conflict...'));
  return wallet
}

module.exports = {
  createUser,
  getUserById,
  updateBalance
};
