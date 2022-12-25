import BaseService from "../../common/BaseService";
import IAdapterOptions from "../../common/IAdapterOptions.interface";
import IAddUserDto from "./dto/IAddUser.dto";
import IEditUser from "./dto/IEditUser.dto";
import IRegisterUser from "./dto/IRegisterUser.dto";
import UserModel from "./UserModel.model";

export class UserAdapterOptions implements IAdapterOptions {
  removePassword: boolean;
  removeEmail: boolean;
  removeActivationCode: boolean;
}

export const DefaultUserAdapterOptions: UserAdapterOptions = {
  removePassword: false,
  removeEmail: false,
  removeActivationCode: false,
};

export default class UserService extends BaseService<
  UserModel,
  UserAdapterOptions
> {
  public tableName(): string {
    return "user";
  }

  protected async adaptToModel(
    data: any,
    options: UserAdapterOptions = DefaultUserAdapterOptions
  ): Promise<UserModel> {
    const user: UserModel = new UserModel();

    user.userId = +data?.user_id;
    user.username = data?.username;
    user.email = data?.email;
    user.passwordHash = data?.password_hash;
    user.createdAt = data?.created_at;
    user.updatedAt = data?.updated_at;
    user.isActive = +data?.is_active === 1;
    user.activationCode = data?.activation_code ? data?.activation_code : null;
    user.passwordResetCode = data?.password_reset_code
      ? data?.password_reset_code
      : null;

    if (options.removePassword) {
      user.passwordHash = null;
    }

    if (options.removeEmail) {
      user.email = null;
    }

    return user;
  }

  public async getByUsername(
    username: string,
    options: UserAdapterOptions = DefaultUserAdapterOptions
  ): Promise<UserModel> {
    return this.getByFieldNameAndValue("username", options, username);
  }

  public async getByEmail(
    email: string,
    options: UserAdapterOptions = DefaultUserAdapterOptions
  ): Promise<UserModel> {
    return this.getByFieldNameAndValue("email", options, email);
  }

  public async add(data: IAddUserDto): Promise<UserModel> {
    return this.baseAdd(data, {
      removeEmail: true,
      removePassword: true,
      removeActivationCode: true,
    });
  }

  public async editById(
    userId: number,
    data: IRegisterUser | IEditUser,
    options: UserAdapterOptions
  ): Promise<UserModel> {
    return this.baseEditById(userId, data, options);
  }

  public async deleteById(id: number): Promise<true> {
    return this.baseDeleteById(id);
  }

  public async getUserByActivationCode(
    code: string,
    options: UserAdapterOptions = DefaultUserAdapterOptions
  ): Promise<UserModel | null> {
    return this.getByFieldNameAndValue("activation_code", options, code);
  }

  public async getUserByPasswordResetCode(
    code: string,
    options: UserAdapterOptions
  ): Promise<UserModel | null> {
    return this.getByFieldNameAndValue("password_reset_code", options, code);
  }
}
