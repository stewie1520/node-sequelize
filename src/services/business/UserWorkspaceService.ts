import User from "../../models/User.js";
import Workspace from "../../models/Workspace.js";
import type { CreateWorkspaceInput } from "../../schemas/workspace.js";
import { UnprocessableEntityError } from "../../utils/errors.js";

class UserWorkspaceService {
  async createWorkspace(authorId: string, input: CreateWorkspaceInput) {
    const existedUser = await User.findByPk(authorId, { attributes: ["id"] });
    if (!existedUser) {
      throw new UnprocessableEntityError();
    }

    const workspace = await Workspace.create({
      ...input,
      authorId: existedUser.id,
    });

    return workspace;
  }

  async updateWorkspace(
    workspaceId: string,
    authorId: string,
    updateData: Partial<CreateWorkspaceInput>,
  ) {
    const workspace = await Workspace.findOne({
      where: {
        id: workspaceId,
        authorId,
      },
    });

    if (!workspace) {
      throw new UnprocessableEntityError(
        "Workspace not found or access denied",
      );
    }

    await workspace.update(updateData);

    return workspace;
  }
}

export default new UserWorkspaceService();
