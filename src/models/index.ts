import User from './User.js';
import Workspace from './Workspace.js';
import sequelize from '../config/database.js';
import type { ModelStatic } from 'sequelize';

const models = {
  User,
  Workspace,
}

type ModelsType = InstanceType<typeof models[keyof typeof models]>;

// Initialize associations on models
Object.values(models).forEach((model: ModelStatic<ModelsType> & {
  initAssociation?(models: Record<string, ModelStatic<ModelsType>>): void;
}) => {
  model.initAssociation?.(models);
});

export { sequelize };
export default models;
