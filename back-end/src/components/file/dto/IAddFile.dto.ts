import Ajv from "ajv";
import useFormats from "ajv-formats";
import IServiceData from "../../../common/IServiceData.interface";

const ajv = new Ajv();
useFormats(ajv);

export default interface IAddFile extends IServiceData {
  file_name: string;
  file_path: string;
  user_id: number;
}

interface IAddFileDto {
  fileName: string;
  filePath: string;
  userId: number;
}

const EditUserSchema = {
  type: "object",
  properties: {
    filename: {
      type: "string",
    },
    userId: {
      type: "number",
    },
  },
  required: ["filename", "userId"],
  additionalProperties: false,
};

const AddFileValidator = ajv.compile(EditUserSchema);

export { AddFileValidator, IAddFileDto };
