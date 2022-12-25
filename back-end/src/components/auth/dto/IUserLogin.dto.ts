import Ajv from "ajv";

const ajv = new Ajv();

export interface IUserLoginDto {
  username: string;
}

const UserLoginValidator = ajv.compile({
  type: "object",
  properties: {
    username: {
      type: "string",
      pattern: "^[a-z-]{5,64}$",
    },
  },
  required: ["username"],
  additionalProperties: false,
});

export { UserLoginValidator };
