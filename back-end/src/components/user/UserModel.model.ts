import IModel from "../../common/IModel.interface";

class UserModel implements IModel {
  userId: number;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  activationCode: string;
  passwordResetCode: string;
}

export default UserModel;
