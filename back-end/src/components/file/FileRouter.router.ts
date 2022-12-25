import * as express from "express";
import AuthMiddleware from "../../middlewares/AuthMiddleware";
import IApplicationResources from "../../common/IApplicationResources.interface";
import IRouter from "../../common/IRouter.interface";
import FileController from "./FileController.controller";

class FileRouter implements IRouter {
  setupRoutes(
    application: express.Application,
    resources: IApplicationResources
  ) {
    const fileController: FileController = new FileController(
      resources.services
    );

    application.get(
      "/api/file/:fid",
      AuthMiddleware.getVerifier("user"),
      fileController.getById.bind(fileController)
    );
    application.get(
      "/api/file/file-name/:ffn",
      AuthMiddleware.getVerifier("user"),
      fileController.getByFileName.bind(fileController)
    );
    application.get(
      "/api/file/user-id/:fuid",
      AuthMiddleware.getVerifier("user"),
      fileController.getByUserId.bind(fileController)
    );
    application.post(
      "/api/file",
      AuthMiddleware.getVerifier("user"),
      fileController.upload.bind(fileController)
    );
    application.put(
      "/api/file/:fid",
      AuthMiddleware.getVerifier("user"),
      fileController.edit.bind(fileController)
    );
    application.delete(
      "/api/file/:fid",
      AuthMiddleware.getVerifier("user"),
      fileController.delete.bind(fileController)
    );
  }
}

export default FileRouter;
