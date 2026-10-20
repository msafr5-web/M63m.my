'use strict';

const { DataTypes, Model } = require('sequelize');

const STATUSES = Object.freeze(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);

module.exports = (sequelize) => {
  class Consultation extends Model {}

  Consultation.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      client_id: { type: DataTypes.UUID, allowNull: false },
      consultant_id: { type: DataTypes.UUID, allowNull: false },
      slot_id: { type: DataTypes.UUID },
      topic: { type: DataTypes.STRING(255), allowNull: false },
      notes: { type: DataTypes.TEXT },
      status: { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'SCHEDULED' },
      meeting_link: { type: DataTypes.TEXT },
    },
    {
      sequelize,
      modelName: 'Consultation',
      tableName: 'consultations',
      updatedAt: false,
      indexes: [{ fields: ['client_id'] }, { fields: ['consultant_id'] }],
    }
  );

  Consultation.STATUSES = STATUSES;
  return Consultation;
};
