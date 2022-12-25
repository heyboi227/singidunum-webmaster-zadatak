import IModel from "../../common/IModel.interface";

class UserModel implements IModel {
  userId: number;
  username: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export default UserModel;
