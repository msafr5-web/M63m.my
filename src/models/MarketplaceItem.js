'use strict';

const { DataTypes, Model } = require('sequelize');

const CATEGORIES = Object.freeze(['JOBS', 'EQUIPMENT', 'SUPPLIES', 'SERVICES']);
const STATUSES = Object.freeze(['ACTIVE', 'CLOSED', 'PENDING']);

module.exports = (sequelize) => {
  class MarketplaceItem extends Model {}

  MarketplaceItem.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      user_id: { type: DataTypes.UUID, allowNull: false },
      category: { type: DataTypes.ENUM(...CATEGORIES), allowNull: false },
      title: { type: DataTypes.STRING(200), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      price: { type: DataTypes.DECIMAL(12, 2) },
      location: { type: DataTypes.STRING(100) },
      status: { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'ACTIVE' },
      // Category-specific fields, e.g. job_title / salary_range, equipment condition, supplier name.
      metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      images: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: false, defaultValue: [] },
    },
    {
      sequelize,
      modelName: 'MarketplaceItem',
      tableName: 'marketplace_items',
      updatedAt: false,
      indexes: [{ fields: ['category', 'status', 'created_at'] }, { fields: ['user_id'] }],
    }
  );

  MarketplaceItem.CATEGORIES = CATEGORIES;
  MarketplaceItem.STATUSES = STATUSES;
  return MarketplaceItem;
};
