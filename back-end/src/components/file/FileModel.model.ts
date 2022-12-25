import IModel from "../../common/IModel.interface";
import UserModel from "../user/UserModel.model";

class FileModel implements IModel {
  fileId: number;
  fileName: string;
  filePath: string;
  userId: number;

  user?: UserModel;
}

export default FileModel;
