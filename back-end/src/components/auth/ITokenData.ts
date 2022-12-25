export default interface ITokenData {
    role: "user" | "activeUser" | "administrator";
    id: number;
    identity: string;
}