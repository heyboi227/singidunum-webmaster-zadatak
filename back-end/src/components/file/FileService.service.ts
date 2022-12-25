import BaseService from "../../common/BaseService";
import IAdapterOptions from "../../common/IAdapterOptions.interface";
import IAddFile from "./dto/IAddFile.dto";
import FileModel from "./FileModel.model";
import IEditFile from "./dto/IEditFile.dto";
import { DefaultUserAdapterOptions } from "../user/UserService.service";

export class FileAdapterOptions implements IAdapterOptions {
  removeFilePath: boolean;
  showUser: boolean;
}

export const DefaultFileAdapterOptions: FileAdapterOptions = {
  removeFilePath: false,
  showUser: true,
};

export default class FileService extends BaseService<
  FileModel,
  FileAdapterOptions
> {
  public tableName(): string {
    return "file";
  }

  protected async adaptToModel(
    data: any,
    options: FileAdapterOptions = DefaultFileAdapterOptions
  ): Promise<FileModel> {
    const file: FileModel = new FileModel();

    file.fileId = +data?.file_id;
    file.fileName = data?.file_name;
    file.filePath = data?.file_path;
    file.userId = +data?.user_id;

    if (options.removeFilePath) {
      file.filePath = null;
    }

    if (options.showUser) {
      file.user = await this.services.user.getById(
        file.userId,
        DefaultUserAdapterOptions
      );
    }

    return file;
  }

  public async getByFileName(
    fileName: string,
    options: FileAdapterOptions = DefaultFileAdapterOptions
  ): Promise<FileModel> {
    return this.getByFieldNameAndValue("file_name", options, fileName);
  }

  public async getByUserId(
    userId: number,
    options: FileAdapterOptions = DefaultFileAdapterOptions
  ): Promise<FileModel> {
    return this.getByFieldNameAndValue("user_id", options, userId);
  }

  public async upload(data: IAddFile): Promise<FileModel> {
    return this.baseAdd(data, DefaultFileAdapterOptions);
  }

  public async editById(
    fileId: number,
    data: IEditFile,
    options: FileAdapterOptions
  ): Promise<FileModel> {
    return this.baseEditById(fileId, data, options);
  }

  public async deleteById(id: number): Promise<true> {
    return this.baseDeleteById(id);
  }
}
