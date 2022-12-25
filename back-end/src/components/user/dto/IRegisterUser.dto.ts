import Ajv from "ajv";
import useFormats from "ajv-formats";
import IServiceData from "../../../common/IServiceData.interface";

const ajv = new Ajv();
useFormats(ajv);

export default interface IRegisterUser extends IServiceData {
  username?: string;
  password_hash?: string;
  is_active?: number;
}

interface IRegisterUserDto {
  username?: string;
  password?: string;
  isActive?: boolean;
}

const RegisterUserSchema = {
  type: "object",
  properties: {
    username: {
      type: "string",
      pattern: "^[0-9A-Za-z-]{5,64}$",
    },
    password: {
      type: "string",
      pattern: "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{6,}$",
    },
  },
  required: ["username", "password"],
  additionalProperties: false,
};

const RegisterUserValidator = ajv.compile(RegisterUserSchema);

export { RegisterUserValidator, IRegisterUserDto };
