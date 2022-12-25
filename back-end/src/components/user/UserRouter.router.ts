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
      "/api/user",
      AuthMiddleware.getVerifier("administrator"),
      userController.getAll.bind(userController)
    );
    application.get(
      "/api/user/:uid",
      AuthMiddleware.getVerifier("user", "activeUser", "administrator"),
      userController.getById.bind(userController)
    );
    application.get(
      "/api/user/username/:uusername",
      AuthMiddleware.getVerifier("user", "activeUser", "administrator"),
      userController.getByUsername.bind(userController)
    );
    application.post("/api/user", userController.register.bind(userController));
    application.put(
      "/api/user/:uid",
      AuthMiddleware.getVerifier("user", "activeUser", "administrator"),
      userController.edit.bind(userController)
    );
    application.put(
      "/api/user/deactivate/:uid",
      AuthMiddleware.getVerifier("user", "activeUser", "administrator"),
      userController.deactivate.bind(userController)
    );
    application.delete(
      "/api/user/:uid",
      AuthMiddleware.getVerifier("administrator"),
      userController.delete.bind(userController)
    );
  }
}

export default UserRouter;
