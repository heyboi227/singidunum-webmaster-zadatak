import Ajv from "ajv";

const ajv = new Ajv();

export interface IActiveUserLoginDto {
  username: string;
  password: string;
}

const ActiveUserLoginValidator = ajv.compile({
  type: "object",
  properties: {
    username: {
      type: "string",
      pattern: "^[a-z-]{5,64}$",
    },
    password: {
      type: "string",
      pattern: "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{6,}$",
    },
  },
  required: ["username", "password"],
  additionalProperties: false,
});

export { ActiveUserLoginValidator };
