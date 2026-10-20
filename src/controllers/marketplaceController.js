'use strict';

const marketplace = require('../services/marketplace.service');
const { enqueueSocialPublish } = require('../services/queue.service');

async function createItem(req, res) {
  const platforms = req.body.auto_share_platforms;
  const item = await marketplace.createItem(req.user.id, req.body);

  let message = 'تم إدراج الطلب بنجاح';
  if (platforms.length) {
    try {
      await enqueueSocialPublish(item.id, platforms);
      message = 'تم إدراج الطلب بنجاح وجاري النشر على منصات التواصل المختارة';
    } catch (err) {
      // The listing is saved; a queue outage must not turn a successful create into an error.
      console.error('[marketplace] could not schedule social publishing:', err.message);
      message = 'تم إدراج الطلب بنجاح، وتعذّر جدولة النشر على منصات التواصل حالياً';
    }
  }

  res.status(201).json({
    success: true,
    message,
    data: { id: item.id, title: item.title, status: item.status, created_at: item.created_at },
  });
}

async function listItems(req, res) {
  const result = await marketplace.listItems(req.validatedQuery);
  res.json({ success: true, data: result.items, pagination: result.pagination });
}

async function getItem(req, res) {
  const item = await marketplace.getItem(req.params.id);
  const data = item.toJSON();
  // Contact details are for signed-in members only.
  if (!req.user && data.owner) {
    delete data.owner.phone;
    delete data.owner.email;
  }
  res.json({ success: true, data });
}

async function updateStatus(req, res) {
  const item = await marketplace.updateStatus(req.user, req.params.id, req.body.status);
  res.json({ success: true, message: 'تم تحديث حالة الطلب', data: { id: item.id, status: item.status } });
}

module.exports = { createItem, listItems, getItem, updateStatus };
