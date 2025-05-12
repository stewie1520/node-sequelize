import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";
import type { User } from "./User.js";

export class Workspace extends Model {
  declare id: string;
  declare name: string;
  declare authorId: string;
  declare author?: User;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  static initAssociation = (models: any) => {
    Workspace.belongsTo(models.User, {
      foreignKey: "authorId",
      as: "author",
    });
  };
}

Workspace.init(
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
    authorId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "workspaces",
    paranoid: true,
    updatedAt: true,
    createdAt: true,
  },
);

export default Workspace;
