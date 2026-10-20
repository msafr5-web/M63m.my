'use strict';

const { Op } = require('sequelize');
const { MarketplaceItem, User } = require('../models');
const AppError = require('../utils/AppError');

const OWNER_ATTRS = ['id', 'full_name', 'role', 'avatar_url', 'is_verified'];

/** Escapes LIKE wildcards so user search text is matched literally. */
const likeSafe = (s) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

async function listItems({ category, q, location, page = 1, limit = 12 }) {
  const where = { status: 'ACTIVE' };
  if (category) where.category = category;
  if (location) where.location = { [Op.iLike]: `%${likeSafe(location)}%` };
  if (q) {
    const term = `%${likeSafe(q)}%`;
    where[Op.or] = [{ title: { [Op.iLike]: term } }, { description: { [Op.iLike]: term } }];
  }

  const { rows, count } = await MarketplaceItem.findAndCountAll({
    where,
    include: [{ model: User, as: 'owner', attributes: OWNER_ATTRS }],
    order: [['created_at', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  return {
    items: rows.map((r) => r.toJSON()),
    pagination: { page, limit, total: count, pages: Math.max(1, Math.ceil(count / limit)) },
  };
}

async function countByCategory() {
  const rows = await MarketplaceItem.count({ where: { status: 'ACTIVE' }, group: ['category'] });
  return Object.fromEntries(MarketplaceItem.CATEGORIES.map((c) => [c, Number(rows.find((r) => r.category === c)?.count || 0)]));
}

async function getItem(id) {
  const item = await MarketplaceItem.findByPk(id, {
    include: [{ model: User, as: 'owner', attributes: [...OWNER_ATTRS, 'phone', 'email', 'bio'] }],
  });
  if (!item) throw AppError.notFound('الطلب غير موجود');
  return item;
}

async function createItem(userId, data) {
  const { auto_share_platforms: _ignored, ...fields } = data;
  return MarketplaceItem.create({ ...fields, user_id: userId, status: 'ACTIVE' });
}

async function updateStatus(actor, id, status) {
  const item = await MarketplaceItem.findByPk(id);
  if (!item) throw AppError.notFound('الطلب غير موجود');
  if (item.user_id !== actor.id && actor.role !== 'ADMIN') throw AppError.forbidden();
  item.status = status;
  await item.save();
  return item;
}

async function listUserItems(userId, limit = 20) {
  const rows = await MarketplaceItem.findAll({ where: { user_id: userId }, order: [['created_at', 'DESC']], limit });
  return rows.map((r) => r.toJSON());
}

module.exports = { listItems, countByCategory, getItem, createItem, updateStatus, listUserItems };
