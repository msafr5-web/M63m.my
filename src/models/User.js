'use strict';

const { DataTypes, Model } = require('sequelize');

const ROLES = Object.freeze(['CLIENT', 'CONSULTANT', 'VENDOR', 'ADMIN']);

module.exports = (sequelize) => {
  class User extends Model {
    /** Public representation: never leaks the password hash. */
    toJSON() {
      const { password_hash: _omit, ...rest } = this.get();
      return rest;
    }
  }

  User.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      full_name: { type: DataTypes.STRING(150), allowNull: false },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        set(v) {
          this.setDataValue('email', String(v).trim().toLowerCase());
        },
      },
      phone: { type: DataTypes.STRING(20), allowNull: false, unique: true },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      role: { type: DataTypes.ENUM(...ROLES), allowNull: false, defaultValue: 'CLIENT' },
      avatar_url: { type: DataTypes.TEXT },
      bio: { type: DataTypes.TEXT },
      // For consultants this doubles as admin approval: only verified consultants are listed.
      is_verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { sequelize, modelName: 'User', tableName: 'users' }
  );

  User.ROLES = ROLES;
  return User;
};
