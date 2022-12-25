import Ajv from "ajv";
import useFormats from "ajv-formats";
import IServiceData from "../../../common/IServiceData.interface";

const ajv = new Ajv();
useFormats(ajv);

export default interface IEditFile extends IServiceData {
  file_name?: string;
}

interface IEditFileDto {
  fileName?: string;
}

const EditFileSchema = {
  type: "object",
  properties: {
    fileName: {
      type: "string",
    },
  },
  required: [],
  additionalProperties: false,
};

const EditFileValidator = ajv.compile(EditFileSchema);

export { EditFileValidator, IEditFileDto };
