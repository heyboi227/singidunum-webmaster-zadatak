import { Request, Response } from "express";
import BaseController from "../../common/BaseController";
import { DevConfig } from "../../configs";
import { DefaultFileAdapterOptions } from "./FileService.service";
import filetype from "magic-bytes.js";
import { UploadedFile } from "express-fileupload";
import { mkdirSync, readFileSync, unlinkSync } from "fs";
import { basename, dirname, extname } from "path";
import * as uuid from "uuid";
import IConfig from "../../common/IConfig.interface";
import FileModel from "./FileModel.model";
import IEditFile, {
  EditFileValidator,
  IEditFileDto,
} from "./dto/IEditFile.dto";

export default class FileController extends BaseController {
  async getAll(_req: Request, res: Response) {
    this.services.file
      .getAll(DefaultFileAdapterOptions)
      .then((result) => {
        res.send(result);
      })
      .catch((error) => {
        res.status(500).send(error?.message);
      });
  }

  getById(req: Request, res: Response) {
    const id: number = +req.params?.fid;

    this.services.file
      .getById(id, DefaultFileAdapterOptions)
      .then((result) => {
        if (result === null) {
          res.status(404).send("File not found!");
        }

        res.send(result);
      })
      .catch((error) => {
        setTimeout(() => {
          res.status(500).send(error?.message);
        }, 500);
      });
  }

  getByFileName(req: Request, res: Response) {
    const filename: string = req.params?.ffn;

    this.services.file
      .getByFileName(filename, DefaultFileAdapterOptions)
      .then((result) => {
        if (result === null) {
          res.status(404).send("File not found!");
        }

        res.send(result);
      })
      .catch((error) => {
        setTimeout(() => {
          res.status(500).send(error?.message);
        }, 500);
      });
  }

  getByUserId(req: Request, res: Response) {
    const userId: number = +req.params?.fuid;

    this.services.file
      .getByUserId(userId, DefaultFileAdapterOptions)
      .then((result) => {
        if (result === null) {
          res.status(404).send("File not found!");
        }

        res.send(result);
      })
      .catch((error) => {
        setTimeout(() => {
          res.status(500).send(error?.message);
        }, 500);
      });
  }

  async upload(req: Request, res: Response) {
    this.doFileUpload(req)
      .then(async (uploadedFiles) => {
        const files: FileModel[] = [];

        for (let singleFile of uploadedFiles) {
          const fileName = basename(singleFile);

          const file = await this.services.file.upload({
            file_name: fileName,
            file_path: singleFile,
            user_id: req.authorization?.id,
          });

          if (file === null) {
            throw {
              code: 500,
              message: "Failed to add this file into the database!",
            };
          }

          files.push(file);
        }

        res.send(files);
      })
      .catch((error) => {
        res.status(error?.code).send(error?.message);
      });
  }

  edit(req: Request, res: Response) {
    const id: number = +req.params?.fid;
    const editData = req.body as IEditFileDto;

    this.services.file.startTransaction().then(() => {
      this.services.file
        .getById(id, DefaultFileAdapterOptions)
        .then((result) => {
          if (result === null) {
            throw {
              status: 404,
              message: "The file is not found!",
            };
          }
          if (result.userId !== req.authorization?.id) {
            throw {
              status: 403,
              message: "You do not have access to this resource!",
            };
          }
        })
        .then(async () => {
          try {
            if (!EditFileValidator(editData)) {
              return res.status(400).send(EditFileValidator.errors);
            }

            const serviceData: IEditFile = {
              file_name: undefined,
            };

            if (editData.fileName !== undefined) {
              serviceData.file_name = editData.fileName;
            }

            const file = await this.services.file.editById(
              id,
              serviceData,
              DefaultFileAdapterOptions
            );
            await this.services.file.commitChanges();
            res.send(file);
          } catch (error) {
            throw {
              status: 400,
              message: error?.message,
            };
          }
        })
        .catch(async (error) => {
          await this.services.file.rollbackChanges();
          setTimeout(() => {
            res.status(error?.status ?? 500).send(error?.message);
          }, 500);
        });
    });
  }

  private async doFileUpload(req: Request): Promise<string[] | null> {
    const config: IConfig = DevConfig;

    if (!req.files || Object.keys(req.files).length === 0)
      throw {
        code: 400,
        message: "No files were uploaded!",
      };

    const fileFieldNames = Object.keys(req.files);

    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1 + "").padStart(2, "0");

    const uploadDestinationRoot = config.server.static.path + "/";
    const destinationDirectory =
      config.fileUploads.destinationDirectoryRoot + year + "/" + month + "/";

    mkdirSync(uploadDestinationRoot + destinationDirectory, {
      recursive: true,
      mode: "755",
    });

    const uploadedFiles = [];

    for (let fileFieldName of fileFieldNames) {
      const file = req.files[fileFieldName] as UploadedFile;

      const type = filetype(readFileSync(file.tempFilePath))[0]?.typename;

      if (!config.fileUploads.files.allowedTypes.includes(type)) {
        unlinkSync(file.tempFilePath);
        throw {
          code: 415,
          message: `File ${fileFieldName} - type is not supported!`,
        };
      }

      file.name = file.name.toLocaleLowerCase();

      const declaredExtension = extname(file.name);

      if (
        !config.fileUploads.files.allowedExtensions.includes(declaredExtension)
      ) {
        unlinkSync(file.tempFilePath);
        throw {
          code: 415,
          message: `File ${fileFieldName} - extension is not supported!`,
        };
      }

      const fileNameRandomPart = uuid.v4();

      const fileDestinationPath =
        uploadDestinationRoot +
        destinationDirectory +
        fileNameRandomPart +
        "-" +
        file.name;

      file.mv(fileDestinationPath, async (error) => {
        if (error) {
          throw {
            code: 500,
            message: `File ${fileFieldName} - could not be saved on the server!`,
          };
        }
      });

      uploadedFiles.push(
        destinationDirectory + fileNameRandomPart + "-" + file.name
      );
    }

    return uploadedFiles;
  }

  delete(req: Request, res: Response) {
    const fileId: number = +req.params?.fid;

    this.services.file
      .startTransaction()
      .then(() => {
        this.services.file
          .getById(fileId, DefaultFileAdapterOptions)
          .then((result) => {
            if (result === null) {
              throw {
                status: 404,
                message: "The file is not found!",
              };
            }

            return result;
          })
          .then((result) => {
            const filePath = result.filePath;
            unlinkSync(filePath);

            return result;
          })
          .then((result) => {
            return this.services.file.deleteById(result.fileId);
          })
          .then(async () => {
            await this.services.file.commitChanges();
            res.send("This file has been deleted!");
          })
          .catch((error) => {
            throw {
              status: 500,
              message: error?.message,
            };
          });
      })
      .catch(async (error) => {
        await this.services.file.rollbackChanges();
        setTimeout(() => {
          res.status(error?.status ?? 500).send(error?.message);
        }, 500);
      });
  }
}
