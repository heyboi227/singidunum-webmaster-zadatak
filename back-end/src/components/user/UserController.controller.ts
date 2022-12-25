import { Request, Response } from "express";
import BaseController from "../../common/BaseController";
import {
  RegisterUserValidator,
  IRegisterUserDto,
} from "./dto/IRegisterUser.dto";
import * as bcrypt from "bcryptjs";
import { DevConfig } from "../../configs";
import { DefaultUserAdapterOptions } from "./UserService.service";
import IEditUser, {
  EditUserValidator,
  IEditUserDto,
} from "./dto/IEditUser.dto";

export default class UserController extends BaseController {
  getById(req: Request, res: Response) {
    const id: number = +req.params?.uid;

    if (req.authorization?.id !== id) {
      return res.status(403).send("You do not have access to this resource!");
    }

    this.services.user
      .getById(id, {
        removePassword: true,
      })
      .then((result) => {
        if (result === null) {
          res.status(404).send("User not found!");
        }

        res.send(result);
      })
      .catch((error) => {
        setTimeout(() => {
          res.status(500).send(error?.message);
        }, 500);
      });
  }

  getByUsername(req: Request, res: Response) {
    const username: string = req.params?.uusername;

    this.services.user
      .getByUsername(username, {
        removePassword: true,
      })
      .then((result) => {
        if (result === null) {
          res.status(404).send("User not found!");
        }

        res.send(result);
      })
      .catch((error) => {
        setTimeout(() => {
          res.status(500).send(error?.message);
        }, 500);
      });
  }

  register(req: Request, res: Response) {
    const data = req.body as IRegisterUserDto;

    if (!RegisterUserValidator(data)) {
      return res.status(400).send(RegisterUserValidator.errors);
    }

    this.services.user.startTransaction().then(() => {
      this.services.user
        .register({
          username: data.username,
          password_hash: data.password,
        })
        .then(async (result) => {
          await this.services.user.commitChanges();
          res.send(result);
        })
        .catch(async (error) => {
          await this.services.user.rollbackChanges();
          res.status(400).send(error?.message);
        });
    });
  }

  edit(req: Request, res: Response) {
    const id: number = +req.params?.uid;
    const editData = req.body as IEditUserDto;

    if (req.authorization?.id !== id) {
      return res.status(403).send("You do not have access to this resource!");
    }

    this.services.user.startTransaction().then(() => {
      this.services.user
        .getById(id, {
          removePassword: true,
        })
        .then((result) => {
          if (result === null) {
            throw {
              status: 404,
              message: "The user is not found!",
            };
          }
        })
        .then(async () => {
          try {
            if (!EditUserValidator(editData)) {
              return res.status(400).send(EditUserValidator.errors);
            }

            const serviceData: IEditUser = {};

            if (editData.password !== undefined) {
              const passwordHash = bcrypt.hashSync(editData.password, 10);
              serviceData.password_hash = passwordHash;
            }

            if (DevConfig.auth.allowAllRoutesWithoutAuthTokens) {
              if (editData.isActive !== undefined) {
                serviceData.is_active = editData.isActive ? 1 : 0;
              }
            }

            if (editData.username !== undefined) {
              serviceData.username = editData.username;
            }

            const user = await this.services.user.editById(
              id,
              serviceData,
              DefaultUserAdapterOptions
            );
            await this.services.user.commitChanges();
            res.send(user);
          } catch (error) {
            throw {
              status: 400,
              message: error?.message,
            };
          }
        })
        .catch(async (error) => {
          await this.services.user.rollbackChanges();
          setTimeout(() => {
            res.status(error?.status ?? 500).send(error?.message);
          }, 500);
        });
    });
  }

  deactivate(req: Request, res: Response) {
    const id: number = +req.params?.uid;

    if (req.authorization?.id !== id) {
      return res.status(403).send("You do not have access to this resource!");
    }

    this.services.user.startTransaction().then(() => {
      this.services.user
        .getById(id, DefaultUserAdapterOptions)
        .then((result) => {
          if (result === null) {
            throw {
              status: 404,
              message: "The user is not found!",
            };
          }

          this.services.user
            .editById(
              id,
              {
                is_active: 0,
              },
              DefaultUserAdapterOptions
            )
            .then(async () => {
              await this.services.user.commitChanges();
              res.send("This user has been deactivated!");
            })
            .catch((error) => {
              throw {
                status: 500,
                message: error?.message,
              };
            });
        })
        .catch(async (error) => {
          await this.services.user.rollbackChanges();
          setTimeout(() => {
            res.status(error?.status ?? 500).send(error?.message);
          }, 500);
        });
    });
  }
}
