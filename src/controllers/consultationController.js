'use strict';

const consultations = require('../services/consultation.service');

async function listConsultants(_req, res) {
  res.json({ success: true, data: await consultations.listConsultants() });
}

async function getConsultantSlots(req, res) {
  res.json({ success: true, data: await consultations.getConsultantWithSlots(req.params.id) });
}

async function createSlots(req, res) {
  const slots = await consultations.createSlots(req.user.id, req.body.slots);
  res.status(201).json({ success: true, message: 'تمت إضافة المواعيد', data: slots });
}

async function book(req, res) {
  const consultation = await consultations.book(req.user.id, req.body);
  res.status(200).json({
    success: true,
    consultation_id: consultation.id,
    meeting_link: consultation.meeting_link,
    status: consultation.status,
  });
}

async function listMine(req, res) {
  res.json({ success: true, data: await consultations.listForUser(req.user) });
}

async function updateStatus(req, res) {
  const consultation = await consultations.updateStatus(req.user, req.params.id, req.body.status);
  res.json({ success: true, message: 'تم تحديث حالة الجلسة', data: { id: consultation.id, status: consultation.status } });
}

async function verifyConsultant(req, res) {
  const user = await consultations.verifyConsultant(req.params.id);
  res.json({ success: true, message: 'تم اعتماد المستشار', data: user.toJSON() });
}

module.exports = { listConsultants, getConsultantSlots, createSlots, book, listMine, updateStatus, verifyConsultant };
