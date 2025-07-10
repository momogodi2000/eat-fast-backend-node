const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    permissions: {
      type: DataTypes.JSONB,
      defaultValue: []
    }
  }, {
    tableName: 'roles',
    timestamps: true
  });

  Role.associate = function(models) {
    Role.hasMany(models.User, { foreignKey: 'roleId', as: 'users' });
  };

  return Role;
};