import * as express from "express";
import AuthMiddleware from "../../middlewares/AuthMiddleware";
import IApplicationResources from "../../common/IApplicationResources.interface";
import IRouter from "../../common/IRouter.interface";
import UserController from "./UserController.controller";

class UserRouter implements IRouter {
  setupRoutes(
    application: express.Application,
    resources: IApplicationResources
  ) {
    const userController: UserController = new UserController(
      resources.services
    );

    application.get(
      "/api/user/:uid",
      AuthMiddleware.getVerifier("user"),
      userController.getById.bind(userController)
    );
    application.get(
      "/api/user/username/:uusername",
      AuthMiddleware.getVerifier("user"),
      userController.getByUsername.bind(userController)
    );
    application.post(
      "/api/user",
      AuthMiddleware.getVerifier("user"),
      userController.register.bind(userController)
    );
    application.put(
      "/api/user/:uid",
      AuthMiddleware.getVerifier("user"),
      userController.edit.bind(userController)
    );
    application.put(
      "/api/user/deactivate/:uid",
      AuthMiddleware.getVerifier("user"),
      userController.deactivate.bind(userController)
    );
  }
}

export default UserRouter;
