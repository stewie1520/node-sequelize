import { DataTypes, Model, type ModelStatic } from "sequelize";

import sequelize from "../config/database.js";
import type User from "./User.js";

export enum ERole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export class UserRole extends Model {
  declare public id: string;
  declare public userId: string;
  declare public role: ERole;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  static initAssociation = (models: Record<string, ModelStatic<User>>) => {
    UserRole.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };
}

UserRole.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    role: {
      type: DataTypes.ENUM(...Object.values(ERole)),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "user_roles",
    paranoid: true,
    updatedAt: true,
    createdAt: true,
  },
);
