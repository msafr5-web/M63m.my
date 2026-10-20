'use strict';

const { Op } = require('sequelize');
const { sequelize, User, ConsultantSlot, Consultation } = require('../models');
const AppError = require('../utils/AppError');
const env = require('../config/env');

const PUBLIC_USER = ['id', 'full_name', 'avatar_url', 'bio', 'is_verified'];

/** Allowed transitions; anything else is rejected. */
const TRANSITIONS = {
  SCHEDULED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

function meetingLinkFor(consultationId) {
  return `${env.APP_URL.replace(/\/$/, '')}/meet/${consultationId}`;
}

async function listConsultants() {
  const consultants = await User.findAll({
    where: { role: 'CONSULTANT', is_verified: true },
    attributes: PUBLIC_USER,
    order: [['full_name', 'ASC']],
  });

  const ids = consultants.map((c) => c.id);
  const upcoming = ids.length
    ? await ConsultantSlot.findAll({
        attributes: [
          'consultant_id',
          [sequelize.fn('COUNT', sequelize.col('id')), 'open_slots'],
          [sequelize.fn('MIN', sequelize.col('price')), 'from_price'],
          [sequelize.fn('MIN', sequelize.col('start_time')), 'next_slot'],
        ],
        where: { consultant_id: ids, is_booked: false, start_time: { [Op.gt]: new Date() } },
        group: ['consultant_id'],
        raw: true,
      })
    : [];

  const stats = new Map(upcoming.map((s) => [s.consultant_id, s]));
  return consultants.map((c) => {
    const s = stats.get(c.id);
    return {
      ...c.toJSON(),
      open_slots: Number(s?.open_slots || 0),
      from_price: s ? Number(s.from_price) : null,
      next_slot: s?.next_slot || null,
    };
  });
}

async function getConsultantWithSlots(consultantId) {
  const consultant = await User.findOne({
    where: { id: consultantId, role: 'CONSULTANT', is_verified: true },
    attributes: PUBLIC_USER,
  });
  if (!consultant) throw AppError.notFound('المستشار غير موجود');

  const slots = await ConsultantSlot.findAll({
    where: { consultant_id: consultantId, is_booked: false, start_time: { [Op.gt]: new Date() } },
    order: [['start_time', 'ASC']],
    limit: 200,
  });
  return { consultant: consultant.toJSON(), slots: slots.map((s) => s.toJSON()) };
}

async function createSlots(consultantId, slots) {
  const sorted = [...slots].sort((a, b) => a.start_time - b.start_time);
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].start_time < sorted[i - 1].end_time) throw AppError.badRequest('توجد مواعيد متداخلة في الطلب');
  }

  return sequelize.transaction(async (transaction) => {
    // Reject overlap with any existing slot of this consultant.
    const overlap = await ConsultantSlot.findOne({
      where: {
        consultant_id: consultantId,
        [Op.or]: sorted.map((s) => ({ start_time: { [Op.lt]: s.end_time }, end_time: { [Op.gt]: s.start_time } })),
      },
      transaction,
    });
    if (overlap) throw AppError.conflict('أحد المواعيد يتداخل مع موعد مسجل مسبقاً');

    return ConsultantSlot.bulkCreate(
      sorted.map((s) => ({ ...s, consultant_id: consultantId })),
      { transaction, validate: true }
    );
  });
}

/**
 * Books a slot atomically. The slot row is locked (SELECT ... FOR UPDATE) so two clients
 * racing for the same slot cannot both succeed.
 */
async function book(clientId, { consultant_id, slot_id, topic, notes }) {
  if (clientId === consultant_id) throw AppError.badRequest('لا يمكنك حجز استشارة مع نفسك');

  return sequelize.transaction(async (transaction) => {
    const slot = await ConsultantSlot.findByPk(slot_id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!slot || slot.consultant_id !== consultant_id) throw AppError.notFound('الموعد غير موجود');
    if (slot.is_booked) throw AppError.conflict('تم حجز هذا الموعد للتو، اختر موعداً آخر');
    if (slot.start_time <= new Date()) throw AppError.badRequest('هذا الموعد انتهى');

    const consultant = await User.findOne({
      where: { id: consultant_id, role: 'CONSULTANT', is_verified: true },
      attributes: ['id'],
      transaction,
    });
    if (!consultant) throw AppError.notFound('المستشار غير موجود');

    slot.is_booked = true;
    await slot.save({ transaction });

    const consultation = Consultation.build({
      client_id: clientId,
      consultant_id,
      slot_id,
      topic,
      notes: notes || null,
      status: 'SCHEDULED',
    });
    consultation.meeting_link = meetingLinkFor(consultation.id);
    await consultation.save({ transaction });
    return consultation;
  });
}

async function listForUser(user) {
  const where = user.role === 'CONSULTANT' ? { consultant_id: user.id } : { client_id: user.id };
  const rows = await Consultation.findAll({
    where,
    include: [
      { model: User, as: 'client', attributes: ['id', 'full_name', 'phone'] },
      { model: User, as: 'consultant', attributes: ['id', 'full_name'] },
      { model: ConsultantSlot, as: 'slot', attributes: ['start_time', 'end_time', 'price'] },
    ],
    order: [['created_at', 'DESC']],
    limit: 100,
  });
  return rows.map((r) => r.toJSON());
}

async function getForParticipant(user, id) {
  const consultation = await Consultation.findByPk(id, {
    include: [
      { model: User, as: 'client', attributes: ['id', 'full_name'] },
      { model: User, as: 'consultant', attributes: ['id', 'full_name', 'avatar_url'] },
      { model: ConsultantSlot, as: 'slot', attributes: ['start_time', 'end_time', 'price'] },
    ],
  });
  if (!consultation) throw AppError.notFound('الجلسة غير موجودة');
  const isParticipant = [consultation.client_id, consultation.consultant_id].includes(user.id);
  if (!isParticipant && user.role !== 'ADMIN') throw AppError.forbidden();
  return consultation.toJSON();
}

/**
 * Consultants drive the session lifecycle; clients may only cancel.
 * Cancelling frees the slot so it can be booked again.
 */
async function updateStatus(user, id, status) {
  return sequelize.transaction(async (transaction) => {
    const consultation = await Consultation.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!consultation) throw AppError.notFound('الجلسة غير موجودة');

    const isConsultant = consultation.consultant_id === user.id;
    const isClient = consultation.client_id === user.id;
    const isAdmin = user.role === 'ADMIN';
    if (!isConsultant && !isClient && !isAdmin) throw AppError.forbidden();
    if (isClient && !isConsultant && !isAdmin && status !== 'CANCELLED') {
      throw AppError.forbidden('يمكن للعميل إلغاء الجلسة فقط');
    }
    if (!TRANSITIONS[consultation.status].includes(status)) {
      throw AppError.badRequest('لا يمكن تغيير حالة الجلسة بهذا الشكل');
    }

    consultation.status = status;
    await consultation.save({ transaction });

    if (status === 'CANCELLED' && consultation.slot_id) {
      await ConsultantSlot.update({ is_booked: false }, { where: { id: consultation.slot_id }, transaction });
    }
    return consultation;
  });
}

async function verifyConsultant(id) {
  const user = await User.findByPk(id);
  if (!user || user.role !== 'CONSULTANT') throw AppError.notFound('المستشار غير موجود');
  user.is_verified = true;
  await user.save();
  return user;
}

module.exports = {
  TRANSITIONS,
  listConsultants,
  getConsultantWithSlots,
  createSlots,
  book,
  listForUser,
  getForParticipant,
  updateStatus,
  verifyConsultant,
};
