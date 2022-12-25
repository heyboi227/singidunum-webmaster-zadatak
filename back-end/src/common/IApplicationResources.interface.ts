import * as mysql2 from "mysql2/promise";
import UserService from "../components/user/UserService.service";

export interface IServices {
  user: UserService;
}

export default interface IApplicationResources {
  databaseConnection: mysql2.Connection;
  services: IServices;
}
