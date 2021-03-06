'use strict'

const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');

const randomKey = length => Array.from({ length })
  .map(() => Math.floor(Math.random() * 10))
  .join('');

module.exports = ({ db }) => {
  const collection = db.collection('accounts');

  const findById = async ({ _id }) => {
    return collection.findOne({ _id: ObjectId(_id) });
  }

  const create = async ({ username, password, fullname }) => {
    const hashPassword = await bcrypt.hash(password, 10);

    const response = await collection.insertOne({
      username, password: hashPassword, fullname, roles: [ "USER" ]
    });

    return response.ops[0];
  }

  const update = async ({ _id, fullname, email }) => {
    const response = await collection.updateOne({ _id: ObjectId(_id) }, { $set: { fullname, email } });
    return response.result.nModified;
  }

  const updatePassword = async ({ _id, currentPassword, password }) => {
    const acc = await findById({ _id });
    const rs = await bcrypt.compare(currentPassword, acc.password);
    if (!rs)
      return false;

    const hashPassword = await bcrypt.hash(password, 10);

    const response = await collection.updateOne({ _id: ObjectId(_id) }, { $set: { password: hashPassword } });
    return response.result.nModified;
  }

  const remove = async ({ _id }) => {
    const response = await collection.deleteOne({ _id: ObjectId(_id) });
    return result.result.ok;
  }

  const removeMany = async ({ _ids }) => {
    const response = await collection.deleteMany({ _id: { $in: _ids } });
    return response.modifiedCount === _ids.length;
  }

  const findByUsername = async ({ username }) => {
    return collection.findOne({ username });
  }

  const updatePasswordById = async ({ _id, password }) => {
    const newPassword = await bcrypt.hash(password, 10);

    collection.updateOne({ _id: ObjectId(_id) }, { $set: { password: newPassword } });
  }

  const findRolesById = async ({ _id }) => {
    const account = await collection.findOne({ _id: ObjectId(_id) });

    if (!account)
      return null;

    return account.roles;
  }

  const block = async ({ _id, is }) => {
    const result = await collection.updateOne({ _id: ObjectId(_id) }, { isBlocked: is });
    return result.ops[0] === is;
  }

  const search = async ({ pattern, page = 0, perPage = 10 }) => {
    pattern = pattern
      ? pattern.split(/[\s]/).map(w => `(${w})`).join('|')
      : '';
    pattern = new RegExp(pattern, 'i');

    const cursor = collection.find({ $or: [
      { username: { $regex: pattern } },
      { fullname: { $regex: pattern } }
    ]})
      .skip(page * perPage)
      .limit(perPage);

    const accounts = [];
    let acc;

    while (acc = await cursor.next()) {
      accounts.push(acc);
    }

    return accounts;
  }

  return {
    findById,
    create,
    update,
    updatePassword,
    remove,
    removeMany,
    findByUsername,
    search
  }
}
