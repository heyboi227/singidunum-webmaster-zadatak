import * as cors from "cors";
import * as express from "express";
import { DevConfig } from "./configs";
import IConfig from "./common/IConfig.interface";
import * as fs from "fs";
import * as morgan from "morgan";
import IApplicationResources from "./common/IApplicationResources.interface";
import * as mysql2 from "mysql2/promise";
import UserService from "./components/user/UserService.service";
import FileService from "./components/file/FileService.service";

async function main() {
  const config: IConfig = DevConfig;

  fs.mkdirSync("./log-files", {
    mode: 0o755,
    recursive: true,
  });

  const db = await mysql2.createConnection({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    charset: config.database.charset,
    timezone: config.database.timezone,
    supportBigNumbers: config.database.supportBigNumbers,
  });

  function attachConnectionMonitoring(db: mysql2.Connection) {
    db.on("error", async (error) => {
      if (!error.fatal) {
        return;
      }

      if (error?.code !== "PROTOCOL_CONNECTION_LOST") {
        throw error;
      }

      console.log("Reconnecting to the database server...");

      db = await mysql2.createConnection(db.config);

      attachConnectionMonitoring(db);

      db.connect();
    });
  }

  attachConnectionMonitoring(db);

  const applicationResources: IApplicationResources = {
    databaseConnection: db,
    services: {
      file: null,
      user: null,
    },
  };

  applicationResources.services.file = new FileService(applicationResources);
  applicationResources.services.user = new UserService(applicationResources);

  const application: express.Application = express();

  application.use(
    morgan(config.logging.format, {
      stream: fs.createWriteStream(
        config.logging.path + "/" + config.logging.filename,
        { flags: "a" }
      ),
    })
  );

  application.use(cors());
  application.use(express.json());
  application.use(express.urlencoded({ extended: true }));

  application.use(
    config.server.static.route,
    express.static(config.server.static.path, {
      index: config.server.static.index,
      dotfiles: config.server.static.dotfiles,
      cacheControl: config.server.static.cacheControl,
      etag: config.server.static.etag,
      maxAge: config.server.static.maxAge,
    })
  );

  for (const router of config.routers) {
    router.setupRoutes(application, applicationResources);
  }

  application.use((_req, res) => {
    res.sendStatus(404);
  });

  application.listen(config.server.port);
}

process.on("uncaughtException", (error) => {
  console.error("ERROR: ", error);
});

main();
