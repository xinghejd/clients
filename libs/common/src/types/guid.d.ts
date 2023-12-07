import { Opaque } from "type-fest";

type Guid = Opaque<string, "Guid">;

type UserId = Opaque<string, "UserId">;

type PolicyId = Opaque<string, "PolicyId">;
