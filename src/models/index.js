'use strict';

const { sequelize } = require('../config/database');

const User = require('./User')(sequelize);
const ConsultantSlot = require('./ConsultantSlot')(sequelize);
const Consultation = require('./Consultation')(sequelize);
const MarketplaceItem = require('./MarketplaceItem')(sequelize);
const SocialPostLog = require('./SocialPostLog')(sequelize);

const cascade = { onDelete: 'CASCADE' };

User.hasMany(ConsultantSlot, { foreignKey: 'consultant_id', as: 'slots', ...cascade });
ConsultantSlot.belongsTo(User, { foreignKey: 'consultant_id', as: 'consultant', ...cascade });

User.hasMany(Consultation, { foreignKey: 'client_id', as: 'clientConsultations', ...cascade });
User.hasMany(Consultation, { foreignKey: 'consultant_id', as: 'consultantConsultations', ...cascade });
Consultation.belongsTo(User, { foreignKey: 'client_id', as: 'client', ...cascade });
Consultation.belongsTo(User, { foreignKey: 'consultant_id', as: 'consultant', ...cascade });
Consultation.belongsTo(ConsultantSlot, { foreignKey: 'slot_id', as: 'slot' });

User.hasMany(MarketplaceItem, { foreignKey: 'user_id', as: 'items', ...cascade });
MarketplaceItem.belongsTo(User, { foreignKey: 'user_id', as: 'owner', ...cascade });

MarketplaceItem.hasMany(SocialPostLog, { foreignKey: 'item_id', as: 'socialPosts', onDelete: 'SET NULL' });
SocialPostLog.belongsTo(MarketplaceItem, { foreignKey: 'item_id', as: 'item', onDelete: 'SET NULL' });

module.exports = { sequelize, User, ConsultantSlot, Consultation, MarketplaceItem, SocialPostLog };
