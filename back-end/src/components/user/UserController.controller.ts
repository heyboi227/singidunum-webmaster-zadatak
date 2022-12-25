import { Request, Response } from "express";
import BaseController from "../../common/BaseController";
import { AddUserValidator, IAddUserDto } from "./dto/IAddUser.dto";
import {
  RegisterUserValidator,
  IRegisterUserDto,
} from "./dto/IRegisterUser.dto";
import * as bcrypt from "bcrypt";
import * as uuid from "uuid";
import * as nodemailer from "nodemailer";
import * as Mailer from "nodemailer/lib/mailer";
import UserModel from "./UserModel.model";
import { DevConfig } from "../../configs";
import { DefaultUserAdapterOptions } from "./UserService.service";
import IEditUser, {
  EditUserValidator,
  IEditUserDto,
} from "./dto/IEditUser.dto";
import {
  IPasswordResetDto,
  PasswordResetValidator,
} from "./dto/IPasswordReset.dto";
import * as generatePassword from "generate-password";

export default class UserController extends BaseController {
  getAll(req: Request, res: Response) {
    this.services.user
      .getAll({
        removePassword: true,
        removeEmail: false,
        removeActivationCode: true,
      })
      .then((result) => {
        res.send(result);
      })
      .catch((error) => {
        setTimeout(() => {
          res.status(500).send(error?.message);
        }, 500);
      });
  }

