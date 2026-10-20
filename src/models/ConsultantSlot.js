'use strict';

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class ConsultantSlot extends Model {}

  ConsultantSlot.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      consultant_id: { type: DataTypes.UUID, allowNull: false },
      start_time: { type: DataTypes.DATE, allowNull: false },
      end_time: { type: DataTypes.DATE, allowNull: false },
      is_booked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    },
    {
      sequelize,
      modelName: 'ConsultantSlot',
      tableName: 'consultant_slots',
      timestamps: false,
      indexes: [{ fields: ['consultant_id', 'start_time'] }],
      validate: {
        endsAfterStart() {
          if (this.end_time <= this.start_time) throw new Error('end_time must be after start_time');
        },
      },
    }
  );

  return ConsultantSlot;
};
