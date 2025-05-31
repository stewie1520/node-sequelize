import User from "./User.js";
import Workspace from "./Workspace.js";
import sequelize from "../config/database.js";
import type { ModelStatic } from "sequelize";
import { UserRole } from "./UserRole.js";

const models = {
  User,
  Workspace,
  UserRole,
};

type ModelsType = InstanceType<(typeof models)[keyof typeof models]>;

// Initialize associations on models
Object.values(models).forEach(
  (
    model: ModelStatic<ModelsType> & {
      initAssociation?(models: Record<string, ModelStatic<ModelsType>>): void;
    },
  ) => {
    model.initAssociation?.(models);
  },
);

export { sequelize };
export default models;