  getById(req: Request, res: Response) {
    const id: number = +req.params?.uid;

    if (
      req.authorization?.role === "user" ||
      req.authorization?.role === "activeUser"
    ) {
      if (req.authorization?.id !== id) {
        return res.status(403).send("You do not have access to this resource!");
      }
    }

    this.services.user
      .getById(id, {
        removePassword: true,
        removeEmail: false,
        removeActivationCode: true,
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
        removeEmail: false,
        removeActivationCode: true,
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

  getByEmail(req: Request, res: Response) {
    const email: string = req.params?.uemail;

    this.services.user
      .getByEmail(email, {
        removePassword: true,
        removeEmail: false,
        removeActivationCode: true,
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

  add(req: Request, res: Response) {
    const data = req.body as IAddUserDto;

    if (!AddUserValidator(data)) {
      return res.status(400).send(AddUserValidator.errors);
    }

    this.services.user.startTransaction().then(() => {
      this.services.user
        .add({
          username: data.username,
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

  private async sendRegistrationEmail(user: UserModel): Promise<UserModel> {
    return new Promise((resolve, reject) => {
      const transport = this.getMailTransport();

      const mailOptions: Mailer.Options = {
        to: user.email,
        subject: "Account registration",
        html: `<!DOCTYPE html>
                <html>
                  <head><meta charset="utf-8"></head>
                  <body>
                    <p>Dear ${user.username},<br>
                      Your account was succesfully created.
                    </p>
                    <p>
                      You must activate your account by clicking on the following link:
                    </p>
                    <p style="text-align: center; padding: 10px;">
                      <a href="http://localhost:10000/api/user/activate/${user.activationCode}">Activate</a>
                  </body>
                </html>`,
      };

      transport
        .sendMail(mailOptions)
        .then(() => {
          transport.close();
          user.passwordHash = null;
          user.activationCode = null;
          resolve(user);
        })
        .catch((error) => {
          transport.close();
          reject({
            message: error?.message,
          });
        });
    });
  }

  passwordResetEmailSend(req: Request, res: Response) {
    const data = req.body as IPasswordResetDto;

    if (!PasswordResetValidator(data)) {
      return res.status(400).send(PasswordResetValidator.errors);
    }

    this.services.user
      .getByEmail(data.email, {
        removeActivationCode: false,
        removePassword: true,
        removeEmail: false,
      })
      .then((result) => {
        if (result === null) {
          throw {
            status: 404,
            message: "User not found!",
          };
        }

        return result;
      })
      .then((user) => {
        if (!user.isActive && !user.activationCode) {
          throw {
            status: 403,
            message: "Your account has been deactivated by the administrator!",
          };
        }

        return user;
      })
      .then((user) => {
        const code = uuid.v4() + "-" + uuid.v4();

        return this.services.user.editById(
          user.userId,
          {
            password_reset_code: code,
          },
          {
            removeActivationCode: true,
            removePassword: true,
            removeEmail: false,
          }
        );
      })
      .then((user) => {
        return this.sendRecoveryEmail(user);
      })
      .then(() => {
        res.send({
          message: "Sent",
        });
      })
      .catch((error) => {
        setTimeout(() => {
          res.status(error?.status ?? 500).send(error?.message);
        }, 500);
      });
  }

  resetPassword(req: Request, res: Response) {
    const code: string = req.params?.code;

    this.services.user
      .getUserByPasswordResetCode(code, {
        removeActivationCode: false,
        removePassword: true,
        removeEmail: false,
      })
      .then((result) => {
        if (result === null) {
          throw {
            status: 404,
            message: "User not found!",
          };
        }

        return result;
      })
      .then((user) => {
        if (!user.isActive && !user.activationCode) {
          throw {
            status: 403,
            message: "Your account has been deactivated by the administrator",
          };
        }

        return user;
      })
      .then((user) => {
        const newPassword = generatePassword.generate({
          numbers: true,
          uppercase: true,
          lowercase: true,
          symbols: false,
          length: 18,
        });

        const passwordHash = bcrypt.hashSync(newPassword, 10);

        return new Promise<{ user: UserModel; newPassword: string }>(
          (resolve) => {
            this.services.user
              .editById(
                user.userId,
                {
                  password_hash: passwordHash,
                  password_reset_code: null,
                },
                {
                  removeActivationCode: true,
                  removePassword: true,
                  removeEmail: false,
                }
              )
              .then((user) => {
                return this.sendNewPassword(user, newPassword);
              })
              .then((user) => {
                resolve({
                  user: user,
                  newPassword: newPassword,
                });
              })
              .catch((error) => {
                throw error;
              });
          }
        );
      })
      .then(() => {
        res.send({
          message: "Sent!",
        });
      })
      .catch((error) => {
        setTimeout(() => {
          res.status(error?.status ?? 500).send(error?.message);
        }, 500);
      });
  }

  private async sendNewPassword(
    user: UserModel,
    newPassword: string
  ): Promise<UserModel> {
    return new Promise((resolve, reject) => {
      const transport = this.getMailTransport();

      const mailOptions: Mailer.Options = {
        to: user.email,
        subject: "New password",
        html: `<!doctype html>
                  <html>
                      <head><meta charset="utf-8"></head>
                      <body>
                          <p>
                              Dear ${user.username},<br>
                              Your account password was successfully reset.
                          </p>
                          <p>
                              Your new password is:<br>
                              <pre style="padding: 20px; font-size: 24pt; color: #000; background-color: #eee; border: 1px solid #666;">${newPassword}</pre>
                          </p>
                          <p>
                              You can now log into your account using the login form.
                          </p>
                      </body>
                  </html>`,
      };

      transport
        .sendMail(mailOptions)
        .then(() => {
          transport.close();

          user.activationCode = null;
          user.passwordResetCode = null;

          resolve(user);
        })
        .catch((error) => {
          transport.close();

          reject({
            message: error?.message,
          });
        });
    });
  }

  private async sendRecoveryEmail(user: UserModel): Promise<UserModel> {
    return new Promise((resolve, reject) => {
      const transport = this.getMailTransport();

      const mailOptions: Mailer.Options = {
        to: user.email,
        subject: "Account password reset code",
        html: `<!doctype html>
                  <html>
                      <head><meta charset="utf-8"></head>
                      <body>
                          <p>
                              Dear ${user.username},<br>
                              Here is a link you can use to reset your account:
                          </p>
                          <p>
                              <a href="http://localhost:10000/api/user/reset/${user.passwordResetCode}"
                                  sryle="display: inline-block; padding: 10px 20px; color: #fff; background-color: #db0002; text-decoration: none;">
                                  Click here to reset your account
                              </a>
                          </p>
                      </body>
                  </html>`,
      };

      transport
        .sendMail(mailOptions)
        .then(() => {
          transport.close();

          user.activationCode = null;
          user.passwordResetCode = null;

          resolve(user);
        })
        .catch((error) => {
          transport.close();

          reject({
            message: error?.message,
          });
        });
    });
  }

  private getMailTransport() {
    return nodemailer.createTransport(
      {
        host: DevConfig.mail.host,
        port: DevConfig.mail.port,
        secure: false,
        tls: {
          ciphers: "SSLv3",
        },
        debug: DevConfig.mail.debug,
        auth: {
          user: DevConfig.mail.email,
          pass: DevConfig.mail.password,
        },
      },
      {
        from: DevConfig.mail.email,
      }
    );
  }

  private async sendActivationEmail(user: UserModel): Promise<UserModel> {
    return new Promise((resolve, reject) => {
      const transport = this.getMailTransport();

      const mailOptions: Mailer.Options = {
        to: user.email,
        subject: "Account activation",
        html: `<!doctype html>
                <html>
                    <head><meta charset="utf-8"></head>
                    <body>
                        <p>
                            Dear ${user.username},<br>
                            Your account was successfully activated.
                        </p>
                        <p>
                            You can now log into your account using the login form.
                        </p>
                    </body>
                </html>`,
      };

      transport
        .sendMail(mailOptions)
        .then(() => {
          transport.close();
          resolve(user);
        })
        .catch((error) => {
          transport.close();
          reject({
            message: error?.message,
          });
        });
    });
  }

  activate(req: Request, res: Response) {
    const code: string = req.params?.ucode;

    this.services.user.startTransaction().then(() => {
      this.services.user
        .getUserByActivationCode(code, {
          removePassword: true,
          removeEmail: false,
          removeActivationCode: false,
        })
        .then((result) => {
          if (result === null) {
            throw {
              status: 404,
              message: "User not found!",
            };
          }

          return result;
        })
        .then((result) => {
          const user = result as UserModel;
          return this.services.user.editById(
            user.userId,
            {
              is_active: 1,
              activation_code: null,
            },
            DefaultUserAdapterOptions
          );
        })
        .then(async (user) => {
          await this.services.user.commitChanges();
          return this.sendActivationEmail(user);
        })
        .then(() => {
          res.send(
            "Your account was successfully activated! Welcome onboard! <br /><br /> You can now log into your account using the login form, and create, modify and delete the questions for the app as well. Happy playing!"
          );
        })
        .catch(async (error) => {
          await this.services.user.rollbackChanges();
          setTimeout(() => {
            res.status(error?.status ?? 500).send(error?.message);
          }, 500);
        });
    });
  }

  edit(req: Request, res: Response) {
    const id: number = +req.params?.uid;
    const registerData = req.body as IRegisterUserDto;
    const editData = req.body as IEditUserDto;

    if (
      req.authorization?.role === "user" ||
      req.authorization?.role === "activeUser"
    ) {
      if (req.authorization?.id !== id) {
        return res.status(403).send("You do not have access to this resource!");
      }
    }

    this.services.user.startTransaction().then(() => {
      this.services.user
        .getById(id, {
          removePassword: true,
          removeEmail: false,
          removeActivationCode: true,
        })
        .then((result) => {
          if (result === null) {
            throw {
              status: 404,
              message: "The user is not found!",
            };
          }

          return result;
        })
        .then(async (result) => {
          try {
            if (result.isActive === true) {
              if (!EditUserValidator(editData)) {
                return res.status(400).send(EditUserValidator.errors);
              }

              const serviceData: IEditUser = {};

              if (editData.password !== undefined) {
                const passwordHash = bcrypt.hashSync(editData.password, 10);
                serviceData.password_hash = passwordHash;
              }

              if (
                DevConfig.auth.allowAllRoutesWithoutAuthTokens ||
                req.authorization?.role === "administrator"
              ) {
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
            } else {
              if (!RegisterUserValidator(registerData)) {
                return res.status(400).send(RegisterUserValidator.errors);
              }

              const passwordHash = bcrypt.hashSync(registerData.password, 10);

              const inactiveUser = await this.services.user.editById(
                id,
                {
                  username: registerData.username,
                  email: registerData.email,
                  password_hash: passwordHash,
                  activation_code: uuid.v4(),
                },
                DefaultUserAdapterOptions
              );
              await this.sendRegistrationEmail(inactiveUser);
              await this.services.user.commitChanges();
              res.send(inactiveUser);
            }
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

  delete(req: Request, res: Response) {
    const id: number = +req.params?.uid;

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
            .deleteById(id)
            .then(async (_result) => {
              await this.services.user.commitChanges();
              res.send("This user has been deleted!");
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
