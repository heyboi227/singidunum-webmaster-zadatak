import BaseService from "../../common/BaseService";
import IAdapterOptions from "../../common/IAdapterOptions.interface";
import IEditUser from "./dto/IEditUser.dto";
import IRegisterUser from "./dto/IRegisterUser.dto";
import UserModel from "./UserModel.model";

export class UserAdapterOptions implements IAdapterOptions {
  removePassword: boolean;
}

export const DefaultUserAdapterOptions: UserAdapterOptions = {
  removePassword: false,
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
    user.passwordHash = data?.password_hash;
    user.createdAt = data?.created_at;
    user.updatedAt = data?.updated_at;
    user.isActive = +data?.is_active === 1;

    if (options.removePassword) {
      user.passwordHash = null;
    }

    return user;
  }

  public async getByUsername(
    username: string,
    options: UserAdapterOptions = DefaultUserAdapterOptions
  ): Promise<UserModel> {
    return this.getByFieldNameAndValue("username", options, username);
  }

  public async register(data: IRegisterUser): Promise<UserModel> {
    return this.baseAdd(data, {
      removePassword: true,
    });
  }

  public async editById(
    userId: number,
    data: IEditUser,
    options: UserAdapterOptions
  ): Promise<UserModel> {
    return this.baseEditById(userId, data, options);
  }

  public async deleteById(id: number): Promise<true> {
    return this.baseDeleteById(id);
  }
}
