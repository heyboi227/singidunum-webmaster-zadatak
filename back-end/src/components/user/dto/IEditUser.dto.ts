import Ajv from "ajv";
import useFormats from "ajv-formats";
import IServiceData from "../../../common/IServiceData.interface";

const ajv = new Ajv();
useFormats(ajv);

export default interface IEditUser extends IServiceData {
  password_hash?: string;
  username?: string;
  is_active?: number;
  password_reset_code?: string;
}

interface IEditUserDto {
  password?: string;
  username?: string;
  isActive?: boolean;
}

const EditUserSchema = {
  type: "object",
  properties: {
    password: {
      type: "string",
      pattern: "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{6,}$",
    },
    username: {
      type: "string",
      pattern: "^[0-9A-Za-z-]{5,64}$",
    },
    isActive: {
      type: "boolean",
    },
  },
  required: [],
  additionalProperties: false,
};

const EditUserValidator = ajv.compile(EditUserSchema);

export { EditUserValidator, IEditUserDto };
