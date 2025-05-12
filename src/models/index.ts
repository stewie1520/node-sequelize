import sequelize from "../config/database.js";
import User from "./User.js";
import Workspace from "./Workspace.js";

// Initialize models
const models = {
  User,
  Workspace,
};

// Initialize associations on models
Object.values(models).forEach((model) => {
  if ("initAssociation" in model) {
    model.initAssociation(models);
  }
});

export { sequelize };
export default models;
