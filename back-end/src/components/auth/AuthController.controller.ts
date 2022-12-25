import { Request, Response } from "express";
import BaseController from "../../common/BaseController";
import { IActiveUserLoginDto } from "./dto/IActiveUserLogin.dto";
import * as bcrypt from "bcrypt";
import ITokenData from "./ITokenData";
import * as jwt from "jsonwebtoken";
import { DevConfig } from "../../configs";
import AuthMiddleware from "../../middlewares/AuthMiddleware";

export default class AuthController extends BaseController {
  public async userLogin(req: Request, res: Response) {
    const data = req.body as IActiveUserLoginDto;

    this.services.user
      .getByUsername(data.username)
      .then((result) => {
        if (result === null) {
          throw {
            status: 404,
            message: "The user account is not found! Please create a new one.",
          };
        }

        return result;
      })
      .then((user) => {
        if (!bcrypt.compareSync(data.password, user.passwordHash)) {
          throw {
            status: 404,
            message: "Wrong password for the given user account!",
          };
        }

        return user;
      })
      .then((user) => {
        if (!user.isActive) {
          throw {
            status: 404,
            message:
              "The user account is not active! Please contact the administrator for reactivation.",
          };
        }

        return user;
      })
      .then((user) => {
        const tokenData: ITokenData = {
          role: "user",
          id: user.userId,
          identity: user.username,
        };

        const authToken = jwt.sign(
          tokenData,
          DevConfig.auth.user.tokens.auth.keys.private,
          {
            algorithm: DevConfig.auth.user.algorithm,
            issuer: DevConfig.auth.user.issuer,
            expiresIn: DevConfig.auth.user.tokens.auth.duration,
          }
        );

        const refreshToken = jwt.sign(
          tokenData,
          DevConfig.auth.user.tokens.refresh.keys.private,
          {
            algorithm: DevConfig.auth.user.algorithm,
            issuer: DevConfig.auth.user.issuer,
            expiresIn: DevConfig.auth.user.tokens.refresh.duration,
          }
        );

        res.send({
          authToken: authToken,
          refreshToken: refreshToken,
          id: user.userId,
        });
      })
      .catch((error) => {
        setTimeout(() => {
          res.status(error?.status ?? 500).send(error?.message);
        }, 1500);
      });
  }

  userRefresh(req: Request, res: Response) {
    const refreshTokenHeader: string = req.headers?.authorization ?? "";

    try {
      const tokenData = AuthMiddleware.validateTokenAs(
        refreshTokenHeader,
        "user",
        "refresh"
      );

      const authToken = jwt.sign(
        tokenData,
        DevConfig.auth.user.tokens.auth.keys.private,
        {
          algorithm: DevConfig.auth.user.algorithm,
          issuer: DevConfig.auth.user.issuer,
          expiresIn: DevConfig.auth.user.tokens.auth.duration,
        }
      );

      res.send({
        authToken: authToken,
      });
    } catch (error) {
      res.status(error?.status ?? 500).send(error?.message);
    }
  }
}
