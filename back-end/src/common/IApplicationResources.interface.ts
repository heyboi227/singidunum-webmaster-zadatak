import * as mysql2 from "mysql2/promise";
import UserService from "../components/user/UserService.service";
import FileService from "../components/file/FileService.service";

export interface IServices {
  file: FileService;
  user: UserService;
}

export default interface IApplicationResources {
  databaseConnection: mysql2.Connection;
  services: IServices;
}
