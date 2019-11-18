const { to } = require('await-to-js');

module.exports = {
  createLunch: async (root, { meal_ids, date }, { repos }) => {
    const [ err, lunch ] = await to(repos.Lunch.create({ meal_ids, date }));

    return lunch;
  },
  updateLunch: async (root, { _id, meal_ids }, { repos }) => {
    const [ err, lunch ] = await to(repos.Lunch.update({ _id, meal_ids }));

    return lunch;
  },
  pickLunch: async (root, { account_id, meal_id, _id }, { repos }) => {
    const [ err, lunch ] = await to(repos.Lunch.updateWithAccount({ account_id, _id, meal_id }));

    return lunch;
  },
  updateLunchStatus: async (root, { _id, lunchStatus }, { repos }) => {
    const [ err, lunch ] = await to(repos.Lunch.updateLunchStatus({ _id, lunchStatus }));

    return lunch;
  }
}