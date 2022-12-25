import IConfig from "./common/IConfig.interface";
import UserRouter from "./components/user/UserRouter.router";
import { readFileSync } from "fs";
import "dotenv/config";
import FileRouter from "./components/file/FileRouter.router";

const DevConfig: IConfig = {
  server: {
    port: 10000,
    static: {
      index: false,
      dotfiles: "deny",
      cacheControl: true,
      etag: true,
      maxAge: 1000 * 60 * 60 * 24,
      path: "./static",
      route: "/assets",
    },
  },
  logging: {
    path: "./log-files",
    filename: "access.log",
    format:
      ":date[iso]\t:remote-addr\t:method\t:url\t:status\t:res[content-length] bytes\t:response-time ms",
  },
  database: {
    host: "localhost",
    port: 3306,
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: "piivt_app",
    charset: "utf8",
    timezone: "+01:00",
    supportBigNumbers: true,
  },
  routers: [new FileRouter(), new UserRouter()],
  auth: {
    user: {
      algorithm: "RS256",
      issuer: "Singidunum",
      tokens: {
        auth: {
          duration: 60 * 60 * 24,
          keys: {
            public: readFileSync("./.keystore/app.public", "ascii"),
            private: readFileSync("./.keystore/app.private", "ascii"),
          },
        },
        refresh: {
          duration: 60 * 60 * 24 * 60,
          keys: {
            public: readFileSync("./.keystore/app.public", "ascii"),
            private: readFileSync("./.keystore/app.private", "ascii"),
          },
        },
      },
    },
    allowAllRoutesWithoutAuthTokens: false,
  },
  fileUploads: {
    maxFiles: 5,
    maxFileSize: 500 * 1024 * 1024,
    temporaryFileDirectory: "../temp/",
    destinationDirectoryRoot: "uploads/",
    files: {
      allowedTypes: ["PDF", "DOCX", "ZIP"],
      allowedExtensions: [".pdf", ".docx", ".zip"],
    },
  },
};

export { DevConfig };
