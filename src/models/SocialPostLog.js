'use strict';

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class SocialPostLog extends Model {}

  SocialPostLog.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      item_id: { type: DataTypes.UUID },
      platform: { type: DataTypes.STRING(50), allowNull: false }, // X, FACEBOOK, TIKTOK, SNAPCHAT
      external_post_id: { type: DataTypes.STRING(255) },
      status: { type: DataTypes.STRING(50), allowNull: false }, // SUCCESS, FAILED, SKIPPED
      response_payload: { type: DataTypes.JSONB },
      posted_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { sequelize, modelName: 'SocialPostLog', tableName: 'social_posts_log', timestamps: false }
  );

  return SocialPostLog;
};
