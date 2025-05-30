import bcrypt from 'bcryptjs';
import { DataTypes, Model, type ModelStatic } from 'sequelize';

import sequelize from '../config/database.js';
import type Workspace from './Workspace.js';

export class User extends Model {
  declare public id: string;
  declare public name: string;
  declare public email: string;
  declare public password?: string;
  declare public googleId?: string;
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  declare public getWorkspaces: () => Promise<Workspace[]>;

  // Method to compare passwords
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
  }

  static initAssociation = (models: Record<string, ModelStatic<Workspace>>) => {
    User.hasMany(models.Workspace, {
      foreignKey: 'authorId',
      as: 'author',
    });
  };
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    paranoid: true,
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password') && user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  },
);

export default User;
