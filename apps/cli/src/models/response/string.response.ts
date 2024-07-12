import { BaseResponse } from "./base.response.js";

export class StringResponse implements BaseResponse {
  object: string;
  data: string;

  constructor(data: string) {
    this.object = "string";
    this.data = data;
  }
}
