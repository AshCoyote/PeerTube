import * as Sequelize from 'sequelize'

async function up (utils: {
  transaction: Sequelize.Transaction
  queryInterface: Sequelize.QueryInterface
  sequelize: Sequelize.Sequelize
}): Promise<void> {
  const { transaction, queryInterface } = utils

  await queryInterface.addColumn('video', 'isShort', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }, { transaction })
}

function down () {
  throw new Error('Not implemented.')
}

export {
  down,
  up
}
