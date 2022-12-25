import { Algorithm } from "jsonwebtoken";
import IRouter from "./IRouter.interface";

export interface ITokenProperties {
  duration: number;
  keys: {
    public: string;
    private: string;
  };
}

export interface IAuthTokenOptions {
  issuer: string;
  algorithm: Algorithm;
  tokens: {
    auth: ITokenProperties;
    refresh: ITokenProperties;
  };
}
interface IConfig {
  server: {
    port: number;
    static: {
      index: string | false;
      dotfiles: "allow" | "deny";
      cacheControl: boolean;
      etag: boolean;
      maxAge: number;
      route: string;
      path: string;
    };
  };
  logging: {
    path: string;
    filename: string;
    format: string;
  };
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    charset: "utf8" | "utf8mb4" | "ascii";
    timezone: string;
    supportBigNumbers: boolean;
  };
  fileUploads: {
    maxFiles: number;
    maxFileSize: number;
    temporaryFileDirectory: string;
    destinationDirectoryRoot: string;
    files: {
      allowedTypes: string[];
      allowedExtensions: string[];
    };
  };
  routers: IRouter[];
  auth: {
    user: IAuthTokenOptions;
    allowAllRoutesWithoutAuthTokens: boolean;
  };
}

export default IConfig;
